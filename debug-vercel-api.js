// 🧪 VERCEL API DEBUG - Test live API endpoints
const API_BASE = 'https://kuddelmanager-git-main-pulse-manager-vip.vercel.app';

async function debugVercelAPI() {
  console.log('🧪 VERCEL API DEBUG TOOL');
  console.log('='.repeat(50));
  
  // Test 1: API Key Check
  console.log('🔑 TEST 1: API Key Validation');
  try {
    const response = await fetch(`${API_BASE}/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a&limit=1`);
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Raw Response:', text.slice(0, 500));
    
    try {
      const json = JSON.parse(text);
      console.log('Parsed Response:', json);
    } catch (parseError) {
      console.log('Parse Error:', parseError.message);
    }
    
  } catch (error) {
    console.error('Fetch Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Test 2: Check different endpoints
  const endpoints = [
    '/api/moralis-tokens?endpoint=wallet-tokens&chain=0x1&address=0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a&limit=1',
    '/api/moralis-prices?endpoint=token-prices&addresses=0x95b303987a60c71504d99aa1b13b4da07b0790ab&chain=0x171'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing: ${endpoint}`);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      console.log(`Status: ${response.status}`);
      
      const text = await response.text();
      console.log(`Response: ${text.slice(0, 200)}...`);
      
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

// Run the debug
debugVercelAPI().catch(console.error); 