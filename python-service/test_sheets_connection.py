#!/usr/bin/env python3
"""
Test Google Sheets connection and data fetching without AI.
This verifies that we can fetch real data from your Google Sheets.
"""

import os
import sys

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

async def test_sheets_connection():
    """Test Google Sheets connection and data fetching"""
    
    print("📊 Testing Google Sheets Connection")
    print("=" * 50)
    
    # Set environment variables from .env.local
    os.environ["GOOGLE_SERVICE_ACCOUNT_EMAIL"] = "visionempower@ve-fundraising.iam.gserviceaccount.com"
    os.environ["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"] = """-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDWDqNT2kdEqoP8
XWBW3x8ezmQgqmD8HB5gW/y+8YNSdhlqCwk1HO0MfHXmVOFz/SUfmdNony37FJMu
i8Pi06s5cQxqWZNjXRKzjGD3K8JN2X1gO6kCb8oqzH9wb6ExN9WW3bqdNx+/TMLk
4ebgO+cXGHY9UKGWqbwMg8iUL05B0lJ62Db0NfIQsx67mvgjuWe39qv4dgBpxqUz
6j9+YMuzhC+FuUD9+h4ub7CKzm634V9AyqeoOe0tKv19Y9pDVb6yFJ6CcVIRay5s
oWlFjpFrsOfXvXTVwfZQ8O2hH0uNbYqsrhxT95Rfw8UriUkLWVfJ9CmHMCadnfyk
yn9kAZizAgMBAAECggEATI2jn8N6pXYOCd0jLS5SpOPPL1d/o+oyeueq9mbNPlp6
MFCOFg6p4ENKrvtAPgkUk76hutLi0N7E3GqjvaVRoRNrC0XJzklk/M2BiCQgM1NK
4XW0tehg9vl3wjBKB54eRvw5Vyx1sCa1tMGNnjgOJ1ZaQwdpIsbFN/yRaV2ZsTPs
zggdHQ/UgPy3aQLOv382JPGrGcWGLjI4wNaJOaQ03UZcwW4yK4sFkN6wDZhgAT4t
Z9uwWTyx3pp/sbQhHcrK6HXuHR/Gj1evZLGb0gy4x/7wfqRQW+GfSknwBtjhzvtC
Zex7OT67zkmCpeyzJAOhxHdEQk9+FfE6MIUeXd/y8QKBgQD9lYg8+lgyN6CHedTm
7Jn6aeOZ9au48Ql7M+tgXDbVzUxFl//qJJguGkcuVBPpbYlpMQxPGbArlU4xFM8Z
QVbae/dy2p5IRcw0YqvYzBUNqWPc3zaNlN40kM/iObTikj5kHpEMI4HiNAWXoOWR
Bgh2BcvtsBZR7VUoWcBm7Y1SrwKBgQDYGLQOoOG6278Hptj3N3Nspd794ES4XnSE
/n79tt49nyTHADzv5asP85tLGJmPpifUcR2yTqb+keUTDXfShzp/miHnk1Aw4q++
22WZ3xznvC/729X4h9eN+qjwIgxcWzlyQasx/H3EYNrv95CuKTLY+8jlE7keh8qm
4WIkfQarPQKBgAgGZWtYmNXuALyI1H4CWtUb6MIEjkyqBBzMBdTk1i9p8dH5/3VP
dyluV3ZV3tNyTfjwPm16aKLYdMME35DzCmabqbcOyBeNberyfHG986SdCbYBsl5E
qcuMEagdH2ZULnlIplp1/TRFZS/pPZqbUEU75bo96lbpZdqDDJ21QtWtAoGBAIq/
ecS2uZi/hS1FjKNWoC7PZZj+SUFTrF7EBQekRZetOfDoDzg875PDZx9VgSuBlKtL
obSd2Y00Ya/VAu1S1FWfwkstA90Pf6X8uoSMg8OqyehdY0o69kT7/0KHqgYWsJDS
5zemFZ5kTc6r1uJsI3C8YWXsPv0CVTTHG7uv5vtFAoGBAOhMg3LedZsYBPUPiOGR
iN1OMuWH1SFECsjPicAPnOV9L7brznWVEAMn8AIhwgFRjydc75sc+GkNl8miZeDC
PWq6O/8big7UG9P9CdZNtfYi6s6/GY9i4P2jTyxdzvRhEecgVO0LT+5LPHqQZH26
VEGiiDaGwSX0vzmMxLyJ5iRw
-----END PRIVATE KEY-----"""
    os.environ["GOOGLE_SHEETS_SPREADSHEET_ID"] = "1-fO8tART495irPsOUwRyyjzywhcR0Nimj-IMvSspoy0"
    
    try:
        from app.repositories.repository_factory import RepositoryFactory
        
        print("🔧 Creating repository factory...")
        repo_factory = RepositoryFactory()
        
        print("📋 Testing funder repository...")
        funder_repo = repo_factory.funder_repository
        funders = await funder_repo.get_all()
        print(f"✅ Retrieved {len(funders)} funders from Google Sheets")
        
        # Show first few funders
        print("\n📊 Sample Funders:")
        for i, funder in enumerate(funders[:5]):
            funder_dict = funder.to_dict() if hasattr(funder, 'to_dict') else funder.__dict__
            name = funder_dict.get('name', 'Unknown')
            print(f"   {i+1}. {name}")
            
            # Check if Microsoft is in the data
            if 'microsoft' in name.lower():
                print(f"      🎯 Found Microsoft funder: {name}")
        
        print(f"\n💰 Testing contribution repository...")
        contribution_repo = repo_factory.contribution_repository
        contributions = await contribution_repo.get_all()
        print(f"✅ Retrieved {len(contributions)} contributions from Google Sheets")
        
        # Show first few contributions and look for Microsoft
        print("\n📊 Sample Contributions:")
        microsoft_contributions = []
        
        for i, contrib in enumerate(contributions[:10]):
            contrib_dict = contrib.to_dict() if hasattr(contrib, 'to_dict') else contrib.__dict__
            funder_name = contrib_dict.get('funder_name', 'Unknown')
            amount = contrib_dict.get('amount', 0)
            fiscal_year = contrib_dict.get('fiscal_year', 'Unknown')
            
            print(f"   {i+1}. ${amount} from {funder_name} ({fiscal_year})")
            
            # Check for Microsoft contributions
            if 'microsoft' in funder_name.lower():
                microsoft_contributions.append(contrib_dict)
                print(f"      🎯 Microsoft contribution found!")
        
        # Summary for Microsoft
        if microsoft_contributions:
            print(f"\n🎉 MICROSOFT DATA FOUND:")
            print(f"   Found {len(microsoft_contributions)} Microsoft contributions")
            total_amount = sum(float(c.get('amount', 0)) for c in microsoft_contributions)
            print(f"   Total Microsoft contributions: ${total_amount:,.2f}")
            
            years = set(c.get('fiscal_year', '') for c in microsoft_contributions)
            print(f"   Years with Microsoft contributions: {sorted(years)}")
        else:
            print(f"\n⚠️  No Microsoft contributions found in the data")
            print("   The AI agent will work with whatever data is available in your sheets")
        
        print(f"\n✅ Google Sheets connection successful!")
        print(f"   Total funders: {len(funders)}")
        print(f"   Total contributions: {len(contributions)}")
        print(f"   Ready for agentic AI queries!")
        
        return True
        
    except Exception as e:
        print(f"❌ Google Sheets connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("🚀 Testing Google Sheets Connection...")
    
    import asyncio
    success = asyncio.run(test_sheets_connection())
    
    if success:
        print("\n🎯 Next Steps:")
        print("1. The Google Sheets connection is working")
        print("2. Your LangGraph agent can now fetch real data")
        print("3. Try the Microsoft query when Gemini quota resets")
        print("4. The agentic flow will use your actual fundraising data")
    else:
        print("\n❌ Fix the Google Sheets connection first")
        print("Check your credentials and spreadsheet ID")