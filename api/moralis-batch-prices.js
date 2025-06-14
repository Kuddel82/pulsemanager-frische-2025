// 🚀 MORALIS BATCH PRICES API
// Lädt Preise für mehrere Token in einem optimierten Call

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokens, chain = '0x171' } = req.body;

  if (!tokens || !Array.isArray(tokens)) {
    return res.status(400).json({ error: 'Tokens array required' });
  }

  const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
  if (!MORALIS_API_KEY) {
    return res.status(500).json({ error: 'Moralis API key not configured' });
  }

  try {
    console.log(`🚀 BATCH PRICES: Loading prices for ${tokens.length} tokens on chain ${chain}`);
    
    const prices = {};
    let successCount = 0;
    let errorCount = 0;

    // Load prices for each token (parallel requests)
    const pricePromises = tokens.map(async (token) => {
      try {
        const response = await fetch(
          `https://deep-index.moralis.io/api/v2.2/erc20/${token.address}/price?chain=${chain}`,
          {
            headers: {
              'X-API-Key': MORALIS_API_KEY,
              'accept': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          prices[token.address.toLowerCase()] = {
            usdPrice: data.usdPrice || 0,
            symbol: data.tokenSymbol || token.symbol,
            name: data.tokenName || token.name,
            source: 'moralis_live'
          };
          successCount++;
        } else {
          console.warn(`⚠️ Price failed for ${token.symbol}: ${response.status}`);
          errorCount++;
        }
      } catch (error) {
        console.warn(`⚠️ Price error for ${token.symbol}:`, error.message);
        errorCount++;
      }
    });

    // Wait for all price requests
    await Promise.allSettled(pricePromises);

    console.log(`✅ BATCH PRICES: ${successCount} success, ${errorCount} errors`);

    return res.status(200).json({
      success: true,
      prices: prices,
      stats: {
        total: tokens.length,
        success: successCount,
        errors: errorCount,
        chain: chain
      }
    });

  } catch (error) {
    console.error('💥 BATCH PRICES ERROR:', error);
    return res.status(500).json({
      error: 'Batch price loading failed',
      message: error.message
    });
  }
} 