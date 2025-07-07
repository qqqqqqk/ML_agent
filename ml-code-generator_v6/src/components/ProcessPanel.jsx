import React, { useState } from 'react';

// 过程展示面板组件
const ProcessPanel = ({
  isGenerating,
  generationProgress,
  realTimeSteps,
  onOutcomeClick,
  onCodeUpdate
}) => {
  // 迁移的本地状态
  const [selectedStep, setSelectedStep] = useState(null);
  const [stepCode, setStepCode] = useState('');
  const [showCurrentCode, setShowCurrentCode] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editedCode, setEditedCode] = useState('');

  // 辅助函数
  const getStatusColor = (status) => {
    switch (status) {
      case 'planning':
      case 'generating':
      case 'checking':
        return '#ffc107';
      case 'complete':
      case 'checked':
      case 'revised':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'refining':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case 'planning': return 'Planning';
      case 'generating': return 'Generating';
      case 'checking': return 'Checking';
      case 'complete': return 'Complete';
      case 'checked': return 'Checked';
      case 'revised': return 'Revised';
      case 'error': return 'Error';
      case 'refining': return 'Refining';
      default: return 'Idle';
    }
  };
  const getStepStatusText = (status) => {
    switch (status) {
      case 'generating': return 'Generating';
      case 'checking': return 'Checking';
      case 'complete': return 'Complete';
      case 'checked': return 'Checked';
      case 'revised': return 'Revised';
      case 'error': return 'Error';
      default: return 'Pending';
    }
  };
  const handleStepClick = (step) => {
    if (selectedStep === step) {
      setSelectedStep(null);
      setStepCode('');
    } else {
      setSelectedStep(step);
      setStepCode(''); // 可扩展为显示代码
    }
  };

  return (
    <div className="process-panel" style={{
      background: '#fff', padding: '20px', borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', height: '100%',
      display: 'flex', flexDirection: 'column', overflowY: 'hidden'
    }}>
      <h2 style={{ 
        marginBottom: 20, fontSize: 24, textAlign: 'center', fontWeight: 700,
        position: 'sticky', top: 0, background: '#fff', zIndex: 10,
        padding: '0 0 8px 0', marginTop: 0
      }}>Process Steps</h2>
      
      {/* 当前代码状态显示区域 */}
      {generationProgress.accumulatedCode && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontWeight: 600, color: '#495057' }}>
              当前代码状态
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowCurrentCode(!showCurrentCode)}
                style={{
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {showCurrentCode ? '隐藏代码' : '查看代码'}
              </button>
              {showCurrentCode && (
                <button
                  onClick={() => {
                    if (isEditingCode) {
                      // 保存编辑的代码
                      if (onCodeUpdate) {
                        onCodeUpdate(editedCode);
                      }
                      setIsEditingCode(false);
                    } else {
                      // 开始编辑
                      setIsEditingCode(true);
                      setEditedCode(generationProgress.accumulatedCode);
                    }
                  }}
                  style={{
                    background: isEditingCode ? '#28a745' : '#ffc107',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {isEditingCode ? '保存' : '编辑'}
                </button>
              )}
            </div>
          </div>
          {showCurrentCode && (
            <div style={{
              background: '#fff',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              padding: '12px',
              maxHeight: '300px',
              overflowY: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {isEditingCode ? (
                <textarea
                  value={editedCode}
                  onChange={(e) => setEditedCode(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              ) : (
                generationProgress.accumulatedCode
              )}
            </div>
          )}
          <div style={{
            fontSize: '12px',
            color: '#6c757d',
            marginTop: '8px'
          }}>
            代码长度: {generationProgress.accumulatedCode.length} 字符
          </div>
        </div>
      )}
      
      {isGenerating && generationProgress.totalSteps > 0 && (
        <div className="progress-bar" style={{
          width: `${(generationProgress.currentStep / generationProgress.totalSteps) * 100}%`
        }} />
      )}
      {isGenerating && (
        <div style={{ padding: '16px', marginBottom: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: '#495057' }}>{generationProgress.message}</span>
            <span style={{ fontSize: '12px', color: '#6c757d', padding: '4px 8px', background: '#e9ecef', borderRadius: '4px' }}>
              {generationProgress.currentStep}/{generationProgress.totalSteps}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(generationProgress.status), marginRight: '6px' }} />
            {getStatusText(generationProgress.status)}
          </div>
        </div>
      )}
      <div className="steps-container" style={{
        display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto',
        height: '100%', padding: '0 30px 16px 30px', position: 'relative', margin: '0 auto',
        width: '100%', maxWidth: '100%', boxSizing: 'border-box'
      }}>
        {realTimeSteps.length > 0 ? (
          realTimeSteps.map((step, index) => (
            <div key={step.id} className={`step-card ${step.status}`} style={{animation: `fadeIn 0.5s ease-out forwards`, animationDelay: `${index * 0.2}s`}}>
              <div className="step-header" onClick={() => handleStepClick(step.id)} style={{cursor: 'pointer'}}>
                <span className="step-index">Step {step.id}</span>
                <span className={`step-status ${step.status}`}>{getStepStatusText(step.status)}</span>
              </div>
              <div className="step-title">{step.name}</div>
              <div className="step-message">{step.message}</div>
              {step.timestamp && (
                <div style={{fontSize: '11px', color: '#6c757d', marginTop: '4px'}}>
                  处理时间: {step.timestamp}
                </div>
              )}
              {step.code && (
                <div>
                  <div 
                    style={{
                      cursor: 'pointer',
                      padding: '8px 12px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      marginTop: '8px',
                      fontSize: '13px',
                      color: '#007bff',
                      border: '1px solid #e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => handleStepClick(step.id)}
                  >
                    <span>查看步骤代码</span>
                    <span>{selectedStep === step.id ? '▼' : '▶'}</span>
                  </div>
                  {selectedStep === step.id && (
                    <pre className="step-code" style={{marginTop: '8px'}}>{step.code}</pre>
                  )}
                </div>
              )}
              {step.error && <div style={{color: '#dc3545', fontSize: '13px', marginTop: '8px'}}>错误: {step.error}</div>}
            </div>
          ))
        ) : (
          <div style={{color: '#888', textAlign: 'center', marginTop: '40px'}}>
            {isGenerating ? '等待生成步骤...' : '暂无步骤信息'}
          </div>
        )}
      </div>
      {/* OUTCOME 按钮由App.jsx统一渲染 */}
    </div>
  );
};

export default ProcessPanel; 