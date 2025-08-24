#!/usr/bin/env python3
"""
Install dependencies for the LangGraph AI Agent service.
"""

import subprocess
import sys
import os

def install_requirements():
    """Install requirements from requirements.txt"""
    try:
        print("📦 Installing Python dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ["GEMINI_API_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  Missing environment variables: {', '.join(missing_vars)}")
        print("Please set these before running the service:")
        for var in missing_vars:
            print(f"   export {var}='your-{var.lower().replace('_', '-')}'")
        return False
    
    print("✅ Environment variables configured!")
    return True

def test_imports():
    """Test if key imports work"""
    try:
        print("🧪 Testing imports...")
        
        # Test LangGraph
        from langgraph.graph import StateGraph, START, END
        print("   ✅ LangGraph imported successfully")
        
        # Test LangChain Google GenAI
        from langchain_google_genai import ChatGoogleGenerativeAI
        print("   ✅ LangChain Google GenAI imported successfully")
        
        # Test other key dependencies
        import fastapi
        print("   ✅ FastAPI imported successfully")
        
        import pydantic
        print("   ✅ Pydantic imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"   ❌ Import failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Setting up LangGraph AI Agent Service")
    print("=" * 50)
    
    # Install dependencies
    if not install_requirements():
        sys.exit(1)
    
    # Test imports
    if not test_imports():
        print("\n❌ Some imports failed. Please check the error messages above.")
        sys.exit(1)
    
    # Check environment
    env_ok = check_environment()
    
    print("\n" + "=" * 50)
    if env_ok:
        print("🎉 Setup complete! You can now run:")
        print("   python test_agentic_flow.py")
        print("   uvicorn main:app --reload")
    else:
        print("⚠️  Setup complete but environment variables need to be configured.")
        print("   Set the required environment variables and then run the service.")