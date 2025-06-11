console.log('🧪 Testing MORALIS API after fix...');

const testUrl = 'https://kuddelmanager-git-main-pulse-manager-vip.vercel.app/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=0x0000000000000000000000000000000000000000&limit=1';

fetch(testUrl)
  .then(response => {
    console.log(`Status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data._test_mode && data._message) {
      console.log('✅ MORALIS API: Working! (Test mode detected)');
    } else if (data.result && Array.isArray(data.result)) {
      console.log(`✅ MORALIS API: Working! Found ${data.result.length} tokens`);
    } else if (data._fallback) {
      console.log(`⚠️ MORALIS API: Fallback mode - ${data._fallback.reason}`);
    } else if (data._error) {
      console.log(`❌ MORALIS API: Error - ${data._error.message}`);
    } else {
      console.log('❓ MORALIS API: Unexpected response format');
    }
  })
  .catch(error => {
    console.error('💥 MORALIS API TEST FAILED:', error.message);
  }); 