// 🚀 DIRECT TANGEM TEST: Direkte Moralis API ohne Vercel-Routing
// Test der echten Moralis Enterprise API

// 🔐 SICHERHEIT: API Key aus Environment Variables laden
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const address = '0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a';

console.log('🔵 DIRECT MORALIS TEST: Tangem Wallet');
console.log('📍 Wallet:', address);

async function testMoralisAPI() {
  try {
    // 1. Test Token Balances
    console.log('\n🪙 TESTE TOKEN BALANCES...');
    const tokensUrl = `https://deep-index.moralis.io/api/v2/${address}/erc20?chain=0x171&limit=50`;
    
    const tokensResponse = await fetch(tokensUrl, {
      headers: {
        'X-API-Key': MORALIS_API_KEY
      }
    });
    
    if (!tokensResponse.ok) {
      throw new Error(`Token API failed: ${tokensResponse.status}`);
    }
    
    const tokens = await tokensResponse.json();
    console.log(`✅ ${tokens.length} Tokens gefunden!`);
    
    // Show top 5 tokens
    if (tokens.length > 0) {
      console.log('\n🏆 TOP 5 TOKENS:');
      tokens.slice(0, 5).forEach((token, index) => {
        const balance = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
        console.log(`${index + 1}. ${token.symbol} - ${balance.toFixed(2)} tokens`);
      });
    }

    // 2. Test PLS Balance  
    console.log('\n💰 TESTE PLS BALANCE...');
    const balanceUrl = `https://deep-index.moralis.io/api/v2/${address}/balance?chain=0x171`;
    
    const balanceResponse = await fetch(balanceUrl, {
      headers: {
        'X-API-Key': MORALIS_API_KEY
      }
    });
    
    if (!balanceResponse.ok) {
      throw new Error(`Balance API failed: ${balanceResponse.status}`);
    }
    
    const balance = await balanceResponse.json();
    const plsBalance = parseFloat(balance.balance) / 1e18;
    console.log(`✅ PLS Balance: ${plsBalance.toFixed(2)} PLS`);
    
    // 3. Test one token price
    if (tokens.length > 0) {
      console.log('\n💎 TESTE TOKEN PREIS...');
      const token = tokens[0];
      const priceUrl = `https://deep-index.moralis.io/api/v2/erc20/${token.token_address}/price?chain=0x171`;
      
      try {
        const priceResponse = await fetch(priceUrl, {
          headers: {
            'X-API-Key': MORALIS_API_KEY
          }
        });
        
        if (priceResponse.ok) {
          const price = await priceResponse.json();
          console.log(`✅ ${token.symbol} Preis: $${price.usdPrice || 0}`);
        } else {
          console.log(`⚠️ ${token.symbol} Preis nicht verfügbar`);
        }
      } catch (priceError) {
        console.log(`⚠️ ${token.symbol} Preis-Error:`, priceError.message);
      }
    }

    console.log('\n🎉 TANGEM WALLET API TEST ERFOLGREICH!');
    
  } catch (error) {
    console.error('💥 DIRECT API ERROR:', error.message);
  }
}

testMoralisAPI(); 