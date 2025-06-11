// 🔧 API DEBUG & FIX SCRIPT
// Behebt die 400/406 API-Fehler für Moralis Endpoints

console.log('🔧 API DEBUG: Starting API endpoint diagnosis...');

// Test Moralis API Key
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || 'YOUR_MORALIS_API_KEY_HERE';

console.log('🔑 Moralis API Key Check:', MORALIS_API_KEY ? '✅ Found' : '❌ Missing');

// Test API Endpoints
const testEndpoints = [
  {
    name: 'Moralis Transactions',
    url: '/api/moralis-transactions',
    method: 'POST',
    body: {
      endpoint: 'wallet-transactions',
      address: '0x742d35Cc6e6c17Dc5f6c15485b2C8EF9c3A3beAf',
      chain: '1'
    }
  },
  {
    name: 'Moralis Prices',
    url: '/api/moralis-prices', 
    method: 'POST',
    body: {
      endpoint: 'token-prices',
      addresses: ['0x742d35Cc6e6c17Dc5f6c15485b2C8EF9c3A3beAf'],
      chain: '1'
    }
  }
];

async function testAPI() {
  for (const test of testEndpoints) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.body)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${test.name}: SUCCESS`);
      } else {
        console.log(`❌ ${test.name}: ${response.status} - ${data.error || data._error?.message}`);
      }
      
    } catch (error) {
      console.log(`💥 ${test.name}: ${error.message}`);
    }
  }
}

// Run API test if this script is executed
if (typeof window === 'undefined') {
  testAPI();
}

export { testAPI }; 