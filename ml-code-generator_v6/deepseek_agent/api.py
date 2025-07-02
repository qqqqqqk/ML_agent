from .agent import WritterAgent, PlannerAgent, RefinerAgent, RevisorAgent, MetricsAnalyzerAgent
from .agent.deepseek_api import BaseAgent
import subprocess
import argparse
import os
import json
import re
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', '.env'))

base_url = 'https://api.deepseek.com'
api_key = os.getenv('DEEPSEEK_API_KEY')
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

def analyze_task_metrics(task_prompt: str):
    '''
    从任务描述中分析评估指标
    
    Params:
        task_prompt: 包含任务描述、评估方法等的完整文本
        
    Returns:
        metrics_data: 包含识别到的指标信息的字典
    '''
    agent = MetricsAnalyzerAgent(base_url, api_key, model)
    metrics_data = agent.analyze_metrics(task_prompt)
    return metrics_data

def evaluate_instruction_following(solution: str, generated_code: str):
    """
    用大模型评估指令跟随能力四个维度
    """
    prompt = f"""
你是一个代码评审专家，请从以下四个维度对生成代码与参考方案的指令跟随能力进行1-100分打分，并给出简要理由：
1. 完整性（Completeness）：是否完成了所有要求的任务，覆盖所有指定元素。
2. 精确性（Precision）：输出格式、参数、字数等是否严格符合要求。
3. 一致性（Consistency）：输出是否与指令逻辑一致，避免自相矛盾。
4. 约束遵守（Constraint Adherence）：是否避开禁止内容，遵循明确限制。

参考方案：
{solution}

生成代码：
{generated_code}

请严格只输出如下JSON，不要输出任何解释、注释或代码块标记：
{{
  "completeness": 分数, "completeness_reason": "",
  "precision": 分数, "precision_reason": "",
  "consistency": 分数, "consistency_reason": "",
  "constraint": 分数, "constraint_reason": ""
}}
    """

    def extract_json_from_response(response):
        # 去除代码块标记
        response = re.sub(r'```json|```', '', response, flags=re.IGNORECASE).strip()
        # 尝试提取第一个大括号包裹的内容
        match = re.search(r'({[\s\S]*})', response)
        if match:
            return match.group(1)
        return response

    agent = BaseAgent(
        base_url=base_url,
        api_key=api_key,
        model_name=model,
        sys_prompt='你是一个专业的代码评审专家，善于从多维度评估代码与指令的契合度。',
        temperature=0.2,
        top_p=0.9
    )
    response = agent.generate(prompt)
    try:
        json_str = extract_json_from_response(response)
        return json.loads(json_str)
    except Exception:
        return {"error": "模型输出无法解析", "raw": response}

if __name__ == "__main__":
    main()