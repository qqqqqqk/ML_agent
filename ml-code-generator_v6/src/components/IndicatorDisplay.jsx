import React from 'react';

// 指标展示组件
const IndicatorDisplay = ({ 
  analyzedMetrics, 
  isAnalyzingMetrics, 
  metricsAnalysisError
}) => {
  // 获取当前显示的指标
  const getCurrentMetrics = () => {
    if (analyzedMetrics && analyzedMetrics.metrics) {
      // 将分析结果转换为显示格式
      const displayMetrics = {};
      analyzedMetrics.metrics.forEach(metric => {
        const key = metric.type || metric.name.toLowerCase().replace(/\s+/g, '');
        displayMetrics[key] = {
          value: metric.target_value || 'N/A',
          description: metric.description,
          priority: metric.priority
        };
      });
      return displayMetrics;
    }
    return null;
  };

  const currentMetrics = getCurrentMetrics();

  // 下载指标
  const handleDownloadMetrics = () => {
    let metricsText = '';
    
    if (currentMetrics) {
      // 下载分析后的指标
      metricsText = `任务类型: ${analyzedMetrics.task_type || 'Unknown'}\n`;
      metricsText += `目标变量: ${analyzedMetrics.dataset_info?.target_variable || 'Unknown'}\n`;
      metricsText += `问题类型: ${analyzedMetrics.dataset_info?.problem_type || 'Unknown'}\n\n`;
      metricsText += `识别到的评估指标:\n`;
      
      analyzedMetrics.metrics.forEach((metric, index) => {
        metricsText += `${index + 1}. ${metric.name}\n`;
        metricsText += `   类型: ${metric.type}\n`;
        metricsText += `   描述: ${metric.description}\n`;
        metricsText += `   目标值: ${metric.target_value || 'N/A'}\n`;
        metricsText += `   重要性: ${metric.priority}\n\n`;
      });
    } else {
      metricsText = '未识别到评估指标';
    }
    
    const element = document.createElement('a');
    const file = new Blob([metricsText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'evaluation_metrics.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="indicator-display" style={{padding: 20}}>
      <h3>指标展示区</h3>
      
      {/* 分析状态显示 */}
      {isAnalyzingMetrics && (
        <div style={{
          padding: '12px',
          margin: '12px 0',
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid #ffc107', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <span>正在分析任务描述中的评估指标...</span>
        </div>
      )}
      
      {/* 错误显示 */}
      {metricsAnalysisError && (
        <div style={{
          padding: '12px',
          margin: '12px 0',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '6px',
          color: '#721c24'
        }}>
          指标分析失败: {metricsAnalysisError}
        </div>
      )}
      
      {/* 任务信息显示 */}
      {analyzedMetrics && (
        <div style={{
          padding: '12px',
          margin: '12px 0',
          background: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          <div><strong>任务类型:</strong> {analyzedMetrics.task_type || 'Unknown'}</div>
          <div><strong>目标变量:</strong> {analyzedMetrics.dataset_info?.target_variable || 'Unknown'}</div>
          <div><strong>问题类型:</strong> {analyzedMetrics.dataset_info?.problem_type || 'Unknown'}</div>
        </div>
      )}
      
      {/* 指标显示 */}
      <div style={{margin: '18px 0'}}>
        {currentMetrics ? (
          // 显示分析后的指标
          <div>
            <h4 style={{ marginBottom: '12px', color: '#495057' }}>识别到的评估指标:</h4>
            {Object.entries(currentMetrics).map(([key, metric]) => (
              <div key={key} style={{
                padding: '8px 12px',
                margin: '4px 0',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '2px solid #007bff'
              }}>
                <div style={{ fontWeight: 600, color: '#495057' }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}: <span style={{ color: '#007bff' }}>{metric.value}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                  {metric.description}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 没有识别到指标
          <div style={{ color: '#888', fontSize: '15px', margin: '24px 0' }}>未识别到评估指标</div>
        )}
      </div>
      
      <button 
        onClick={handleDownloadMetrics} 
        style={{
          marginTop: 12, 
          padding: '8px 18px', 
          borderRadius: 6, 
          border: 'none', 
          background: '#1976d2', 
          color: '#fff', 
          fontSize: '1rem', 
          cursor: 'pointer'
        }}
        disabled={isAnalyzingMetrics}
      >
        {isAnalyzingMetrics ? '分析中...' : '下载指标'}
      </button>
      
      {/* 添加CSS动画 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default IndicatorDisplay; 