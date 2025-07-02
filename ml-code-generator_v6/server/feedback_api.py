from flask import Blueprint, request, jsonify
import sys
import os

# 添加项目根目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from deepseek_agent.api import revise_code

feedback_api = Blueprint('feedback_api', __name__)

@feedback_api.route('/api/feedback', methods=['POST'])
def feedback():
    try:
        data = request.json
        code = data.get('code')
        feedback_text = data.get('feedback')
        task_prompt = data.get('task_prompt')
        previous_code = data.get('previous_code', None)
        
        if not code or not feedback_text or not task_prompt:
            return jsonify({'message': '缺少必要参数'}), 400
            
        # 调用AI代理进行代码修正
        revised_code = revise_code(task_prompt, code, feedback_text)
        
        return jsonify({
            'status': 'success', 
            'message': '代码已根据反馈修正',
            'revised_code': revised_code
        })
    except Exception as e:
        print(f"Feedback processing error: {str(e)}")
        return jsonify({'message': 'Server error', 'error': str(e)}), 500 