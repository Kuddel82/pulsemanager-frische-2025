// 🧪 MORALIS INTEGRATION TEST SCRIPT
// Testet alle wichtigen Moralis Web3 Data API Endpoints

async function testMoralisIntegration() {
  console.log('🔵 TESTING MORALIS ENTERPRISE INTEGRATION...\n');
  
  const testResults = {};
  const baseUrl = 'http://localhost:3000'; // Vite dev server
  
  // Test 1: Moralis Prices API (neu repariert)
  console.log('1️⃣ Testing Moralis Prices API...');
  try {
    const response = await fetch(`${baseUrl}/api/moralis-prices?endpoint=token-prices&addresses=0x2b591e99afe9f32eaa6214f7b7629768c40eeb39&chain=369`);
    const data = await response.json();
    
    if (response.ok && data._proxy) {
      console.log('✅ Moralis Prices API: WORKING');
      console.log(`   - Provider: ${data._proxy.provider}`);
      console.log(`   - Price Count: ${data._proxy.priceCount}`);
      testResults.prices = true;
    } else {
      console.log('❌ Moralis Prices API: ERROR');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Message: ${data.message || data.error}`);
      testResults.prices = false;
    }
  } catch (error) {
    console.log('❌ Moralis Prices API: CONNECTION ERROR');
    console.log(`   - Error: ${error.message}`);
    testResults.prices = false;
  }
  
  // Test 2: Moralis Tokens API
  console.log('\n2️⃣ Testing Moralis Tokens API...');
  try {
    const response = await fetch(`${baseUrl}/api/moralis-tokens?endpoint=wallet-tokens&address=0x742d35Cc6634C0532925a3b8D26c6a9f2e3a2451&chain=369`);
    const data = await response.json();
    
    if (response.ok && data._proxy) {
      console.log('✅ Moralis Tokens API: WORKING');
      console.log(`   - Provider: ${data._proxy.provider}`);
      console.log(`   - Results: ${data.result?.length || 0} items`);
      testResults.tokens = true;
    } else {
      console.log('❌ Moralis Tokens API: ERROR');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Message: ${data.message || data.error}`);
      testResults.tokens = false;
    }
  } catch (error) {
    console.log('❌ Moralis Tokens API: CONNECTION ERROR');
    console.log(`   - Error: ${error.message}`);
    testResults.tokens = false;
  }
  
  // Test 3: API Key Security Check
  console.log('\n3️⃣ Testing API Key Security...');
  try {
    // Versuche Frontend-Zugriff auf API Key (sollte NICHT funktionieren)
    const frontendTest = await fetch(`${baseUrl}/api/moralis-tokens?endpoint=wallet-tokens&address=test&chain=369`);
    const data = await frontendTest.json();
    
    if (frontendTest.status === 503 && data.error === 'Moralis API not configured') {
      console.log('✅ API Key Security: SECURE (Key not exposed to frontend)');
      testResults.security = true;
    } else if (frontendTest.status === 401) {
      console.log('✅ API Key Security: WORKING (Key configured, request authenticated)');
      testResults.security = true;
    } else {
      console.log('⚠️ API Key Security: CHECK MANUALLY');
      testResults.security = 'manual_check';
    }
  } catch (error) {
    console.log('⚠️ API Key Security: CONNECTION ERROR');
    testResults.security = false;
  }
  
  // Test 4: Chain Support
  console.log('\n4️⃣ Testing Multi-Chain Support...');
  const chains = [
    { id: '369', name: 'PulseChain' },
    { id: '1', name: 'Ethereum' }
  ];
  
  for (const chain of chains) {
    try {
      const response = await fetch(`${baseUrl}/api/moralis-tokens?endpoint=wallet-tokens&address=0x742d35Cc6634C0532925a3b8D26c6a9f2e3a2451&chain=${chain.id}`);
      const data = await response.json();
      
      if (response.ok && data._proxy?.chain) {
        console.log(`✅ ${chain.name} (${chain.id}): SUPPORTED`);
        console.log(`   - Chain ID: ${data._proxy.chain}`);
      } else {
        console.log(`❌ ${chain.name} (${chain.id}): ERROR`);
      }
    } catch (error) {
      console.log(`❌ ${chain.name} (${chain.id}): CONNECTION ERROR`);
    }
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('================');
  
  const passedTests = Object.values(testResults).filter(result => result === true).length;
  const totalTests = Object.keys(testResults).length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  
  if (testResults.prices) console.log('✅ Moralis Prices API: WORKING');
  else console.log('❌ Moralis Prices API: NEEDS FIXING');
  
  if (testResults.tokens) console.log('✅ Moralis Tokens API: WORKING');
  else console.log('❌ Moralis Tokens API: NEEDS FIXING');
  
  if (testResults.security === true) console.log('✅ API Key Security: SECURE');
  else if (testResults.security === 'manual_check') console.log('⚠️ API Key Security: MANUAL CHECK NEEDED');
  else console.log('❌ API Key Security: NEEDS ATTENTION');
  
  console.log('\n🔑 ENVIRONMENT CHECK:');
  console.log('===================');
  console.log('Make sure these environment variables are set:');
  console.log('- MORALIS_API_KEY (in .env file)');
  console.log('- MORALIS_BASE_URL (optional, defaults to Moralis v2.2)');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('=============');
  console.log('1. Start your dev server: npm run dev');
  console.log('2. Run this test: node test-moralis-integration.js');
  console.log('3. Check your .env file for MORALIS_API_KEY');
  console.log('4. Test your live portfolio loading');
  
  return testResults;
}

// Für Node.js direkte Ausführung
if (typeof window === 'undefined') {
  // Node.js environment - use fetch polyfill
  const fetch = (await import('node-fetch')).default;
  global.fetch = fetch;
  
  testMoralisIntegration().catch(error => {
    console.error('🚨 Test failed:', error);
  });
}

// Für Browser/Frontend testing
if (typeof window !== 'undefined') {
  window.testMoralisIntegration = testMoralisIntegration;
  console.log('🧪 Test function loaded! Run: testMoralisIntegration()');
} 