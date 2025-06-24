import React, { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import './App.css';
import { uploadDataset, getDatasets, deleteDataset, generateCode, generateCodeRealtime, connectWebSocket, disconnectWebSocket, getDatasetPreview } from './services/api';
import { VscFile, VscFileCode, VscJson, VscFilePdf, VscMarkdown } from 'react-icons/vsc';
import IndicatorDisplay from './components/IndicatorDisplay';
import ResultEditor from './components/ResultEditor';
import ProcessPanel from './components/ProcessPanel';

const evaluationOptions = [
  'Accuracy',
  'Efficiency',
  'Interpretability',
  'Robustness',
];

function App() {
  const [tab, setTab] = useState('code');
  const [selectedEval, setSelectedEval] = useState([]);
  const [taskDesc, setTaskDesc] = useState('');
  const [solution, setSolution] = useState('');
  const [datasetFiles, setDatasetFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [filePreviewMap, setFilePreviewMap] = useState({});
  const [uploadType, setUploadType] = useState('file'); // 'file' or 'folder'
  const [evalDesc, setEvalDesc] = useState('');
  const [evalDropdownOpen, setEvalDropdownOpen] = useState(false);
  const [showPanels, setShowPanels] = useState(true);
  const [showOutcomeButton, setShowOutcomeButton] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // 添加新的状态
  const [showProcessPanel, setShowProcessPanel] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 实时生成相关状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    currentStep: 0,
    totalSteps: 0,
    status: 'idle', // idle, planning, generating, checking, error, complete
    message: '',
    plans: [],
    currentStepCode: '',
    accumulatedCode: '',
    errors: []
  });
  const [realTimeSteps, setRealTimeSteps] = useState([]);

  // 新增：中间区域tab切换
  const [centerTab, setCenterTab] = useState('process'); // 'process' or 'dataset'

  // WebSocket连接管理
  useEffect(() => {
    // 组件挂载时连接WebSocket
    connectWebSocket();
    
    // 组件卸载时断开连接
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // 处理评估方法多选下拉
  const toggleEvalDropdown = () => setEvalDropdownOpen(v => !v);
  const handleEvalOptionClick = (opt) => {
    setSelectedEval(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  // 处理文件上传
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const allowedExts = ['CSV', 'TXT', 'JSON', 'MD'];
    const filteredFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toUpperCase();
      return allowedExts.includes(ext);
    });

    if (filteredFiles.length === 0) {
      return;
      }

    setIsUploading(true);
    try {
      const uploadedFiles = [];
      // 上传到服务器
      for (const file of filteredFiles) {
        const localAnalysisMetadata = await analyzeFileContent(file);
        const serverFile = await uploadDataset(file, {
          type: 'training',
          description: `Uploaded on ${new Date().toLocaleString()}`,
          userId: 'user123',
          metadata: {
            rowCount: localAnalysisMetadata.rows,
            columnCount: localAnalysisMetadata.columns,
            features: localAnalysisMetadata.previewData.length > 0 ? Object.keys(localAnalysisMetadata.previewData[0]) : []
          }
        });
        uploadedFiles.push(serverFile);
      }
      // 只显示本次上传的文件 (with server metadata)
      setDatasetFiles(uploadedFiles);

      // 默认选中最新上传的文件
      if (uploadedFiles.length > 0) {
        handleFileSelect(uploadedFiles[uploadedFiles.length - 1]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('File upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 自动分析所有文件内容并缓存
  const analyzeFiles = (files) => {
    const previewMap = {};
    let analyzedCount = 0;
    files.forEach(file => {
      analyzeFileContent(file, (preview) => {
        const key = file.webkitRelativePath || file.name;
        previewMap[key] = preview;
        analyzedCount++;
        if (analyzedCount === files.length) {
          setFilePreviewMap(previewMap);
          setSelectedFile(files[0]);
          setFilePreview(previewMap[files[0].webkitRelativePath || files[0].name]);
        }
      });
    });
  };

  // 分析单个文件内容
  const analyzeFileContent = async (file, callback) => {
    const sizeInBytes = file.fileSize || file.size;
    let sizeStr = '';
    if (sizeInBytes < 1024) {
      sizeStr = sizeInBytes + ' B';
    } else if (sizeInBytes < 1024 * 1024) {
      sizeStr = (sizeInBytes / 1024).toFixed(2) + ' KB';
    } else if (sizeInBytes < 1024 * 1024 * 1024) {
      sizeStr = (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      sizeStr = (sizeInBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    const fileInfo = {
      name: file.name,
      size: sizeStr,
      format: file.name.split('.').pop().toUpperCase(),
      updateTime: new Date().toLocaleString(),
    };

    // 如果是数据库中的文件，获取预览内容
    if (file.filePath) {
      try {
        const previewResult = await getDatasetPreview(file._id);
        const { headers, data: previewData, totalRows } = previewResult;

        const result = {
          ...fileInfo,
          rows: totalRows,
          columns: headers.length,
          missingRatio: 'N/A', // Missing ratio calculation requires full data scan on the backend
          previewData: previewData
        };
        if (callback) callback(result);
        return result;
      } catch (error) {
        console.error('Failed to get or parse preview:', error);
        // Fallback to basic info if preview fails
        const result = {
        ...fileInfo,
        rows: file.metadata?.rowCount || 0,
        columns: file.metadata?.columnCount || 0,
        missingRatio: '0%',
        previewData: []
      };
        if (callback) callback(result);
        return result;
      }
    }

    // 处理本地文件
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const previewData = parseContentToPreview(content, fileInfo.format);

        const rows = previewData.length;
        const columns = previewData.length > 0 ? Object.keys(previewData[0]).length : 0;
        let missingCount = 0;
        let totalCount = 0;
        
        previewData.forEach(row => {
          Object.values(row).forEach(value => {
            totalCount++;
            if (!value) missingCount++;
          });
        });
        
        const missingRatio = totalCount > 0 ? `${((missingCount / totalCount) * 100).toFixed(2)}%` : '0%';
        
        const result = {
          ...fileInfo,
          rows,
          columns,
          missingRatio,
          previewData
        };

        if (callback) {
          callback(result);
        }
        resolve(result);
      };

      reader.onerror = (error) => {
        console.error('File reading error:', error);
        const result = {
          ...fileInfo,
          rows: 0,
          columns: 0,
          missingRatio: '0%',
          previewData: []
        };
        if (callback) {
          callback(result);
        }
        resolve(result);
      };

      reader.readAsText(file);
    });
  };

  const handleDeleteDataset = async (fileId, event) => {
    event.stopPropagation(); // Stop the click from selecting the file
    if (window.confirm('Are you sure you want to delete this dataset?')) {
      try {
        await deleteDataset(fileId);
        const updatedDatasets = datasetFiles.filter(d => d._id !== fileId);
        setDatasetFiles(updatedDatasets);
        if (selectedFile && selectedFile._id === fileId) {
          setSelectedFile(null);
          setFilePreview(null);
        }
      } catch (error) {
        console.error('Failed to delete dataset:', error);
        alert(`Failed to delete dataset: ${error.message}`);
      }
    }
  };

  // 新增一个纯函数用于解析内容
  const parseContentToPreview = (content, format) => {
    let previewData = [];
    if (format === 'CSV') {
      const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim());
        previewData = lines.slice(1).map(line => { // 从第二行开始都是数据
          const values = line.split(',');
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] ? values[idx].trim() : '';
          });
          return row;
        });
      }
    } else if (format === 'JSON') {
        try {
            let obj = JSON.parse(content);
            let arr = [];
            if (Array.isArray(obj)) {
              arr = obj;
            } else if (obj && typeof obj === 'object') {
              const arrKey = Object.keys(obj).find(k => Array.isArray(obj[k]));
              if (arrKey) {
                arr = obj[arrKey];
              } else {
                arr = [obj];
              }
            }
            
            const allKeys = Array.from(arr.reduce((set, item) => {
              if (item && typeof item === 'object' && !Array.isArray(item)) {
                Object.keys(item).forEach(k => set.add(k));
              }
              return set;
            }, new Set()));
            
            previewData = arr.slice(0, 20).map(item => {
              if (item && typeof item === 'object' && !Array.isArray(item)) {
                const row = {};
                allKeys.forEach(k => { row[k] = item[k] !== undefined ? item[k] : ''; });
                return row;
              } else {
                return { Value: item };
              }
            });
        } catch(e) {
            console.error("JSON parsing error in preview:", e);
            previewData = [];
        }
    }
    // 可以为 TXT 和 MD 添加更多解析逻辑
    return previewData;
  }

  // 切换文件时直接展示已分析内容
  const handleFileSelect = (file) => {
    console.log('handleFileSelect triggered with file:', file); // 调试信息
    setSelectedFile(file);
    // 检查文件对象是否是来自后端的标准对象
    if (file && file.filePath) {
        console.log('File is from backend, analyzing for preview.'); // 调试信息
        analyzeFileContent(file).then(preview => {
            console.log('Analysis complete, setting file preview:', preview); // 调试信息
            setFilePreview(preview);
        });
    } else {
        // 对于本地文件或已经有预览缓存的情况
    const key = file.webkitRelativePath || file.name;
        console.log('File is local or cached, key:', key); // 调试信息
    if (filePreviewMap[key]) {
            console.log('Preview found in cache.'); // 调试信息
      setFilePreview(filePreviewMap[key]);
    } else {
            console.log('No preview in cache, analyzing file.'); // 调试信息
      analyzeFileContent(file, (preview) => {
        setFilePreview(preview);
        setFilePreviewMap(prev => ({ ...prev, [key]: preview }));
      });
    }
    }
  };

  // 处理拖拽上传
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const items = e.dataTransfer.items;
    const files = [];

    setIsUploading(true);
    
    const processEntry = async (entry) => {
      if (entry.isFile) {
        const file = await new Promise((resolve) => entry.file(resolve));
        files.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = await new Promise((resolve) => {
          reader.readEntries(resolve);
        });
        for (const entry of entries) {
          await processEntry(entry);
        }
      }
    };

    const processItems = async () => {
      if (uploadType === 'folder') {
        // 文件夹模式：递归处理所有文件
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              await processEntry(entry);
            }
          }
        }
      } else {
        // 文件模式：直接处理所有文件
        const droppedFiles = Array.from(e.dataTransfer.files);
        files.push(...droppedFiles);
      }
      
      const allowedExts = ['CSV', 'TXT', 'JSON', 'MD'];
      const filteredFiles = files.filter(file => {
        const ext = file.name.split('.').pop().toUpperCase();
        return allowedExts.includes(ext);
      });
      
      if (filteredFiles.length === 0) {
        setIsUploading(false);
        return;
        }

      try {
        const uploadedFiles = [];
        for (const file of filteredFiles) {
          const localAnalysisMetadata = await analyzeFileContent(file);
          const serverFile = await uploadDataset(file, {
            type: 'training',
            description: `Uploaded on ${new Date().toLocaleString()}`,
            userId: 'user123',
            metadata: {
              rowCount: localAnalysisMetadata.rows,
              columnCount: localAnalysisMetadata.columns,
              features: localAnalysisMetadata.previewData.length > 0 ? Object.keys(localAnalysisMetadata.previewData[0]) : []
            }
          });
          uploadedFiles.push(serverFile);
        }
        // 只显示本次上传的文件 (with server metadata)
        setDatasetFiles(uploadedFiles);
        
        // 默认选中最新上传的文件
        if (uploadedFiles.length > 0) {
            handleFileSelect(uploadedFiles[uploadedFiles.length - 1]);
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        alert('File upload failed: ' + error.message);
      } finally {
        setIsUploading(false);
      }
    };

    processItems();
  };

  // 添加拖拽视觉反馈
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.border = '2px dashed #0056d6';
    e.currentTarget.style.background = '#f0f7ff';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.border = '1px solid #e0e0e0';
    e.currentTarget.style.background = '#fff';
  };

  const handleDragEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.border = '1px solid #e0e0e0';
    e.currentTarget.style.background = '#fff';
  };

  // 辅助函数：构建文件树结构（只将有扩展名的叶子节点视为文件）
  function buildFileTree(files) {
    const root = { name: 'Loaded Files', type: 'folder', children: [] };
    if (files && files.length > 0) {
    files.forEach(file => {
        root.children.push({
          id: file._id,
          name: file.name,
          type: 'file',
          icon: '📄', // Reverted to the original simple text icon
          file: file 
        });
      });
    }
    return root;
  }

  // VSCode 风格的文件树
  function VSCodeFileTree({ node, onSelect, selectedFile, level = 0 }) {
    const [isOpen, setIsOpen] = useState(level === 0);

    if (node.type === 'folder') {
      return (
        <div className="file-tree-node">
          <div
            className={`file-tree-item folder ${isOpen ? 'open' : ''}`}
            style={{ paddingLeft: `${level * 20}px` }}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="folder-icon">{isOpen ? '▼' : '▶'}</span>
            {node.name}
          </div>
          {isOpen && node.children.map(child => (
            <VSCodeFileTree key={child.id || child.name} node={child} onSelect={onSelect} selectedFile={selectedFile} level={level + 1} />
          ))}
        </div>
      );
    }

    // It's a file
    const isSelected = selectedFile && node.id === selectedFile._id;
      return (
        <div
        className={`file-tree-item file ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 20}px` }}
          onClick={() => onSelect(node.file)}
        >
        <span className="file-icon">{node.icon}</span>
        <span className="file-name">{node.name}</span>
        </div>
      );
  }

  // 修改 handleRunClick 函数
  const handleRunClick = async () => {
    setShowOutcomeButton(true);
    setShowProcessPanel(true);
    setIsAnimating(true);
    setIsGenerating(true);
    
    try {
      // 检查是否上传了数据集
      if (datasetFiles.length === 0) {
        alert('请先上传至少一个数据集文件');
        setIsAnimating(false);
        setIsGenerating(false);
        return;
      }

      // 检查是否输入了任务描述
      if (!taskDesc.trim()) {
        alert('请输入任务描述');
        setIsAnimating(false);
        setIsGenerating(false);
        return;
      }

      // -- 开始修改 --
      // 1. 收集所有数据集的路径
      const datasetPaths = datasetFiles.map(f => f.filePath).filter(Boolean);
      if (datasetPaths.length === 0) {
        alert('没有找到有效的数据集路径，请重新上传文件。');
        setIsAnimating(false);
        setIsGenerating(false);
        return;
      }

      // 2. 创建数据集描述，供AI理解
      const datasetsDescription = datasetFiles
        .map(f => `- 文件名: ${f.name}\n  路径: ${f.filePath}`)
        .join('\n');

      // 3. 准备包含所有数据集信息的任务描述
      const taskPrompt = `任务: ${taskDesc}

可用的数据集如下:
${datasetsDescription}

请生成代码来处理所有这些列出的数据集。

---
其他信息:
评估方法: ${selectedEval.join(', ')}
评估描述: ${evalDesc}
参考解决方案: ${solution}`;
      // -- 结束修改 --
      
      console.log('Generating code for multiple datasets:', { taskPrompt, datasetPaths });
      
      // 重置生成进度
      setGenerationProgress({
        currentStep: 0,
        totalSteps: 0,
        status: 'planning',
        message: '正在分析任务并制定执行计划...',
        plans: [],
        currentStepCode: '',
        accumulatedCode: '',
        errors: []
      });
      setRealTimeSteps([]);
      
      // 使用实时代码生成，传递路径数组
      const sessionId = generateCodeRealtime(taskPrompt, datasetPaths, {
        onStarted: (data) => {
          console.log('Generation started:', data);
          setGenerationProgress(prev => ({
            ...prev,
            status: 'planning',
            message: '正在分析任务并制定执行计划...'
          }));
        },
        
        onPlanning: (data) => {
          console.log('Planning step:', data);
          setGenerationProgress(prev => ({
            ...prev,
            status: 'planning',
            message: data.message
          }));
        },
        
        onPlanningComplete: (data) => {
          console.log('Planning complete:', data);
          setGenerationProgress(prev => ({
            ...prev,
            status: 'planning-complete',
            message: data.message,
            plans: data.plans,
            totalSteps: data.plans.length
          }));
        },
        
        onStepStarted: (data) => {
          console.log('Step started:', data);
          console.log('Step data details:', {
            stepId: data.stepId,
            stepName: data.stepName,
            message: data.message,
            fullData: data
          });
          setGenerationProgress(prev => ({
            ...prev,
            currentStep: data.stepId,
            status: 'generating',
            message: data.message
          }));
          
          // 添加新的步骤到实时步骤列表
          setRealTimeSteps(prev => [...prev, {
            id: data.stepId,
            name: data.stepName || `Step ${data.stepId}`, // 添加fallback
            status: 'generating',
            code: '',
            message: data.message,
            showCode: false // 添加showCode属性，默认不显示代码
          }]);
        },
        
        onStepComplete: (data) => {
          console.log('Step complete:', data);
          setGenerationProgress(prev => ({
            ...prev,
            status: 'step-complete',
            message: data.message,
            currentStepCode: data.code, // 只显示当前步骤的代码
            accumulatedCode: data.accumulatedCode
          }));
          
          // 更新实时步骤 - 只显示当前步骤的代码
          setRealTimeSteps(prev => prev.map(step => 
            step.id === data.stepId 
              ? { ...step, status: 'complete', code: data.code, message: data.message, showCode: false }
              : step
          ));
      
          // 更新生成的代码 - 显示累积的代码
          setGenerationProgress(prev => ({
            ...prev,
            accumulatedCode: data.accumulatedCode
          }));
        },
        
        onStepChecking: (data) => {
          console.log('Step checking:', data);
          setGenerationProgress(prev => ({
            ...prev,
            status: 'checking',
            message: data.message
          }));
          
          // 更新实时步骤状态
          setRealTimeSteps(prev => prev.map(step => 
            step.id === data.stepId 
              ? { ...step, status: 'checking', message: data.message }
              : step
          ));
        },
        
        onStepError: (data) => {
          console.log('Step error:', data);
          setGenerationProgress(prev => ({
            ...prev,
            status: 'error',
            message: data.message,
            errors: [...prev.errors, { stepId: data.stepId, error: data.error }]
          }));
          
          // 更新实时步骤状态
          setRealTimeSteps(prev => prev.map(step => 
            step.id === data.stepId 
              ? { ...step, status: 'error', message: data.message, error: data.error }
              : step
          ));
        },
        
        onStepRevised: (data) => {
          console.log('Step revised:', data);
          setGenerationProgress(prev => ({
            ...prev,
            status: 'revised',
            message: data.message,
            accumulatedCode: data.revisedCode
          }));
          
          // 更新实时步骤状态 - 只更新当前步骤的代码
          setRealTimeSteps(prev => prev.map(step => 
            step.id === data.stepId 
              ? { ...step, status: 'revised', code: data.revisedCode, message: data.message }
              : step
          ));
          
          // 更新生成的代码 - 显示修正后的累积代码
          setGenerationProgress(prev => ({
            ...prev,
            accumulatedCode: data.revisedCode
          }));
        },
        
        onStepChecked: (data) => {
          console.log('Step checked:', data);
          setGenerationProgress(prev => ({
            ...prev,
            status: 'checked',
            message: data.message
          }));
      
          // 更新实时步骤状态
          setRealTimeSteps(prev => prev.map(step => 
            step.id === data.stepId 
              ? { ...step, status: 'checked', message: data.message }
              : step
          ));
        },
        
        onFinalRefining: (data) => {
          console.log('Final refining:', data);
          setGenerationProgress(prev => ({
            ...prev,
            status: 'refining',
            message: data.message
          }));
        },
        
        onComplete: (data) => {
          console.log('Generation complete:', data);
          setGenerationProgress(prev => ({
            ...prev,
            status: 'complete',
            message: data.message,
            accumulatedCode: data.finalCode
          }));
          
          // 结束动画
            setIsAnimating(false);
          setIsGenerating(false);
          
          // 不设置 visibleSteps，保持 realTimeSteps 的显示
          // setVisibleSteps(['STEP1', 'STEP2', 'ERROR_DEBUG', 'FINALLY']);
        },
        
        onError: (data) => {
          console.error('Generation error:', data);
          setGenerationProgress(prev => ({
            ...prev,
            status: 'error',
            message: data.message
          }));
          
          setIsAnimating(false);
          setIsGenerating(false);
          
          alert('代码生成过程中出现错误: ' + data.error);
        }
      });
      
    } catch (error) {
      console.error('Error generating code:', error);
      alert('生成代码时发生错误: ' + error.message);
      setIsAnimating(false);
      setIsGenerating(false);
    }
  };

  // 修改 handleOutcomeClick 函数
  const handleOutcomeClick = () => {
    setShowProcessPanel(false);
    setShowOutcomeButton(false);
    // 切换到代码标签页
    setTab('code');
  };

  const handleDownloadMetrics = () => {
    // For now, just download the placeholder text as a simple file
    const metricsText = '暂无评价指标'; // Replace with actual metrics data when available
    const element = document.createElement('a');
    const file = new Blob([metricsText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'evaluation_metrics.txt'; // Suggest a .txt extension
    document.body.appendChild(element); // Required for Firefox
    element.click();
    document.body.removeChild(element); // Clean up
  };

  const parseGeneratedCode = (code) => {
    // 将代码按行分割
    const lines = code.split('\n');
    
    // 初始化步骤内容
    const steps = {
      step1: [],
      step2: [],
      errorDebug: [],
      finally: []
    };
    
    // 解析代码并分类到不同步骤
    let currentStep = 'step1';
    let currentContent = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // 根据代码内容判断属于哪个步骤
      if (trimmedLine.startsWith('import') || trimmedLine.includes('import ')) {
        if (currentContent.length > 0) {
          steps[currentStep].push(currentContent.join('\n'));
          currentContent = [];
        }
        currentStep = 'step1';
        currentContent.push(trimmedLine);
      } else if (trimmedLine.includes('preprocess') || 
                 trimmedLine.includes('StandardScaler') || 
                 trimmedLine.includes('train_test_split') ||
                 trimmedLine.includes('feature_') ||
                 trimmedLine.includes('data') ||
                 trimmedLine.includes('dataset')) {
        if (currentContent.length > 0) {
          steps[currentStep].push(currentContent.join('\n'));
          currentContent = [];
        }
        currentStep = 'step2';
        currentContent.push(trimmedLine);
      } else if (trimmedLine.includes('try') || 
                 trimmedLine.includes('except') || 
                 trimmedLine.includes('error') ||
                 trimmedLine.includes('warning') ||
                 trimmedLine.includes('debug')) {
        if (currentContent.length > 0) {
          steps[currentStep].push(currentContent.join('\n'));
          currentContent = [];
        }
        currentStep = 'errorDebug';
        currentContent.push(trimmedLine);
      } else if (trimmedLine.includes('print') || 
                 trimmedLine.includes('evaluate') || 
                 trimmedLine.includes('metrics') ||
                 trimmedLine.includes('result') ||
                 trimmedLine.includes('output') ||
                 trimmedLine.includes('save')) {
        if (currentContent.length > 0) {
          steps[currentStep].push(currentContent.join('\n'));
          currentContent = [];
        }
        currentStep = 'finally';
        currentContent.push(trimmedLine);
      } else {
        currentContent.push(trimmedLine);
      }
    });
    
    // 添加最后的内容
    if (currentContent.length > 0) {
      steps[currentStep].push(currentContent.join('\n'));
    }
    
    return steps;
  };

  return (
    <div className="container" style={{ minHeight: '100vh', minWidth: 1200, height: '100vh', overflowY: 'auto', overflowX: 'hidden', alignItems: 'flex-start', padding: '32px', display: 'flex', position: 'relative' }}>
      {/* 左侧输入区 - 始终可见 */}
      <div className="left-panel" style={{ padding: '0 22px', minWidth: 320, maxWidth: 400, display: 'flex', flexDirection: 'column', height: 'auto', fontSize: 17, boxSizing: 'border-box', justifyContent: 'flex-start', flexShrink: 0 }}>
        <h2 style={{ marginBottom: 28, fontSize: 28, textAlign: 'center', fontWeight: 700 }}>Input</h2>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="input-section" style={{ gap: 8 }}>
            <label style={{ fontSize: 15 }}>Task Description</label>
            <textarea
              placeholder="[Natural language input]"
              value={taskDesc}
              onChange={e => setTaskDesc(e.target.value)}
              style={{ minHeight: 28, fontSize: 14, padding: 4 }}
            />
          </div>
          <div className="input-section" style={{ gap: 8 }}>
            <label style={{ fontSize: 15 }}>Evaluation Method</label>
            <div style={{ position: 'relative', width: '100%', marginBottom: 4 }}>
              <div
                className="dropdown-selected"
                style={{ cursor: 'pointer', padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fafbfc', fontSize: 14 }}
                onClick={toggleEvalDropdown}
              >
                {'Default choice'}
                <span style={{ float: 'right', color: '#888' }}>{evalDropdownOpen ? '▲' : '▼'}</span>
              </div>
              {evalDropdownOpen && (
                <div className="dropdown-list" style={{ position: 'absolute', left: 0, right: 0, top: '110%', zIndex: 10, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 6 }}>
                  {evaluationOptions.map(opt => (
                    <div
                      key={opt}
                      className="dropdown-item"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '2px 4px', fontSize: 14, color: selectedEval.includes(opt) ? '#0056d6' : '#222' }}
                      onClick={() => handleEvalOptionClick(opt)}
                    >
                      <span>{opt}</span>
                      {selectedEval.includes(opt) && <span style={{ color: '#1976d2', fontWeight: 'bold', marginLeft: 8 }}>✔</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <textarea
              placeholder="[Natural language input for evaluation method]"
              value={evalDesc || ''}
              onChange={e => setEvalDesc(e.target.value)}
              style={{ minHeight: 28, fontSize: 14, padding: 4, marginTop: 2 }}
            />
          </div>
          <div className="input-section" style={{ gap: 8 }}>
            <label style={{ fontSize: 15 }}>Dataset</label>
            <div className="dataset-upload" 
              style={{
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                padding: '8px 8px 6px 8px',
                margin: '0 0 6px 0',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 40,
                border: '1px solid #e0e0e0',
                transition: 'all 0.2s ease'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>Drag and drop files here</div>
                <div className="upload-tip" style={{ color: '#888', fontSize: 12, margin: 0 }}>Limit 200MB per file<br/>CSV, TXT, JSON, MD</div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <select
                  value={uploadType}
                  onChange={e => setUploadType(e.target.value)}
                  style={{ marginBottom: 0, width: 100, textAlign: 'center', fontSize: 13, height: 24 }}
                >
                  <option value="file">Upload files</option>
                  <option value="folder">Upload folder</option>
                </select>
                <input
                  type="file"
                  multiple
                  accept=".csv,.txt,.json,.md"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                  disabled={isUploading}
                  {...(uploadType === 'folder' ? { webkitdirectory: '' } : {})}
                />
                <label htmlFor="file-upload" className="upload-btn" style={{ width: 100, textAlign: 'center', margin: 0, height: 28, lineHeight: '28px', fontSize: 14, opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                  {isUploading ? 'Uploading...' : 'Browse files'}
                </label>
              </div>
            </div>
            <div style={{ textAlign: 'center', margin: '4px 0 0 0', fontSize: 13, color: datasetFiles.length > 0 ? '#1aaf5d' : '#888' }}>
              {isUploading ? 'Processing uploaded files...' : (datasetFiles.length > 0 ? 'Upload successful!' : '')}
            </div>
            {datasetFiles.length > 0 && (
              <select 
                className="file-select"
                onChange={(e) => {
                  const selectedFile = datasetFiles[e.target.value];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
                style={{ margin: '4px auto 0 auto', width: 200, textAlign: 'center', display: 'block', fontSize: 15, height: 28 }}
              >
                <option value="">View loaded files</option>
                {datasetFiles.map((file, idx) => (
                  <option key={idx} value={idx}>{file.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="input-section" style={{ gap: 8 }}>
            <label style={{ fontSize: 15 }}>Solution</label>
            <textarea
              placeholder="[Natural language input]"
              value={solution}
              onChange={e => setSolution(e.target.value)}
              style={{ minHeight: 28, fontSize: 14, padding: 4 }}
            />
          </div>
        </div>
        <button className="run-btn" onClick={handleRunClick} style={{ height: 44, fontSize: 20, marginTop: 24, width: '100%' }} disabled={isUploading || isGenerating}>
          {isGenerating ? 'GENERATING...' : 'RUN'}
        </button>
      </div>

      {/* 中间区域 */}
      <div className="center-content-panel" style={{background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%'}}>
        <div className="tab-header" style={{marginBottom: 0}}>
          <span
            className={centerTab === 'process' ? 'active' : ''}
            onClick={() => setCenterTab('process')}
          >过程面板</span>
          <span
            className={centerTab === 'dataset' ? 'active' : ''}
            onClick={() => setCenterTab('dataset')}
          >数据集预览</span>
        </div>
        <div className="tab-content" style={{flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0}}>
          {centerTab === 'process' ? (
            <ProcessPanel
              isGenerating={isGenerating}
              generationProgress={generationProgress}
              realTimeSteps={realTimeSteps}
              onOutcomeClick={handleOutcomeClick}
            />
          ) : (
          <>
            {!datasetFiles.length ? (
              <div className="empty-state">
                <div className="empty-message">
                  <h3>等待数据集上传</h3>
                  <p>请在左侧点击"Browse files"上传数据集文件</p>
                </div>
              </div>
            ) : (
              <>
                <div className="file-list-section" style={{ height: 220, overflowY: 'auto', minHeight: 120 }}>
                  <h3>File list</h3>
                  <div className="file-tree">
                    <VSCodeFileTree node={buildFileTree(datasetFiles)} onSelect={handleFileSelect} selectedFile={selectedFile} />
                  </div>
                </div>
                {filePreview && (
                  <div className="data-info-section" style={{ height: 420, overflowY: 'auto', minHeight: 220 }}>
                    <div className="basic-info">
                      <h4>Basic information</h4>
                      <div>File name: {filePreview.name}</div>
                      <div>Size: {filePreview.size}</div>
                      <div>Format: {filePreview.format}</div>
                      <div>Number of rows: {filePreview.rows}</div>
                      <div>Number of columns: {filePreview.columns}</div>
                      <div>Update time: {filePreview.updateTime}</div>
                      <div>Ratio of missing value: {filePreview.missingRatio}</div>
                    </div>
                    <div className="data-preview">
                      <h4>Data preview</h4>
                      <table>
                        <thead>
                          <tr>
                            {filePreview.previewData && filePreview.previewData.length > 0 && (() => {
                              const first = filePreview.previewData[0];
                              if (first && typeof first === 'object' && !Array.isArray(first)) {
                                return Object.keys(first).map((key) => (
                                  <th key={key}>{key}</th>
                                ));
                              } else {
                                return <th>Value</th>;
                              }
                            })()}
                          </tr>
                        </thead>
                        <tbody>
                          {filePreview.previewData && filePreview.previewData.length > 0 ? (() => {
                            const first = filePreview.previewData[0];
                            if (first && typeof first === 'object' && !Array.isArray(first)) {
                              return filePreview.previewData.map((row, idx) => (
                                <tr key={idx}>
                                  {Object.keys(first).map((key) => (
                                    <td key={key}>{row && row[key] !== undefined ? String(row[key]) : ''}</td>
                                  ))}
                                </tr>
                              ));
                            } else {
                              return filePreview.previewData.map((val, idx) => (
                                <tr key={idx}><td>{val !== undefined && val !== null ? String(val) : ''}</td></tr>
                              ));
                            }
                          })() : (
                            <tr><td colSpan={3} style={{textAlign: 'center', color: '#aaa'}}>No data</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
          )}
                </div>
      </div>

      {/* 右侧代码与结果展示区 */}
      <div className="right-panel" style={{ 
        padding: '0 22px', 
        flex: 1, 
        minWidth: 400, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'stretch', 
        boxSizing: 'border-box' 
      }}>
        {showProcessPanel ? (
          <div className="process-panel" style={{
            background: '#fff', padding: '20px', borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', height: '100%',
            display: 'flex', flexDirection: 'column', overflowY: 'hidden'
          }}>
            <h2 style={{ 
              marginBottom: 20, fontSize: 24, textAlign: 'center', fontWeight: 700,
              position: 'sticky', top: 0, background: '#fff', zIndex: 10,
              padding: '0 0 8px 0', marginTop: 0
            }}>Process Details</h2>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '1.2rem' }}>
              {/* This area is intentionally left blank during generation */}
            </div>
          </div>
        ) : (
          <>
            <div className="tab-header">
              <span
                className={tab === 'code' ? 'active' : ''}
                onClick={() => setTab('code')}
              >code</span>
              <span
                className={tab === 'display' ? 'active' : ''}
                onClick={() => setTab('display')}
              >dispaly</span>
            </div>
            <div className="tab-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {tab === 'code' ? (
                <ResultEditor />
              ) : (
                <IndicatorDisplay />
              )}
            </div>
          </>
        )}
      </div>

      {/* OUTCOME 按钮 */}
      {showOutcomeButton && (
        <button 
          onClick={handleOutcomeClick}
          className="run-btn"
          disabled={isGenerating}
          style={{
            position: 'fixed',
            bottom: '60px',
            right: '120px',
            width: 'auto',
            padding: '0 30px',
            height: '44px',
            fontSize: '20px',
            marginTop: 0,
            zIndex: 1000,
            opacity: isGenerating ? 0.6 : 1,
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
        >
          OUTCOME
        </button>
      )}
    </div>
  );
}

export default App; 