// 🚀 MORALIS V2 API - PRO COMPATIBLE VERSION
// Simple REST API calls instead of expensive SDK
// Datum: 2025-01-11 - COST REDUCTION: Pro Plan Compatible

// Note: Using native fetch API (available on Vercel/Node 18+)

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

// 🔥 FIXED CHAIN DETECTION MAPPING
const CHAIN_DETECTION = {
  // Ethereum
  '0x1': 'Ethereum',
  'eth': 'Ethereum', 
  '1': 'Ethereum',
  'ethereum': 'Ethereum',
  
  // PulseChain  
  '0x171': 'PulseChain',
  'pls': 'PulseChain',
  '369': 'PulseChain',
  'pulsechain': 'PulseChain',
  
  // Other chains
  '0x38': 'BSC',
  'bsc': 'BSC',
  '0x89': 'Polygon',
  'polygon': 'Polygon',
  '0xa4b1': 'Arbitrum',
  'arbitrum': 'Arbitrum'
};

/**
 * Helper to fetch data from Moralis REST API
 */
async function moralisFetch(endpoint, params = {}) {
  const url = new URL(`${MORALIS_BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, val]) => url.searchParams.append(key, val));

  const res = await fetch(url.toString(), {
    headers: {
      'X-API-Key': MORALIS_API_KEY
    }
  });

  if (!res.ok) {
    console.error(`Moralis Error: ${res.status} - ${res.statusText}`);
    return null;
  }

  return await res.json();
}

/**
 * 🔥 FIXED: Add chain detection to transactions
 */
function addChainDetection(transactions, chainId) {
  const sourceChain = CHAIN_DETECTION[chainId] || 'Unknown';
  const chainSymbol = chainId === '0x171' ? 'PLS' : 'ETH';
  
  return transactions.map(transaction => ({
    ...transaction,
    sourceChain: sourceChain,
    chainSymbol: chainSymbol,
    chainId: chainId
  }));
}

/**
 * 🎯 PRO COMPATIBLE: GET /api/moralis-v2?address=0x...&chain=ethereum&endpoint=wallet-tokens-prices
 */
export default async function handler(req, res) {
  console.log('🔵 MORALIS V2 PRO: Cost-efficient API endpoint');
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract parameters
  const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
  const { address, chain = 'eth', endpoint, limit = 100, cursor } = params;

  console.log('🔵 PRO PARAMS:', { endpoint, chain, address: address?.slice(0, 8) + '...' });

  if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
    console.error('🚨 MORALIS V2: API Key missing or invalid');
    console.error('Environment variables:', {
      hasKey: !!MORALIS_API_KEY,
      keyLength: MORALIS_API_KEY?.length || 0,
      keyPreview: MORALIS_API_KEY?.substring(0, 8) + '...' || 'missing'
    });
    return res.status(503).json({ 
      error: 'Moralis API Key missing or invalid.',
      _pro_mode: true,
      debug: {
        hasKey: !!MORALIS_API_KEY,
        keyLength: MORALIS_API_KEY?.length || 0
      }
    });
  }

  if (!address || !endpoint) {
    return res.status(400).json({ 
      error: 'Missing address or endpoint param.',
      available_endpoints: ['wallet-token-transfers', 'erc20_transfers', 'native_transactions', 'erc20', 'token-price', 'nft', 'balance']
    });
  }

  // Convert chain names to Moralis format - ORIGINAL PORTFOLIO MAPPING
  const chainMap = {
    ethereum: '0x1',
    eth: '0x1',
    '1': '0x1',
    '0x1': '0x1',
    pulsechain: '0x171',
    pls: '0x171',
    '369': '0x171',
    '0x171': '0x171',
    bsc: '0x38',
    polygon: '0x89',
    arbitrum: '0xa4b1'
  };
  const chainId = chainMap[chain.toLowerCase()] || chain;

  console.log(`🔵 CHAIN MAPPING: ${chain} -> ${chainId}`);

  try {
    // ❌ REMOVED: wallet-tokens-prices (Enterprise feature - not available in Pro Plan)
    if (endpoint === 'wallet-tokens-prices') {
      console.log(`🚨 ENTERPRISE ENDPOINT REMOVED: wallet-tokens-prices not available in Pro Plan`);
      
      return res.status(400).json({
        error: 'wallet-tokens-prices endpoint removed - use separate erc20 and token-price calls instead',
        _enterprise_feature: true,
        _pro_alternative: 'Use: 1) GET /erc20 for tokens, 2) GET /token-price for each token',
        suggested_endpoints: ['erc20', 'token-price']
      });
    }

    // 🔄 TOKEN TRANSFERS (Pro-compatible)
    if (endpoint === 'wallet-token-transfers' || endpoint === 'erc20_transfers') {
      console.log(`🚀 PRO TRANSFERS: Loading for ${address} on ${chainId}`);
      
      const result = await moralisFetch(`${address}/erc20/transfers`, { 
        chain: chainId,
        limit: Math.min(limit, 300000),
        cursor: cursor
      });
      
      if (!result) {
        return res.status(500).json({ 
          error: 'Failed to fetch token transfers.',
          _pro_mode: true 
        });
      }

      console.log(`✅ PRO TRANSFERS: ${result.result?.length || 0} transfers loaded`);

      // Wenn der erc20_transfers Endpoint verwendet wird, formatiere das Ergebnis speziell
      // für TaxService und andere interne Anwendungen
      if (endpoint === 'erc20_transfers') {
        return res.status(200).json({
          transfers: addChainDetection(result.result || [], chainId),
          cursor: result.cursor,
          page_size: result.result?.length || 0,
          _source: 'moralis_v2_pro_erc20_transfers'
        });
      }

      // Standard-Antwort für den wallet-token-transfers Endpoint
      return res.status(200).json({
        ...result,
        result: addChainDetection(result.result || [], chainId),
        _source: 'moralis_v2_pro_transfers'
      });
    }

    // 🔄 NATIVE TRANSACTIONS (Pro-compatible)
    if (endpoint === 'native_transactions') {
      console.log(`🚀 PRO NATIVE TX: Loading for ${address} on ${chainId}`);
      
      const result = await moralisFetch(`${address}`, { 
        chain: chainId,
        limit: Math.min(limit, 300000),
        cursor: cursor
      });
      
      if (!result) {
        return res.status(500).json({ 
          error: 'Failed to fetch native transactions.',
          _pro_mode: true 
        });
      }

      console.log(`✅ PRO NATIVE TX: ${result.result?.length || 0} transactions loaded`);

      return res.status(200).json({
        transactions: addChainDetection(result.result || [], chainId),
        cursor: result.cursor,
        page_size: result.result?.length || 0,
        _source: 'moralis_v2_pro_native_transactions'
      });
    }

    // 💰 NATIVE BALANCE
    if (endpoint === 'balance' || endpoint === 'native-balance') {
      console.log(`🚀 PRO BALANCE: Loading native balance for ${address} on ${chainId}`);
      
      const result = await moralisFetch(`${address}/balance`, { 
        chain: chainId 
      });
      
      if (!result) {
        return res.status(500).json({ 
          error: 'Failed to fetch native balance.',
          _pro_mode: true 
        });
      }

      const balanceEth = parseFloat(result.balance) / 1e18;
      const currency = chainId === '0x171' ? 'PLS' : 'ETH';

      console.log(`✅ PRO BALANCE: ${balanceEth.toFixed(6)} ${currency}`);

      return res.status(200).json({
        balance: result.balance,
        balance_formatted: balanceEth.toFixed(6),
        currency: currency,
        chain: chainId,
        _source: 'moralis_v2_pro_balance'
      });
    }

    // 🖼️ NFT BALANCES  
    if (endpoint === 'nft' || endpoint === 'wallet-nfts') {
      console.log(`🚀 PRO NFTs: Loading NFTs for ${address} on ${chainId}`);
      
      const result = await moralisFetch(`${address}/nft`, { 
        chain: chainId,
        limit: Math.min(limit, 300000),
        cursor: cursor
      });
      
      if (!result) {
        return res.status(500).json({ 
          error: 'Failed to fetch NFTs.',
          _pro_mode: true 
        });
      }

      console.log(`✅ PRO NFTs: ${result.result?.length || 0} NFTs loaded`);

      return res.status(200).json({
        ...result,
        _source: 'moralis_v2_pro_nfts'
      });
    }

    // 🔄 RAW ERC20 TOKENS (without prices)
    if (endpoint === 'erc20') {
      console.log(`🚀 PRO ERC20: Loading raw tokens for ${address} on ${chainId}`);
      
      const result = await moralisFetch(`${address}/erc20`, { 
        chain: chainId,
        limit: Math.min(limit, 300000),
        cursor: cursor
      });
      
      if (!result) {
        return res.status(500).json({ 
          error: 'Failed to fetch ERC20 tokens.',
          _pro_mode: true 
        });
      }

      console.log(`✅ PRO ERC20: ${result.length || 0} tokens loaded`);

      return res.status(200).json({
        result: result,
        _source: 'moralis_v2_pro_erc20'
      });
    }

    // 💎 SINGLE TOKEN PRICE (FIXED ERROR HANDLING)
    if (endpoint === 'token-price') {
      console.log(`🚀 PRO PRICE: Getting price for token ${address} on ${chainId}`);
      
      try {
        const result = await moralisFetch(`erc20/${address}/price`, { 
          chain: chainId 
        });
        
        // Fallback to zero price if API fails (no 500 error)
        if (!result) {
          console.warn(`⚠️ PRO PRICE: No price data for ${address}, returning $0`);
          return res.status(200).json({
            usdPrice: 0,
            exchangeAddress: null,
            exchangeName: null,
            tokenAddress: address,
            _source: 'moralis_v2_pro_price_fallback',
            _fallback: true
          });
        }

        console.log(`✅ PRO PRICE: $${result.usdPrice || 0}`);

        return res.status(200).json({
          ...result,
          _source: 'moralis_v2_pro_price'
        });
      } catch (priceError) {
        console.warn(`⚠️ PRO PRICE ERROR: ${priceError.message} - returning $0`);
        return res.status(200).json({
          usdPrice: 0,
          exchangeAddress: null,
          exchangeName: null,
          tokenAddress: address,
          _source: 'moralis_v2_pro_price_error',
          _error: priceError.message
        });
      }
    }

    // ❌ ENTERPRISE ENDPOINTS COMPLETELY REMOVED (to prevent CU consumption)
    if (endpoint === 'defi-summary' || endpoint === 'defi-positions' || endpoint === 'stats') {
      console.log(`🚨 ENTERPRISE ENDPOINT BLOCKED: ${endpoint} not supported in Pro Plan`);
      
      return res.status(400).json({
        error: `Enterprise endpoint '${endpoint}' removed to prevent CU waste`,
        _enterprise_feature: true,
        _removed_reason: 'These endpoints consume CUs but return empty data in Pro Plan',
        _alternatives: {
          'defi-summary': 'Use transaction-based ROI detection instead',
          'defi-positions': 'Use transaction analysis for position tracking',
          'stats': 'Use wallet activity analysis from transfers'
        }
      });
    }

    // Invalid endpoint
    return res.status(400).json({ 
      error: `Unsupported endpoint: ${endpoint}`,
      available_endpoints: [
        'wallet-token-transfers',
        'erc20_transfers',
        'native_transactions', 
        'balance',
        'native-balance',
        'nft',
        'wallet-nfts',
        'erc20',
        'token-price'
      ],
      _pro_compatible: true,
      _enterprise_removed: [
        'wallet-tokens-prices',  // Use erc20 + token-price instead
        'defi-summary',          // Use transaction analysis instead
        'defi-positions',        // Use transaction analysis instead  
        'stats'                  // Use activity analysis instead
      ],
      _note: 'Enterprise endpoints removed to prevent CU waste in Pro Plan'
    });

  } catch (error) {
    console.error('💥 PRO API ERROR:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      _pro_mode: true,
      timestamp: new Date().toISOString()
    });
  }
} 