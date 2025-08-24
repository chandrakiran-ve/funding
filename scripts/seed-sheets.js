const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

// Sample data for Vision Empower Trust fundraising
const sampleData = {
  funders: [
    { id: 'F001', name: 'Tata Trusts', type: 'Corporate Foundation', priority: 'High', owner: 'Priya Sharma' },
    { id: 'F002', name: 'Azim Premji Foundation', type: 'Private Foundation', priority: 'High', owner: 'Rahul Kumar' },
    { id: 'F003', name: 'Infosys Foundation', type: 'Corporate Foundation', priority: 'Medium', owner: 'Anita Singh' },
    { id: 'F004', name: 'Mahindra Foundation', type: 'Corporate Foundation', priority: 'Medium', owner: 'Vikram Patel' },
    { id: 'F005', name: 'Wipro Foundation', type: 'Corporate Foundation', priority: 'Medium', owner: 'Sunita Rao' },
    { id: 'F006', name: 'HCL Foundation', type: 'Corporate Foundation', priority: 'Low', owner: 'Amit Gupta' },
    { id: 'F007', name: 'Tech Mahindra Foundation', type: 'Corporate Foundation', priority: 'Low', owner: 'Neha Agarwal' },
    { id: 'F008', name: 'Bharti Foundation', type: 'Corporate Foundation', priority: 'High', owner: 'Rajesh Mehta' }
  ],

  states: [
    { code: 'MH', name: 'Maharashtra', coordinator: 'Deepak Patil' },
    { code: 'KA', name: 'Karnataka', coordinator: 'Lakshmi Nair' },
    { code: 'TN', name: 'Tamil Nadu', coordinator: 'Karthik Raman' },
    { code: 'AP', name: 'Andhra Pradesh', coordinator: 'Srinivas Reddy' },
    { code: 'TG', name: 'Telangana', coordinator: 'Madhavi Rao' },
    { code: 'GJ', name: 'Gujarat', coordinator: 'Bharat Shah' },
    { code: 'RJ', name: 'Rajasthan', coordinator: 'Pooja Jain' },
    { code: 'UP', name: 'Uttar Pradesh', coordinator: 'Arjun Singh' }
  ],

  schools: [
    // Maharashtra
    { id: 'S001', stateCode: 'MH', name: 'Vision School Mumbai', program: 'Primary Education' },
    { id: 'S002', stateCode: 'MH', name: 'Empower Academy Pune', program: 'Secondary Education' },
    { id: 'S003', stateCode: 'MH', name: 'Trust School Nashik', program: 'Vocational Training' },
    
    // Karnataka
    { id: 'S004', stateCode: 'KA', name: 'Bangalore Learning Center', program: 'Primary Education' },
    { id: 'S005', stateCode: 'KA', name: 'Mysore Skills Institute', program: 'Vocational Training' },
    { id: 'S006', stateCode: 'KA', name: 'Hubli Community School', program: 'Secondary Education' },
    
    // Tamil Nadu
    { id: 'S007', stateCode: 'TN', name: 'Chennai Education Hub', program: 'Primary Education' },
    { id: 'S008', stateCode: 'TN', name: 'Coimbatore Tech School', program: 'Vocational Training' },
    { id: 'S009', stateCode: 'TN', name: 'Madurai Learning Center', program: 'Secondary Education' },
    
    // Andhra Pradesh
    { id: 'S010', stateCode: 'AP', name: 'Visakhapatnam School', program: 'Primary Education' },
    { id: 'S011', stateCode: 'AP', name: 'Vijayawada Institute', program: 'Vocational Training' },
    
    // Telangana
    { id: 'S012', stateCode: 'TG', name: 'Hyderabad Tech Center', program: 'Vocational Training' },
    { id: 'S013', stateCode: 'TG', name: 'Warangal Community School', program: 'Primary Education' },
    
    // Gujarat
    { id: 'S014', stateCode: 'GJ', name: 'Ahmedabad Learning Hub', program: 'Secondary Education' },
    { id: 'S015', stateCode: 'GJ', name: 'Surat Skills Center', program: 'Vocational Training' },
    
    // Rajasthan
    { id: 'S016', stateCode: 'RJ', name: 'Jaipur Education Center', program: 'Primary Education' },
    { id: 'S017', stateCode: 'RJ', name: 'Jodhpur Community School', program: 'Secondary Education' },
    
    // Uttar Pradesh
    { id: 'S018', stateCode: 'UP', name: 'Lucknow Learning Institute', program: 'Primary Education' },
    { id: 'S019', stateCode: 'UP', name: 'Kanpur Skills Center', program: 'Vocational Training' },
    { id: 'S020', stateCode: 'UP', name: 'Agra Community School', program: 'Secondary Education' }
  ],

  stateTargets: [
    // FY24-25 targets
    { stateCode: 'MH', fiscalYear: 'FY24-25', targetAmount: 50000000 }, // 5 crores
    { stateCode: 'KA', fiscalYear: 'FY24-25', targetAmount: 40000000 }, // 4 crores
    { stateCode: 'TN', fiscalYear: 'FY24-25', targetAmount: 35000000 }, // 3.5 crores
    { stateCode: 'AP', fiscalYear: 'FY24-25', targetAmount: 30000000 }, // 3 crores
    { stateCode: 'TG', fiscalYear: 'FY24-25', targetAmount: 25000000 }, // 2.5 crores
    { stateCode: 'GJ', fiscalYear: 'FY24-25', targetAmount: 30000000 }, // 3 crores
    { stateCode: 'RJ', fiscalYear: 'FY24-25', targetAmount: 20000000 }, // 2 crores
    { stateCode: 'UP', fiscalYear: 'FY24-25', targetAmount: 45000000 }, // 4.5 crores
    
    // FY25-26 targets
    { stateCode: 'MH', fiscalYear: 'FY25-26', targetAmount: 55000000 },
    { stateCode: 'KA', fiscalYear: 'FY25-26', targetAmount: 45000000 },
    { stateCode: 'TN', fiscalYear: 'FY25-26', targetAmount: 40000000 },
    { stateCode: 'AP', fiscalYear: 'FY25-26', targetAmount: 35000000 },
    { stateCode: 'TG', fiscalYear: 'FY25-26', targetAmount: 30000000 },
    { stateCode: 'GJ', fiscalYear: 'FY25-26', targetAmount: 35000000 },
    { stateCode: 'RJ', fiscalYear: 'FY25-26', targetAmount: 25000000 },
    { stateCode: 'UP', fiscalYear: 'FY25-26', targetAmount: 50000000 }
  ],

  contributions: [
    // FY23-24 contributions
    { id: 'C001', funderId: 'F001', stateCode: 'MH', schoolId: 'S001', fiscalYear: 'FY23-24', date: '2023-06-15', initiative: 'Digital Learning', amount: 8000000 },
    { id: 'C002', funderId: 'F002', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY23-24', date: '2023-07-20', initiative: 'Teacher Training', amount: 6000000 },
    { id: 'C003', funderId: 'F003', stateCode: 'TN', schoolId: 'S007', fiscalYear: 'FY23-24', date: '2023-08-10', initiative: 'Infrastructure', amount: 5000000 },
    
    // FY24-25 contributions
    { id: 'C004', funderId: 'F001', stateCode: 'MH', schoolId: 'S002', fiscalYear: 'FY24-25', date: '2024-05-15', initiative: 'STEM Education', amount: 12000000 },
    { id: 'C005', funderId: 'F002', stateCode: 'KA', schoolId: 'S005', fiscalYear: 'FY24-25', date: '2024-06-20', initiative: 'Skill Development', amount: 10000000 },
    { id: 'C006', funderId: 'F003', stateCode: 'TN', schoolId: 'S008', fiscalYear: 'FY24-25', date: '2024-07-10', initiative: 'Digital Literacy', amount: 8000000 },
    { id: 'C007', funderId: 'F004', stateCode: 'AP', schoolId: 'S010', fiscalYear: 'FY24-25', date: '2024-08-05', initiative: 'Teacher Training', amount: 7000000 },
    { id: 'C008', funderId: 'F005', stateCode: 'TG', schoolId: 'S012', fiscalYear: 'FY24-25', date: '2024-09-12', initiative: 'Infrastructure', amount: 6000000 },
    { id: 'C009', funderId: 'F006', stateCode: 'GJ', schoolId: 'S014', fiscalYear: 'FY24-25', date: '2024-10-18', initiative: 'Library Development', amount: 5000000 },
    { id: 'C010', funderId: 'F007', stateCode: 'RJ', schoolId: 'S016', fiscalYear: 'FY24-25', date: '2024-11-25', initiative: 'Sports Program', amount: 4000000 },
    { id: 'C011', funderId: 'F008', stateCode: 'UP', schoolId: 'S018', fiscalYear: 'FY24-25', date: '2024-12-08', initiative: 'Nutrition Program', amount: 9000000 },
    { id: 'C012', funderId: 'F001', stateCode: 'MH', schoolId: 'S003', fiscalYear: 'FY24-25', date: '2024-12-20', initiative: 'Vocational Training', amount: 7500000 },
    { id: 'C013', funderId: 'F002', stateCode: 'KA', schoolId: 'S006', fiscalYear: 'FY24-25', date: '2025-01-15', initiative: 'Computer Lab', amount: 6500000 },
    { id: 'C014', funderId: 'F004', stateCode: 'GJ', schoolId: 'S015', fiscalYear: 'FY24-25', date: '2025-02-10', initiative: 'Science Lab', amount: 5500000 },
    { id: 'C015', funderId: 'F008', stateCode: 'UP', schoolId: 'S019', fiscalYear: 'FY24-25', date: '2025-02-28', initiative: 'Skill Training', amount: 8000000 }
  ],

  prospects: [
    { id: 'P001', stateCode: 'MH', funderName: 'Reliance Foundation', stage: 'Lead', estimatedAmount: 15000000, probability: 0.3, nextAction: 'Initial meeting scheduled', dueDate: '2025-03-15', owner: 'Priya Sharma' },
    { id: 'P002', stateCode: 'KA', funderName: 'JSW Foundation', stage: 'Contacted', estimatedAmount: 12000000, probability: 0.5, nextAction: 'Send proposal draft', dueDate: '2025-03-20', owner: 'Rahul Kumar' },
    { id: 'P003', stateCode: 'TN', funderName: 'TVS Foundation', stage: 'Proposal', estimatedAmount: 10000000, probability: 0.7, nextAction: 'Follow up on proposal', dueDate: '2025-03-10', owner: 'Anita Singh' },
    { id: 'P004', stateCode: 'AP', funderName: 'Dr. Reddy\'s Foundation', stage: 'Committed', estimatedAmount: 8000000, probability: 0.9, nextAction: 'Finalize agreement', dueDate: '2025-03-05', owner: 'Vikram Patel' },
    { id: 'P005', stateCode: 'GJ', funderName: 'Adani Foundation', stage: 'Lead', estimatedAmount: 20000000, probability: 0.2, nextAction: 'Research contact person', dueDate: '2025-03-25', owner: 'Bharat Shah' },
    { id: 'P006', stateCode: 'TG', funderName: 'Cyient Foundation', stage: 'Contacted', estimatedAmount: 7000000, probability: 0.4, nextAction: 'Schedule presentation', dueDate: '2025-03-18', owner: 'Madhavi Rao' },
    { id: 'P007', stateCode: 'RJ', funderName: 'Birla Foundation', stage: 'Proposal', estimatedAmount: 9000000, probability: 0.6, nextAction: 'Revise budget section', dueDate: '2025-03-12', owner: 'Pooja Jain' },
    { id: 'P008', stateCode: 'UP', funderName: 'ITC Foundation', stage: 'Lead', estimatedAmount: 11000000, probability: 0.3, nextAction: 'Cold outreach email', dueDate: '2025-03-30', owner: 'Arjun Singh' },
    { id: 'P009', stateCode: 'MH', funderName: 'Godrej Foundation', stage: 'Contacted', estimatedAmount: 13000000, probability: 0.5, nextAction: 'Submit detailed proposal', dueDate: '2025-03-22', owner: 'Priya Sharma' },
    { id: 'P010', stateCode: 'KA', funderName: 'Biocon Foundation', stage: 'Proposal', estimatedAmount: 6000000, probability: 0.8, nextAction: 'Final presentation prep', dueDate: '2025-03-08', owner: 'Lakshmi Nair' }
  ],

  // Users data (including default admin)
  users: [
    { 
      id: 'admin_default', 
      email: 'admin@visionempowertrust.org', 
      firstName: 'System', 
      lastName: 'Admin', 
      role: 'admin', 
      status: 'approved', 
      assignedStates: '', 
      requestedAt: new Date().toISOString(), 
      approvedAt: new Date().toISOString(), 
      approvedBy: 'system' 
    },
    { 
      id: 'chandrakiran_admin', 
      email: 'chandrakiran@visionempowertrust.org', 
      firstName: 'Chandrakiran', 
      lastName: 'HJ', 
      role: 'admin', 
      status: 'approved', 
      assignedStates: '', 
      requestedAt: new Date().toISOString(), 
      approvedAt: new Date().toISOString(), 
      approvedBy: 'system' 
    }
  ]
};

async function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const key = keyRaw?.replace(/\\n/g, '\n');
  
  if (!email || !key) {
    throw new Error('Google Sheets service account credentials are missing');
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
}

async function createOrUpdateSheet(sheets, spreadsheetId, sheetName, headers, data) {
  try {
    console.log(`Processing sheet: ${sheetName}`);
    
    // Clear existing data
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A:Z`
    });

    // Prepare data with headers
    const values = [headers, ...data];
    
    // Update the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      resource: { values }
    });
    
    console.log(`✓ Updated ${sheetName} with ${data.length} rows`);
  } catch (error) {
    console.error(`Error updating ${sheetName}:`, error.message);
  }
}

async function seedGoogleSheets() {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set');
    }

    console.log('Starting to seed Google Sheets with sample data...\n');

    // Seed Funders
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Funders',
      ['id', 'name', 'type', 'priority', 'owner'],
      sampleData.funders.map(f => [f.id, f.name, f.type, f.priority, f.owner])
    );

    // Seed States
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'States',
      ['code', 'name', 'coordinator'],
      sampleData.states.map(s => [s.code, s.name, s.coordinator])
    );

    // Seed Schools
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Schools',
      ['id', 'stateCode', 'name', 'program'],
      sampleData.schools.map(s => [s.id, s.stateCode, s.name, s.program])
    );

    // Seed State Targets
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'StateTargets',
      ['stateCode', 'fiscalYear', 'targetAmount'],
      sampleData.stateTargets.map(t => [t.stateCode, t.fiscalYear, t.targetAmount])
    );

    // Seed Contributions
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Contributions',
      ['id', 'funderId', 'stateCode', 'schoolId', 'fiscalYear', 'date', 'initiative', 'amount'],
      sampleData.contributions.map(c => [c.id, c.funderId, c.stateCode, c.schoolId, c.fiscalYear, c.date, c.initiative, c.amount])
    );

    // Seed Prospects
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Prospects',
      ['id', 'stateCode', 'funderName', 'stage', 'estimatedAmount', 'probability', 'nextAction', 'dueDate', 'owner'],
      sampleData.prospects.map(p => [p.id, p.stateCode, p.funderName, p.stage, p.estimatedAmount, p.probability, p.nextAction, p.dueDate, p.owner])
    );

    // Seed Users
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Users',
      ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'assignedStates', 'requestedAt', 'approvedAt', 'approvedBy'],
      sampleData.users.map(u => [u.id, u.email, u.firstName, u.lastName, u.role, u.status, u.assignedStates, u.requestedAt, u.approvedAt, u.approvedBy])
    );

    console.log('\n🎉 Successfully seeded all sheets with sample data!');
    console.log('\nData Summary:');
    console.log(`- ${sampleData.funders.length} Funders`);
    console.log(`- ${sampleData.states.length} States`);
    console.log(`- ${sampleData.schools.length} Schools`);
    console.log(`- ${sampleData.stateTargets.length} State Targets`);
    console.log(`- ${sampleData.contributions.length} Contributions`);
    console.log(`- ${sampleData.prospects.length} Prospects`);
    console.log(`- ${sampleData.users.length} Users`);
    
    // Calculate totals
    const totalTarget = sampleData.stateTargets.filter(t => t.fiscalYear === 'FY24-25').reduce((sum, t) => sum + t.targetAmount, 0);
    const totalSecured = sampleData.contributions.filter(c => c.fiscalYear === 'FY24-25').reduce((sum, c) => sum + c.amount, 0);
    const totalPipeline = sampleData.prospects.reduce((sum, p) => sum + p.estimatedAmount, 0);
    
    console.log('\nFY24-25 Summary:');
    console.log(`- Target: ₹${(totalTarget / 10000000).toFixed(1)} crores`);
    console.log(`- Secured: ₹${(totalSecured / 10000000).toFixed(1)} crores (${((totalSecured / totalTarget) * 100).toFixed(1)}%)`);
    console.log(`- Pipeline: ₹${(totalPipeline / 10000000).toFixed(1)} crores`);

  } catch (error) {
    console.error('Error seeding Google Sheets:', error);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  seedGoogleSheets();
}

module.exports = { seedGoogleSheets, sampleData };

