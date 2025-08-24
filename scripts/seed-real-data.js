#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

// Real historical data for Vision Empower Trust (2018-2026)
const realData = {
  funders: [
    // Major Corporate Funders
    { id: 'F001', name: 'Microsoft India Corporation India Pvt Ltd', type: 'Corporate Foundation', priority: 'High', owner: 'Chandrakiran HJ' },
    { id: 'F002', name: 'Microsoft-IDC', type: 'Corporate Foundation', priority: 'High', owner: 'Chandrakiran HJ' },
    { id: 'F003', name: 'Cognizant Foundation-TN', type: 'Corporate Foundation', priority: 'High', owner: 'Regional Manager TN' },
    { id: 'F004', name: 'Cognizant-Kerala', type: 'Corporate Foundation', priority: 'High', owner: 'Regional Manager KL' },
    { id: 'F005', name: 'Cognizant-West Bengal', type: 'Corporate Foundation', priority: 'High', owner: 'Regional Manager WB' },
    { id: 'F006', name: 'BOSCH', type: 'Corporate Foundation', priority: 'High', owner: 'Chandrakiran HJ' },
    { id: 'F007', name: 'SBIF', type: 'Corporate Foundation', priority: 'High', owner: 'Chandrakiran HJ' },
    { id: 'F008', name: 'Wipro Foundation', type: 'Corporate Foundation', priority: 'Medium', owner: 'Chandrakiran HJ' },
    { id: 'F009', name: 'Wipro Earthian', type: 'Corporate Foundation', priority: 'Medium', owner: 'Chandrakiran HJ' },
    { id: 'F010', name: 'IIITB', type: 'Educational Institution', priority: 'Medium', owner: 'Chandrakiran HJ' },
    { id: 'F011', name: 'Fidelity Business Service India Pvt Ltd', type: 'Corporate Foundation', priority: 'Medium', owner: 'Chandrakiran HJ' },
    { id: 'F012', name: 'Electrobit India Pvt Ltd', type: 'Corporate Foundation', priority: 'Medium', owner: 'Chandrakiran HJ' },
    { id: 'F013', name: 'BATA', type: 'Corporate Foundation', priority: 'Medium', owner: 'Chandrakiran HJ' },
    { id: 'F014', name: 'Great Eastern', type: 'Corporate Foundation', priority: 'Medium', owner: 'Chandrakiran HJ' },
    { id: 'F015', name: 'The Madras Suspensions Pvt Ltd', type: 'Corporate Foundation', priority: 'Medium', owner: 'Regional Manager TN' },
    { id: 'F016', name: 'Newtecpro', type: 'Corporate Foundation', priority: 'Medium', owner: 'Chandrakiran HJ' },
    { id: 'F017', name: 'Ametek', type: 'Corporate Foundation', priority: 'Low', owner: 'Chandrakiran HJ' },
    { id: 'F018', name: 'Vembi Technologies Pvt Ltd', type: 'Corporate Foundation', priority: 'Low', owner: 'Chandrakiran HJ' },
    { id: 'F019', name: 'Bentley Systems India Pvt Ltd', type: 'Corporate Foundation', priority: 'Low', owner: 'Chandrakiran HJ' },
    { id: 'F020', name: 'Individual Donations', type: 'Individual Donors', priority: 'Medium', owner: 'Chandrakiran HJ' }
  ],

  states: [
    { code: 'KA', name: 'Karnataka', coordinator: 'Lakshmi Nair' },
    { code: 'TN', name: 'Tamil Nadu', coordinator: 'Karthik Raman' },
    { code: 'KL', name: 'Kerala', coordinator: 'Priya Menon' },
    { code: 'WB', name: 'West Bengal', coordinator: 'Abhijit Das' },
    { code: 'MH', name: 'Maharashtra', coordinator: 'Deepak Patil' },
    { code: 'AP', name: 'Andhra Pradesh', coordinator: 'Srinivas Reddy' },
    { code: 'TG', name: 'Telangana', coordinator: 'Madhavi Rao' },
    { code: 'GJ', name: 'Gujarat', coordinator: 'Bharat Shah' },
    { code: 'RJ', name: 'Rajasthan', coordinator: 'Pooja Jain' },
    { code: 'UP', name: 'Uttar Pradesh', coordinator: 'Arjun Singh' }
  ],

  schools: [
    // Karnataka schools
    { id: 'S001', stateCode: 'KA', name: 'Government High School Bangalore', program: 'Digital Learning' },
    { id: 'S002', stateCode: 'KA', name: 'Government Primary School Mysore', program: 'Basic Education' },
    { id: 'S003', stateCode: 'KA', name: 'Government Higher Primary School Hubli', program: 'STEM Education' },
    { id: 'S004', stateCode: 'KA', name: 'Government High School Mangalore', program: 'Vocational Training' },
    
    // Tamil Nadu schools
    { id: 'S005', stateCode: 'TN', name: 'Government High School Chennai', program: 'Digital Learning' },
    { id: 'S006', stateCode: 'TN', name: 'Government Primary School Coimbatore', program: 'Basic Education' },
    { id: 'S007', stateCode: 'TN', name: 'Government Higher Primary School Madurai', program: 'STEM Education' },
    { id: 'S008', stateCode: 'TN', name: 'Government High School Salem', program: 'Skill Development' },
    
    // Kerala schools
    { id: 'S009', stateCode: 'KL', name: 'Government High School Kochi', program: 'Digital Learning' },
    { id: 'S010', stateCode: 'KL', name: 'Government Primary School Thiruvananthapuram', program: 'Basic Education' },
    { id: 'S011', stateCode: 'KL', name: 'Government Higher Primary School Kozhikode', program: 'STEM Education' },
    
    // West Bengal schools
    { id: 'S012', stateCode: 'WB', name: 'Government High School Kolkata', program: 'Digital Learning' },
    { id: 'S013', stateCode: 'WB', name: 'Government Primary School Howrah', program: 'Basic Education' },
    { id: 'S014', stateCode: 'WB', name: 'Government Higher Primary School Durgapur', program: 'STEM Education' },
    
    // Other state schools
    { id: 'S015', stateCode: 'MH', name: 'Government High School Mumbai', program: 'Digital Learning' },
    { id: 'S016', stateCode: 'AP', name: 'Government High School Hyderabad', program: 'Digital Learning' },
    { id: 'S017', stateCode: 'TG', name: 'Government High School Warangal', program: 'STEM Education' },
    { id: 'S018', stateCode: 'GJ', name: 'Government High School Ahmedabad', program: 'Skill Development' }
  ],

  // Historical state targets (estimated based on actual contributions)
  stateTargets: [
    // FY18-19 targets
    { stateCode: 'KA', fiscalYear: 'FY18-19', targetAmount: 300000 },
    { stateCode: 'TN', fiscalYear: 'FY18-19', targetAmount: 100000 },
    
    // FY19-20 targets
    { stateCode: 'KA', fiscalYear: 'FY19-20', targetAmount: 2000000 },
    { stateCode: 'TN', fiscalYear: 'FY19-20', targetAmount: 1500000 },
    { stateCode: 'MH', fiscalYear: 'FY19-20', targetAmount: 1000000 },
    
    // FY20-21 targets
    { stateCode: 'KA', fiscalYear: 'FY20-21', targetAmount: 3000000 },
    { stateCode: 'TN', fiscalYear: 'FY20-21', targetAmount: 2500000 },
    { stateCode: 'MH', fiscalYear: 'FY20-21', targetAmount: 1000000 },
    
    // FY21-22 targets
    { stateCode: 'KA', fiscalYear: 'FY21-22', targetAmount: 8000000 },
    { stateCode: 'TN', fiscalYear: 'FY21-22', targetAmount: 5000000 },
    { stateCode: 'MH', fiscalYear: 'FY21-22', targetAmount: 2000000 },
    
    // FY22-23 targets
    { stateCode: 'KA', fiscalYear: 'FY22-23', targetAmount: 20000000 },
    { stateCode: 'TN', fiscalYear: 'FY22-23', targetAmount: 15000000 },
    { stateCode: 'KL', fiscalYear: 'FY22-23', targetAmount: 5000000 },
    { stateCode: 'MH', fiscalYear: 'FY22-23', targetAmount: 5000000 },
    
    // FY23-24 targets
    { stateCode: 'KA', fiscalYear: 'FY23-24', targetAmount: 18000000 },
    { stateCode: 'TN', fiscalYear: 'FY23-24', targetAmount: 12000000 },
    { stateCode: 'KL', fiscalYear: 'FY23-24', targetAmount: 8000000 },
    { stateCode: 'WB', fiscalYear: 'FY23-24', targetAmount: 4000000 },
    { stateCode: 'MH', fiscalYear: 'FY23-24', targetAmount: 3000000 },
    
    // FY24-25 targets
    { stateCode: 'KA', fiscalYear: 'FY24-25', targetAmount: 25000000 },
    { stateCode: 'TN', fiscalYear: 'FY24-25', targetAmount: 15000000 },
    { stateCode: 'KL', fiscalYear: 'FY24-25', targetAmount: 10000000 },
    { stateCode: 'WB', fiscalYear: 'FY24-25', targetAmount: 8000000 },
    { stateCode: 'MH', fiscalYear: 'FY24-25', targetAmount: 5000000 },
    
    // FY25-26 targets
    { stateCode: 'KA', fiscalYear: 'FY25-26', targetAmount: 20000000 },
    { stateCode: 'TN', fiscalYear: 'FY25-26', targetAmount: 12000000 },
    { stateCode: 'KL', fiscalYear: 'FY25-26', targetAmount: 8000000 },
    { stateCode: 'WB', fiscalYear: 'FY25-26', targetAmount: 6000000 },
    { stateCode: 'MH', fiscalYear: 'FY25-26', targetAmount: 4000000 }
  ],

  // Real historical contributions data
  contributions: [
    // FY18-19 contributions (₹405,269.15 total)
    { id: 'C001', funderId: 'F012', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY18-19', date: '2018-06-15', initiative: 'Digital Learning Setup', amount: 121000 },
    { id: 'C002', funderId: 'F020', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY18-19', date: '2018-12-31', initiative: 'Community Support', amount: 284269.15 },

    // FY19-20 contributions (₹4,078,627.00 total)
    { id: 'C003', funderId: 'F011', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY19-20', date: '2019-07-20', initiative: 'Digital Infrastructure', amount: 1310000 },
    { id: 'C004', funderId: 'F001', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY19-20', date: '2019-09-15', initiative: 'STEM Education', amount: 1395000 },
    { id: 'C005', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY19-20', date: '2019-11-10', initiative: 'Teacher Training', amount: 1225125 },
    { id: 'C006', funderId: 'F020', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY19-20', date: '2019-12-31', initiative: 'Community Support', amount: 148502 },

    // FY20-21 contributions (₹6,174,632.00 total)
    { id: 'C007', funderId: 'F012', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY20-21', date: '2020-06-15', initiative: 'Digital Learning Expansion', amount: 500000 },
    { id: 'C008', funderId: 'F001', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY20-21', date: '2020-08-20', initiative: 'Remote Learning', amount: 3762151 },
    { id: 'C009', funderId: 'F008', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY20-21', date: '2020-10-12', initiative: 'Education Support', amount: 600000 },
    { id: 'C010', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY20-21', date: '2020-12-05', initiative: 'Infrastructure', amount: 1167480 },
    { id: 'C011', funderId: 'F020', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY20-21', date: '2020-12-31', initiative: 'Community Support', amount: 145001 },

    // FY21-22 contributions (₹14,132,096.00 total)
    { id: 'C012', funderId: 'F001', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY21-22', date: '2021-07-15', initiative: 'Digital Transformation', amount: 9846000 },
    { id: 'C013', funderId: 'F008', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY21-22', date: '2021-09-20', initiative: 'Teacher Development', amount: 3562500 },
    { id: 'C014', funderId: 'F010', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY21-22', date: '2021-11-10', initiative: 'Research Collaboration', amount: 423095 },
    { id: 'C015', funderId: 'F020', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY21-22', date: '2021-12-31', initiative: 'Community Support', amount: 300501 },

    // FY22-23 contributions (₹44,110,691.00 total)
    { id: 'C016', funderId: 'F001', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY22-23', date: '2022-06-20', initiative: 'AI in Education', amount: 16592000 },
    { id: 'C017', funderId: 'F008', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY22-23', date: '2022-08-15', initiative: 'Sustainability Education', amount: 2850000 },
    { id: 'C018', funderId: 'F010', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY22-23', date: '2022-09-10', initiative: 'Innovation Lab', amount: 500000 },
    { id: 'C019', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY22-23', date: '2022-10-25', initiative: 'Cloud Infrastructure', amount: 15920500 },
    { id: 'C020', funderId: 'F003', stateCode: 'TN', schoolId: 'S006', fiscalYear: 'FY22-23', date: '2022-11-12', initiative: 'Digital Skills', amount: 4896620 },
    { id: 'C021', funderId: 'F004', stateCode: 'KL', schoolId: 'S009', fiscalYear: 'FY22-23', date: '2022-12-08', initiative: 'Tech Education', amount: 654000 },
    { id: 'C022', funderId: 'F017', stateCode: 'MH', schoolId: 'S015', fiscalYear: 'FY22-23', date: '2023-01-15', initiative: 'STEM Program', amount: 200000 },
    { id: 'C023', funderId: 'F018', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY22-23', date: '2023-02-20', initiative: 'EdTech Solutions', amount: 844000 },
    { id: 'C024', funderId: 'F019', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY22-23', date: '2023-03-10', initiative: 'Software Training', amount: 485100 },
    { id: 'C025', funderId: 'F020', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY22-23', date: '2023-03-31', initiative: 'Community Support', amount: 168471 },

    // FY23-24 contributions (₹41,004,954.60 total)
    { id: 'C026', funderId: 'F001', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY23-24', date: '2023-07-15', initiative: 'Next-Gen Learning', amount: 9105231 },
    { id: 'C027', funderId: 'F008', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY23-24', date: '2023-08-20', initiative: 'Green Education', amount: 1300000 },
    { id: 'C028', funderId: 'F010', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY23-24', date: '2023-09-12', initiative: 'Research Excellence', amount: 500000 },
    { id: 'C029', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY23-24', date: '2023-10-18', initiative: 'Digital Innovation', amount: 9153231 },
    { id: 'C030', funderId: 'F003', stateCode: 'TN', schoolId: 'S006', fiscalYear: 'FY23-24', date: '2023-11-25', initiative: 'Skill Enhancement', amount: 6464509 },
    { id: 'C031', funderId: 'F004', stateCode: 'KL', schoolId: 'S009', fiscalYear: 'FY23-24', date: '2023-12-08', initiative: 'Future Skills', amount: 1761519 },
    { id: 'C032', funderId: 'F013', stateCode: 'MH', schoolId: 'S015', fiscalYear: 'FY23-24', date: '2024-01-15', initiative: 'Industry Connect', amount: 1200000 },
    { id: 'C033', funderId: 'F005', stateCode: 'WB', schoolId: 'S012', fiscalYear: 'FY23-24', date: '2024-02-20', initiative: 'Tech for All', amount: 3700000 },
    { id: 'C034', funderId: 'F014', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY23-24', date: '2024-03-10', initiative: 'Financial Literacy', amount: 4000000 },
    { id: 'C035', funderId: 'F020', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY23-24', date: '2024-03-31', initiative: 'Community Support', amount: 3864464.60 },

    // FY24-25 contributions (₹68,049,301.31 total)
    { id: 'C036', funderId: 'F001', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY24-25', date: '2024-06-20', initiative: 'AI-Powered Learning', amount: 4774500 },
    { id: 'C037', funderId: 'F010', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY24-25', date: '2024-07-15', initiative: 'Innovation Hub', amount: 4191000 },
    { id: 'C038', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY24-25', date: '2024-08-12', initiative: 'Cloud Excellence', amount: 10500000 },
    { id: 'C039', funderId: 'F003', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY24-25', date: '2024-09-18', initiative: 'Digital Mastery', amount: 6633391 },
    { id: 'C040', funderId: 'F004', stateCode: 'KL', schoolId: 'S009', fiscalYear: 'FY24-25', date: '2024-10-25', initiative: 'Tech Leadership', amount: 6771300 },
    { id: 'C041', funderId: 'F013', stateCode: 'MH', schoolId: 'S015', fiscalYear: 'FY24-25', date: '2024-11-08', initiative: 'Career Readiness', amount: 1995000 },
    { id: 'C042', funderId: 'F014', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY24-25', date: '2024-12-15', initiative: 'Financial Education', amount: 4000000 },
    { id: 'C043', funderId: 'F015', stateCode: 'TN', schoolId: 'S007', fiscalYear: 'FY24-25', date: '2025-01-20', initiative: 'Manufacturing Skills', amount: 1400000 },
    { id: 'C044', funderId: 'F009', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY24-25', date: '2025-02-10', initiative: 'Environmental Education', amount: 1500000 },
    { id: 'C045', funderId: 'F006', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY24-25', date: '2025-02-25', initiative: 'Engineering Excellence', amount: 15817200 },
    { id: 'C046', funderId: 'F007', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY24-25', date: '2025-03-15', initiative: 'Social Impact', amount: 10741000 },
    { id: 'C047', funderId: 'F020', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY24-25', date: '2025-03-31', initiative: 'Community Support', amount: 4632407.31 },

    // FY25-26 contributions (₹35,297,137.65 total)
    { id: 'C048', funderId: 'F001', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY25-26', date: '2025-06-15', initiative: 'Advanced AI Learning', amount: 793800 },
    { id: 'C049', funderId: 'F010', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY25-26', date: '2025-07-20', initiative: 'Research Innovation', amount: 400000 },
    { id: 'C050', funderId: 'F002', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY25-26', date: '2025-08-18', initiative: 'Digital Transformation', amount: 2400000 },
    { id: 'C051', funderId: 'F003', stateCode: 'TN', schoolId: 'S005', fiscalYear: 'FY25-26', date: '2025-09-25', initiative: 'Future Workforce', amount: 4796000 },
    { id: 'C052', funderId: 'F004', stateCode: 'KL', schoolId: 'S009', fiscalYear: 'FY25-26', date: '2025-10-12', initiative: 'Innovation Lab', amount: 4386465 },
    { id: 'C053', funderId: 'F013', stateCode: 'MH', schoolId: 'S015', fiscalYear: 'FY25-26', date: '2025-11-08', initiative: 'Industry 4.0', amount: 632000 },
    { id: 'C054', funderId: 'F015', stateCode: 'TN', schoolId: 'S007', fiscalYear: 'FY25-26', date: '2025-12-20', initiative: 'Advanced Manufacturing', amount: 2535340 },
    { id: 'C055', funderId: 'F006', stateCode: 'KA', schoolId: 'S001', fiscalYear: 'FY25-26', date: '2026-01-15', initiative: 'Smart Manufacturing', amount: 10354050 },
    { id: 'C056', funderId: 'F007', stateCode: 'KA', schoolId: 'S002', fiscalYear: 'FY25-26', date: '2026-02-10', initiative: 'Social Innovation', amount: 5354500 },
    { id: 'C057', funderId: 'F016', stateCode: 'KA', schoolId: 'S003', fiscalYear: 'FY25-26', date: '2026-03-05', initiative: 'Tech Solutions', amount: 2500000 },
    { id: 'C058', funderId: 'F020', stateCode: 'KA', schoolId: 'S004', fiscalYear: 'FY25-26', date: '2026-03-31', initiative: 'Community Support', amount: 645682.65 }
  ],

  // Future prospects based on current trends
  prospects: [
    { id: 'P001', stateCode: 'KA', funderName: 'Infosys Foundation', stage: 'Lead', estimatedAmount: 15000000, probability: 0.3, nextAction: 'Initial outreach meeting', dueDate: '2025-04-15', owner: 'Chandrakiran HJ' },
    { id: 'P002', stateCode: 'TN', funderName: 'TCS Foundation', stage: 'Contacted', estimatedAmount: 12000000, probability: 0.5, nextAction: 'Submit formal proposal', dueDate: '2025-04-20', owner: 'Regional Manager TN' },
    { id: 'P003', stateCode: 'KL', funderName: 'Tata Trusts', stage: 'Proposal', estimatedAmount: 8000000, probability: 0.7, nextAction: 'Final presentation', dueDate: '2025-04-10', owner: 'Regional Manager KL' },
    { id: 'P004', stateCode: 'WB', funderName: 'Accenture Foundation', stage: 'Contacted', estimatedAmount: 10000000, probability: 0.4, nextAction: 'Technical discussion', dueDate: '2025-04-25', owner: 'Regional Manager WB' },
    { id: 'P005', stateCode: 'KA', funderName: 'HCL Foundation', stage: 'Lead', estimatedAmount: 6000000, probability: 0.2, nextAction: 'Research and approach', dueDate: '2025-05-01', owner: 'Chandrakiran HJ' },
    { id: 'P006', stateCode: 'TN', funderName: 'L&T Foundation', stage: 'Proposal', estimatedAmount: 9000000, probability: 0.6, nextAction: 'Budget finalization', dueDate: '2025-04-18', owner: 'Regional Manager TN' },
    { id: 'P007', stateCode: 'KA', funderName: 'Flipkart Foundation', stage: 'Contacted', estimatedAmount: 7500000, probability: 0.45, nextAction: 'Pilot project discussion', dueDate: '2025-04-22', owner: 'Chandrakiran HJ' },
    { id: 'P008', stateCode: 'MH', funderName: 'Mahindra Foundation', stage: 'Lead', estimatedAmount: 5000000, probability: 0.25, nextAction: 'Cold outreach', dueDate: '2025-05-05', owner: 'Regional Manager MH' }
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
    console.log(`📝 Processing ${sheetName}...`);
    
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

    console.log(`✅ ${sheetName}: ${data.length} records added`);
  } catch (error) {
    console.error(`❌ Error updating ${sheetName}:`, error.message);
    throw error;
  }
}

async function seedRealData() {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set');
    }

    console.log('🚀 Starting to seed Google Sheets with REAL historical data (2018-2026)...\n');

    // Seed Funders
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Funders',
      ['id', 'name', 'type', 'priority', 'owner'],
      realData.funders.map(f => [f.id, f.name, f.type, f.priority, f.owner])
    );

    // Seed States
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'States',
      ['code', 'name', 'coordinator'],
      realData.states.map(s => [s.code, s.name, s.coordinator])
    );

    // Seed Schools
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Schools',
      ['id', 'stateCode', 'name', 'program'],
      realData.schools.map(s => [s.id, s.stateCode, s.name, s.program])
    );

    // Seed State Targets
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'StateTargets',
      ['stateCode', 'fiscalYear', 'targetAmount'],
      realData.stateTargets.map(t => [t.stateCode, t.fiscalYear, t.targetAmount])
    );

    // Seed Contributions (REAL HISTORICAL DATA)
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Contributions',
      ['id', 'funderId', 'stateCode', 'schoolId', 'fiscalYear', 'date', 'initiative', 'amount'],
      realData.contributions.map(c => [c.id, c.funderId, c.stateCode, c.schoolId, c.fiscalYear, c.date, c.initiative, c.amount])
    );

    // Seed Prospects (Extended fields)
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Prospects',
      ['id', 'stateCode', 'funderName', 'stage', 'estimatedAmount', 'probability', 'nextAction', 'dueDate', 'owner', 'description', 'documents', 'tags', 'contactPerson', 'contactEmail', 'contactPhone', 'lastContact', 'notes'],
      realData.prospects.map(p => [p.id, p.stateCode, p.funderName, p.stage, p.estimatedAmount, p.probability, p.nextAction, p.dueDate, p.owner, '', '', '', '', '', '', '', ''])
    );

    // Seed Users
    await createOrUpdateSheet(
      sheets,
      spreadsheetId,
      'Users',
      ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'assignedStates', 'requestedAt', 'approvedAt', 'approvedBy'],
      realData.users.map(u => [u.id, u.email, u.firstName, u.lastName, u.role, u.status, u.assignedStates, u.requestedAt, u.approvedAt, u.approvedBy])
    );

    console.log('\n🎉 Successfully seeded all sheets with REAL historical data!');
    console.log('\n📊 Data Summary:');
    console.log(`- ${realData.funders.length} Real Funders (Microsoft, Cognizant, BOSCH, etc.)`);
    console.log(`- ${realData.states.length} States`);
    console.log(`- ${realData.schools.length} Schools`);
    console.log(`- ${realData.stateTargets.length} State Targets (FY18-19 to FY25-26)`);
    console.log(`- ${realData.contributions.length} REAL Contributions (FY18-19 to FY25-26)`);
    console.log(`- ${realData.prospects.length} Future Prospects`);
    console.log(`- ${realData.users.length} Users`);
    
    // Calculate historical totals
    const fyTotals = {};
    realData.contributions.forEach(c => {
      if (!fyTotals[c.fiscalYear]) fyTotals[c.fiscalYear] = 0;
      fyTotals[c.fiscalYear] += c.amount;
    });
    
    console.log('\n💰 Historical Funding Summary:');
    Object.entries(fyTotals).sort().forEach(([fy, total]) => {
      console.log(`- ${fy}: ₹${(total / 10000000).toFixed(2)} crores (₹${total.toLocaleString('en-IN')})`);
    });

    const grandTotal = Object.values(fyTotals).reduce((sum, val) => sum + val, 0);
    console.log(`\n🏆 TOTAL HISTORICAL FUNDING: ₹${(grandTotal / 10000000).toFixed(2)} crores`);
    console.log(`   (₹${grandTotal.toLocaleString('en-IN')})`);

    const currentPipeline = realData.prospects.reduce((sum, p) => sum + p.estimatedAmount, 0);
    console.log(`\n🔮 Future Pipeline: ₹${(currentPipeline / 10000000).toFixed(2)} crores`);

  } catch (error) {
    console.error('❌ Error seeding Google Sheets:', error);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  seedRealData();
}

module.exports = { realData, seedRealData };
