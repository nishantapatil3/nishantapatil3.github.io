#!/bin/bash

# Simple local development server script
# This starts a local web server to avoid CORS issues

echo "Starting local web server..."
echo "Open your browser to: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null
then
    python3 -m http.server 8000
# Fallback to Python 2
elif command -v python &> /dev/null
then
    python -m SimpleHTTPServer 8000
else
    echo "Error: Python is not installed. Please install Python to run the local server."
    exit 1
fi
