// 💰 MORALIS BATCH PRICES API 
// Holt Token-Preise in Batches für optimierte CU-Verwendung

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2';

// 🌐 MORALIS API HELPER
async function moralisFetch(endpoint) {
  try {
    const res = await fetch(`${MORALIS_BASE}${endpoint}`, {
      headers: {
        'X-API-Key': MORALIS_API_KEY
      }
    });
    
    if (!res.ok) {
      console.error(`❌ Moralis error ${res.status}: ${endpoint}`);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('❌ Moralis fetch error:', error.message);
    return null;
  }
}

export default async function handler(req, res) {
  console.log('💰 MORALIS PRICES API: Request received');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      allowedMethods: ['POST']
    });
  }

  const { tokenAddresses, chain = '0x1' } = req.body;

  // Validation
  if (!tokenAddresses || !Array.isArray(tokenAddresses)) {
    return res.status(400).json({ 
      error: 'tokenAddresses array fehlt',
      usage: 'POST { "tokenAddresses": ["0x...", "0x..."], "chain": "0x1" }'
    });
  }

  if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
    return res.status(503).json({ 
      error: 'Moralis API Key nicht konfiguriert'
    });
  }

  // Chain mapping
  const chainMap = {
    '0x171': '0x171', // PulseChain
    '0x1': '0x1',     // Ethereum
    'pulsechain': '0x171',
    'ethereum': '0x1',
    'eth': '0x1',
    'pls': '0x171'
  };
  const normalizedChain = chainMap[chain.toLowerCase()] || chain;

  try {
    console.log(`💰 Loading prices for ${tokenAddresses.length} tokens on chain ${normalizedChain}`);

    const prices = [];
    let nativePrice = null;

    // 🚀 Handle native token special case
    if (tokenAddresses.includes('native')) {
      try {
        const nativeSymbol = normalizedChain === '0x171' ? 'pls' : 'eth';
        const nativeData = await moralisFetch(`/market-data/erc20s/0x0000000000000000000000000000000000000000/price?chain=${normalizedChain}`);
        
        if (nativeData && nativeData.usdPrice) {
          nativePrice = {
            tokenAddress: 'native',
            tokenSymbol: nativeSymbol.toUpperCase(),
            tokenName: normalizedChain === '0x171' ? 'PulseChain' : 'Ethereum',
            usdPrice: nativeData.usdPrice || '0',
            verifiedContract: true,
            possibleSpam: false
          };
        } else {
          // Fallback prices for native tokens
          const fallbackPrices = {
            '0x1': '2400',     // ETH ca. $2400
            '0x171': '0.00001' // PLS ca. $0.00001
          };
          
          nativePrice = {
            tokenAddress: 'native',
            tokenSymbol: nativeSymbol.toUpperCase(),
            tokenName: normalizedChain === '0x171' ? 'PulseChain' : 'Ethereum',
            usdPrice: fallbackPrices[normalizedChain] || '0',
            verifiedContract: true,
            possibleSpam: false
          };
        }
      } catch (nativeError) {
        console.error('⚠️ Native price fetch failed:', nativeError);
      }
    }

    // 🚀 Handle contract addresses
    const contractAddresses = tokenAddresses.filter(addr => addr !== 'native');
    
    if (contractAddresses.length > 0) {
      // Limit to 25 addresses per call (Moralis limit)
      const limitedAddresses = contractAddresses.slice(0, 25);
      
      for (const address of limitedAddresses) {
        try {
          const priceData = await moralisFetch(`/erc20/${address}/price?chain=${normalizedChain}&include=percent_change`);
          
          if (priceData && priceData.usdPrice) {
            prices.push({
              tokenAddress: address,
              tokenSymbol: priceData.tokenSymbol || 'UNKNOWN',
              tokenName: priceData.tokenName || 'Unknown Token',
              usdPrice: priceData.usdPrice,
              change24h: priceData['24hrPercentChange'],
              verifiedContract: priceData.verifiedContract,
              possibleSpam: priceData.possibleSpam === 'true'
            });
          } else {
            // Add with zero price if no data found
            prices.push({
              tokenAddress: address,
              tokenSymbol: 'UNKNOWN',
              tokenName: 'Unknown Token',
              usdPrice: '0',
              verifiedContract: false,
              possibleSpam: true
            });
          }
          
          // Rate limiting between calls
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (tokenError) {
          console.error(`⚠️ Price fetch failed for ${address}:`, tokenError);
          
          // Add with zero price on error
          prices.push({
            tokenAddress: address,
            tokenSymbol: 'ERROR',
            tokenName: 'Price Fetch Failed',
            usdPrice: '0',
            verifiedContract: false,
            possibleSpam: true
          });
        }
      }
    }

    console.log(`✅ Loaded prices for ${prices.length} tokens + ${nativePrice ? '1 native' : '0 native'}`);

    const response = {
      success: true,
      prices,
      chain: normalizedChain,
      totalRequested: tokenAddresses.length,
      totalProcessed: prices.length + (nativePrice ? 1 : 0),
      source: 'moralis_prices_api'
    };

    if (nativePrice) {
      response.nativePrice = nativePrice;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('💥 MORALIS PRICES ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      tokenAddresses,
      chain: normalizedChain
    });
  }
} 