// 🚀 LIVE TEST: Tangem Wallet 0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a
// Test der Moralis V2 API mit echten Daten

const address = '0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a';
const apiUrl = `http://localhost:5173/api/moralis-v2?address=${address}&chain=pulsechain&endpoint=wallet-tokens-prices`;

console.log('🔵 TANGEM LIVE TEST: Lade Portfolio-Daten...');
console.log('📍 Wallet:', address);
console.log('🌐 API URL:', apiUrl);

fetch(apiUrl)
  .then(response => {
    console.log('📡 Response Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ LIVE DATA RECEIVED:');
    console.log('📊 Total Tokens:', data.tokens?.length || 0);
    console.log('💰 Total Value USD:', data.total_value_usd || 0);
    
    if (data.tokens && data.tokens.length > 0) {
      console.log('\n🪙 TOP 5 TOKENS:');
      data.tokens.slice(0, 5).forEach((token, index) => {
        console.log(`${index + 1}. ${token.symbol} - ${token.balance?.toFixed(2)} tokens - $${token.total_usd?.toFixed(2)}`);
      });
    }
    
    if (data.error) {
      console.error('❌ API ERROR:', data.error);
    }
  })
  .catch(error => {
    console.error('💥 FETCH ERROR:', error.message);
  }); 