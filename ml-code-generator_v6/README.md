# ML Code Generator v2 - 实时代码生成系统

这是一个基于WebSocket的实时机器学习代码生成系统，支持分步代码生成和实时进度展示。

## 新功能特性

### 🚀 实时代码生成
- **WebSocket连接**：前后端实时通信
- **分步生成**：任务分解为多个步骤，逐步生成代码
- **实时进度**：实时显示生成进度和状态
- **错误处理**：自动检测和修正代码错误
- **代码优化**：最终代码自动优化和整合

### 📊 实时进度展示
- **步骤分解**：显示任务分解后的各个步骤
- **状态指示**：每个步骤的实时状态（生成中、检查中、完成、错误等）
- **代码预览**：每个步骤生成的代码实时显示
- **错误信息**：显示详细的错误信息和修正过程

## 系统架构

```
前端 (React + Socket.io-client)
    ↕ WebSocket
后端 (Node.js + Socket.io)
    ↕ Python进程
Python模块 (deepseek_agent)
    ↕ DeepSeek API
```

## 安装和运行

### 快速启动（推荐）

**Windows用户：**
```bash
# 快速启动（自动清理 + 启动）
double-click quick-start.bat

# 或者使用完整启动脚本（包含依赖安装）
double-click start.bat

# 手动清理进程
double-click cleanup.bat
```

**Linux/Mac用户：**
```bash
# 快速启动
./quick-start.sh

# 完整启动
./start.sh

# 手动清理
./cleanup.sh
```

### 手动启动

### 1. 安装依赖

**前端依赖：**
```bash
cd ml-code-generator_v2
npm install
```

**后端依赖：**
```bash
cd ml-code-generator_v2/server
npm install
```

**Python依赖：**
```bash
cd ml-code-generator_v2/server
pip install -r requirements.txt
```

### 2. 启动服务

**启动后端服务：**
```bash
cd ml-code-generator_v2/server
npm start
```
后端将在 `http://localhost:5000` 运行

**启动前端服务：**
```bash
cd ml-code-generator_v2
npm start
```
前端将在 `http://localhost:3000` 运行

### 3. 访问系统

打开浏览器，访问 `http://localhost:3000`

## 进程管理

### 清理Node.js进程

如果遇到端口占用或进程冲突问题，可以使用以下命令清理：

**Windows:**
```cmd
# 查看Node.js进程
tasklist | findstr node.exe

# 终止所有Node.js进程
taskkill /F /IM node.exe

# 或者使用清理脚本
cleanup.bat
```

**Linux/Mac:**
```bash
# 查看Node.js进程
ps aux | grep node

# 终止所有Node.js进程
pkill -f node

# 或者使用清理脚本
./cleanup.sh
```

### 端口检查

**Windows:**
```cmd
# 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```

**Linux/Mac:**
```bash
# 检查端口占用
lsof -i :3000
lsof -i :5000
```

## 使用流程

### 1. 上传数据集
- 点击"Upload Dataset"按钮
- 选择CSV、TXT、JSON或MD格式的数据文件
- 系统会自动分析文件内容并显示预览

### 2. 配置任务
- 输入任务描述（如："使用随机森林模型对鸢尾花数据集进行分类"）
- 选择评估方法（准确率、效率、可解释性、鲁棒性）
- 添加评估描述和解决方案

### 3. 开始代码生成
- 点击"Run"按钮开始生成
- 系统会实时显示：
  - 任务分解进度
  - 每个步骤的生成状态
  - 生成的代码内容
  - 错误检测和修正过程

### 4. 查看结果
- 实时查看每个步骤的生成代码
- 查看最终优化后的完整代码
- 下载生成的代码和评估指标

## 实时生成流程

### 步骤1：任务规划
- 分析用户输入的任务描述
- 将任务分解为多个子步骤
- 制定执行计划

### 步骤2：逐步代码生成
- 按顺序生成每个步骤的代码
- 实时显示生成进度
- 显示每个步骤的代码内容

### 步骤3：代码检查
- 自动检查生成的代码
- 检测语法错误和逻辑问题
- 显示详细的错误信息

### 步骤4：错误修正
- 自动修正检测到的错误
- 重新生成修正后的代码
- 再次检查代码正确性

### 步骤5：代码优化
- 整合所有步骤的代码
- 优化代码结构和可读性
- 生成最终的完整代码

## 技术栈

### 前端
- **React 18**：用户界面框架
- **Socket.io-client**：WebSocket客户端
- **CSS3**：样式和动画

### 后端
- **Node.js**：服务器运行环境
- **Express**：Web框架
- **Socket.io**：WebSocket服务器
- **MongoDB**：数据存储
- **Multer**：文件上传处理

### Python模块
- **DeepSeek API**：AI代码生成
- **Flask**：Python Web框架
- **Subprocess**：进程管理

## 文件结构

```
ml-code-generator_v2/
├── src/
│   ├── App.jsx              # 主应用组件
│   ├── services/
│   │   └── api.js           # API服务和WebSocket连接
│   └── App.css              # 样式文件
├── server/
│   ├── server.js            # 后端服务器
│   ├── models/
│   │   └── Dataset.js       # 数据模型
│   ├── uploads/             # 上传文件存储
│   └── requirements.txt     # Python依赖
├── deepseek_agent/
│   ├── api.py               # Python API模块
│   └── agent.py             # AI代理实现
└── package.json             # 前端依赖配置
```

## 测试

### 测试Python模块
```bash
cd ml-code-generator_v2/server
python test_socket.py
```

### 测试WebSocket连接
1. 启动前后端服务
2. 打开浏览器开发者工具
3. 查看Console中的WebSocket连接状态

## 故障排除

### 常见问题

1. **WebSocket连接失败**
   - 检查后端服务是否正常运行
   - 确认端口5000未被占用
   - 检查防火墙设置

2. **Python模块导入错误**
   - 确认Python环境正确安装
   - 检查依赖包是否安装完整
   - 验证API密钥配置

3. **代码生成失败**
   - 检查任务描述是否清晰
   - 确认数据集格式正确
   - 查看错误日志获取详细信息

### 日志查看

**后端日志：**
```bash
cd ml-code-generator_v2/server
npm start
```

**前端日志：**
- 打开浏览器开发者工具
- 查看Console标签页

## 开发说明

### 添加新的生成步骤
1. 在`deepseek_agent/api.py`中添加新的函数
2. 在`server/server.js`中添加对应的WebSocket事件处理
3. 在前端`src/services/api.js`中添加事件监听器
4. 在`src/App.jsx`中更新UI显示

### 自定义UI样式
- 修改`src/App.css`中的样式定义
- 调整`src/App.jsx`中的内联样式
- 更新状态指示器和进度条样式

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。 