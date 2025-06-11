// 🚀 MORALIS V2 API - PRO COMPATIBLE VERSION
// Simple REST API calls instead of expensive SDK
// Datum: 2025-01-11 - COST REDUCTION: Pro Plan Compatible

import fetch from 'node-fetch';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

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
    return res.status(503).json({ 
      error: 'Moralis API Key missing or invalid.',
      _pro_mode: true 
    });
  }

  if (!address || !endpoint) {
    return res.status(400).json({ 
      error: 'Missing address or endpoint param.',
      available_endpoints: ['wallet-tokens-prices', 'wallet-token-transfers', 'erc20', 'nft', 'balance']
    });
  }

  // Convert chain names to Moralis format
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
    // 🎯 MAIN ENDPOINT: Wallet tokens with prices (Pro-optimized)
    if (endpoint === 'wallet-tokens-prices') {
      console.log(`🚀 PRO TOKENS+PRICES: Loading for ${address} on ${chainId}`);
      
      // Step 1: Get tokens (single API call)
      const tokens = await moralisFetch(`${address}/erc20`, { 
        chain: chainId,
        limit: Math.min(limit, 100)
      });
      
      if (!tokens) {
        return res.status(500).json({ 
          error: 'Failed to fetch tokens.',
          _pro_mode: true 
        });
      }

      console.log(`📊 PRO: Found ${tokens.length} tokens, getting prices...`);

      // Step 2: Get prices for tokens (batch where possible)
      const enriched = await Promise.all(tokens.map(async (token) => {
        try {
          const price = await moralisFetch(`erc20/${token.token_address}/price`, { 
            chain: chainId 
          });
          const priceUsd = price?.usdPrice || 0;
          const balanceReadable = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
          
          return {
            symbol: token.symbol,
            name: token.name,
            address: token.token_address,
            decimals: token.decimals,
            balance: balanceReadable,
            balance_raw: token.balance,
            usd_price: priceUsd,
            total_usd: balanceReadable * priceUsd,
            _source: 'moralis_pro_rest'
          };
        } catch (priceError) {
          console.warn(`⚠️ Price failed for ${token.symbol}:`, priceError.message);
          const balanceReadable = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
          return {
            symbol: token.symbol,
            name: token.name,
            address: token.token_address,
            decimals: token.decimals,
            balance: balanceReadable,
            balance_raw: token.balance,
            usd_price: 0,
            total_usd: 0,
            _source: 'moralis_pro_rest_no_price'
          };
        }
      }));

      const totalValue = enriched.reduce((sum, token) => sum + (token.total_usd || 0), 0);

      console.log(`✅ PRO SUCCESS: ${enriched.length} tokens, total value: $${totalValue.toFixed(2)}`);

      return res.status(200).json({ 
        address, 
        chain: chainId, 
        tokens: enriched,
        total_count: tokens.length,
        total_value_usd: totalValue,
        _source: 'moralis_v2_pro',
        _cost_optimized: true
      });
    }

    // 🔄 TOKEN TRANSFERS (Pro-compatible)
    if (endpoint === 'wallet-token-transfers') {
      console.log(`🚀 PRO TRANSFERS: Loading for ${address} on ${chainId}`);
      
      const result = await moralisFetch(`${address}/erc20/transfers`, { 
        chain: chainId,
        limit: Math.min(limit, 100),
        cursor: cursor
      });
      
      if (!result) {
        return res.status(500).json({ 
          error: 'Failed to fetch token transfers.',
          _pro_mode: true 
        });
      }

      console.log(`✅ PRO TRANSFERS: ${result.result?.length || 0} transfers loaded`);

      return res.status(200).json({
        ...result,
        _source: 'moralis_v2_pro_transfers'
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
        limit: Math.min(limit, 100),
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
        limit: Math.min(limit, 100),
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

    // 💎 SINGLE TOKEN PRICE
    if (endpoint === 'token-price') {
      console.log(`🚀 PRO PRICE: Getting price for token ${address} on ${chainId}`);
      
      const result = await moralisFetch(`erc20/${address}/price`, { 
        chain: chainId 
      });
      
      if (!result) {
        return res.status(500).json({ 
          error: 'Failed to fetch token price.',
          _pro_mode: true 
        });
      }

      console.log(`✅ PRO PRICE: $${result.usdPrice || 0}`);

      return res.status(200).json({
        ...result,
        _source: 'moralis_v2_pro_price'
      });
    }

    // Invalid endpoint
    return res.status(400).json({ 
      error: `Unsupported endpoint: ${endpoint}`,
      available_endpoints: [
        'wallet-tokens-prices',
        'wallet-token-transfers', 
        'balance',
        'native-balance',
        'nft',
        'wallet-nfts',
        'erc20',
        'token-price'
      ],
      _pro_compatible: true
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