from .agent import WritterAgent, PlannerAgent, RefinerAgent, RevisorAgent
import subprocess
import argparse
import os
import json
from pathlib import Path
from dotenv import load_dotenv



env_path = Path(__file__).parent.parent.parent / ".env"  # 向上回溯两级到根目录
load_dotenv(env_path)
base_url = 'https://api.deepseek.com'
api_key = os.getenv("DEEPSEEK_API_KEY")  # 从环境变量读取 DeepSeek API 密钥，推荐在 .env 文件中设置
model = "deepseek-chat"


def plan_for_machine_task(task_prompt: str):
    '''
    给定一个机器学习任务，对其进行分解规划
    
    Params:
        task_prompt: task_prompt中包含了机器学习任务描述，评估指标，数据集描述，以及参考解决方案

    Returns:
        plan: 为list类型数据，对任务进行规划分解后的若干个子步骤
    '''
    
    agent = PlannerAgent(base_url, api_key, model)
    plans, response = agent.plan(task_prompt)
    return plans



def generate_current_step_code(task_prompt: str, 
                               current_step: str, 
                               step_id: int,
                               previous_code: str = None):
    '''
    分步生成代码，生成第N步的代码
    
    Params:
        task_prompt: task_prompt中包含了机器学习任务描述，评估指标，数据集描述，以及参考解决方案
        current_step: 为函数plan_for_machine_task所返回的步骤集合中，当前步骤对应的子任务
        previous_code: 为前 N - 1 步所对应的代码

    Returns:
        current_step_code: 当前步骤对应的代码
    '''
    agent = WritterAgent(base_url, api_key, model)
    current_step_code = agent.write_code(task_prompt, current_step, step_id, previous_code)
    return current_step_code



def refine_all_step_code(task_prompt: str,
                         all_step_code: str):
    '''
    在完成所有的代码生成步骤以及调试步骤会，对最终的代码进行整合，优化代码的结构，使代码可读性更高一点

    Params:
        all_step_code: 所有的代码

    Returns:
        refined_code: 整合后的代码
    '''
    agent = RefinerAgent(base_url, api_key, model)
    refined_code = agent.refine(task_prompt, all_step_code)
    return refined_code



def checking(folder, py_file):
    shell_template = '''
    cd {}\npython {}
    '''.strip()
    shell = shell_template.format(folder, py_file)
    try:
        result = subprocess.run(
            shell,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True 
        )
        return {
            "success": True,
            "stderr": None
        }
    
    except subprocess.CalledProcessError as e:
        return {
            "success": False,
            "stderr": e.stderr
        }


def revise_code(task_prompt: str,
                code: str,
                error_log: str):
    '''
    当代码中出现bug时，根据错误信息修改代码
    
    Params:
        task_prompt: task_prompt中包含了机器学习任务描述，评估指标，数据集描述，以及参考解决方案
        code: 已经生成的代码
        error_log: 错误log
        
    Returns:
        revised_code: 修改后的代码
    '''
    agent = RevisorAgent(base_url, api_key, model)
    revised_code = agent.revise(task_prompt, code, error_log)
    return revised_code



task_prompt = 'Use random forest model to classify the iris dataset.'

def run(task_prompt: str, python_file_name: str, save_fold: str):
    plans = plan_for_machine_task(task_prompt)
    
    previous_code = ''
    for i, current_step in enumerate(plans):
        current_step_id = i + 1
        current_step_code = generate_current_step_code(task_prompt, current_step, current_step_id, previous_code)
        previous_code += '\n\n' + current_step_code
        
    refined_code = refine_all_step_code(task_prompt, previous_code)
    
    with open(os.path.join(save_fold, python_file_name), 'w') as f:
        f.write(refined_code)
        
    code = refined_code
        
    ### debug 
    run_log = checking(save_fold, python_file_name)
    
    if not run_log['success']:
        error_log = run_log['stderr']
        
        with open(os.path.join(save_fold, python_file_name), 'r') as f:
            code = f.read()
        
        revised_code = revise_code(task_prompt, code, error_log)
        
        with open(os.path.join(save_fold, python_file_name), 'w') as f:
            f.write(revised_code)

        code = revised_code
        run_log = checking(save_fold, python_file_name)
        
    
def main():
    parser = argparse.ArgumentParser(description='Generate ML code for a given task')
    parser.add_argument('--task', type=str, required=True, help='Task description')
    parser.add_argument('--dataset', type=str, required=True, help='Path to dataset')
    args = parser.parse_args()

    # 生成代码
    python_file_name = 'generated_code.py'
    save_fold = os.path.dirname(args.dataset)
    
    try:
        run(args.task, python_file_name, save_fold)
        print("Code generation completed successfully")
    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)

def check_code(code: str):
    save_fold = 'temp_check'
    if not os.path.exists(save_fold):
        os.makedirs(save_fold)
    
    python_file_name = 'check_this.py'
    file_path = os.path.join(save_fold, python_file_name)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
        
    result = checking(save_fold, python_file_name)
    return result

if __name__ == "__main__":
    main()