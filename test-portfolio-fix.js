console.log('🎯 Testing COMPLETE PORTFOLIO SYSTEM...');

// Test mit echter Wallet-Adresse (Vitalik's öffentliche Adresse)
const testWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

console.log(`🔍 Testing wallet: ${testWallet}`);

const testUrl = `https://kuddelmanager-git-main-pulse-manager-vip.vercel.app/api/moralis-tokens?endpoint=wallet-tokens&chain=0x1&address=${testWallet}&limit=5`;

fetch(testUrl)
  .then(response => {
    console.log(`Status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log('Portfolio Response Summary:');
    console.log(`- Has result: ${!!data.result}`);
    console.log(`- Result type: ${Array.isArray(data.result) ? 'array' : typeof data.result}`);
    console.log(`- Token count: ${data.result ? data.result.length : 0}`);
    console.log(`- Has error: ${!!data._error}`);
    console.log(`- Has fallback: ${!!data._fallback}`);
    
    if (data.result && data.result.length > 0) {
      console.log('\n✅ PORTFOLIO SYSTEM: WORKING!');
      console.log(`📊 Found ${data.result.length} tokens:`);
      
      data.result.slice(0, 3).forEach((token, i) => {
        console.log(`  ${i+1}. ${token.symbol || 'Unknown'} - Balance: ${token.balance || 'N/A'}`);
      });
      
      console.log('\n🎉 PORTFOLIO FEHLER SOLLTEN JETZT BEHOBEN SEIN!');
    } else if (data._error) {
      console.log(`\n❌ API Error: ${data._error.message}`);
    } else if (data._fallback) {
      console.log(`\n⚠️ Fallback: ${data._fallback.reason}`);
    } else {
      console.log('\n📊 Empty portfolio (normal for some wallets)');
    }
  })
  .catch(error => {
    console.error('💥 PORTFOLIO TEST FAILED:', error.message);
  }); 