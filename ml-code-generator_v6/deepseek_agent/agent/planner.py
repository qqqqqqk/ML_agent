from .deepseek_api import BaseAgent
import re

Prompt_Template = '''
You are given a description of a machine learning code generation task, which includes the task description and a reference solution description. 
You should first fully understand the task and the reference solution, then reasonably break down the reference solution into several steps. No need to evaluate the trained models. 
For each step, provide a description.
You only need to output the decomposed steps along with their descriptions, without any additional content.
Prefix each step with Step i: , where i is the corresponding step number.
Now, I will provide you with the code generation task:

{}

Output the decomposed steps according to the required format.
'''.strip()


class PlannerAgent(BaseAgent):
    def __init__(self, url, key, model_name, temperature=0.2, top_p=0.9):
        sys_prompt = 'You are an expert in machine learning, and you excel at planning machine learning code generation tasks.'
        
        super().__init__(url, key, model_name, sys_prompt, temperature, top_p)
            
        
    def plan(self, task):
        prompt = Prompt_Template.format(task)
        response = self.generate(prompt)
        plans = self.__extract_subtasks(response)
        
        if 'comment' in plans[-1].lower() or 'document' in plans[-1].lower() or 'optional' in plans[-1].lower():
            plans.pop(-1)
            
        self.plan_count = len(plans)
        
        return plans, response
    
    
    def __extract_subtasks(self, text):
        matches = re.findall(r"Step\s*\d+:\s*(.*?)(?=Step\s*\d+:|$)", text, re.DOTALL)

        formatted_results = [match.strip() for match in matches]
        
        return formatted_results
    
