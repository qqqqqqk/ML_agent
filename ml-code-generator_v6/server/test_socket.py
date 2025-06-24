#!/usr/bin/env python3
"""
测试脚本：验证WebSocket连接和Python模块调用
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from deepseek_agent.api import plan_for_machine_task, generate_current_step_code, refine_all_step_code, revise_code

def test_planning():
    """测试任务规划功能"""
    print("Testing task planning...")
    task_prompt = "Use random forest model to classify the iris dataset."
    
    try:
        plans = plan_for_machine_task(task_prompt)
        print(f"Plans generated: {len(plans)} steps")
        for i, plan in enumerate(plans, 1):
            print(f"Step {i}: {plan}")
        return plans
    except Exception as e:
        print(f"Error in planning: {e}")
        return []

def test_code_generation():
    """测试代码生成功能"""
    print("\nTesting code generation...")
    task_prompt = "Use random forest model to classify the iris dataset."
    current_step = "Load and preprocess the iris dataset"
    step_id = 1
    
    try:
        code = generate_current_step_code(task_prompt, current_step, step_id)
        print(f"Generated code length: {len(code)} characters")
        print("Code preview:")
        print(code[:200] + "..." if len(code) > 200 else code)
        return code
    except Exception as e:
        print(f"Error in code generation: {e}")
        return ""

def test_code_refinement():
    """测试代码优化功能"""
    print("\nTesting code refinement...")
    task_prompt = "Use random forest model to classify the iris dataset."
    all_step_code = """
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load data
data = pd.read_csv('iris.csv')
X = data.drop('target', axis=1)
y = data['target']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Predict
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
print(f"Accuracy: {accuracy}")
"""
    
    try:
        refined_code = refine_all_step_code(task_prompt, all_step_code)
        print(f"Refined code length: {len(refised_code)} characters")
        print("Refined code preview:")
        print(refined_code[:200] + "..." if len(refined_code) > 200 else refined_code)
        return refined_code
    except Exception as e:
        print(f"Error in code refinement: {e}")
        return ""

def test_code_revision():
    """测试代码修正功能"""
    print("\nTesting code revision...")
    task_prompt = "Use random forest model to classify the iris dataset."
    code = """
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load data
data = pd.read_csv('iris.csv')  # This will cause an error if file doesn't exist
X = data.drop('target', axis=1)
y = data['target']
"""
    error_log = "FileNotFoundError: [Errno 2] No such file or directory: 'iris.csv'"
    
    try:
        revised_code = revise_code(task_prompt, code, error_log)
        print(f"Revised code length: {len(revised_code)} characters")
        print("Revised code preview:")
        print(revised_code[:200] + "..." if len(revised_code) > 200 else revised_code)
        return revised_code
    except Exception as e:
        print(f"Error in code revision: {e}")
        return ""

if __name__ == "__main__":
    print("Starting API module tests...")
    
    # 测试所有功能
    plans = test_planning()
    if plans:
        code = test_code_generation()
        if code:
            refined = test_code_refinement()
            revised = test_code_revision()
    
    print("\nAll tests completed!") 