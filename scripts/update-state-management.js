#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

// Updated state management structure with account managers and assigned funders
const stateManagementData = {
  states: [
    // Existing states with updated coordinators and expanded coverage
    { code: 'JH', name: 'Jharkhand', coordinator: 'Jyoti' },
    { code: 'KA', name: 'Karnataka', coordinator: 'Raji' },
    { code: 'KL', name: 'Kerala', coordinator: 'Raji' },
    { code: 'MP', name: 'Madhya Pradesh', coordinator: 'Jyoti' },
    { code: 'MH', name: 'Maharashtra', coordinator: 'Devi' },
    { code: 'ML', name: 'Meghalaya', coordinator: 'Devi' },
    { code: 'DL', name: 'Delhi (NCR)', coordinator: 'Jyoti' },
    { code: 'UP', name: 'Uttar Pradesh (NCR)', coordinator: 'Jyoti' },
    { code: 'HR', name: 'Haryana (NCR)', coordinator: 'Jyoti' },
    { code: 'OR', name: 'Odisha', coordinator: 'Jyoti' },
    { code: 'TN', name: 'Tamil Nadu', coordinator: 'Raji' },
    { code: 'TG', name: 'Telangana', coordinator: 'Raji' },
    { code: 'TR', name: 'Tripura', coordinator: 'Devi' },
    { code: 'UK', name: 'Uttarakhand', coordinator: 'Jyoti' },
    { code: 'WB', name: 'West Bengal', coordinator: 'Devi' },
    
    // Keep some existing states for historical data continuity
    { code: 'GJ', name: 'Gujarat', coordinator: 'Regional Manager' },
    { code: 'RJ', name: 'Rajasthan', coordinator: 'Regional Manager' },
    { code: 'AP', name: 'Andhra Pradesh', coordinator: 'Regional Manager' }
  ],

  // Updated funders with proper mapping
  funders: [
    // Microsoft ecosystem
    { id: 'F001', name: 'Microsoft India Corporation India Pvt Ltd', type: 'Corporate Foundation', priority: 'High', owner: 'Jyoti' },
    { id: 'F002', name: 'Microsoft-IDC', type: 'Corporate Foundation', priority: 'High', owner: 'Jyoti' },
    { id: 'F010', name: 'IIITB (Microsoft Support)', type: 'Educational Institution', priority: 'High', owner: 'Jyoti' },
    
    // BOSCH partnerships
    { id: 'F006', name: 'BOSCH', type: 'Corporate Foundation', priority: 'High', owner: 'Raji' },
    
    // Wipro ecosystem  
    { id: 'F008', name: 'Wipro Foundation', type: 'Corporate Foundation', priority: 'High', owner: 'Raji' },
    { id: 'F009', name: 'Wipro Earthian', type: 'Corporate Foundation', priority: 'Medium', owner: 'Raji' },
    
    // Cognizant Foundation network
    { id: 'F003', name: 'Cognizant Foundation-TN', type: 'Corporate Foundation', priority: 'High', owner: 'Raji' },
    { id: 'F004', name: 'Cognizant Foundation-Kerala', type: 'Corporate Foundation', priority: 'High', owner: 'Raji' },
    { id: 'F005', name: 'Cognizant Foundation-West Bengal', type: 'Corporate Foundation', priority: 'High', owner: 'Devi' },
    
    // BATA and CSGI
    { id: 'F013', name: 'BATA', type: 'Corporate Foundation', priority: 'Medium', owner: 'Devi' },
    { id: 'F021', name: 'CSGI', type: 'Corporate Foundation', priority: 'Medium', owner: 'Devi' },
    
    // Great Eastern (GE)
    { id: 'F014', name: 'Great Eastern', type: 'Corporate Foundation', priority: 'Medium', owner: 'Devi' },
    
    // State Bank of India Foundation
    { id: 'F007', name: 'SBIF', type: 'Corporate Foundation', priority: 'High', owner: 'Jyoti' },
    
    // Other existing funders
    { id: 'F011', name: 'Fidelity Business Service India Pvt Ltd', type: 'Corporate Foundation', priority: 'Medium', owner: 'Regional Manager' },
    { id: 'F012', name: 'Electrobit India Pvt Ltd', type: 'Corporate Foundation', priority: 'Medium', owner: 'Regional Manager' },
    { id: 'F015', name: 'The Madras Suspensions Pvt Ltd', type: 'Corporate Foundation', priority: 'Medium', owner: 'Raji' },
    { id: 'F016', name: 'Newtecpro', type: 'Corporate Foundation', priority: 'Medium', owner: 'Regional Manager' },
    { id: 'F017', name: 'Ametek', type: 'Corporate Foundation', priority: 'Low', owner: 'Regional Manager' },
    { id: 'F018', name: 'Vembi Technologies Pvt Ltd', type: 'Corporate Foundation', priority: 'Low', owner: 'Regional Manager' },
    { id: 'F019', name: 'Bentley Systems India Pvt Ltd', type: 'Corporate Foundation', priority: 'Low', owner: 'Regional Manager' },
    { id: 'F020', name: 'Individual Donations', type: 'Individual Donors', priority: 'Medium', owner: 'All Managers' }
  ],

  // Expanded school network
  schools: [
    // Jharkhand schools (Jyoti)
    { id: 'S101', stateCode: 'JH', name: 'Government High School Ranchi', program: 'Digital Learning' },
    { id: 'S102', stateCode: 'JH', name: 'Government Primary School Jamshedpur', program: 'STEM Education' },
    { id: 'S103', stateCode: 'JH', name: 'Government Higher Secondary School Dhanbad', program: 'Skill Development' },
    
    // Karnataka schools (Raji)
    { id: 'S001', stateCode: 'KA', name: 'Government High School Bangalore', program: 'Digital Learning' },
    { id: 'S002', stateCode: 'KA', name: 'Government Primary School Mysore', program: 'Basic Education' },
    { id: 'S003', stateCode: 'KA', name: 'Government Higher Primary School Hubli', program: 'STEM Education' },
    { id: 'S004', stateCode: 'KA', name: 'Government High School Mangalore', program: 'Vocational Training' },
    
    // Kerala schools (Raji)
    { id: 'S009', stateCode: 'KL', name: 'Government High School Kochi', program: 'Digital Learning' },
    { id: 'S010', stateCode: 'KL', name: 'Government Primary School Thiruvananthapuram', program: 'Basic Education' },
    { id: 'S011', stateCode: 'KL', name: 'Government Higher Primary School Kozhikode', program: 'STEM Education' },
    { id: 'S110', stateCode: 'KL', name: 'Government Vocational School Kannur', program: 'Skill Development' },
    
    // Madhya Pradesh schools (Jyoti)
    { id: 'S111', stateCode: 'MP', name: 'Government High School Bhopal', program: 'Digital Learning' },
    { id: 'S112', stateCode: 'MP', name: 'Government Primary School Indore', program: 'Basic Education' },
    { id: 'S113', stateCode: 'MP', name: 'Government Higher Secondary School Gwalior', program: 'STEM Education' },
    
    // Maharashtra schools (Devi)
    { id: 'S015', stateCode: 'MH', name: 'Government High School Mumbai', program: 'Digital Learning' },
    { id: 'S114', stateCode: 'MH', name: 'Government Primary School Pune', program: 'Basic Education' },
    { id: 'S115', stateCode: 'MH', name: 'Government Higher Secondary School Nagpur', program: 'Vocational Training' },
    
    // Meghalaya schools (Devi)
    { id: 'S116', stateCode: 'ML', name: 'Government High School Shillong', program: 'Digital Learning' },
    { id: 'S117', stateCode: 'ML', name: 'Government Primary School Tura', program: 'Basic Education' },
    
    // Delhi NCR schools (Jyoti)
    { id: 'S118', stateCode: 'DL', name: 'Government High School Delhi', program: 'Digital Learning' },
    { id: 'S119', stateCode: 'UP', name: 'Government Higher Secondary School Noida', program: 'STEM Education' },
    { id: 'S120', stateCode: 'HR', name: 'Government High School Gurgaon', program: 'Skill Development' },
    
    // Odisha schools (Jyoti)
    { id: 'S121', stateCode: 'OR', name: 'Government High School Bhubaneswar', program: 'Digital Learning' },
    { id: 'S122', stateCode: 'OR', name: 'Government Primary School Cuttack', program: 'Basic Education' },
    
    // Tamil Nadu schools (Raji)
    { id: 'S005', stateCode: 'TN', name: 'Government High School Chennai', program: 'Digital Learning' },
    { id: 'S006', stateCode: 'TN', name: 'Government Primary School Coimbatore', program: 'Basic Education' },
    { id: 'S007', stateCode: 'TN', name: 'Government Higher Primary School Madurai', program: 'STEM Education' },
    { id: 'S008', stateCode: 'TN', name: 'Government High School Salem', program: 'Skill Development' },
    
    // Telangana schools (Raji)
    { id: 'S017', stateCode: 'TG', name: 'Government High School Warangal', program: 'STEM Education' },
    { id: 'S123', stateCode: 'TG', name: 'Government High School Hyderabad', program: 'Digital Learning' },
    { id: 'S124', stateCode: 'TG', name: 'Government Primary School Nizamabad', program: 'Basic Education' },
    
    // Tripura schools (Devi)
    { id: 'S125', stateCode: 'TR', name: 'Government High School Agartala', program: 'Digital Learning' },
    { id: 'S126', stateCode: 'TR', name: 'Government Primary School Udaipur', program: 'Basic Education' },
    
    // Uttarakhand schools (Jyoti)
    { id: 'S127', stateCode: 'UK', name: 'Government High School Dehradun', program: 'Digital Learning' },
    { id: 'S128', stateCode: 'UK', name: 'Government Primary School Haridwar', program: 'Basic Education' },
    
    // West Bengal schools (Devi)
    { id: 'S012', stateCode: 'WB', name: 'Government High School Kolkata', program: 'Digital Learning' },
    { id: 'S013', stateCode: 'WB', name: 'Government Primary School Howrah', program: 'Basic Education' },
    { id: 'S014', stateCode: 'WB', name: 'Government Higher Primary School Durgapur', program: 'STEM Education' },
    { id: 'S129', stateCode: 'WB', name: 'Government Vocational School Siliguri', program: 'Skill Development' }
  ],

  // Updated state targets with new states
  stateTargets: [
    // FY24-25 targets for all states
    { stateCode: 'JH', fiscalYear: 'FY24-25', targetAmount: 8000000 },
    { stateCode: 'KA', fiscalYear: 'FY24-25', targetAmount: 40000000 },
    { stateCode: 'KL', fiscalYear: 'FY24-25', targetAmount: 12000000 },
    { stateCode: 'MP', fiscalYear: 'FY24-25', targetAmount: 5000000 },
    { stateCode: 'MH', fiscalYear: 'FY24-25', targetAmount: 8000000 },
    { stateCode: 'ML', fiscalYear: 'FY24-25', targetAmount: 3000000 },
    { stateCode: 'DL', fiscalYear: 'FY24-25', targetAmount: 6000000 },
    { stateCode: 'UP', fiscalYear: 'FY24-25', targetAmount: 8000000 },
    { stateCode: 'HR', fiscalYear: 'FY24-25', targetAmount: 5000000 },
    { stateCode: 'OR', fiscalYear: 'FY24-25', targetAmount: 7000000 },
    { stateCode: 'TN', fiscalYear: 'FY24-25', targetAmount: 15000000 },
    { stateCode: 'TG', fiscalYear: 'FY24-25', targetAmount: 10000000 },
    { stateCode: 'TR', fiscalYear: 'FY24-25', targetAmount: 2500000 },
    { stateCode: 'UK', fiscalYear: 'FY24-25', targetAmount: 4000000 },
    { stateCode: 'WB', fiscalYear: 'FY24-25', targetAmount: 12000000 },
    
    // FY25-26 targets
    { stateCode: 'JH', fiscalYear: 'FY25-26', targetAmount: 10000000 },
    { stateCode: 'KA', fiscalYear: 'FY25-26', targetAmount: 35000000 },
    { stateCode: 'KL', fiscalYear: 'FY25-26', targetAmount: 15000000 },
    { stateCode: 'MP', fiscalYear: 'FY25-26', targetAmount: 7000000 },
    { stateCode: 'MH', fiscalYear: 'FY25-26', targetAmount: 10000000 },
    { stateCode: 'ML', fiscalYear: 'FY25-26', targetAmount: 4000000 },
    { stateCode: 'DL', fiscalYear: 'FY25-26', targetAmount: 8000000 },
    { stateCode: 'UP', fiscalYear: 'FY25-26', targetAmount: 10000000 },
    { stateCode: 'HR', fiscalYear: 'FY25-26', targetAmount: 6000000 },
    { stateCode: 'OR', fiscalYear: 'FY25-26', targetAmount: 9000000 },
    { stateCode: 'TN', fiscalYear: 'FY25-26', targetAmount: 18000000 },
    { stateCode: 'TG', fiscalYear: 'FY25-26', targetAmount: 12000000 },
    { stateCode: 'TR', fiscalYear: 'FY25-26', targetAmount: 3000000 },
    { stateCode: 'UK', fiscalYear: 'FY25-26', targetAmount: 5000000 },
    { stateCode: 'WB', fiscalYear: 'FY25-26', targetAmount: 15000000 }
  ],

  // Updated prospects with state-specific assignments
  prospects: [
    // Jyoti's prospects
    { id: 'P001', stateCode: 'JH', funderName: 'IBM India Foundation', stage: 'Lead', estimatedAmount: 8000000, probability: 0.3, nextAction: 'Initial outreach meeting', dueDate: '2025-04-15', owner: 'Jyoti' },
    { id: 'P002', stateCode: 'MP', funderName: 'Mahindra Foundation', stage: 'Contacted', estimatedAmount: 6000000, probability: 0.4, nextAction: 'Submit proposal', dueDate: '2025-04-20', owner: 'Jyoti' },
    { id: 'P003', stateCode: 'DL', funderName: 'HCL Foundation', stage: 'Proposal', estimatedAmount: 10000000, probability: 0.6, nextAction: 'Final presentation', dueDate: '2025-04-10', owner: 'Jyoti' },
    { id: 'P004', stateCode: 'OR', funderName: 'Vedanta Foundation', stage: 'Contacted', estimatedAmount: 7000000, probability: 0.5, nextAction: 'Technical discussion', dueDate: '2025-04-25', owner: 'Jyoti' },
    { id: 'P005', stateCode: 'UK', funderName: 'NTPC Foundation', stage: 'Lead', estimatedAmount: 5000000, probability: 0.2, nextAction: 'Research and approach', dueDate: '2025-05-01', owner: 'Jyoti' },
    
    // Raji's prospects
    { id: 'P006', stateCode: 'KA', funderName: 'Infosys Foundation', stage: 'Proposal', estimatedAmount: 15000000, probability: 0.7, nextAction: 'Contract finalization', dueDate: '2025-04-08', owner: 'Raji' },
    { id: 'P007', stateCode: 'TN', funderName: 'TCS Foundation', stage: 'Contacted', estimatedAmount: 12000000, probability: 0.5, nextAction: 'Submit formal proposal', dueDate: '2025-04-18', owner: 'Raji' },
    { id: 'P008', stateCode: 'KL', funderName: 'Tata Trusts', stage: 'Proposal', estimatedAmount: 9000000, probability: 0.8, nextAction: 'Final approval', dueDate: '2025-04-05', owner: 'Raji' },
    { id: 'P009', stateCode: 'TG', funderName: 'Tech Mahindra Foundation', stage: 'Lead', estimatedAmount: 8000000, probability: 0.3, nextAction: 'Initial meeting', dueDate: '2025-04-22', owner: 'Raji' },
    
    // Devi's prospects
    { id: 'P010', stateCode: 'MH', funderName: 'Godrej Foundation', stage: 'Contacted', estimatedAmount: 10000000, probability: 0.4, nextAction: 'Proposal submission', dueDate: '2025-04-20', owner: 'Devi' },
    { id: 'P011', stateCode: 'WB', funderName: 'ITC Foundation', stage: 'Proposal', estimatedAmount: 11000000, probability: 0.6, nextAction: 'Budget discussion', dueDate: '2025-04-12', owner: 'Devi' },
    { id: 'P012', stateCode: 'ML', funderName: 'Coal India Foundation', stage: 'Lead', estimatedAmount: 4000000, probability: 0.25, nextAction: 'Cold outreach', dueDate: '2025-04-30', owner: 'Devi' },
    { id: 'P013', stateCode: 'TR', funderName: 'ONGC Foundation', stage: 'Contacted', estimatedAmount: 3500000, probability: 0.35, nextAction: 'Site visit arrangement', dueDate: '2025-04-28', owner: 'Devi' }
  ],

  // Updated users with proper role assignments
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
      assignedStates: 'JH,MP,DL,UP,HR,OR,UK', 
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
      assignedStates: 'KA,KL,TN,TG', 
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
      assignedStates: 'MH,ML,TR,WB', 
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

async function updateStateManagement() {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set');
    }

    console.log('🚀 Updating state management structure...\n');

    // Update States with new coordinators
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'States',
      ['code', 'name', 'coordinator'],
      stateManagementData.states.map(s => [s.code, s.name, s.coordinator])
    );

    // Update Funders with proper owner assignments
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Funders',
      ['id', 'name', 'type', 'priority', 'owner'],
      stateManagementData.funders.map(f => [f.id, f.name, f.type, f.priority, f.owner])
    );

    // Update Schools with expanded network
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Schools',
      ['id', 'stateCode', 'name', 'program'],
      stateManagementData.schools.map(s => [s.id, s.stateCode, s.name, s.program])
    );

    // Update State Targets for new states
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'StateTargets',
      ['stateCode', 'fiscalYear', 'targetAmount'],
      stateManagementData.stateTargets.map(t => [t.stateCode, t.fiscalYear, t.targetAmount])
    );

    // Update Prospects with state-specific assignments
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Prospects',
      ['id', 'stateCode', 'funderName', 'stage', 'estimatedAmount', 'probability', 'nextAction', 'dueDate', 'owner', 'description', 'documents', 'tags', 'contactPerson', 'contactEmail', 'contactPhone', 'lastContact', 'notes'],
      stateManagementData.prospects.map(p => [p.id, p.stateCode, p.funderName, p.stage, p.estimatedAmount, p.probability, p.nextAction, p.dueDate, p.owner, '', '', '', '', '', '', '', ''])
    );

    // Update Users with account managers
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Users',
      ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'assignedStates', 'requestedAt', 'approvedAt', 'approvedBy'],
      stateManagementData.users.map(u => [u.id, u.email, u.firstName, u.lastName, u.role, u.status, u.assignedStates, u.requestedAt, u.approvedAt, u.approvedBy])
    );

    console.log('\n🎉 Successfully updated state management structure!');
    console.log('\n📊 Updated Data Summary:');
    console.log(`- ${stateManagementData.states.length} States (15+ states with dedicated coordinators)`);
    console.log(`- ${stateManagementData.funders.length} Funders (with proper owner assignments)`);
    console.log(`- ${stateManagementData.schools.length} Schools (expanded network)`);
    console.log(`- ${stateManagementData.stateTargets.length} State Targets (FY24-25 & FY25-26)`);
    console.log(`- ${stateManagementData.prospects.length} Prospects (assigned to account managers)`);
    console.log(`- ${stateManagementData.users.length} Users (3 account managers + 2 admins)`);
    
    console.log('\n👥 Account Manager Assignments:');
    console.log('📍 Jyoti: Jharkhand, Madhya Pradesh, Delhi NCR (DL/UP/HR), Odisha, Uttarakhand');
    console.log('📍 Raji: Karnataka, Kerala, Tamil Nadu, Telangana');  
    console.log('📍 Devi: Maharashtra, Meghalaya, Tripura, West Bengal');
    
    console.log('\n🏢 Key Funder Assignments:');
    console.log('• Microsoft ecosystem (IIIT-B) → Jyoti (Jharkhand)');
    console.log('• BOSCH → Raji (Karnataka, Telangana)');
    console.log('• Wipro & Cognizant Foundation → Raji (Kerala, TN)');
    console.log('• BATA & CSGI → Devi (Maharashtra)');
    console.log('• Great Eastern (GE) → Devi (Meghalaya, Tripura)');
    console.log('• SBIF → Jyoti (Odisha)');
    console.log('• Cognizant Foundation → Devi (West Bengal)');

  } catch (error) {
    console.error('❌ Error updating state management:', error);
    process.exit(1);
  }
}

// Run the update script
if (require.main === module) {
  updateStateManagement();
}

module.exports = { stateManagementData, updateStateManagement };
