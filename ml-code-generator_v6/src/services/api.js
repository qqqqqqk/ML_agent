const API_BASE_URL = 'http://localhost:5001/api';
let socket = null;

// WebSocket 连接管理
export const connectWebSocket = () => {
  if (!socket) {
    const io = require('socket.io-client');
    socket = io('http://localhost:5001');
    
    socket.on('connect', () => {
      console.log('WebSocket connected');
    });
    
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }
  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// 实时代码生成
export const generateCodeRealtime = (taskPrompt, datasetPaths, callbacks) => {
  const socket = connectWebSocket();
  const sessionId = Date.now().toString();
  
  // 设置事件监听器
  socket.on('generation-started', (data) => {
    if (callbacks.onStarted) callbacks.onStarted(data);
  });
  
  socket.on('step-planning', (data) => {
    if (callbacks.onPlanning) callbacks.onPlanning(data);
  });
  
  socket.on('planning-complete', (data) => {
    if (callbacks.onPlanningComplete) callbacks.onPlanningComplete(data);
  });
  
  socket.on('step-started', (data) => {
    if (callbacks.onStepStarted) callbacks.onStepStarted(data);
  });
  
  socket.on('step-complete', (data) => {
    if (callbacks.onStepComplete) callbacks.onStepComplete(data);
  });
  
  socket.on('step-checking', (data) => {
    if (callbacks.onStepChecking) callbacks.onStepChecking(data);
  });
  
  socket.on('step-error', (data) => {
    if (callbacks.onStepError) callbacks.onStepError(data);
  });
  
  socket.on('step-revised', (data) => {
    if (callbacks.onStepRevised) callbacks.onStepRevised(data);
  });
  
  socket.on('step-checked', (data) => {
    if (callbacks.onStepChecked) callbacks.onStepChecked(data);
  });
  
  socket.on('final-refining', (data) => {
    if (callbacks.onFinalRefining) callbacks.onFinalRefining(data);
  });
  
  socket.on('generation-complete', (data) => {
    if (callbacks.onComplete) callbacks.onComplete(data);
    // 清理事件监听器
    cleanupEventListeners(socket);
  });
  
  socket.on('generation-error', (data) => {
    if (callbacks.onError) callbacks.onError(data);
    // 清理事件监听器
    cleanupEventListeners(socket);
  });
  
  // 发送代码生成请求
  socket.emit('generate-code', {
    task_prompt: taskPrompt,
    dataset_paths: datasetPaths,
    sessionId: sessionId
  });
  
  return sessionId;
};

// 清理事件监听器
const cleanupEventListeners = (socket) => {
  socket.off('generation-started');
  socket.off('step-planning');
  socket.off('planning-complete');
  socket.off('step-started');
  socket.off('step-complete');
  socket.off('step-checking');
  socket.off('step-error');
  socket.off('step-revised');
  socket.off('step-checked');
  socket.off('final-refining');
  socket.off('generation-complete');
  socket.off('generation-error');
};

export const uploadDataset = async (file, metadata) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);
  formData.append('type', metadata.type);
  formData.append('description', metadata.description || '');
  formData.append('metadata', JSON.stringify(metadata));
  formData.append('userId', metadata.userId);

  const response = await fetch(`${API_BASE_URL}/datasets`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload dataset');
  }

  return response.json();
};

export const getDatasets = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/datasets?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch datasets');
  }
  return response.json();
};

export const getDataset = async (id) => {
  const response = await fetch(`${API_BASE_URL}/datasets/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch dataset');
  }
  return response.json();
};

export const deleteDataset = async (id) => {
  const response = await fetch(`${API_BASE_URL}/datasets/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete dataset');
  }
  return response.json();
};

export const getDatasetPreview = async (id) => {
  const response = await fetch(`${API_BASE_URL}/datasets/${id}/preview`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch dataset preview');
  }
  return response.json();
};

// 保留原有的HTTP API用于兼容性
export const generateCode = async (taskPrompt, datasetPath) => {
  const response = await fetch(`${API_BASE_URL}/generate-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task_prompt: taskPrompt,
      dataset_path: datasetPath
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate code');
  }

  const data = await response.json();
  
  // 确保返回的数据格式正确
  return {
    code: data.code || data.generated_code || '',
    steps: data.steps || {
      step1: [],
      step2: [],
      errorDebug: [],
      finally: []
    }
  };
};

// 指标分析功能
export const analyzeMetricsRealtime = (taskPrompt, callbacks) => {
  const socket = connectWebSocket();
  const sessionId = Date.now().toString();
  
  // 设置事件监听器
  socket.on('metrics-analysis-started', (data) => {
    if (callbacks.onStarted) callbacks.onStarted(data);
  });
  
  socket.on('metrics-analysis-complete', (data) => {
    if (callbacks.onComplete) callbacks.onComplete(data);
    // 清理事件监听器
    cleanupMetricsEventListeners(socket);
  });
  
  socket.on('metrics-analysis-error', (data) => {
    if (callbacks.onError) callbacks.onError(data);
    // 清理事件监听器
    cleanupMetricsEventListeners(socket);
  });
  
  // 发送指标分析请求
  socket.emit('analyze-metrics', {
    task_prompt: taskPrompt,
    sessionId: sessionId
  });
  
  return sessionId;
};

// 清理指标分析事件监听器
const cleanupMetricsEventListeners = (socket) => {
  socket.off('metrics-analysis-started');
  socket.off('metrics-analysis-complete');
  socket.off('metrics-analysis-error');
};

// HTTP API版本的指标分析
export const analyzeMetrics = async (taskPrompt) => {
  const response = await fetch(`${API_BASE_URL}/analyze-metrics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task_prompt: taskPrompt
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze metrics');
  }

  return response.json();
};

export const submitFeedback = async (feedback, code, taskPrompt, previousCode = null) => {
  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      feedback,
      task_prompt: taskPrompt,
      previous_code: previousCode
    })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to submit feedback');
  }
  const data = await response.json();
  return data.revised_code;
}; 