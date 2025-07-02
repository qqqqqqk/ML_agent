import React, { useEffect, useRef, useState } from 'react';
import { evaluateInstructionFollowing } from '../services/api';

// 指标展示组件
const IndicatorDisplay = ({ 
  analyzedMetrics, 
  isAnalyzingMetrics, 
  metricsAnalysisError,
  solution,
  generatedCode
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

  // 计算指令跟随度（简单Jaccard相似度）
  let instructionFollowingScore = null;
  if (solution && generatedCode) {
    // 以行为单位，去除空行和首尾空格
    const solLines = solution.split('\n').map(l => l.trim()).filter(l => l);
    const genLines = generatedCode.split('\n').map(l => l.trim()).filter(l => l);
    const solSet = new Set(solLines);
    const genSet = new Set(genLines);
    const intersection = new Set([...solSet].filter(x => genSet.has(x)));
    const union = new Set([...solSet, ...genSet]);
    const score = union.size === 0 ? 1 : intersection.size / union.size;
    instructionFollowingScore = (score * 100).toFixed(1) + '%';
  }

  // 评估维度实现
  // 1. 完整性（Completeness）：solution有多少非空行，生成代码有多少覆盖
  let completenessScore = null;
  if (solution && generatedCode) {
    const solLines = solution.split('\n').map(l => l.trim()).filter(l => l);
    const genLines = generatedCode.split('\n').map(l => l.trim()).filter(l => l);
    const covered = solLines.filter(l => genLines.includes(l)).length;
    completenessScore = solLines.length === 0 ? 'N/A' : ((covered / solLines.length) * 100).toFixed(1) + '%';
  }

  // 2. 精确性（Precision）：如solution有JSON/CSV/结构要求，简单检测格式（这里只做JSON/CSV/字数限制的简单检测）
  let precisionScore = null;
  if (solution && generatedCode) {
    if (/json/i.test(solution)) {
      try {
        JSON.parse(generatedCode);
        precisionScore = '100% (JSON格式)';
      } catch {
        precisionScore = '0% (非JSON)';
      }
    } else if (/csv/i.test(solution)) {
      precisionScore = /,/.test(generatedCode) ? '100% (含逗号)' : '0% (无逗号)';
    } else if (/\d{1,4}字/.test(solution)) {
      // 检查字数限制
      const match = solution.match(/(\d{1,4})字/);
      if (match) {
        const limit = parseInt(match[1]);
        const len = generatedCode.replace(/\s/g, '').length;
        precisionScore = len <= limit ? `100% (${len}字)` : `0% (${len}字)`;
      }
    } else {
      precisionScore = 'N/A';
    }
  }

  // 3. 一致性（Consistency）：检查solution中有否"不使用xxx"，生成代码是否包含xxx
  let consistencyScore = null;
  if (solution && generatedCode) {
    const forbidMatch = solution.match(/不使用([\u4e00-\u9fa5A-Za-z0-9_]+)/);
    if (forbidMatch) {
      const keyword = forbidMatch[1];
      consistencyScore = generatedCode.includes(keyword) ? '0% (出现违禁内容)' : '100% (无违禁内容)';
    } else {
      consistencyScore = 'N/A';
    }
  }

  // 4. 约束遵守（Constraint Adherence）：如solution有"禁止xxx"或"不提及xxx"，生成代码是否包含xxx
  let constraintScore = null;
  if (solution && generatedCode) {
    const banMatch = solution.match(/禁止([\u4e00-\u9fa5A-Za-z0-9_]+)/);
    const notMentionMatch = solution.match(/不提及([\u4e00-\u9fa5A-Za-z0-9_]+)/);
    let violated = false;
    if (banMatch && generatedCode.includes(banMatch[1])) violated = true;
    if (notMentionMatch && generatedCode.includes(notMentionMatch[1])) violated = true;
    constraintScore = (banMatch || notMentionMatch) ? (violated ? '0% (出现违禁内容)' : '100% (无违禁内容)') : 'N/A';
  }

  // LLM评估结果
  const [llmEval, setLlmEval] = useState(null);
  useEffect(() => {
    if (solution && generatedCode) {
      setLlmEval('loading');
      evaluateInstructionFollowing(solution, generatedCode)
        .then(setLlmEval)
        .catch(e => setLlmEval({ error: e.message }));
    } else {
      setLlmEval(null);
    }
  }, [solution, generatedCode]);

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
      
      {/* 指令跟随度核心评估维度 */}
      {solution && generatedCode && (
        <div style={{
          padding: '8px 12px',
          margin: '4px 0',
          background: '#fffbe6',
          borderRadius: '6px',
          border: '2px solid #ff9800',
          fontWeight: 600,
          color: '#b26a00'
        }}>
          <div style={{ fontWeight: 700, fontSize: 16, margin: '6px 0 8px 0', color: '#b26a00' }}>
            评估指令跟随能力（Instruction Following）
          </div>
          {llmEval === 'loading' && <div>大模型评估中...</div>}
          {llmEval && llmEval.error && <div style={{color: 'red'}}>评估失败: {llmEval.error}</div>}
          {llmEval && !llmEval.error ? (
            <>
              <div style={{ fontWeight: 400, fontSize: 15, margin: '6px 0 0 0' }}>
                完整性（Completeness）：<span style={{ color: '#ff9800' }}>{llmEval.completeness}分</span>
                <span style={{ fontWeight: 400, fontSize: 12, color: '#888', marginLeft: 8 }}>{llmEval.completeness_reason}</span>
              </div>
              <div style={{ fontWeight: 400, fontSize: 15, margin: '2px 0 0 0' }}>
                精确性（Precision）：<span style={{ color: '#ff9800' }}>{llmEval.precision}分</span>
                <span style={{ fontWeight: 400, fontSize: 12, color: '#888', marginLeft: 8 }}>{llmEval.precision_reason}</span>
              </div>
              <div style={{ fontWeight: 400, fontSize: 15, margin: '2px 0 0 0' }}>
                一致性（Consistency）：<span style={{ color: '#ff9800' }}>{llmEval.consistency}分</span>
                <span style={{ fontWeight: 400, fontSize: 12, color: '#888', marginLeft: 8 }}>{llmEval.consistency_reason}</span>
              </div>
              <div style={{ fontWeight: 400, fontSize: 15, margin: '2px 0 0 0' }}>
                约束遵守（Constraint Adherence）：<span style={{ color: '#ff9800' }}>{llmEval.constraint}分</span>
                <span style={{ fontWeight: 400, fontSize: 12, color: '#888', marginLeft: 8 }}>{llmEval.constraint_reason}</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 400, fontSize: 15, margin: '6px 0 0 0' }}>
                完整性（Completeness）：<span style={{ color: '#ff9800' }}>{completenessScore}</span>
              </div>
              <div style={{ fontWeight: 400, fontSize: 15, margin: '2px 0 0 0' }}>
                精确性（Precision）：<span style={{ color: '#ff9800' }}>{precisionScore}</span>
              </div>
              <div style={{ fontWeight: 400, fontSize: 15, margin: '2px 0 0 0' }}>
                一致性（Consistency）：<span style={{ color: '#ff9800' }}>{consistencyScore}</span>
              </div>
              <div style={{ fontWeight: 400, fontSize: 15, margin: '2px 0 0 0' }}>
                约束遵守（Constraint Adherence）：<span style={{ color: '#ff9800' }}>{constraintScore}</span>
              </div>
            </>
          )}
        </div>
      )}
      
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