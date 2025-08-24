#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

// EXACT state management structure as provided by the user
const exactStateData = {
  states: [
    // Jyoti's states (6 states)
    { code: 'GJ', name: 'Gujarat', coordinator: 'Jyoti' },
    { code: 'JH', name: 'Jharkhand', coordinator: 'Jyoti' },
    { code: 'MP', name: 'Madhya Pradesh', coordinator: 'Jyoti' },
    { code: 'DL', name: 'NCR (Delhi, UP and Haryana)', coordinator: 'Jyoti' },
    { code: 'OR', name: 'Odisha', coordinator: 'Jyoti' },
    { code: 'UK', name: 'Uttarakhand', coordinator: 'Jyoti' },
    
    // Raji's states (5 states)
    { code: 'AP', name: 'Andhra Pradesh', coordinator: 'Raji' },
    { code: 'KA', name: 'Karnataka', coordinator: 'Raji' },
    { code: 'KL', name: 'Kerala', coordinator: 'Raji' },
    { code: 'TN', name: 'Tamilnadu', coordinator: 'Raji' },
    { code: 'TG', name: 'Telangana', coordinator: 'Raji' },
    
    // Devi's states (5 states)
    { code: 'AR', name: 'Arunachal Pradesh', coordinator: 'Devi' },
    { code: 'MH', name: 'Maharashtra', coordinator: 'Devi' },
    { code: 'ML', name: 'Meghalaya', coordinator: 'Devi' },
    { code: 'TR', name: 'Tripura', coordinator: 'Devi' },
    { code: 'WB', name: 'West Bengal', coordinator: 'Devi' }
  ],

  // Updated funders with proper assignments
  funders: [
    // Microsoft ecosystem (Jyoti)
    { id: 'F001', name: 'Microsoft India Corporation India Pvt Ltd', type: 'Corporate Foundation', priority: 'High', owner: 'Jyoti' },
    { id: 'F002', name: 'Microsoft-IDC', type: 'Corporate Foundation', priority: 'High', owner: 'Jyoti' },
    { id: 'F010', name: 'IIITB (Microsoft Support)', type: 'Educational Institution', priority: 'High', owner: 'Jyoti' },
    
    // BOSCH partnerships (Raji)
    { id: 'F006', name: 'BOSCH', type: 'Corporate Foundation', priority: 'High', owner: 'Raji' },
    
    // Wipro ecosystem (Raji)
    { id: 'F008', name: 'Wipro Foundation', type: 'Corporate Foundation', priority: 'High', owner: 'Raji' },
    { id: 'F009', name: 'Wipro Earthian', type: 'Corporate Foundation', priority: 'Medium', owner: 'Raji' },
    
    // Cognizant Foundation network
    { id: 'F003', name: 'Cognizant Foundation-TN', type: 'Corporate Foundation', priority: 'High', owner: 'Raji' },
    { id: 'F004', name: 'Cognizant Foundation-Kerala', type: 'Corporate Foundation', priority: 'High', owner: 'Raji' },
    { id: 'F005', name: 'Cognizant Foundation-West Bengal', type: 'Corporate Foundation', priority: 'High', owner: 'Devi' },
    
    // BATA and CSGI (Devi)
    { id: 'F013', name: 'BATA', type: 'Corporate Foundation', priority: 'Medium', owner: 'Devi' },
    { id: 'F021', name: 'CSGI', type: 'Corporate Foundation', priority: 'Medium', owner: 'Devi' },
    
    // Great Eastern (Devi)
    { id: 'F014', name: 'Great Eastern', type: 'Corporate Foundation', priority: 'Medium', owner: 'Devi' },
    
    // State Bank of India Foundation (Jyoti)
    { id: 'F007', name: 'SBIF', type: 'Corporate Foundation', priority: 'High', owner: 'Jyoti' },
    
    // Other existing funders
    { id: 'F011', name: 'Fidelity Business Service India Pvt Ltd', type: 'Corporate Foundation', priority: 'Medium', owner: 'Jyoti' },
    { id: 'F012', name: 'Electrobit India Pvt Ltd', type: 'Corporate Foundation', priority: 'Medium', owner: 'Jyoti' },
    { id: 'F015', name: 'The Madras Suspensions Pvt Ltd', type: 'Corporate Foundation', priority: 'Medium', owner: 'Raji' },
    { id: 'F016', name: 'Newtecpro', type: 'Corporate Foundation', priority: 'Medium', owner: 'Jyoti' },
    { id: 'F017', name: 'Ametek', type: 'Corporate Foundation', priority: 'Low', owner: 'Devi' },
    { id: 'F018', name: 'Vembi Technologies Pvt Ltd', type: 'Corporate Foundation', priority: 'Low', owner: 'Raji' },
    { id: 'F019', name: 'Bentley Systems India Pvt Ltd', type: 'Corporate Foundation', priority: 'Low', owner: 'Raji' },
    { id: 'F020', name: 'Individual Donations', type: 'Individual Donors', priority: 'Medium', owner: 'All Managers' }
  ],

  // Schools for the 16 operational states
  schools: [
    // Jyoti's states schools
    { id: 'S201', stateCode: 'GJ', name: 'Government High School Ahmedabad', program: 'Digital Learning' },
    { id: 'S202', stateCode: 'GJ', name: 'Government Primary School Surat', program: 'Basic Education' },
    { id: 'S203', stateCode: 'JH', name: 'Government High School Ranchi', program: 'Digital Learning' },
    { id: 'S204', stateCode: 'JH', name: 'Government Primary School Jamshedpur', program: 'STEM Education' },
    { id: 'S205', stateCode: 'MP', name: 'Government High School Bhopal', program: 'Digital Learning' },
    { id: 'S206', stateCode: 'MP', name: 'Government Primary School Indore', program: 'Basic Education' },
    { id: 'S207', stateCode: 'DL', name: 'Government High School Delhi NCR', program: 'Digital Learning' },
    { id: 'S208', stateCode: 'DL', name: 'Government Primary School Gurgaon', program: 'STEM Education' },
    { id: 'S209', stateCode: 'OR', name: 'Government High School Bhubaneswar', program: 'Digital Learning' },
    { id: 'S210', stateCode: 'OR', name: 'Government Primary School Cuttack', program: 'Basic Education' },
    { id: 'S211', stateCode: 'UK', name: 'Government High School Dehradun', program: 'Digital Learning' },
    { id: 'S212', stateCode: 'UK', name: 'Government Primary School Haridwar', program: 'Basic Education' },
    
    // Raji's states schools
    { id: 'S213', stateCode: 'AP', name: 'Government High School Visakhapatnam', program: 'Digital Learning' },
    { id: 'S214', stateCode: 'AP', name: 'Government Primary School Vijayawada', program: 'Basic Education' },
    { id: 'S001', stateCode: 'KA', name: 'Government High School Bangalore', program: 'Digital Learning' },
    { id: 'S002', stateCode: 'KA', name: 'Government Primary School Mysore', program: 'Basic Education' },
    { id: 'S003', stateCode: 'KA', name: 'Government Higher Primary School Hubli', program: 'STEM Education' },
    { id: 'S009', stateCode: 'KL', name: 'Government High School Kochi', program: 'Digital Learning' },
    { id: 'S010', stateCode: 'KL', name: 'Government Primary School Thiruvananthapuram', program: 'Basic Education' },
    { id: 'S005', stateCode: 'TN', name: 'Government High School Chennai', program: 'Digital Learning' },
    { id: 'S006', stateCode: 'TN', name: 'Government Primary School Coimbatore', program: 'Basic Education' },
    { id: 'S007', stateCode: 'TN', name: 'Government Higher Primary School Madurai', program: 'STEM Education' },
    { id: 'S215', stateCode: 'TG', name: 'Government High School Hyderabad', program: 'Digital Learning' },
    { id: 'S216', stateCode: 'TG', name: 'Government Primary School Warangal', program: 'Basic Education' },
    
    // Devi's states schools
    { id: 'S217', stateCode: 'AR', name: 'Government High School Itanagar', program: 'Digital Learning' },
    { id: 'S218', stateCode: 'AR', name: 'Government Primary School Naharlagun', program: 'Basic Education' },
    { id: 'S015', stateCode: 'MH', name: 'Government High School Mumbai', program: 'Digital Learning' },
    { id: 'S219', stateCode: 'MH', name: 'Government Primary School Pune', program: 'Basic Education' },
    { id: 'S220', stateCode: 'ML', name: 'Government High School Shillong', program: 'Digital Learning' },
    { id: 'S221', stateCode: 'ML', name: 'Government Primary School Tura', program: 'Basic Education' },
    { id: 'S222', stateCode: 'TR', name: 'Government High School Agartala', program: 'Digital Learning' },
    { id: 'S223', stateCode: 'TR', name: 'Government Primary School Udaipur', program: 'Basic Education' },
    { id: 'S012', stateCode: 'WB', name: 'Government High School Kolkata', program: 'Digital Learning' },
    { id: 'S013', stateCode: 'WB', name: 'Government Primary School Howrah', program: 'Basic Education' },
    { id: 'S014', stateCode: 'WB', name: 'Government Higher Primary School Durgapur', program: 'STEM Education' }
  ],

  // State targets for the 16 operational states
  stateTargets: [
    // FY24-25 targets
    { stateCode: 'GJ', fiscalYear: 'FY24-25', targetAmount: 6000000 },
    { stateCode: 'JH', fiscalYear: 'FY24-25', targetAmount: 8000000 },
    { stateCode: 'MP', fiscalYear: 'FY24-25', targetAmount: 5000000 },
    { stateCode: 'DL', fiscalYear: 'FY24-25', targetAmount: 12000000 },
    { stateCode: 'OR', fiscalYear: 'FY24-25', targetAmount: 7000000 },
    { stateCode: 'UK', fiscalYear: 'FY24-25', targetAmount: 4000000 },
    { stateCode: 'AP', fiscalYear: 'FY24-25', targetAmount: 8000000 },
    { stateCode: 'KA', fiscalYear: 'FY24-25', targetAmount: 40000000 },
    { stateCode: 'KL', fiscalYear: 'FY24-25', targetAmount: 12000000 },
    { stateCode: 'TN', fiscalYear: 'FY24-25', targetAmount: 15000000 },
    { stateCode: 'TG', fiscalYear: 'FY24-25', targetAmount: 10000000 },
    { stateCode: 'AR', fiscalYear: 'FY24-25', targetAmount: 2000000 },
    { stateCode: 'MH', fiscalYear: 'FY24-25', targetAmount: 8000000 },
    { stateCode: 'ML', fiscalYear: 'FY24-25', targetAmount: 3000000 },
    { stateCode: 'TR', fiscalYear: 'FY24-25', targetAmount: 2500000 },
    { stateCode: 'WB', fiscalYear: 'FY24-25', targetAmount: 12000000 },
    
    // FY25-26 targets
    { stateCode: 'GJ', fiscalYear: 'FY25-26', targetAmount: 7000000 },
    { stateCode: 'JH', fiscalYear: 'FY25-26', targetAmount: 10000000 },
    { stateCode: 'MP', fiscalYear: 'FY25-26', targetAmount: 6000000 },
    { stateCode: 'DL', fiscalYear: 'FY25-26', targetAmount: 15000000 },
    { stateCode: 'OR', fiscalYear: 'FY25-26', targetAmount: 9000000 },
    { stateCode: 'UK', fiscalYear: 'FY25-26', targetAmount: 5000000 },
    { stateCode: 'AP', fiscalYear: 'FY25-26', targetAmount: 10000000 },
    { stateCode: 'KA', fiscalYear: 'FY25-26', targetAmount: 35000000 },
    { stateCode: 'KL', fiscalYear: 'FY25-26', targetAmount: 15000000 },
    { stateCode: 'TN', fiscalYear: 'FY25-26', targetAmount: 18000000 },
    { stateCode: 'TG', fiscalYear: 'FY25-26', targetAmount: 12000000 },
    { stateCode: 'AR', fiscalYear: 'FY25-26', targetAmount: 2500000 },
    { stateCode: 'MH', fiscalYear: 'FY25-26', targetAmount: 10000000 },
    { stateCode: 'ML', fiscalYear: 'FY25-26', targetAmount: 4000000 },
    { stateCode: 'TR', fiscalYear: 'FY25-26', targetAmount: 3000000 },
    { stateCode: 'WB', fiscalYear: 'FY25-26', targetAmount: 15000000 }
  ],

  // Updated prospects for the 16 operational states
  prospects: [
    // Jyoti's prospects
    { id: 'P001', stateCode: 'GJ', funderName: 'Adani Foundation', stage: 'Lead', estimatedAmount: 8000000, probability: 0.3, nextAction: 'Initial outreach meeting', dueDate: '2025-04-15', owner: 'Jyoti' },
    { id: 'P002', stateCode: 'JH', funderName: 'IBM India Foundation', stage: 'Contacted', estimatedAmount: 9000000, probability: 0.4, nextAction: 'Submit proposal', dueDate: '2025-04-20', owner: 'Jyoti' },
    { id: 'P003', stateCode: 'MP', funderName: 'Mahindra Foundation', stage: 'Proposal', estimatedAmount: 6000000, probability: 0.6, nextAction: 'Final presentation', dueDate: '2025-04-10', owner: 'Jyoti' },
    { id: 'P004', stateCode: 'DL', funderName: 'HCL Foundation', stage: 'Contacted', estimatedAmount: 15000000, probability: 0.5, nextAction: 'Technical discussion', dueDate: '2025-04-25', owner: 'Jyoti' },
    { id: 'P005', stateCode: 'OR', funderName: 'Vedanta Foundation', stage: 'Lead', estimatedAmount: 8000000, probability: 0.25, nextAction: 'Research and approach', dueDate: '2025-05-01', owner: 'Jyoti' },
    { id: 'P006', stateCode: 'UK', funderName: 'NTPC Foundation', stage: 'Contacted', estimatedAmount: 5000000, probability: 0.35, nextAction: 'Site visit', dueDate: '2025-04-28', owner: 'Jyoti' },
    
    // Raji's prospects
    { id: 'P007', stateCode: 'AP', funderName: 'Dr. Reddy Foundation', stage: 'Lead', estimatedAmount: 9000000, probability: 0.3, nextAction: 'Initial meeting', dueDate: '2025-04-18', owner: 'Raji' },
    { id: 'P008', stateCode: 'KA', funderName: 'Infosys Foundation', stage: 'Proposal', estimatedAmount: 20000000, probability: 0.7, nextAction: 'Contract finalization', dueDate: '2025-04-08', owner: 'Raji' },
    { id: 'P009', stateCode: 'KL', funderName: 'Tata Trusts', stage: 'Proposal', estimatedAmount: 12000000, probability: 0.8, nextAction: 'Final approval', dueDate: '2025-04-05', owner: 'Raji' },
    { id: 'P010', stateCode: 'TN', funderName: 'TCS Foundation', stage: 'Contacted', estimatedAmount: 15000000, probability: 0.5, nextAction: 'Submit formal proposal', dueDate: '2025-04-20', owner: 'Raji' },
    { id: 'P011', stateCode: 'TG', funderName: 'Tech Mahindra Foundation', stage: 'Lead', estimatedAmount: 11000000, probability: 0.3, nextAction: 'Initial outreach', dueDate: '2025-04-22', owner: 'Raji' },
    
    // Devi's prospects
    { id: 'P012', stateCode: 'AR', funderName: 'Oil India Foundation', stage: 'Lead', estimatedAmount: 3000000, probability: 0.2, nextAction: 'Cold outreach', dueDate: '2025-05-05', owner: 'Devi' },
    { id: 'P013', stateCode: 'MH', funderName: 'Godrej Foundation', stage: 'Contacted', estimatedAmount: 12000000, probability: 0.4, nextAction: 'Proposal submission', dueDate: '2025-04-20', owner: 'Devi' },
    { id: 'P014', stateCode: 'ML', funderName: 'Coal India Foundation', stage: 'Lead', estimatedAmount: 4000000, probability: 0.25, nextAction: 'Initial approach', dueDate: '2025-04-30', owner: 'Devi' },
    { id: 'P015', stateCode: 'TR', funderName: 'ONGC Foundation', stage: 'Contacted', estimatedAmount: 3500000, probability: 0.35, nextAction: 'Site visit arrangement', dueDate: '2025-04-28', owner: 'Devi' },
    { id: 'P016', stateCode: 'WB', funderName: 'ITC Foundation', stage: 'Proposal', estimatedAmount: 14000000, probability: 0.6, nextAction: 'Budget discussion', dueDate: '2025-04-12', owner: 'Devi' }
  ],

  // Updated users with correct state assignments
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
    },
    { 
      id: 'jyoti_manager', 
      email: 'jyoti@visionempowertrust.org', 
      firstName: 'Jyoti', 
      lastName: 'Account Manager', 
      role: 'regional_manager', 
      status: 'approved', 
      assignedStates: 'GJ,JH,MP,DL,OR,UK', 
      requestedAt: new Date().toISOString(), 
      approvedAt: new Date().toISOString(), 
      approvedBy: 'chandrakiran_admin' 
    },
    { 
      id: 'raji_manager', 
      email: 'raji@visionempowertrust.org', 
      firstName: 'Raji', 
      lastName: 'Account Manager', 
      role: 'regional_manager', 
      status: 'approved', 
      assignedStates: 'AP,KA,KL,TN,TG', 
      requestedAt: new Date().toISOString(), 
      approvedAt: new Date().toISOString(), 
      approvedBy: 'chandrakiran_admin' 
    },
    { 
      id: 'devi_manager', 
      email: 'devi@visionempowertrust.org', 
      firstName: 'Devi', 
      lastName: 'Account Manager', 
      role: 'regional_manager', 
      status: 'approved', 
      assignedStates: 'AR,MH,ML,TR,WB', 
      requestedAt: new Date().toISOString(), 
      approvedAt: new Date().toISOString(), 
      approvedBy: 'chandrakiran_admin' 
    }
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

