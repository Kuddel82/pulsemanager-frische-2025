console.log('🧪 Testing with SMALLER wallet...');

// Kleinere Test-Wallet (öffentliche bekannte Adresse aber nicht so groß wie Vitalik)
const testWallet = '0x00000000219ab540356cBB839Cbe05303d7705Fa'; // ETH2 Deposit Contract

async function testSmallWallet() {
  console.log(`\n🔍 Testing wallet: ${testWallet}`);
  
  try {
    const response = await fetch(`https://kuddelmanager-git-main-pulse-manager-vip.vercel.app/api/moralis-tokens?endpoint=wallet-tokens&chain=0x1&address=${testWallet}`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Has result: ${!!data.result}`);
    console.log(`Result length: ${data.result ? data.result.length : 'N/A'}`);
    console.log(`Has error: ${!!data._error}`);
    console.log(`Has fallback: ${!!data._fallback}`);
    
    if (data.result && data.result.length > 0) {
      console.log('\n✅ SUCCESS! API Key funktioniert perfekt!');
      console.log(`📊 Found ${data.result.length} tokens:`);
      data.result.slice(0, 3).forEach((token, i) => {
        console.log(`  ${i+1}. ${token.symbol || 'Unknown'}`);
      });
    } else if (data._error) {
      console.log(`\n❌ Error: ${data._error.message}`);
      
      if (data._error.message.includes('over 2000 tokens')) {
        console.log('\n💡 LÖSUNG: Das war das ursprüngliche Problem!');
        console.log('   Portfolio-Fehler entstehen durch Wallets mit >2000 Tokens');
      }
    } else {
      console.log('\n📊 Empty wallet or contract (normal)');
      console.log('✅ API Key funktioniert - keine Fehler!');
    }
  } catch (error) {
    console.log(`💥 Test failed: ${error.message}`);
  }
}

testSmallWallet(); 