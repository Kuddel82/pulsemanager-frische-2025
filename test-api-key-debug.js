console.log('🔍 DEBUG: Testing API Key transmission...');

const testUrl = 'https://kuddelmanager-git-main-pulse-manager-vip.vercel.app/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=0x0000000000000000000000000000000000000000';

fetch(testUrl)
  .then(response => {
    console.log(`Status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log('\n🔍 API KEY DEBUG:');
    console.log(`- Has _test_mode: ${!!data._test_mode}`);
    console.log(`- Has _fallback: ${!!data._fallback}`);
    console.log(`- Has _error: ${!!data._error}`);
    console.log(`- Fallback reason: ${data._fallback?.reason}`);
    console.log(`- Error message: ${data._error?.message}`);
    console.log(`- Error type: ${data._error?.type}`);
    
    if (data._fallback && data._fallback.reason === 'moralis_api_key_not_configured') {
      console.log('\n❌ PROBLEM: API Key wird NICHT von Vercel übertragen!');
      console.log('💡 LÖSUNG: Prüfen Sie die Vercel Environment Variables');
    } else if (data._error && data._error.message.includes('Invalid signature')) {
      console.log('\n❌ PROBLEM: API Key ist ungültig oder falsch formatiert');
      console.log('💡 LÖSUNG: Prüfen Sie den Moralis API Key im Dashboard');
    } else if (data._test_mode) {
      console.log('\n✅ API Key wird übertragen, aber Test-Modus aktiv');
    }
    
    console.log('\n📋 Vollständige Response:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('💥 API DEBUG TEST FAILED:', error.message);
  }); 