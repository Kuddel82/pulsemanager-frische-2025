// 💰 SIMPLE TOKEN PRICE API - Fallback für TaxService
// Nur für einfache Preis-Abfragen einzelner Tokens

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
  console.log('💰 TOKEN PRICE API: Request received');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { contract, chain = 'pulsechain' } = req.query;

  // Validation
  if (!contract) {
    return res.status(400).json({ 
      error: 'Contract-Adresse fehlt',
      usage: '/api/token-price?contract=0x...&chain=pulsechain'
    });
  }

  if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
    return res.status(503).json({ 
      error: 'Moralis API Key nicht konfiguriert'
    });
  }

  // Chain mapping
  const chainMap = {
    ethereum: '0x1',
    pulsechain: '0x171',
    eth: '0x1',
    pls: '0x171'
  };
  const chainId = chainMap[chain.toLowerCase()] || chain;

  try {
    console.log(`💰 Loading price for ${contract} on chain ${chainId}`);

    // 🚀 Simple Moralis price query
    const priceData = await moralisFetch(`/erc20/${contract}/price?chain=${chainId}`);
    
    if (!priceData?.usdPrice) {
      return res.status(404).json({ 
        success: false,
        error: 'Preis nicht gefunden',
        contract,
        chain: chainId
      });
    }

    console.log(`✅ Price found: ${priceData.tokenSymbol} = $${priceData.usdPrice}`);

    return res.status(200).json({
      success: true,
      contract,
      chain: chainId,
      symbol: priceData.tokenSymbol,
      name: priceData.tokenName,
      price: parseFloat(priceData.usdPrice),
      verified: priceData.verifiedContract,
      spam: priceData.possibleSpam === 'true',
      source: 'moralis_simple'
    });

  } catch (error) {
    console.error('💥 TOKEN PRICE ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      contract,
      chain: chainId
    });
  }
} 