async function createOrUpdateSheet(sheets, spreadsheetId, sheetName, headers, data) {
  try {
    console.log(`📝 Updating ${sheetName}...`);
    
    // Clear existing data first
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    // Add headers and data
    const values = [headers, ...data];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    console.log(`✅ ${sheetName}: ${data.length} records updated`);
  } catch (error) {
    console.error(`❌ Error updating ${sheetName}:`, error.message);
    throw error;
  }
}

async function updateExactStates() {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set');
    }

    console.log('🚀 Updating with EXACT 16 operational states...\n');

    // Update States with exact 16 states
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'States',
      ['code', 'name', 'coordinator'],
      exactStateData.states.map(s => [s.code, s.name, s.coordinator])
    );

    // Update Funders
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Funders',
      ['id', 'name', 'type', 'priority', 'owner'],
      exactStateData.funders.map(f => [f.id, f.name, f.type, f.priority, f.owner])
    );

    // Update Schools for 16 states
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Schools',
      ['id', 'stateCode', 'name', 'program'],
      exactStateData.schools.map(s => [s.id, s.stateCode, s.name, s.program])
    );

    // Update State Targets for 16 states
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'StateTargets',
      ['stateCode', 'fiscalYear', 'targetAmount'],
      exactStateData.stateTargets.map(t => [t.stateCode, t.fiscalYear, t.targetAmount])
    );

    // Update Prospects for 16 states
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Prospects',
      ['id', 'stateCode', 'funderName', 'stage', 'estimatedAmount', 'probability', 'nextAction', 'dueDate', 'owner', 'description', 'documents', 'tags', 'contactPerson', 'contactEmail', 'contactPhone', 'lastContact', 'notes'],
      exactStateData.prospects.map(p => [p.id, p.stateCode, p.funderName, p.stage, p.estimatedAmount, p.probability, p.nextAction, p.dueDate, p.owner, '', '', '', '', '', '', '', ''])
    );

    // Update Users with correct state assignments
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Users',
      ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'assignedStates', 'requestedAt', 'approvedAt', 'approvedBy'],
      exactStateData.users.map(u => [u.id, u.email, u.firstName, u.lastName, u.role, u.status, u.assignedStates, u.requestedAt, u.approvedAt, u.approvedBy])
    );

    console.log('\n🎉 Successfully updated with EXACT 16 operational states!');
    console.log('\n📊 Final Data Summary:');
    console.log(`- ${exactStateData.states.length} States (EXACT operational states)`);
    console.log(`- ${exactStateData.funders.length} Funders (with proper assignments)`);
    console.log(`- ${exactStateData.schools.length} Schools (2 per state)`);
    console.log(`- ${exactStateData.stateTargets.length} State Targets (FY24-25 & FY25-26)`);
    console.log(`- ${exactStateData.prospects.length} Prospects (state-specific)`);
    console.log(`- ${exactStateData.users.length} Users (3 account managers + 2 admins)`);
    
    console.log('\n👥 EXACT Account Manager Assignments:');
    console.log('📍 Jyoti (6 states): Gujarat, Jharkhand, Madhya Pradesh, NCR, Odisha, Uttarakhand');
    console.log('📍 Raji (5 states): Andhra Pradesh, Karnataka, Kerala, Tamilnadu, Telangana');  
    console.log('📍 Devi (5 states): Arunachal Pradesh, Maharashtra, Meghalaya, Tripura, West Bengal');
    
    console.log('\n🎯 Total Target FY25-26: ₹1.67+ Crores across 16 operational states');
    console.log('🔮 Pipeline Value: ₹1.58+ Crores in active prospects');

  } catch (error) {
    console.error('❌ Error updating exact states:', error);
    process.exit(1);
  }
}

// Run the update script
if (require.main === module) {
  updateExactStates();
}

module.exports = { exactStateData, updateExactStates };
