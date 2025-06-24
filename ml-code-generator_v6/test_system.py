#!/usr/bin/env python3
"""
系统测试脚本：验证所有组件是否正常工作
"""

import os
import sys
import subprocess
import requests
import json
from pathlib import Path

def test_python_modules():
    """测试Python模块是否正常工作"""
    print("🔍 Testing Python modules...")
    
    try:
        # 添加项目路径到Python路径
        project_root = Path(__file__).parent
        sys.path.append(str(project_root))
        
        # 测试导入
        from deepseek_agent.api import plan_for_machine_task
        
        # 测试基本功能
        task_prompt = "Use random forest model to classify the iris dataset."
        plans = plan_for_machine_task(task_prompt)
        
        print(f"✅ Python modules working correctly")
        print(f"   Generated {len(plans)} plans")
        return True
        
    except Exception as e:
        print(f"❌ Python modules test failed: {e}")
        return False

def test_backend_server():
    """测试后端服务器是否正常运行"""
    print("\n🔍 Testing backend server...")
    
    try:
        # 测试HTTP API
        response = requests.get("http://localhost:5000/api/datasets?userId=test", timeout=5)
        if response.status_code == 200:
            print("✅ Backend HTTP API working correctly")
            return True
        else:
            print(f"❌ Backend HTTP API returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend server not running or not accessible")
        return False
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        return False

def test_frontend_server():
    """测试前端服务器是否正常运行"""
    print("\n🔍 Testing frontend server...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend server working correctly")
            return True
        else:
            print(f"❌ Frontend server returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Frontend server not running or not accessible")
        return False
    except Exception as e:
        print(f"❌ Frontend test failed: {e}")
        return False

def test_websocket_connection():
    """测试WebSocket连接是否正常"""
    print("\n🔍 Testing WebSocket connection...")
    
    try:
        import socketio
        
        # 创建Socket.IO客户端
        sio = socketio.Client()
        
        connected = False
        
        @sio.event
        def connect():
            nonlocal connected
            connected = True
            print("✅ WebSocket connection established")
            sio.disconnect()
        
        @sio.event
        def disconnect():
            print("WebSocket disconnected")
        
        # 连接到服务器
        sio.connect('http://localhost:5000', timeout=5)
        
        if connected:
            return True
        else:
            print("❌ WebSocket connection failed")
            return False
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False

def check_dependencies():
    """检查依赖是否安装"""
    print("🔍 Checking dependencies...")
    
    # 检查Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js: {result.stdout.strip()}")
        else:
            print("❌ Node.js not found")
            return False
    except:
        print("❌ Node.js not found")
        return False
    
    # 检查npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm: {result.stdout.strip()}")
        else:
            print("❌ npm not found")
            return False
    except:
        print("❌ npm not found")
        return False
    
    # 检查Python
    try:
        result = subprocess.run([sys.executable, '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Python: {result.stdout.strip()}")
        else:
            print("❌ Python not found")
            return False
    except:
        print("❌ Python not found")
        return False
    
    # 检查pip
    try:
        result = subprocess.run([sys.executable, '-m', 'pip', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ pip: {result.stdout.strip()}")
        else:
            print("❌ pip not found")
            return False
    except:
        print("❌ pip not found")
        return False
    
    return True

def check_files():
    """检查必要文件是否存在"""
    print("\n🔍 Checking project files...")
    
    required_files = [
        'package.json',
        'server/package.json',
        'server/requirements.txt',
        'server/server.js',
        'src/App.jsx',
        'src/services/api.js',
        'deepseek_agent/api.py'
    ]
    
    missing_files = []
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - Missing")
            missing_files.append(file_path)
    
    if missing_files:
        print(f"\n❌ Missing {len(missing_files)} required files")
        return False
    else:
        print("\n✅ All required files present")
        return True

def main():
    """主测试函数"""
    print("🚀 ML Code Generator v2 - System Test")
    print("=" * 50)
    
    # 检查依赖
    deps_ok = check_dependencies()
    
    # 检查文件
    files_ok = check_files()
    
    # 测试Python模块
    python_ok = test_python_modules()
    
    # 测试服务器（如果正在运行）
    backend_ok = test_backend_server()
    frontend_ok = test_frontend_server()
    websocket_ok = test_websocket_connection()
    
    # 总结
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    results = {
        "Dependencies": deps_ok,
        "Project Files": files_ok,
        "Python Modules": python_ok,
        "Backend Server": backend_ok,
        "Frontend Server": frontend_ok,
        "WebSocket Connection": websocket_ok
    }
    
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:<20} {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All tests passed! System is ready to use.")
        print("\nTo start the system:")
        print("1. Run 'start.bat' (Windows) or './start.sh' (Linux/Mac)")
        print("2. Or manually start backend and frontend servers")
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        print("\nTroubleshooting:")
        if not deps_ok:
            print("- Install missing dependencies (Node.js, npm, Python, pip)")
        if not files_ok:
            print("- Ensure all project files are present")
        if not python_ok:
            print("- Check Python environment and deepseek_agent module")
        if not backend_ok or not frontend_ok:
            print("- Start the servers: 'npm start' in respective directories")
        if not websocket_ok:
            print("- Ensure backend server is running and WebSocket is enabled")

if __name__ == "__main__":
    main() 