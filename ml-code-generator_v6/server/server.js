require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Dataset = require('./models/Dataset');
const { spawn } = require('child_process');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 5001;

// 中间件
app.use(cors());
app.use(express.json());

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ml-code-generator', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

// WebSocket 连接处理
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // 处理代码生成请求
  socket.on('generate-code', async (data) => {
    const { task_prompt, dataset_paths, sessionId } = data;
    
    try {
      // 发送开始处理的消息
      socket.emit('generation-started', { sessionId });
      
      // 步骤1: 规划分解
      socket.emit('step-planning', { 
        sessionId,
        message: '正在分析任务并制定执行计划...',
        status: 'planning'
      });
      
      const plans = await planForMachineTask(task_prompt);
      
      // 发送规划结果
      socket.emit('planning-complete', {
        sessionId,
        plans: plans,
        message: `任务已分解为 ${plans.length} 个步骤`,
        status: 'planning-complete'
      });

      let previousCode = '';
      let allGeneratedCode = '';

      // 步骤2: 逐步生成代码
      for (let i = 0; i < plans.length; i++) {
        const plan = plans[i];
        const stepId = i + 1;
        const stepName = plan; // plan is already a string
        
        // 告知前端：步骤开始
        socket.emit('step-started', { sessionId, stepId, stepName, message: `开始执行步骤 ${stepId}: ${stepName}` });

        try {
          // 生成当前步骤的代码 - 只传递之前步骤的代码作为上下文
          const currentStepCodeRaw = await generateCurrentStepCode(
            task_prompt, 
            stepName, 
            stepId, 
            previousCode
          );

          // 新增：只保留当前步骤的代码
          function extractCurrentStepCode(stepId, code) {
            const pattern = new RegExp(`# Step ${stepId}:(.|\n|\r)*?(?=# Step ${stepId + 1}:|$)`, 'g');
            const match = code.match(pattern);
            if (match && match.length > 0) {
              return match[0].trim();
            }
            return code; // fallback
          }
          const currentStepCode = extractCurrentStepCode(stepId, currentStepCodeRaw);

          // 将当前步骤的代码添加到累积代码中
          allGeneratedCode += '\n\n' + currentStepCode;
          previousCode = allGeneratedCode; // 更新previousCode为累积的代码

          // 发送当前步骤完成的消息 - 只发送当前步骤的代码
          socket.emit('step-complete', {
            sessionId,
            stepId,
            stepName: stepName,
            code: currentStepCode, // 只发送当前步骤的代码
            accumulatedCode: allGeneratedCode, // 累积代码用于最终显示
            message: `第 ${stepId} 步代码生成完成`,
            status: 'step-complete'
          });

          // 步骤3: 检查代码
          socket.emit('step-checking', {
            sessionId,
            stepId,
            message: `正在检查第 ${stepId} 步代码...`,
            status: 'checking'
          });

          const checkResult = await checkCode(allGeneratedCode);
          
          if (!checkResult.success) {
            console.error('Code check failed. Stderr:', checkResult.stderr);
            
            // 代码有错误，进行修正
            socket.emit('step-error', {
              sessionId,
              stepId,
              error: checkResult.stderr,
              message: `第 ${stepId} 步代码存在错误，正在修正...`,
              status: 'error'
            });

            const revisedCode = await reviseCode(task_prompt, allGeneratedCode, checkResult.stderr);
            
            socket.emit('step-revised', {
              sessionId,
              stepId,
              revisedCode: revisedCode,
              message: `第 ${stepId} 步代码已修正`,
              status: 'revised'
            });

            allGeneratedCode = revisedCode;
            previousCode = revisedCode;
          } else {
            socket.emit('step-checked', {
              sessionId,
              stepId,
              message: `第 ${stepId} 步代码检查通过`,
              status: 'checked'
            });
          }
        } catch (error) {
          console.error(`Error during step ${stepId}: ${stepName}`, error);
          socket.emit('step-error', {
            sessionId,
            stepId,
            error: error.message,
            message: `执行步骤 ${stepId}: ${stepName} 时出现错误`,
            status: 'error'
          });
        }
      }

      // 步骤4: 最终优化
      socket.emit('final-refining', {
        sessionId,
        message: '正在对最终代码进行优化...',
        status: 'refining'
      });

      const refinedCode = await refineAllStepCode(task_prompt, allGeneratedCode);
      
      // 发送最终结果
      socket.emit('generation-complete', {
        sessionId,
        finalCode: refinedCode,
        message: '代码生成完成！',
        status: 'complete'
      });

    } catch (error) {
      socket.emit('generation-error', {
        sessionId,
        error: error.message,
        message: '代码生成过程中出现错误',
        status: 'error'
      });
    }
  });
});

