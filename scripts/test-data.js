const { sampleData } = require('./seed-sheets.js');

console.log('🎯 VE Funds - Sample Data Structure\n');

console.log('📊 Data Summary:');
console.log(`- ${sampleData.funders.length} Funders`);
console.log(`- ${sampleData.states.length} States`);
console.log(`- ${sampleData.schools.length} Schools`);
console.log(`- ${sampleData.stateTargets.length} State Targets`);
console.log(`- ${sampleData.contributions.length} Contributions`);
console.log(`- ${sampleData.prospects.length} Prospects\n`);

// Calculate totals
const totalTarget = sampleData.stateTargets.filter(t => t.fiscalYear === 'FY24-25').reduce((sum, t) => sum + t.targetAmount, 0);
const totalSecured = sampleData.contributions.filter(c => c.fiscalYear === 'FY24-25').reduce((sum, c) => sum + c.amount, 0);
const totalPipeline = sampleData.prospects.reduce((sum, p) => sum + p.estimatedAmount, 0);
const weightedPipeline = sampleData.prospects.reduce((sum, p) => sum + p.estimatedAmount * (p.probability || 0), 0);

console.log('💰 FY24-25 Financial Summary:');
console.log(`- Target: ₹${(totalTarget / 10000000).toFixed(1)} crores (${totalTarget.toLocaleString('en-IN')})`);
console.log(`- Secured: ₹${(totalSecured / 10000000).toFixed(1)} crores (${totalSecured.toLocaleString('en-IN')})`);
console.log(`- Achievement: ${((totalSecured / totalTarget) * 100).toFixed(1)}%`);
console.log(`- Shortfall: ₹${((totalTarget - totalSecured) / 10000000).toFixed(1)} crores`);
console.log(`- Pipeline: ₹${(totalPipeline / 10000000).toFixed(1)} crores`);
console.log(`- Weighted Pipeline: ₹${(weightedPipeline / 10000000).toFixed(1)} crores\n`);

console.log('🏢 Sample Funders:');
sampleData.funders.slice(0, 5).forEach(f => {
  console.log(`- ${f.name} (${f.type}) - Priority: ${f.priority}, Owner: ${f.owner}`);
});

console.log('\n🗺️ Sample States:');
sampleData.states.forEach(s => {
  const stateTarget = sampleData.stateTargets.find(t => t.stateCode === s.code && t.fiscalYear === 'FY24-25');
  const stateContribs = sampleData.contributions.filter(c => c.stateCode === s.code && c.fiscalYear === 'FY24-25');
  const secured = stateContribs.reduce((sum, c) => sum + c.amount, 0);
  const target = stateTarget ? stateTarget.targetAmount : 0;
  const achievement = target > 0 ? ((secured / target) * 100).toFixed(1) : 0;
  
  console.log(`- ${s.name} (${s.code}): ${achievement}% achieved (₹${(secured / 10000000).toFixed(1)}/${(target / 10000000).toFixed(1)} cr) - ${s.coordinator}`);
});

console.log('\n🏫 Schools by State:');
const schoolsByState = sampleData.schools.reduce((acc, school) => {
  if (!acc[school.stateCode]) acc[school.stateCode] = [];
  acc[school.stateCode].push(school);
  return acc;
}, {});

Object.entries(schoolsByState).forEach(([stateCode, schools]) => {
  const state = sampleData.states.find(s => s.code === stateCode);
  console.log(`- ${state?.name || stateCode}: ${schools.length} schools`);
});

console.log('\n📈 Pipeline by Stage:');
const pipelineByStage = ['Lead', 'Contacted', 'Proposal', 'Committed'].map(stage => {
  const stageProspects = sampleData.prospects.filter(p => p.stage === stage);
  const stageValue = stageProspects.reduce((sum, p) => sum + p.estimatedAmount, 0);
  const avgProb = stageProspects.length > 0 ? 
    stageProspects.reduce((sum, p) => sum + (p.probability || 0), 0) / stageProspects.length : 0;
  
  return {
    stage,
    count: stageProspects.length,
    value: stageValue,
    avgProbability: avgProb
  };
});

pipelineByStage.forEach(stage => {
  console.log(`- ${stage.stage}: ${stage.count} prospects, ₹${(stage.value / 10000000).toFixed(1)} cr, ${(stage.avgProbability * 100).toFixed(0)}% avg probability`);
});

console.log('\n📋 Google Sheets Structure Required:');
console.log('Create the following tabs in your Google Sheet:');
console.log('1. Funders - Columns: id, name, type, priority, owner');
console.log('2. States - Columns: code, name, coordinator'); 
console.log('3. Schools - Columns: id, stateCode, name, program');
console.log('4. StateTargets - Columns: stateCode, fiscalYear, targetAmount');
console.log('5. Contributions - Columns: id, funderId, stateCode, schoolId, fiscalYear, date, initiative, amount');
console.log('6. Prospects - Columns: id, stateCode, funderName, stage, estimatedAmount, probability, nextAction, dueDate, owner');

console.log('\n🔧 Setup Instructions:');
console.log('1. Create a Google Sheet with the above tabs');
console.log('2. Set up a Google Service Account with Sheets API access');
console.log('3. Share the sheet with your service account email');
console.log('4. Add your credentials to .env.local:');
console.log('   - GOOGLE_SERVICE_ACCOUNT_EMAIL');
console.log('   - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
console.log('   - GOOGLE_SHEETS_SPREADSHEET_ID');
console.log('5. Run: node scripts/seed-sheets.js');
console.log('6. Set up Clerk authentication keys');
console.log('7. Run: npm run dev');

console.log('\n✨ Once setup is complete, your dashboard will show:');
console.log('- Comprehensive org-wide overview with key metrics');
console.log('- Detailed funder profiles with contribution history');
console.log('- State performance tracking with school breakdowns');
console.log('- Interactive pipeline management with kanban board');
console.log('- Advanced analytics with trends and insights');
console.log('- All amounts displayed in Indian Rupees (INR)');
console.log('- Fiscal year tracking (FY24-25, FY25-26, etc.)');

