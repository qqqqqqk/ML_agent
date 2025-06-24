#!/bin/bash

echo "========================================"
echo "ML Code Generator v2 - Quick Start"
echo "========================================"
echo

echo "Step 1: Cleaning up existing processes..."
if pgrep -x "node" > /dev/null; then
    echo "Found Node.js processes, terminating them..."
    pkill -f "node"
    echo "Cleanup complete!"
    sleep 2
else
    echo "No existing processes found"
fi
echo

echo "Step 2: Starting servers..."
echo "Starting backend server..."
cd "$(dirname "$0")/server"
gnome-terminal --title="Backend Server" -- bash -c "npm start; exec bash" &
# For macOS, use: open -a Terminal "npm start"

echo "Waiting for backend to start..."
sleep 3

echo "Starting frontend server..."
cd "$(dirname "$0")"
gnome-terminal --title="Frontend Server" -- bash -c "npm start; exec bash" &
# For macOS, use: open -a Terminal "npm start"

echo "Waiting for frontend to start..."
sleep 3

echo
echo "Step 3: Opening browser..."
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
echo "========================================"
echo "Servers are starting up!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "========================================"
echo
echo "To stop all servers, run: ./cleanup.sh"
echo
echo "Press Ctrl+C to stop all servers"
echo

# Wait for user to stop
trap 'echo "Stopping servers..."; pkill -f "npm start"; exit' INT
wait 