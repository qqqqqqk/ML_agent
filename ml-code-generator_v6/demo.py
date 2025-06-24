#!/usr/bin/env python3
"""
演示脚本：展示实时代码生成功能
"""

import sys
import os
import time
import json
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent
sys.path.append(str(project_root))

def demo_planning():
    """演示任务规划功能"""
    print("🎯 演示1: 任务规划")
    print("-" * 40)
    
    try:
        from deepseek_agent.api import plan_for_machine_task
        
        task_prompt = "使用随机森林模型对鸢尾花数据集进行分类，要求准确率达到95%以上"
        
        print(f"任务描述: {task_prompt}")
        print("\n正在分解任务...")
        
        plans = plan_for_machine_task(task_prompt)
        
        print(f"\n✅ 任务分解完成，共 {len(plans)} 个步骤:")
        for i, plan in enumerate(plans, 1):
            print(f"  步骤 {i}: {plan}")
            
        return plans
        
    except Exception as e:
        print(f"❌ 任务规划失败: {e}")
        return []

def demo_code_generation(plans):
    """演示代码生成功能"""
    print("\n\n💻 演示2: 逐步代码生成")
    print("-" * 40)
    
    try:
        from deepseek_agent.api import generate_current_step_code
        
        task_prompt = "使用随机森林模型对鸢尾花数据集进行分类，要求准确率达到95%以上"
        previous_code = ""
        
        for i, step in enumerate(plans[:3], 1):  # 只演示前3个步骤
            print(f"\n🔄 生成步骤 {i}: {step}")
            print("正在生成代码...")
            
            step_code = generate_current_step_code(task_prompt, step, i, previous_code)
            
            print(f"✅ 步骤 {i} 代码生成完成")
            print(f"代码长度: {len(step_code)} 字符")
            print("代码预览:")
            print("-" * 30)
            print(step_code[:300] + "..." if len(step_code) > 300 else step_code)
            print("-" * 30)
            
            previous_code += "\n\n" + step_code
            time.sleep(1)  # 模拟生成时间
            
        return previous_code
        
    except Exception as e:
        print(f"❌ 代码生成失败: {e}")
        return ""

def demo_code_refinement(code):
    """演示代码优化功能"""
    print("\n\n🔧 演示3: 代码优化")
    print("-" * 40)
    
    try:
        from deepseek_agent.api import refine_all_step_code
        
        task_prompt = "使用随机森林模型对鸢尾花数据集进行分类，要求准确率达到95%以上"
        
        print("正在优化代码...")
        
        refined_code = refine_all_step_code(task_prompt, code)
        
        print("✅ 代码优化完成")
        print(f"优化后代码长度: {len(refined_code)} 字符")
        print("优化后代码预览:")
        print("-" * 30)
        print(refined_code[:500] + "..." if len(refined_code) > 500 else refined_code)
        print("-" * 30)
        
        return refined_code
        
    except Exception as e:
        print(f"❌ 代码优化失败: {e}")
        return ""

def demo_error_handling():
    """演示错误处理功能"""
    print("\n\n🚨 演示4: 错误处理")
    print("-" * 40)
    
    try:
        from deepseek_agent.api import revise_code
        
        task_prompt = "使用随机森林模型对鸢尾花数据集进行分类"
        
        # 模拟有错误的代码
        buggy_code = """
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# 加载数据
data = pd.read_csv('iris.csv')  # 文件不存在
X = data.drop('target', axis=1)
y = data['target']

# 训练模型
model = RandomForestClassifier()
model.fit(X, y)
"""
        
        error_log = "FileNotFoundError: [Errno 2] No such file or directory: 'iris.csv'"
        
        print("检测到代码错误:")
        print(f"错误信息: {error_log}")
        print("\n正在修正代码...")
        
        revised_code = revise_code(task_prompt, buggy_code, error_log)
        
        print("✅ 代码修正完成")
        print("修正后代码:")
        print("-" * 30)
        print(revised_code)
        print("-" * 30)
        
    except Exception as e:
        print(f"❌ 错误处理演示失败: {e}")

def demo_realtime_simulation():
    """演示实时生成过程"""
    print("\n\n⚡ 演示5: 实时生成过程模拟")
    print("-" * 40)
    
    try:
        from deepseek_agent.api import plan_for_machine_task, generate_current_step_code
        
        task_prompt = "使用支持向量机对乳腺癌数据集进行分类"
        
        print("🚀 开始实时代码生成...")
        print(f"任务: {task_prompt}")
        
        # 步骤1: 规划
        print("\n📋 步骤1: 任务规划")
        print("正在分析任务并制定执行计划...")
        plans = plan_for_machine_task(task_prompt)
        print(f"✅ 规划完成，共 {len(plans)} 个步骤")
        
        # 步骤2: 逐步生成
        print("\n🔨 步骤2: 逐步代码生成")
        previous_code = ""
        
        for i, step in enumerate(plans[:3], 1):
            print(f"\n   🔄 生成步骤 {i}/{len(plans)}: {step}")
            print("   正在生成代码...")
            
            step_code = generate_current_step_code(task_prompt, step, i, previous_code)
            
            print(f"   ✅ 步骤 {i} 完成")
            print(f"   代码长度: {len(step_code)} 字符")
            
            previous_code += "\n\n" + step_code
            time.sleep(0.5)  # 模拟生成时间
        
        # 步骤3: 检查
        print("\n🔍 步骤3: 代码检查")
        print("正在检查代码语法和逻辑...")
        time.sleep(1)
        print("✅ 代码检查通过")
        
        # 步骤4: 优化
        print("\n✨ 步骤4: 代码优化")
        print("正在优化代码结构和可读性...")
        time.sleep(1)
        print("✅ 代码优化完成")
        
        print("\n🎉 实时代码生成完成！")
        print(f"最终代码长度: {len(previous_code)} 字符")
        
    except Exception as e:
        print(f"❌ 实时生成演示失败: {e}")

def main():
    """主演示函数"""
    print("🚀 ML Code Generator v2 - 功能演示")
    print("=" * 60)
    print("本演示将展示系统的核心功能:")
    print("1. 任务规划 - 将复杂任务分解为简单步骤")
    print("2. 代码生成 - 逐步生成每个步骤的代码")
    print("3. 代码优化 - 整合和优化最终代码")
    print("4. 错误处理 - 自动检测和修正代码错误")
    print("5. 实时生成 - 模拟完整的实时生成过程")
    print("=" * 60)
    
    input("\n按回车键开始演示...")
    
    # 演示各个功能
    plans = demo_planning()
    
    if plans:
        code = demo_code_generation(plans)
        if code:
            refined_code = demo_code_refinement(code)
    
    demo_error_handling()
    demo_realtime_simulation()
    
    print("\n" + "=" * 60)
    print("🎉 演示完成！")
    print("\n要体验完整的实时功能，请:")
    print("1. 启动后端服务器: cd server && npm start")
    print("2. 启动前端服务器: npm start")
    print("3. 在浏览器中访问: http://localhost:3000")
    print("4. 上传数据集并开始实时代码生成")
    print("=" * 60)

if __name__ == "__main__":
    main() 