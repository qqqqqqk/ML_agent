from .deepseek_api import BaseAgent
import re

Prompt_Template = '''
I will provide you with a code related to a machine learning code generation task that contains errors, along with the reason for the errors. I will also give you the origin description of the machine learning code generation task.
You need to modify the original erroneous code and output the revised code.

### The machine learning code generation task:
{}

### Code containing errors:
{}

### Error reason: 
{}

Only output the revised code, don't output anything else.
'''.strip()

class RevisorAgent(BaseAgent):
    def __init__(self, url, key, model_name, temperature=0.5, top_p=0.9):
        sys_prompt = 'You are a code expert, skilled at fixing errors in code.'
        super().__init__(url, key, model_name, sys_prompt, temperature, top_p)

        
    def revise(self, task, code_snippet, error_reason):
        self.revised_code = []
        
        super().clean_message()
        prompt = Prompt_Template.format(task, code_snippet, error_reason)
        response = self.generate(prompt)
        code = self.__extract_code(response)
        
        return code
            
            
    def __extract_code(self, response):
        if "```python" not in response:
            return response
        else:
            match = re.search(r'```python(.*?)```', response, re.S)
            code = match.group(1).strip()
                
        return code 
            