import React, { useState } from 'react';

// 指标展示组件
const IndicatorDisplay = () => {
  // 示例指标数据
  const [metrics] = useState({
    accuracy: '92.5%',
    loss: '0.18',
    bestMSE: '0.12',
    minLoss: '0.15',
    positiveClass: '93.2%',
    minusClass: '91.8%'
  });

  // 下载指标
  const handleDownloadMetrics = () => {
    const metricsText = `Accuracy: ${metrics.accuracy}\nLoss: ${metrics.loss}\nBest MSE: ${metrics.bestMSE}\nMin Loss: ${metrics.minLoss}\nPositive Class: ${metrics.positiveClass}\nMinus Class: ${metrics.minusClass}`;
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
      <div style={{margin: '18px 0'}}>
        <div>Accuracy: <b>{metrics.accuracy}</b></div>
        <div>Loss: <b>{metrics.loss}</b></div>
        <div>Best MSE: <b>{metrics.bestMSE}</b></div>
        <div>Min Loss: <b>{metrics.minLoss}</b></div>
        <div>Positive Class: <b>{metrics.positiveClass}</b></div>
        <div>Minus Class: <b>{metrics.minusClass}</b></div>
      </div>
      <button onClick={handleDownloadMetrics} style={{marginTop: 12, padding: '8px 18px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontSize: '1rem', cursor: 'pointer'}}>下载指标</button>
    </div>
  );
};

export default IndicatorDisplay; 