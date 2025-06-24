#!/bin/bash

echo "Starting ML Code Generator v2..."
echo

echo "Cleaning up existing Node.js processes..."
if pgrep -x "node" > /dev/null; then
    echo "Found existing Node.js processes, terminating them..."
    pkill -f "node"
    if [ $? -eq 0 ]; then
        echo "Successfully terminated Node.js processes"
    else
        echo "Warning: Could not terminate some Node.js processes"
    fi
    sleep 2
else
    echo "No existing Node.js processes found"
fi
echo

echo "Installing dependencies..."
echo

echo "Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error installing frontend dependencies"
    exit 1
fi

echo
echo "Installing backend dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "Error installing backend dependencies"
    exit 1
fi

echo
echo "Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Warning: Some Python dependencies may not be installed correctly"
    echo "Please check your Python environment"
fi

echo
echo "Starting backend server..."
gnome-terminal --title="Backend Server" -- bash -c "npm start; exec bash" &
# For macOS, use: open -a Terminal "npm start"

echo
echo "Waiting for backend to start..."
sleep 5

echo
echo "Starting frontend server..."
cd ..
gnome-terminal --title="Frontend Server" -- bash -c "npm start; exec bash" &
# For macOS, use: open -a Terminal "npm start"

echo
echo "Opening browser..."
sleep 3
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:3000
else
    echo "Please manually open http://localhost:3000 in your browser"
fi

echo
echo "ML Code Generator v2 is starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo
echo "Press Ctrl+C to stop all servers"
echo

# Wait for user to stop
trap 'echo "Stopping servers..."; pkill -f "npm start"; exit' INT
wait 