const fs = require('fs');
const path = require('path');

console.log('🔧 VE Funds - Environment Setup Helper\n');

const envPath = path.join(__dirname, '..', '.env.local');

// Check if .env.local exists
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('Current .env.local content:');
  console.log('='.repeat(50));
  console.log(content);
  console.log('='.repeat(50));
}

console.log('\n❌ Issues Found:');
console.log('1. Your GOOGLE_SERVICE_ACCOUNT_EMAIL looks like an OAuth client ID, not a service account email');
console.log('2. Your GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is not a valid private key format');
console.log('3. You need to create a proper Google Service Account\n');

console.log('🛠️  How to Fix:');
console.log('1. Go to Google Cloud Console (https://console.cloud.google.com/)');
console.log('2. Create or select a project');
console.log('3. Enable Google Sheets API');
console.log('4. Go to IAM & Admin > Service Accounts');
console.log('5. Click "Create Service Account"');
console.log('6. Give it a name like "ve-funds-sheets"');
console.log('7. Grant "Editor" role or "Google Sheets API" access');
console.log('8. Click "Create Key" > JSON');
console.log('9. Download the JSON file');
console.log('10. Extract these values from the JSON:\n');

console.log('From the JSON file, copy these values:');
console.log('- "client_email" → GOOGLE_SERVICE_ACCOUNT_EMAIL');
console.log('- "private_key" → GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (keep the quotes and \\n characters)');
console.log('- Share your Google Sheet with the client_email address\n');

console.log('🤖 For AI Assistant (Gemini API):');
console.log('1. Go to Google AI Studio (https://aistudio.google.com/)');
console.log('2. Click "Get API key"');
console.log('3. Create a new API key');
console.log('4. Copy the API key → GEMINI_API_KEY\n');

console.log('✅ Correct .env.local format:');
console.log(`
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aGFuZHktZ251LTU1LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_FgNoldE0aEX9L5vk1SxUIH6beZ6wIFurGwAEDQqV5i
ALLOWED_EMAIL_DOMAIN=visionempowertrust.org

# Google Sheets (Service Account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=ve-funds-sheets@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"
GOOGLE_SHEETS_SPREADSHEET_ID=Y1PcHr3d3lJZt0lHbPzsN0cUNj1qw6vS3f-wSYVtKmTCo

# Google Gemini AI API (for AI Assistant)
GEMINI_API_KEY=your_gemini_api_key_here
`);

console.log('\n🧪 Test without credentials:');
console.log('You can run "npm run dev" to see the dashboard interface even without Google Sheets data.');
console.log('The pages will show empty states until you configure the service account.\n');

console.log('📋 Quick Test Checklist:');
console.log('- [ ] Service account email ends with .iam.gserviceaccount.com');
console.log('- [ ] Private key starts with -----BEGIN PRIVATE KEY-----');
console.log('- [ ] Private key ends with -----END PRIVATE KEY-----');
console.log('- [ ] Google Sheet is shared with the service account email');
console.log('- [ ] Google Sheets API is enabled in your project');
console.log('- [ ] Spreadsheet ID is from the URL of your sheet');

