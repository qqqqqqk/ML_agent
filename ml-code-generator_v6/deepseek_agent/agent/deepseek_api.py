from openai import OpenAI
import tiktoken



class BaseAgent:
    def __init__(self, base_url, api_key, model_name, sys_prompt, temperature, top_p):
        self.model_name = model_name
        self.temperature = temperature
        self.top_p = top_p
        self.sys_prompt = sys_prompt

        self.api = OpenAI(base_url=base_url, api_key=api_key)
        
        self.messages = []
        self.response_record = []
        
        self.encoding = tiktoken.encoding_for_model('gpt-4o')
        
        
    def generate(self, prompt):
        if not self.messages:
            self.messages = [
                    {"role": "system", "content": self.sys_prompt},
                    {"role": "user", "content": prompt}
                ]
        else: 
            self.messages.append({'role': 'user', 'content': prompt})
        
        completion = self.api.chat.completions.create(
            model=self.model_name,
            messages=self.messages,
            temperature=self.temperature,
            top_p=self.top_p,
            )
        
        response = completion.choices[0].message.content
        
        self.response_record.append(response)
        
        return response
    
    
    def clean_message(self,):
        self.messages.clear()
        
        
    @property
    def token_lens(self,):
        return len(self.encoding.encode('\n'.join(self.response_record)))