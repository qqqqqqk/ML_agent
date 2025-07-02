#!/usr/bin/env python3
"""
测试指标分析功能
"""

import sys
import os
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent
sys.path.append(str(project_root))

def test_metrics_analysis():
    """测试指标分析功能"""
    print("🧪 测试指标分析功能")
    print("=" * 50)
    
    try:
        from deepseek_agent.api import analyze_task_metrics
        
        # 测试用例
        test_cases = [
            {
                "name": "分类任务 - 准确率要求",
                "task": "使用随机森林模型对鸢尾花数据集进行分类，要求准确率达到95%以上，同时计算精确率和召回率"
            },
            {
                "name": "回归任务 - 多种指标",
                "task": "使用线性回归预测房价，需要计算MSE、MAE和R²指标，目标MSE小于0.1"
            },
            {
                "name": "多分类任务 - F1分数",
                "task": "对MNIST数据集进行手写数字识别，使用卷积神经网络，重点关注F1分数和混淆矩阵"
            },
            {
                "name": "不平衡数据集",
                "task": "处理信用卡欺诈检测的不平衡数据集，使用SMOTE技术，评估指标包括AUC-ROC、精确率、召回率和F1分数"
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📋 测试用例 {i}: {test_case['name']}")
            print(f"任务描述: {test_case['task']}")
            print("-" * 40)
            
            try:
                metrics_data = analyze_task_metrics(test_case['task'])
                
                print("✅ 分析成功!")
                print(f"任务类型: {metrics_data.get('task_type', 'Unknown')}")
                print(f"目标变量: {metrics_data.get('dataset_info', {}).get('target_variable', 'Unknown')}")
                print(f"问题类型: {metrics_data.get('dataset_info', {}).get('problem_type', 'Unknown')}")
                print("\n识别到的指标:")
                
                for j, metric in enumerate(metrics_data.get('metrics', []), 1):
                    print(f"  {j}. {metric['name']}")
                    print(f"     类型: {metric['type']}")
                    print(f"     描述: {metric['description']}")
                    print(f"     目标值: {metric.get('target_value', 'N/A')}")
                    print(f"     重要性: {metric.get('priority', 'N/A')}")
                
            except Exception as e:
                print(f"❌ 分析失败: {e}")
            
            print()
        
        print("🎉 所有测试用例完成!")
        
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        print("请确保deepseek_agent模块正确安装")
    except Exception as e:
        print(f"❌ 测试失败: {e}")

def test_metrics_agent_directly():
    """直接测试MetricsAnalyzerAgent"""
    print("\n🔧 直接测试MetricsAnalyzerAgent")
    print("=" * 50)
    
    try:
        from deepseek_agent.agent.metrics_analyzer import MetricsAnalyzerAgent
        
        # 创建agent实例
        base_url = 'https://api.deepseek.com'
        api_key = 'sk-994f4eb9a08942c4b494a84d9ee3ff85'
        model = "deepseek-chat"
        
        agent = MetricsAnalyzerAgent(base_url, api_key, model)
        
        # 测试简单任务
        simple_task = "使用逻辑回归进行二分类，计算准确率"
        
        print(f"测试任务: {simple_task}")
        result = agent.analyze_metrics(simple_task)
        
        print("✅ 直接测试成功!")
        print(f"结果: {result}")
        
    except Exception as e:
        print(f"❌ 直接测试失败: {e}")

if __name__ == "__main__":
    test_metrics_analysis()
    test_metrics_agent_directly() 