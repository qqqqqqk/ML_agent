from .deepseek_api import BaseAgent
import re

Prompt_Template = '''
You are given a machine learning-related code generation task along with a draft of the generated code. Your task is to fully understand the task requirements, then integrate the provided code draft, correct any errors, and refine it into the final version.

### Task description:
{}

### Code draft:
{}

Only output the refined code, don't output anything else.
'''.strip()


class RefinerAgent(BaseAgent):
    def __init__(self, url, key, model_name, temperature=0.2, top_p=0.9):
        sys_prompt = 'You are a code expert, skilled in modifying and correcting erroneous code.'
        
        super().__init__(url, key, model_name, sys_prompt, temperature, top_p)
        
    
    def refine(self, 
               task: str,
               code_draft: str):
        
        super().clean_message()
                
        prompt = Prompt_Template.format(task, code_draft)
        
        response = super().generate(prompt)
        code = self.__extract_code(response)
                
        return code
    
    
    def __extract_code(self, response):
        if "```python" not in response:
            return response
        else:
            match = re.search(r'```python(.*?)```', response, re.S)
            code = match.group(1).strip()
                
        return code 
        
        