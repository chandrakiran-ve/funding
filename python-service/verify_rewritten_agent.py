#!/usr/bin/env python3
"""
Quick verification script for the rewritten LangGraph agent.
This checks if everything is properly installed and configured.
"""

import os
import sys
from pathlib import Path

def check_environment():
    """Check if the environment is properly set up"""
    print("🔍 Checking Environment Setup...")
    print("=" * 50)
    
    # Check Python version
    python_version = sys.version_info
    print(f"🐍 Python Version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version < (3, 11):
        print("❌ Python 3.11+ is required")
        return False
    else:
        print("✅ Python version is compatible")
    
    # Check API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY environment variable not set")
        print("💡 Set it with: export GEMINI_API_KEY='your-api-key'")
        return False
    else:
        print(f"✅ GEMINI_API_KEY is set (length: {len(api_key)})")
    
    # Check required packages
    required_packages = [
        "langgraph",
        "langchain",
        "langchain_google_genai",
        "fastapi",
        "uvicorn"
    ]
    
    print(f"\n📦 Checking Required Packages...")
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - Not installed")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n❌ Missing packages: {', '.join(missing_packages)}")
        print("💡 Install with: pip install -r requirements.txt")
        return False
    
    return True


def check_agent_files():
    """Check if all agent files are present"""
    print(f"\n📁 Checking Agent Files...")
    print("-" * 30)
    
    required_files = [
        "app/workflows/langgraph_agent.py",
        "app/services/langgraph_service_v2.py",
        "app/api/v1/endpoints/langgraph_v2.py",
        "test_rewritten_agent.py",
        "REWRITTEN_AGENT_README.md"
    ]
    
    missing_files = []
    
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - Missing")
            missing_files.append(file_path)
    
    if missing_files:
        print(f"\n❌ Missing files: {', '.join(missing_files)}")
        return False
    
    return True


def test_basic_import():
    """Test basic import of the rewritten agent"""
    print(f"\n🧪 Testing Basic Import...")
    print("-" * 25)
    
    try:
        # Add current directory to path
        sys.path.append(str(Path(__file__).parent))
        
        # Test imports
        from app.workflows.langgraph_agent import create_fundraising_agent, get_fundraising_agent
        from app.services.langgraph_service_v2 import LangGraphServiceV2
        
        print("✅ Successfully imported rewritten agent components")
        print("✅ LangGraph agent creation function available")
        print("✅ Service layer available")
        
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False


def main():
    """Main verification function"""
    print("🚀 Verifying Rewritten LangGraph Agent Setup")
    print("=" * 60)
    
    checks = [
        ("Environment Setup", check_environment),
        ("Agent Files", check_agent_files),
        ("Basic Import", test_basic_import)
    ]
    
    all_passed = True
    
    for check_name, check_func in checks:
        try:
            if not check_func():
                all_passed = False
        except Exception as e:
            print(f"❌ {check_name} failed with error: {e}")
            all_passed = False
    
    print(f"\n{'='*60}")
    
    if all_passed:
        print("🎉 All checks passed! The rewritten agent is ready to use.")
        print("\n🚀 Next steps:")
        print("1. Run the test: python test_rewritten_agent.py")
        print("2. Start the API: uvicorn main:app --reload")
        print("3. Test interactively: python test_rewritten_agent.py --interactive")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        print("\n💡 Common solutions:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Set API key: export GEMINI_API_KEY='your-key'")
        print("3. Check file paths and permissions")
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)