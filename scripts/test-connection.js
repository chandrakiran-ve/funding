#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function testConnection() {
  console.log('🔍 Testing Google Sheets connection...\n');
  
  // Check if credentials are present
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  
  console.log('📋 Environment Variables Check:');
  console.log('- GOOGLE_SERVICE_ACCOUNT_EMAIL:', email ? '✅ Present' : '❌ Missing');
  console.log('- GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:', privateKey ? '✅ Present' : '❌ Missing');
  console.log('- GOOGLE_SHEETS_SPREADSHEET_ID:', spreadsheetId ? '✅ Present' : '❌ Missing');
  
  if (!email || !privateKey || !spreadsheetId) {
    console.log('\n❌ Missing required environment variables. Please check your .env.local file.');
    return;
  }
  
  try {
    // Initialize Google Sheets client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('\n🔗 Attempting to connect to Google Sheets...');
    
    // Test basic connection by getting spreadsheet metadata
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });
    
    console.log('✅ Connection successful!');
    console.log('📊 Spreadsheet Title:', response.data.properties.title);
    console.log('📄 Sheet Count:', response.data.sheets.length);
    
    console.log('\n📋 Available Sheets:');
    response.data.sheets.forEach((sheet, index) => {
      console.log(`${index + 1}. ${sheet.properties.title}`);
    });
    
    // Test reading data from the first sheet
    console.log('\n🔍 Testing data read from first sheet...');
    const firstSheet = response.data.sheets[0].properties.title;
    
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${firstSheet}!A1:Z10`, // Read first 10 rows
    });
    
    const rows = dataResponse.data.values || [];
    console.log(`📊 Found ${rows.length} rows in "${firstSheet}"`);
    
    if (rows.length > 0) {
      console.log('📋 Headers:', rows[0]);
      if (rows.length > 1) {
        console.log('📝 Sample data row:', rows[1]);
      }
    }
    
    console.log('\n🎉 Google Sheets connection is working perfectly!');
    
  } catch (error) {
    console.log('\n❌ Connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('DECODER')) {
      console.log('\n💡 This looks like a private key format issue.');
      console.log('Make sure your private key is properly formatted in the .env.local file.');
      console.log('Run: node scripts/setup-env.js to fix credential formatting.');
    } else if (error.message.includes('403')) {
      console.log('\n💡 This looks like a permissions issue.');
      console.log('Make sure the service account has access to the spreadsheet.');
    } else if (error.message.includes('404')) {
      console.log('\n💡 This looks like the spreadsheet ID is incorrect.');
      console.log('Check your GOOGLE_SHEETS_SPREADSHEET_ID in .env.local');
    }
  }
}

testConnection().catch(console.error);
