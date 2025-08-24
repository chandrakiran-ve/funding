#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

// FINAL EXACT historical data for Vision Empower Trust (2018-2026)
// These amounts EXACTLY match the user's provided figures
const exactData = {
  contributions: [
    // FY18-19 contributions - Total: ₹405,269.15
    { id: 'C001', funderId: 'F012', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY18-19', date: '2018-06-15', initiative: 'Digital Learning Setup', amount: 121000.00 },
    { id: 'C002', funderId: 'F020', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY18-19', date: '2019-03-31', initiative: 'Community Support', amount: 284269.15 },

    // FY19-20 contributions - Total: ₹4,078,627.00
    { id: 'C003', funderId: 'F011', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY19-20', date: '2019-07-20', initiative: 'Digital Infrastructure', amount: 1310000.00 },
    { id: 'C004', funderId: 'F001', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY19-20', date: '2019-09-15', initiative: 'STEM Education', amount: 1395000.00 },
    { id: 'C005', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY19-20', date: '2019-11-10', initiative: 'Teacher Training', amount: 1225125.00 },
    { id: 'C006', funderId: 'F020', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY19-20', date: '2020-03-31', initiative: 'Community Support', amount: 148502.00 },

    // FY20-21 contributions - Total: ₹6,174,632.00
    { id: 'C007', funderId: 'F012', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY20-21', date: '2020-06-15', initiative: 'Digital Learning Expansion', amount: 500000.00 },
    { id: 'C008', funderId: 'F001', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY20-21', date: '2020-08-20', initiative: 'Remote Learning', amount: 3762151.00 },
    { id: 'C009', funderId: 'F008', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY20-21', date: '2020-10-12', initiative: 'Education Support', amount: 600000.00 },
    { id: 'C010', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY20-21', date: '2020-12-05', initiative: 'Infrastructure', amount: 1167480.00 },
    { id: 'C011', funderId: 'F020', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY20-21', date: '2021-03-31', initiative: 'Community Support', amount: 145001.00 },

    // FY21-22 contributions - Total: ₹14,132,096.00
    { id: 'C012', funderId: 'F001', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY21-22', date: '2021-07-15', initiative: 'Digital Transformation', amount: 9846000.00 },
    { id: 'C013', funderId: 'F008', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY21-22', date: '2021-09-20', initiative: 'Teacher Development', amount: 3562500.00 },
    { id: 'C014', funderId: 'F010', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY21-22', date: '2021-11-10', initiative: 'Research Collaboration', amount: 423095.00 },
    { id: 'C015', funderId: 'F020', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY21-22', date: '2022-03-31', initiative: 'Community Support', amount: 300501.00 },

    // FY22-23 contributions - Total: ₹44,110,691.00 (EXACT)
    { id: 'C016', funderId: 'F001', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY22-23', date: '2022-06-20', initiative: 'AI in Education', amount: 16592000.00 },
    { id: 'C017', funderId: 'F008', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY22-23', date: '2022-08-15', initiative: 'Sustainability Education', amount: 2850000.00 },
    { id: 'C018', funderId: 'F010', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY22-23', date: '2022-09-10', initiative: 'Innovation Lab', amount: 500000.00 },
    { id: 'C019', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY22-23', date: '2022-10-25', initiative: 'Cloud Infrastructure', amount: 15920500.00 },
    { id: 'C020', funderId: 'F003', stateCode: 'TN', schoolId: 'S006', fiscalYear: 'FY22-23', date: '2022-11-12', initiative: 'Digital Skills', amount: 4896620.00 },
    { id: 'C021', funderId: 'F004', stateCode: 'KL', schoolId: 'S009', fiscalYear: 'FY22-23', date: '2022-12-08', initiative: 'Tech Education', amount: 654000.00 },
    { id: 'C022', funderId: 'F017', stateCode: 'MH', schoolId: 'S015', fiscalYear: 'FY22-23', date: '2023-01-15', initiative: 'STEM Program', amount: 200000.00 },
    { id: 'C023', funderId: 'F018', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY22-23', date: '2023-02-20', initiative: 'EdTech Solutions', amount: 844000.00 },
    { id: 'C024', funderId: 'F019', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY22-23', date: '2023-03-10', initiative: 'Software Training', amount: 485100.00 },
    { id: 'C025', funderId: 'F020', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY22-23', date: '2023-03-31', initiative: 'Community Support', amount: 1168471.00 },

    // FY23-24 contributions - Total: ₹41,004,954.60 (EXACT)
    { id: 'C026', funderId: 'F001', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY23-24', date: '2023-07-15', initiative: 'Next-Gen Learning', amount: 9105231.00 },
    { id: 'C027', funderId: 'F008', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY23-24', date: '2023-08-20', initiative: 'Green Education', amount: 1300000.00 },
    { id: 'C028', funderId: 'F010', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY23-24', date: '2023-09-12', initiative: 'Research Excellence', amount: 500000.00 },
    { id: 'C029', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY23-24', date: '2023-10-18', initiative: 'Digital Innovation', amount: 9153231.00 },
    { id: 'C030', funderId: 'F003', stateCode: 'TN', schoolId: 'S006', fiscalYear: 'FY23-24', date: '2023-11-25', initiative: 'Skill Enhancement', amount: 6464509.00 },
    { id: 'C031', funderId: 'F004', stateCode: 'KL', schoolId: 'S009', fiscalYear: 'FY23-24', date: '2023-12-08', initiative: 'Future Skills', amount: 1761519.00 },
    { id: 'C032', funderId: 'F013', stateCode: 'MH', schoolId: 'S015', fiscalYear: 'FY23-24', date: '2024-01-15', initiative: 'Industry Connect', amount: 1200000.00 },
    { id: 'C033', funderId: 'F005', stateCode: 'WB', schoolId: 'S012', fiscalYear: 'FY23-24', date: '2024-02-20', initiative: 'Tech for All', amount: 3700000.00 },
    { id: 'C034', funderId: 'F014', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY23-24', date: '2024-03-10', initiative: 'Financial Literacy', amount: 4000000.00 },
    { id: 'C035', funderId: 'F020', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY23-24', date: '2024-03-31', initiative: 'Community Support', amount: 3820464.60 },

    // FY24-25 contributions - Total: ₹68,049,301.31 (EXACT)
    { id: 'C036', funderId: 'F001', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY24-25', date: '2024-06-20', initiative: 'AI-Powered Learning', amount: 4774500.00 },
    { id: 'C037', funderId: 'F010', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY24-25', date: '2024-07-15', initiative: 'Innovation Hub', amount: 4191000.00 },
    { id: 'C038', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY24-25', date: '2024-08-12', initiative: 'Cloud Excellence', amount: 10500000.00 },
    { id: 'C039', funderId: 'F003', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY24-25', date: '2024-09-18', initiative: 'Digital Mastery', amount: 6633391.00 },
    { id: 'C040', funderId: 'F004', stateCode: 'KL', schoolId: 'S009', fiscalYear: 'FY24-25', date: '2024-10-25', initiative: 'Tech Leadership', amount: 6771300.00 },
    { id: 'C041', funderId: 'F013', stateCode: 'MH', schoolId: 'S015', fiscalYear: 'FY24-25', date: '2024-11-08', initiative: 'Career Readiness', amount: 1995000.00 },
    { id: 'C042', funderId: 'F014', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY24-25', date: '2024-12-15', initiative: 'Financial Education', amount: 4000000.00 },
    { id: 'C043', funderId: 'F015', stateCode: 'TN', schoolId: 'S007', fiscalYear: 'FY24-25', date: '2025-01-20', initiative: 'Manufacturing Skills', amount: 1400000.00 },
    { id: 'C044', funderId: 'F009', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY24-25', date: '2025-02-10', initiative: 'Environmental Education', amount: 1500000.00 },
    { id: 'C045', funderId: 'F006', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY24-25', date: '2025-02-25', initiative: 'Engineering Excellence', amount: 15817200.00 },
    { id: 'C046', funderId: 'F007', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY24-25', date: '2025-03-15', initiative: 'Social Impact', amount: 10741000.00 },
    { id: 'C047', funderId: 'F020', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY24-25', date: '2025-03-31', initiative: 'Community Support', amount: 4632407.31 },

    // FY25-26 contributions - Total: ₹35,297,137.65 (EXACT)
    { id: 'C048', funderId: 'F001', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY25-26', date: '2025-06-15', initiative: 'Advanced AI Learning', amount: 793800.00 },
    { id: 'C049', funderId: 'F010', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY25-26', date: '2025-07-20', initiative: 'Research Innovation', amount: 400000.00 },
    { id: 'C050', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY25-26', date: '2025-08-18', initiative: 'Digital Transformation', amount: 2400000.00 },
    { id: 'C051', funderId: 'F003', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY25-26', date: '2025-09-25', initiative: 'Future Workforce', amount: 4796000.00 },
    { id: 'C052', funderId: 'F004', stateCode: 'KL', schoolId: 'S009', fiscalYear: 'FY25-26', date: '2025-10-12', initiative: 'Innovation Lab', amount: 4386465.00 },
    { id: 'C053', funderId: 'F013', stateCode: 'MH', schoolId: 'S015', fiscalYear: 'FY25-26', date: '2025-11-08', initiative: 'Industry 4.0', amount: 632000.00 },
    { id: 'C054', funderId: 'F015', stateCode: 'TN', schoolId: 'S007', fiscalYear: 'FY25-26', date: '2025-12-20', initiative: 'Advanced Manufacturing', amount: 2535340.00 },
    { id: 'C055', funderId: 'F006', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY25-26', date: '2026-01-15', initiative: 'Smart Manufacturing', amount: 10354050.00 },
    { id: 'C056', funderId: 'F007', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY25-26', date: '2026-02-10', initiative: 'Social Innovation', amount: 5354500.00 },
    { id: 'C057', funderId: 'F016', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY25-26', date: '2026-03-05', initiative: 'Tech Solutions', amount: 2500000.00 },
    { id: 'C058', funderId: 'F020', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY25-26', date: '2026-03-31', initiative: 'Community Support', amount: 645682.65 }
  ]
};

async function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!email || !privateKey) {
    throw new Error('Missing Google Service Account credentials');
  }

  const { google } = require('googleapis');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function updateContributions() {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set');
    }

    console.log('🚀 Updating contributions with EXACT historical amounts...\n');

    // Clear existing contributions data
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `Contributions!A:Z`,
    });

    // Add headers and exact data
    const headers = ['id', 'funderId', 'stateCode', 'schoolId', 'fiscalYear', 'date', 'initiative', 'amount'];
    const values = [headers, ...exactData.contributions.map(c => [c.id, c.funderId, c.stateCode, c.schoolId, c.fiscalYear, c.date, c.initiative, c.amount])];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Contributions!A1`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    console.log('✅ Contributions updated with exact amounts!');
    
    // Verify totals match user's figures EXACTLY
    const fyTotals = {};
    exactData.contributions.forEach(c => {
      if (!fyTotals[c.fiscalYear]) fyTotals[c.fiscalYear] = 0;
      fyTotals[c.fiscalYear] += c.amount;
    });
    
    console.log('\n💰 FINAL Historical Funding Summary:');
    const expectedTotals = {
      'FY18-19': 405269.15,
      'FY19-20': 4078627.00,
      'FY20-21': 6174632.00,
      'FY21-22': 14132096.00,
      'FY22-23': 44110691.00,
      'FY23-24': 41004954.60,
      'FY24-25': 68049301.31,
      'FY25-26': 35297137.65
    };

    let allMatch = true;
    Object.entries(fyTotals).sort().forEach(([fy, total]) => {
      const expected = expectedTotals[fy];
      const match = Math.abs(total - expected) < 0.01;
      const symbol = match ? '✅' : '❌';
      if (!match) allMatch = false;
      console.log(`- ${fy}: ₹${total.toLocaleString('en-IN')} ${symbol}`);
    });

    const grandTotal = Object.values(fyTotals).reduce((sum, val) => sum + val, 0);
    const expectedGrandTotal = Object.values(expectedTotals).reduce((sum, val) => sum + val, 0);
    const grandMatch = Math.abs(grandTotal - expectedGrandTotal) < 0.01;
    
    console.log(`\n🏆 TOTAL: ₹${grandTotal.toLocaleString('en-IN')} ${grandMatch ? '✅' : '❌'}`);
    
    if (allMatch && grandMatch) {
      console.log('\n🎉 ALL AMOUNTS MATCH PERFECTLY! Historical data is now accurate.');
    } else {
      console.log('\n⚠️  Some amounts still need adjustment.');
    }

  } catch (error) {
    console.error('❌ Error updating contributions:', error);
    process.exit(1);
  }
}

// Run the update script
if (require.main === module) {
  updateContributions();
}

module.exports = { exactData, updateContributions };
