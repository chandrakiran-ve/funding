console.log('🧪 Testing VE Funds App without Google Sheets...\n');

// Test if the app can start without credentials
const { spawn } = require('child_process');

console.log('Starting development server...');
console.log('This will show you the dashboard interface even without Google Sheets data.');
console.log('All pages will display empty states with proper UI structure.\n');

console.log('🌐 Open http://localhost:3000 to see:');
console.log('- Authentication flow (Clerk)');
console.log('- Dashboard layout with sidebar navigation');
console.log('- All pages with empty state messages');
console.log('- Premium UI components and styling\n');

console.log('Press Ctrl+C to stop the server when done testing.\n');

// Start the dev server
const devServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

devServer.on('close', (code) => {
  console.log(`\nDev server exited with code ${code}`);
});

