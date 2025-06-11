console.log('🔍 DEBUG: Testing different chains...');

const testWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik

async function testChain(chainId, chainName) {
  console.log(`\n🧪 Testing ${chainName} (${chainId})...`);
  
  try {
    const response = await fetch(`https://kuddelmanager-git-main-pulse-manager-vip.vercel.app/api/moralis-tokens?endpoint=wallet-tokens&chain=${chainId}&address=${testWallet}`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Has result: ${!!data.result}`);
    console.log(`Has error: ${!!data._error}`);
    console.log(`Has fallback: ${!!data._fallback}`);
    
    if (data._error) {
      console.log(`❌ ${chainName}: ${data._error.message}`);
    } else if (data._fallback) {
      console.log(`⚠️ ${chainName}: ${data._fallback.reason}`);
    } else if (data.result) {
      console.log(`✅ ${chainName}: ${data.result.length} tokens found`);
    }
  } catch (error) {
    console.log(`💥 ${chainName}: ${error.message}`);
  }
}

// Test verschiedene Chains
async function runTests() {
  await testChain('0x1', 'Ethereum Mainnet');
  await testChain('0x171', 'PulseChain');
  await testChain('1', 'Ethereum (Numeric)');
  
  console.log('\n🎯 DIAGNOSE:');
  console.log('- Wenn Ethereum funktioniert = API Key OK, PulseChain Problem');
  console.log('- Wenn beide nicht funktionieren = API Key oder Wallet Problem');
}

runTests(); 