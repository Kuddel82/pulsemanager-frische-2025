console.log('🟣 Testing PulseChain Support...');

const testAddress = '0x1234567890123456789012345678901234567890';
const url = `https://kuddelmanager-git-main-pulse-manager-vip.vercel.app/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=${testAddress}`;

fetch(url)
  .then(response => {
    console.log(`Status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log('\n🟣 PulseChain Response:');
    console.log(`- Source: ${data._source}`);
    console.log(`- PulseChain Native: ${!!data._pulsechain_native}`);
    console.log(`- Fallback: ${data._fallback?.reason}`);
    console.log(`- Error: ${data._error?.message}`);
    console.log(`- Result count: ${data.result ? data.result.length : 0}`);
    
    if (data._source === 'pulsechain_scanner_api') {
      console.log('\n✅ SUCCESS: PulseChain Scanner API ist aktiv!');
    } else if (data._fallback?.reason?.includes('pulsechain')) {
      console.log('\n✅ SUCCESS: PulseChain Fallback funktioniert!');
    } else {
      console.log('\n📊 PulseChain API Response received');
    }
  })
  .catch(error => {
    console.error('💥 Test failed:', error.message);
  }); 