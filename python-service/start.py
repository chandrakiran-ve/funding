#!/usr/bin/env python3
"""
Startup script for the LangGraph AI Assistant service.
"""
import subprocess
import sys
import os
from pathlib import Path


def main():
    """Start the LangGraph AI Assistant service."""
    print("Starting LangGraph AI Assistant service...")
    
    # Check if virtual environment exists
    venv_path = Path("venv")
    if not venv_path.exists():
        print("Error: Virtual environment not found. Please run setup.py first.")
        sys.exit(1)
    
    # Determine the correct python path based on OS
    if os.name == 'nt':  # Windows
        python_path = "venv\\Scripts\\python"
    else:  # Unix-like
        python_path = "venv/bin/python"
    
    try:
        # Start the service
        subprocess.run([python_path, "main.py"], check=True)
    except KeyboardInterrupt:
        print("\nShutting down service...")
    except subprocess.CalledProcessError as e:
        print(f"Error starting service: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()