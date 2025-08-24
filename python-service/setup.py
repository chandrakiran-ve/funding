#!/usr/bin/env python3
"""
Setup script for LangGraph AI Assistant service.
"""
import subprocess
import sys
import os
from pathlib import Path


def run_command(command, cwd=None, use_shell=True):
    """Run a shell command and return the result."""
    try:
        if isinstance(command, str) and use_shell:
            result = subprocess.run(
                command,
                shell=True,
                check=True,
                capture_output=True,
                text=True,
                cwd=cwd
            )
        else:
            result = subprocess.run(
                command,
                check=True,
                capture_output=True,
                text=True,
                cwd=cwd
            )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command '{command}': {e}")
        print(f"Error output: {e.stderr}")
        return None


def check_python_version():
    """Check if Python version is compatible."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        print("Error: Python 3.11 or higher is required")
        print(f"Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"Python version: {version.major}.{version.minor}.{version.micro} ✓")
    return True


def setup_virtual_environment():
    """Set up virtual environment if it doesn't exist."""
    venv_path = Path("venv")
    
    if not venv_path.exists():
        print("Creating virtual environment...")
        # Use list format to handle spaces in path
        result = run_command([sys.executable, "-m", "venv", "venv"], use_shell=False)
        if result is None:
            print("Failed to create virtual environment")
            return False
        print("Virtual environment created ✓")
    else:
        print("Virtual environment already exists ✓")
    
    return True


def install_dependencies():
    """Install project dependencies."""
    print("Installing dependencies...")
    
    # Determine the correct pip path based on OS
    if os.name == 'nt':  # Windows
        pip_path = "venv\\Scripts\\pip"
    else:  # Unix-like
        pip_path = "venv/bin/pip"
    
    # Upgrade pip first
    result = run_command(f"{pip_path} install --upgrade pip")
    if result is None:
        print("Failed to upgrade pip")
        return False
    
    # Install dependencies
    result = run_command(f"{pip_path} install -r requirements.txt")
    if result is None:
        print("Failed to install dependencies")
        return False
    
    print("Dependencies installed ✓")
    return True


def run_tests():
    """Run basic tests to verify setup."""
    print("Running tests...")
    
    # Determine the correct python path based on OS
    if os.name == 'nt':  # Windows
        python_path = "venv\\Scripts\\python"
    else:  # Unix-like
        python_path = "venv/bin/python"
    
    result = run_command(f"{python_path} -m pytest tests/ -v")
    if result is None:
        print("Tests failed")
        return False
    
    print("Tests passed ✓")
    return True


def main():
    """Main setup function."""
    print("Setting up LangGraph AI Assistant service...")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Setup virtual environment
    if not setup_virtual_environment():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Run tests
    if not run_tests():
        print("Warning: Tests failed, but setup is complete")
    
    print("=" * 50)
    print("Setup complete! 🎉")
    print()
    print("To start the service:")
    if os.name == 'nt':  # Windows
        print("  venv\\Scripts\\activate")
    else:  # Unix-like
        print("  source venv/bin/activate")
    print("  python main.py")
    print()
    print("Service will be available at: http://localhost:8000")
    print("API documentation: http://localhost:8000/docs")


if __name__ == "__main__":
    main()