// 🧪 QUICK API TEST - Check if Moralis API Key is working
// Datum: 2025-01-11 - Emergency debugging

const testWallet = '0x742d35Cc6e6c17Dc5f6c15485b2C8EF9c3A3beAf';

async function testMoralisAPI() {
  console.log('🧪 TESTING MORALIS API ACCESS...');
  console.log('===============================');

  try {
    // Test 1: Health Check
    console.log('🔧 Test 1: API Health Check');
    const healthResponse = await fetch('http://localhost:5175/api/moralis-enterprise-apis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: 'enterprise-health' })
    });
    
    const healthData = await healthResponse.json();
    console.log('Health Response:', healthData.status || 'Error');
    
    // Test 2: Basic Token Check  
    console.log('\n🪙 Test 2: Basic Token API');
    const tokenResponse = await fetch(`http://localhost:5175/api/moralis-tokens?endpoint=wallet-tokens&chain=0x1&address=${testWallet}&limit=5`);
    const tokenData = await tokenResponse.json();
    
    if (tokenData._error) {
      console.log('❌ TOKEN API ERROR:', tokenData._error.message);
    } else if (tokenData._fallback) {
      console.log('⚠️ TOKEN API: Using fallback (no Moralis access)');
    } else if (tokenData.result) {
      console.log('✅ TOKEN API: Working! Found', tokenData.result.length, 'tokens');
    } else {
      console.log('⚪ TOKEN API: Unexpected response format');
    }
    
    // Test 3: Environment Variable Check (server-side)
    console.log('\n🔑 Test 3: Environment Check');
    const envResponse = await fetch('http://localhost:5175/api/moralis-v2?endpoint=api-version');
    const envData = await envResponse.json();
    
    if (envData._error && envData._error.message.includes('API Key')) {
      console.log('❌ ENV CHECK: API Key not found on server');
    } else if (envData.result) {
      console.log('✅ ENV CHECK: API Key working, version:', envData.result.version);
    } else {
      console.log('⚪ ENV CHECK: Unexpected response');
    }
    
  } catch (error) {
    console.log('💥 TEST ERROR:', error.message);
  }
  
  console.log('\n🏁 TEST COMPLETE');
}

// Run test
testMoralisAPI().catch(console.error); 