// API 路由
// 上传数据集
app.post('/api/datasets', upload.single('file'), async (req, res) => {
  try {
    // 添加文件上传验证
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please check the upload field name and file data.' });
    }

    const dataset = new Dataset({
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      metadata: JSON.parse(req.body.metadata || '{}'),
      userId: req.body.userId
    });

    await dataset.save();
    res.status(201).json(dataset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 获取所有数据集
app.get('/api/datasets', async (req, res) => {
  try {
    const datasets = await Dataset.find({ userId: req.query.userId });
    res.json(datasets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取单个数据集
app.get('/api/datasets/:id', async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }
    res.json(dataset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取文件内容预览
app.get('/api/datasets/:id/preview', async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    const filePath = path.resolve(dataset.filePath);
    const results = [];
    let headers = [];
    let rowCount = 0;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: `File not found on server at path: ${filePath}` });
    }

    fs.createReadStream(filePath, { encoding: 'utf-8' })
      .pipe(csv())
      .on('headers', (headerList) => {
        headers = headerList;
      })
      .on('data', (data) => {
        if (rowCount < 5) { // 只读取前5行预览
          results.push(data);
        }
        rowCount++;
      })
      .on('end', () => {
        // 如果行数超过5，则不再继续读取
        if (rowCount > 5) {
          // 'end' 事件可能在 stream destroy 后触发，确保只发送一次响应
          if (!res.headersSent) {
            res.json({ headers, data: results, totalRows: rowCount });
          }
        } else {
           if (!res.headersSent) {
            res.json({ headers, data: results, totalRows: rowCount });
          }
        }
      })
      .on('error', (err) => {
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error reading or parsing file', error: err.message });
        }
      });

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// 删除数据集
app.delete('/api/datasets/:id', async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    // 从文件系统删除文件
    const filePath = path.resolve(dataset.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 从数据库删除记录
    await Dataset.findByIdAndDelete(req.params.id);

    res.json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete dataset', error: error.message });
  }
});

// 保留原有的HTTP API用于兼容性
app.post('/api/generate-code', async (req, res) => {
  try {
    const { task_prompt, dataset_path } = req.body;
    
    // 调用 Python 脚本
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../deepseek_agent/api.py'),
      '--task', task_prompt,
      '--dataset', dataset_path
    ], {
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      }
    });

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ 
          error: 'Failed to generate code',
          details: error 
        });
      }
      
      res.json({ 
        success: true,
        output: output,
        code: output
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 辅助函数：调用Python模块
async function planForMachineTask(task_prompt) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      '-c',
      `from deepseek_agent.api import plan_for_machine_task; import sys; print(plan_for_machine_task(${JSON.stringify(task_prompt)}))`
    ], {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      }
    });

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(error));
      } else {
        try {
          // 解析Python返回的列表
          const plans = eval(output.trim());
          resolve(plans);
        } catch (e) {
          reject(new Error('Failed to parse plans'));
        }
      }
    });
  });
}

async function generateCurrentStepCode(task_prompt, current_step, step_id, previous_code) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      '-c',
      `from deepseek_agent.api import generate_current_step_code; import sys; print(generate_current_step_code(${JSON.stringify(task_prompt)}, ${JSON.stringify(current_step)}, ${step_id}, ${JSON.stringify(previous_code)}))`
    ], {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      }
    });

    let output = '';
    let error = '';

    // 添加超时机制
    const timeout = setTimeout(() => {
      console.error('Python process timeout in generateCurrentStepCode, killing process...');
      pythonProcess.kill('SIGKILL');
      reject(new Error('Process timeout - code generation took too long'));
    }, 60000); // 60秒超时

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(error));
      } else {
        resolve(output.trim());
      }
    });

    pythonProcess.on('error', (err) => {
      clearTimeout(timeout);
      console.error('Python process error in generateCurrentStepCode:', err);
      reject(new Error(`Process error: ${err.message}`));
    });
  });
}

async function refineAllStepCode(task_prompt, all_step_code) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      '-c',
      `from deepseek_agent.api import refine_all_step_code; import sys; print(refine_all_step_code(${JSON.stringify(task_prompt)}, ${JSON.stringify(all_step_code)}))`
    ], {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      }
    });

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(error));
      } else {
        resolve(output.trim());
      }
    });
  });
}

async function checkCode(code) {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python', [
      '-c',
      `from deepseek_agent.api import check_code; import sys, json; print(json.dumps(check_code(${JSON.stringify(code)})))`
    ], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let output = '';
    let error = '';

    // 添加超时机制
    const timeout = setTimeout(() => {
      console.error('Python process timeout in checkCode, killing process...');
      pythonProcess.kill('SIGKILL');
      resolve({ success: false, stderr: 'Process timeout - code check took too long' });
    }, 30000); // 30秒超时

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      // 实时捕获并打印错误
      error += data.toString();
      console.error(`Python Stderr (checkCode): ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
      clearTimeout(timeout); // 清除超时
      if (code !== 0) {
        // 当进程以非0代码退出时，也认为是失败
        resolve({ success: false, stderr: error });
      } else {
        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (e) {
          // 如果JSON解析失败，说明有严重问题
          resolve({ success: false, stderr: `Failed to parse checker output. Raw: ${output}. Error: ${error}` });
        }
      }
    });

    pythonProcess.on('error', (err) => {
      clearTimeout(timeout);
      console.error('Python process error in checkCode:', err);
      resolve({ success: false, stderr: `Process error: ${err.message}` });
    });
  });
}

async function reviseCode(task_prompt, code, error_log) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      '-c',
      `from deepseek_agent.api import revise_code; import sys; print(revise_code(${JSON.stringify(task_prompt)}, ${JSON.stringify(code)}, ${JSON.stringify(error_log)}))`
    ], {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      }
    });

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(error));
      } else {
        resolve(output.trim());
      }
    });
  });
}

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 