#!/bin/bash

echo "Cleaning up Node.js processes..."
echo

echo "Checking for existing Node.js processes..."
if pgrep -x "node" > /dev/null; then
    echo "Found Node.js processes:"
    pgrep -x "node" -l
    echo
    echo "Terminating all Node.js processes..."
    pkill -f "node"
    if [ $? -eq 0 ]; then
        echo "Successfully terminated all Node.js processes"
    else
        echo "Warning: Could not terminate some processes"
    fi
else
    echo "No Node.js processes found"
fi

echo
echo "Checking for processes on ports 3000 and 5000..."
lsof -ti:3000
lsof -ti:5000

echo
echo "Cleanup complete!" 