// 🚀 QUICK API TEST - STANDARD MORALIS APIS
// Test der wichtigsten API-Endpunkte für Funktionalität

console.log('🚀 QUICK API TEST: Standard Moralis APIs');

// Test Health Check
async function testHealth() {
  try {
    const healthResponse = await fetch('/api/health', {
      method: 'GET'
    });
    
    const healthData = await healthResponse.json();
    
    console.log('✅ Health Check:', healthData);
    return { success: true, ...healthData };
  } catch (error) {
    console.error('❌ Health Check failed:', error);
    return { success: false, error: error.message };
  }
}

// Test Token Prices  
async function testTokenPrices() {
  try {
    const response = await fetch('/api/moralis-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'token-price',
        chain: '0x171',
        address: '0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d'
      })
    });
    
    const data = await response.json();
    console.log('✅ Token Prices:', data);
    return { success: true, ...data };
  } catch (error) {
    console.error('❌ Token Prices failed:', error);
    return { success: false, error: error.message };
  }
}

// Test Wallet Tokens
async function testWalletTokens() {
  try {
    const response = await fetch('/api/moralis-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'wallet-tokens',
        chain: '0x171',
        address: '0x0000000000000000000000000000000000000000',
        limit: 5
      })
    });
    
    const data = await response.json();
    console.log('✅ Wallet Tokens:', data);
    return { success: true, ...data };
  } catch (error) {
    console.error('❌ Wallet Tokens failed:', error);
    return { success: false, error: error.message };
  }
}

// Run all tests
async function runAllTests() {
  console.log('🎯 RUNNING ALL API TESTS...\n');
  
  const results = {
    health: await testHealth(),
    tokenPrices: await testTokenPrices(),
    walletTokens: await testWalletTokens()
  };
  
  console.log('\n📊 TEST RESULTS:');
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result.success ? '✅' : '❌'} ${test}: ${result.success ? 'OK' : result.error}`);
  });
  
  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`\n🎯 SUMMARY: ${successCount}/${Object.keys(results).length} tests passed`);
  
  return results;
}

// Auto-run
runAllTests(); 