from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
# 添加项目根目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)
from deepseek_agent.api import run
import tempfile
import shutil
from feedback_api import feedback_api
from solution_api import solution_api
from rerun_logic import rerun_task

app = Flask(__name__)
CORS(app)

# 创建临时目录用于存储上传的文件
UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'ml_code_generator')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.register_blueprint(feedback_api)
app.register_blueprint(solution_api)

@app.route('/api/datasets', methods=['POST', 'GET'])
def datasets_route():
    if request.method == 'POST':
        try:
            if 'file' not in request.files:
                return jsonify({'error': 'No file part'}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No selected file'}), 400

            # 保存文件
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(file_path)
            print(f"File saved to: {file_path}")

            return jsonify({
                'id': file.filename,
                'name': file.filename,
                'filePath': file_path,
                'type': request.form.get('type', 'training'),
                'description': request.form.get('description', ''),
                'metadata': {
                    'rowCount': 0,  # 这里可以添加实际的行数统计
                    'columnCount': 0,  # 这里可以添加实际的列数统计
                    'features': []  # 这里可以添加实际的特征列表
                }
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    elif request.method == 'GET':
        try:
            files_info = []
            for filename in os.listdir(UPLOAD_FOLDER):
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                if os.path.isfile(file_path):
                    files_info.append({
                        'id': filename,
                        'name': filename,
                        'filePath': file_path,
                        'type': 'uploaded', # 可以根据需要设置类型
                        'description': '', # 可以根据需要添加描述
                        'metadata': { # 可以根据需要添加元数据
                            'rowCount': 0,
                            'columnCount': 0,
                            'features': []
                        }
                    })
            return jsonify(files_info)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/generate-code', methods=['POST'])
def generate_code():
    try:
        data = request.json
        print(f"Server received data: {data}")
        task_prompt = data.get('task_prompt')
        dataset_path = data.get('dataset_path')
        print(f"Server extracted task_prompt: {task_prompt}")
        print(f"Server extracted dataset_path: {dataset_path}")

        if not task_prompt or not dataset_path:
            return jsonify({'error': 'Missing required parameters'}), 400

        # 生成代码
        python_file_name = 'generated_code.py'
        save_folder = os.path.dirname(dataset_path)
        
        run(task_prompt, python_file_name, save_folder)
        
        # 读取生成的代码
        with open(os.path.join(save_folder, python_file_name), 'r') as f:
            generated_code = f.read()

        return jsonify({
            'code': generated_code,
            'steps': {
                'step1': ['导入必要的库'],
                'step2': ['数据处理'],
                'errorDebug': ['错误处理'],
                'finally': ['模型评估']
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rerun', methods=['POST'])
def rerun():
    data = request.json
    task_id = data.get('task_id')
    params = data.get('params')
    result = rerun_task(task_id, params)
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000) 