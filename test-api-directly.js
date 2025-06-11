// 🧪 DIRECT API TEST - Check if our NULL address fix is working
// This tests our API directly to see what's happening

async function testNullAddressAPI() {
  console.log('🧪 TESTING NULL ADDRESS API FIX');
  console.log('='.repeat(50));
  
  // Test URLs
  const testUrls = [
    'https://kuddelmanager-git-main-pulse-manager-vip.vercel.app/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=0x0000000000000000000000000000000000000000&limit=1',
    'http://localhost:3000/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=0x0000000000000000000000000000000000000000&limit=1'
  ];
  
  for (const [index, url] of testUrls.entries()) {
    console.log(`\n🔍 TEST ${index + 1}: ${index === 0 ? 'PRODUCTION (Vercel)' : 'LOCAL DEV'}`);
    console.log('-'.repeat(40));
    
    try {
      console.log(`📡 Fetching: ${url}`);
      
      const response = await fetch(url);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS - Response received:');
        console.log({
          hasResult: !!data.result,
          resultLength: data.result?.length || 0,
          isTestMode: !!data._test_mode,
          message: data._message,
          fallback: data._fallback,
          error: data._error
        });
        
        if (data._test_mode) {
          console.log('🎯 NULL ADDRESS FIX: WORKING! ✅');
        } else if (data._fallback) {
          console.log('⚠️ FALLBACK MODE: API Key not configured');
        } else if (data._error) {
          console.log('❌ ERROR MODE:', data._error.message);
        } else {
          console.log('🔍 UNKNOWN RESPONSE TYPE');
        }
      } else {
        console.log('❌ FAILED - HTTP Error');
        const text = await response.text().catch(() => 'Could not read response');
        console.log('Response:', text);
      }
      
    } catch (error) {
      console.log('💥 CONNECTION ERROR:', error.message);
    }
  }
  
  console.log('\n📋 EXPECTED RESULTS:');
  console.log('- Status: 200 (not 500!)');
  console.log('- _test_mode: true');
  console.log('- _message: "Test call with null address - API Key validation passed"');
  console.log('- result: []');
}

// Run the test
testNullAddressAPI().catch(console.error); 