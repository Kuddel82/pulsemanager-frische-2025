// 🚀 DEXSCREENER API - BACKUP FÜR MORALIS PREISE
// Verwendet für fehlende oder fehlerhafte Moralis-Preise

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokens, chain = 'pulsechain' } = req.query;
    
    if (!tokens) {
      return res.status(400).json({ error: 'Missing tokens parameter' });
    }

    const tokenAddresses = Array.isArray(tokens) ? tokens : tokens.split(',');
    console.log(`🔍 DEXSCREENER BACKUP: Loading prices for ${tokenAddresses.length} tokens`);

    const prices = {};
    const batchSize = 5; // DexScreener Rate Limiting
    
    // Process tokens in batches
    for (let i = 0; i < tokenAddresses.length; i += batchSize) {
      const batch = tokenAddresses.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (tokenAddress) => {
        try {
          // DexScreener API Call
          const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
            headers: {
              'User-Agent': 'PulseManager/1.0',
              'Accept': 'application/json'
            },
            timeout: 5000
          });

          if (!response.ok) {
            throw new Error(`DexScreener API error: ${response.status}`);
          }

          const data = await response.json();
          
          if (data.pairs && data.pairs.length > 0) {
            // Find PulseChain pair with highest liquidity
            const pulsechainPairs = data.pairs.filter(pair => 
              pair.chainId === 'pulsechain' && 
              pair.priceUsd && 
              parseFloat(pair.priceUsd) > 0
            );
            
            if (pulsechainPairs.length > 0) {
              // Sort by liquidity (highest first)
              const bestPair = pulsechainPairs.sort((a, b) => 
                parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0)
              )[0];
              
              prices[tokenAddress.toLowerCase()] = {
                usdPrice: parseFloat(bestPair.priceUsd),
                source: 'dexscreener',
                liquidity: bestPair.liquidity?.usd || 0,
                volume24h: bestPair.volume?.h24 || 0,
                pairAddress: bestPair.pairAddress,
                dexId: bestPair.dexId
              };
              
              console.log(`✅ DEXSCREENER: ${tokenAddress} = $${bestPair.priceUsd} (liquidity: $${bestPair.liquidity?.usd || 0})`);
            } else {
              console.log(`⚠️ DEXSCREENER: No PulseChain pairs found for ${tokenAddress}`);
            }
          } else {
            console.log(`⚠️ DEXSCREENER: No pairs found for ${tokenAddress}`);
          }
          
        } catch (error) {
          console.error(`❌ DEXSCREENER: Error fetching ${tokenAddress}:`, error.message);
        }
      }));
      
      // Rate limiting between batches
      if (i + batchSize < tokenAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ DEXSCREENER BACKUP: Loaded ${Object.keys(prices).length}/${tokenAddresses.length} prices`);

    return res.status(200).json({
      success: true,
      prices: prices,
      source: 'dexscreener_backup',
      timestamp: new Date().toISOString(),
      tokensRequested: tokenAddresses.length,
      pricesFound: Object.keys(prices).length
    });

  } catch (error) {
    console.error('❌ DEXSCREENER API ERROR:', error);
    return res.status(500).json({ 
      error: 'DexScreener API failed', 
      details: error.message 
    });
  }
} 