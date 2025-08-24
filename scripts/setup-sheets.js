#!/usr/bin/env node

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function setupSheetStructure() {
  console.log('🔧 Setting up Google Sheets structure...\n');

  // Initialize Google Sheets client
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  try {
    // Get current sheet structure
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);
    console.log('📋 Current sheets:', existingSheets.join(', '));

    // Required sheets for our fundraising system
    const requiredSheets = ['Funders', 'States', 'Schools', 'StateTargets', 'Contributions', 'Prospects', 'Users'];
    
    // Find sheets that need to be created
    const sheetsToCreate = requiredSheets.filter(sheetName => !existingSheets.includes(sheetName));
    
    if (sheetsToCreate.length === 0) {
      console.log('✅ All required sheets already exist!');
      return;
    }

    console.log('📝 Creating missing sheets:', sheetsToCreate.join(', '));

    // Create missing sheets
    const requests = sheetsToCreate.map(sheetName => ({
      addSheet: {
        properties: {
          title: sheetName,
          gridProperties: {
            rowCount: 1000,
            columnCount: 26
          }
        }
      }
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: requests
      }
    });

    console.log('✅ Successfully created all required sheets!');
    
    // Optional: Delete the default "Sheet1" if it exists and is empty
    if (existingSheets.includes('Sheet1') && existingSheets.length === 1) {
      console.log('🗑️ Removing default "Sheet1"...');
      
      const sheet1Id = response.data.sheets.find(sheet => sheet.properties.title === 'Sheet1').properties.sheetId;
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [{
            deleteSheet: {
              sheetId: sheet1Id
            }
          }]
        }
      });
      
      console.log('✅ Removed default "Sheet1"');
    }

    console.log('\n🎉 Sheet structure setup complete!');
    console.log('📊 Your spreadsheet now has all required sheets for the fundraising system.');

  } catch (error) {
    console.error('❌ Error setting up sheet structure:', error.message);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupSheetStructure();
}

module.exports = { setupSheetStructure };
