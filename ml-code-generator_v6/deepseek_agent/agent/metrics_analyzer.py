from .deepseek_api import BaseAgent
import re
import json

Metrics_Prompt_Template = '''
你是一个机器学习评估指标分析专家。请从给定的任务描述中识别和提取所有相关的评估指标。

常见指标范式及别名（中英文均可识别）：
- 准确率/Accuracy
- 精确率/Precision
- 召回率/Recall
- F1分数/F1-score/F1/F1 Score
- AUC/AUC-ROC/ROC曲线/Area Under Curve
- ROC曲线/ROC
- AUPRC/PR曲线/Precision-Recall Curve
- 灵敏度/Sensitivity/True Positive Rate/TPR
- 特异性/Specificity/True Negative Rate/TNR
- 混淆矩阵/Confusion Matrix
- Cohen's Kappa/Kappa系数
- LogLoss/对数损失/Logarithmic Loss
- MSE/均方误差/Mean Squared Error
- RMSE/均方根误差/Root Mean Squared Error
- MAE/平均绝对误差/Mean Absolute Error
- R2/R²/决定系数/Determination Coefficient
- MAPE/平均绝对百分比误差/Mean Absolute Percentage Error
- AUC-PR/PR-AUC
- MCC/马修斯相关系数/Matthews Correlation Coefficient
- Recall@K/Precision@K/Top-K准确率
- Hamming Loss/汉明损失
- Balanced Accuracy/平衡准确率
- G-mean/G均值
- F-beta/F0.5/F2等

任务描述：
{}

请分析上述任务描述，识别其中提到的所有评估指标，并按照以下格式返回JSON：

{{
  "metrics": [
    {{
      "name": "指标名称",
      "type": "指标类型", // accuracy, precision, recall, f1, auc, mse, mae, r2, etc.
      "description": "指标描述",
      "target_value": "目标值或要求", // 如果有的话
      "priority": "high/medium/low" // 重要性
    }}
  ],
  "task_type": "任务类型", // classification, regression, clustering, etc.
  "dataset_info": {{
    "target_variable": "目标变量名",
    "problem_type": "问题类型"
  }}
}}

只返回JSON格式，不要其他内容。
'''.strip()

class MetricsAnalyzerAgent(BaseAgent):
    def __init__(self, url, key, model_name, temperature=0.1, top_p=0.9):
        sys_prompt = '你是一个专业的机器学习评估指标分析专家，擅长从自然语言描述中准确识别和提取评估指标。'
        super().__init__(url, key, model_name, sys_prompt, temperature, top_p)
    
    def analyze_metrics(self, task_description):
        """
        从任务描述中分析评估指标
        
        Args:
            task_description: 包含任务描述、评估方法等的完整文本
            
        Returns:
            dict: 包含识别到的指标信息
        """
        prompt = Metrics_Prompt_Template.format(task_description)
        response = self.generate(prompt)
        
        try:
            # 尝试解析JSON响应
            metrics_data = self.__extract_json(response)
            return metrics_data
        except Exception as e:
            print(f"Error parsing metrics response: {e}")
            # 返回默认指标
            return self.__get_default_metrics()
    
    def __extract_json(self, response):
        """从响应中提取JSON"""
        # 查找JSON块
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            return json.loads(json_str)
        else:
            raise ValueError("No JSON found in response")
    
    def __get_default_metrics(self):
        """返回默认指标"""
        return {
            "metrics": [],
            "task_type": "unknown",
            "dataset_info": {
                "target_variable": "unknown",
                "problem_type": "unknown"
            }
        } 