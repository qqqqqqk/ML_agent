from .deepseek_api import BaseAgent
import re

Problem_Template = '''
{}

To help you implement the corresponding code more effectively, I have broken down the solution into several steps.

Each time, I will only give you one step, and I will provide you with the code implementations for the previous steps. You need to combine the original task generation code and the code for the previous steps to implement the code for the current step that I provide to you.

Important Note:
1. When generating code, there is no need to print intermediate results.
2. No need to provide generated examples.
3. If certain variables or functions have not appeared in the previous code, you must not assume that they have already been defined.

You only need to implement the code corresponding to the current step. 
{}
'''

class WritterAgent(BaseAgent):
    def __init__(self, url, key, model_name, temperature=0.1, top_p=0.9):
        sys_prompt = 'You are an expert in code generation related to machine learning tasks, and you excel in code generation tasks within the field of machine learning.'
        
        super().__init__(url, key, model_name, sys_prompt, temperature, top_p)
        
        
        
    def __extract_code(self, response):
        if "```python" not in response:
            return response
        else:
            match = re.search(r'```python(.*?)```', response, re.S)
            code = match.group(1).strip()
                
        return code 
            
        
    def write_code(self, task_prompt, current_step, step_id, previous_code):
        step = f'Step {step_id}: ' + current_step
        step = ['# ' + item for item in step.split('\n')]
        step = '\n'.join(step)

        previous_code += '\n\n' + step + '\n\n' + '# Insert your code for the current step here.'

        prompt = Problem_Template.format(task_prompt, previous_code)

        reponse = super().generate(prompt)
        super().clean_message()

        code = self.__extract_code(reponse)
        if f'Step {step_id}' not in code:
            code = step + '\n\n' + code

        return code

    

