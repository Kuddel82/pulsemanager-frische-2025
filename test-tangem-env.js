// 🚀 TANGEM WALLET TEST mit Environment Variables
// Verwendet .env-Datei für sicheren API-Key-Zugriff

// Simulated environment loading (Node.js would load .env automatically)
require('dotenv').config();

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const address = '0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a';

console.log('🔵 TANGEM ENV TEST: Tangem Wallet mit Environment Variables');
console.log('📍 Wallet:', address);
console.log('🔑 API Key Status:', MORALIS_API_KEY ? '✅ Geladen' : '❌ Fehlt');

if (!MORALIS_API_KEY) {
  console.error('💥 MORALIS_API_KEY nicht gefunden in .env Datei!');
  process.exit(1);
}

async function testTangemWallet() {
  try {
    // 1. Test Token Balances
    console.log('\n🪙 TESTE TANGEM TOKEN BALANCES...');
    const tokensUrl = `https://deep-index.moralis.io/api/v2/${address}/erc20?chain=0x171&limit=50`;
    
    const tokensResponse = await fetch(tokensUrl, {
      headers: {
        'X-API-Key': MORALIS_API_KEY
      }
    });
    
    console.log('📡 Token Response Status:', tokensResponse.status);
    
    if (!tokensResponse.ok) {
      const errorText = await tokensResponse.text();
      throw new Error(`Token API failed: ${tokensResponse.status} - ${errorText}`);
    }
    
    const tokens = await tokensResponse.json();
    console.log(`✅ TANGEM TOKENS: ${tokens.length} Token gefunden!`);
    
    // Show tangem tokens
    if (tokens.length > 0) {
      console.log('\n🏆 TANGEM TOP 5 TOKENS:');
      tokens.slice(0, 5).forEach((token, index) => {
        const balance = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
        console.log(`${index + 1}. ${token.symbol} (${token.name}) - ${balance.toFixed(4)} tokens`);
      });
      
      // Test one token price
      console.log('\n💎 TESTE TOKEN PREISE...');
      const testToken = tokens[0];
      const priceUrl = `https://deep-index.moralis.io/api/v2/erc20/${testToken.token_address}/price?chain=0x171`;
      
      try {
        const priceResponse = await fetch(priceUrl, {
          headers: {
            'X-API-Key': MORALIS_API_KEY
          }
        });
        
        if (priceResponse.ok) {
          const price = await priceResponse.json();
          console.log(`✅ ${testToken.symbol} Preis: $${price.usdPrice || 0}`);
          
          if (price.usdPrice > 0) {
            const tokenValue = balance * price.usdPrice;
            console.log(`💰 ${testToken.symbol} Wert: $${tokenValue.toFixed(2)}`);
          }
        } else {
          console.log(`⚠️ Preis für ${testToken.symbol} nicht verfügbar`);
        }
      } catch (priceError) {
        console.log(`⚠️ Preis-Error für ${testToken.symbol}:`, priceError.message);
      }
    }

    // 2. Test PLS Balance  
    console.log('\n💰 TESTE TANGEM PLS BALANCE...');
    const balanceUrl = `https://deep-index.moralis.io/api/v2/${address}/balance?chain=0x171`;
    
    const balanceResponse = await fetch(balanceUrl, {
      headers: {
        'X-API-Key': MORALIS_API_KEY
      }
    });
    
    if (balanceResponse.ok) {
      const balance = await balanceResponse.json();
      const plsBalance = parseFloat(balance.balance) / 1e18;
      console.log(`✅ TANGEM PLS Balance: ${plsBalance.toFixed(2)} PLS`);
    } else {
      console.log('⚠️ PLS Balance nicht verfügbar');
    }

    console.log('\n🎉 TANGEM WALLET API TEST ERFOLGREICH!');
    console.log('✅ Die Moralis Enterprise API funktioniert mit Ihrer Tangem Wallet!');
    
  } catch (error) {
    console.error('💥 TANGEM API ERROR:', error.message);
  }
}

testTangemWallet(); 