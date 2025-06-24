import React, { useState } from 'react';

// 结果编辑组件
const ResultEditor = () => {
  const [generatedCode, setGeneratedCode] = useState('# 代码将在任务执行后生成...');
  const [visibleSteps, setVisibleSteps] = useState([]);

  // 示例：下载代码
  const handleDownloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedCode], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'generated_code.py';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="code-section">
      <div className="code-header">Python 3</div>
      <textarea
        className="code-area"
        value={generatedCode}
        onChange={(e) => setGeneratedCode(e.target.value)}
        placeholder="代码将在任务执行后生成..."
      />
      <div className="code-btns">
        <button onClick={() => {
          try {
            // eslint-disable-next-line no-eval
            console.log("Running generated code...");
            eval(generatedCode);
          } catch (e) {
            console.error("Error executing generated code:", e);
            alert("Error executing code: " + e.message);
          }
        }}>run</button>
        <button onClick={() => navigator.clipboard.writeText(generatedCode)}>copy</button>
        {visibleSteps && visibleSteps.length > 0 && (
          <button onClick={handleDownloadCode}>download</button>
        )}
      </div>
    </div>
  );
};

export default ResultEditor; 