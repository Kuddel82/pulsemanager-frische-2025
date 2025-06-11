// 🚀 MORALIS SDK INTEGRATION - Real Moralis SDK Objects  
// Enterprise-grade APIs für PulseManager mit echtem Moralis SDK

const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");

let moralisInitialized = false;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint, chain, address, cursor, limit } = req.query;

    // 🔑 Moralis API Configuration
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

    // 🛡️ FALLBACK: If no Moralis API key, return empty results
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.warn('⚠️ MORALIS TOKENS: API Key not configured - returning empty results');
      
      // Return empty results based on endpoint
      const emptyResult = {
        result: [],
        total: 0,
        page: 0,
        page_size: limit || 100,
        cursor: null,
        _fallback: {
          reason: 'moralis_api_key_not_configured',
          message: 'Add MORALIS_API_KEY to environment for token data',
          alternative: 'Use PulseChain Scanner API instead'
        }
      };
      
      return res.status(200).json(emptyResult);
    }

    // 🌐 Chain ID Mapping (Moralis Standard Format)
    const chainIdMap = {
      '369': '0x171',        // PulseChain (wenn unterstützt)
      'pulsechain': '0x171',
      'pls': '0x171',
      '0x171': '0x171',      // Direct hex format
      '1': '0x1',            // Ethereum Mainnet  
      'ethereum': '0x1',
      'eth': '0x1',
      '0x1': '0x1'           // Direct hex format
    };

    const chainId = chainIdMap[chain?.toString().toLowerCase()] || '0x171'; // Default PulseChain
    
    // 🚨 PULSECHAIN SUPPORT CHECK
    if (chainId === '0x171') {
      console.warn(`⚠️ PULSECHAIN NOTICE: Chain ${chainId} may not be fully supported by Moralis yet. Using experimental support.`);
    }
    
    console.log(`🔍 CHAIN MAPPING: Input='${chain}' -> Output='${chainId}'`);

    // 🎉 INITIALIZE MORALIS SDK  
    if (!moralisInitialized) {
      try {
        await Moralis.start({
          apiKey: MORALIS_API_KEY,
        });
        moralisInitialized = true;
        console.log('✅ MORALIS SDK INITIALIZED');
      } catch (initError) {
        console.error('💥 MORALIS SDK INIT ERROR:', initError.message);
        return res.status(200).json({
          success: false,
          error: 'Moralis SDK initialization failed',
          _safe_mode: true
        });
      }
    }

    // 📊 API Endpoint Routing with REAL SDK
    switch (endpoint) {
      case 'wallet-tokens':
        // ✅ REAL MORALIS SDK: Token balances für eine Wallet
        if (!address) {
          return res.status(200).json({ 
            success: false,
            error: 'Address parameter required for wallet-tokens',
            _safe_mode: true
          });
        }
        
        try {
          console.log(`🚀 MORALIS SDK: Getting wallet tokens for ${address} on chain ${chainId}`);
          
          // Use real Moralis SDK
          const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
          
          const tokenBalances = await Moralis.EvmApi.token.getWalletTokenBalances({
            address,
            chain: moralisChain,
            limit: limit ? Math.min(parseInt(limit), 100) : 100
          });
          
          console.log(`✅ MORALIS SDK SUCCESS: ${tokenBalances.result.length} tokens found`);
          
          // Return the raw Moralis response (will be parsed by frontend)
          return res.status(200).json(tokenBalances);
          
        } catch (sdkError) {
          console.error('💥 MORALIS SDK ERROR:', sdkError.message);
          
          if (chainId === '0x171' && sdkError.message.includes('chain')) {
            return res.status(200).json({
              result: [],
              total: 0,
              _fallback: {
                reason: 'pulsechain_not_supported',
                message: 'PulseChain not supported by Moralis SDK',
                chain: chainId
              }
            });
          }
          
          return res.status(200).json({
            result: [],
            total: 0,
            _error: {
              message: sdkError.message,
              endpoint: 'wallet-tokens'
            }
          });
        }

      default:
        return res.status(200).json({
          success: false,
          error: 'Invalid endpoint',
          available: ['wallet-tokens'],
          _safe_mode: true
        });
    }

    // 🎉 All endpoints handled in switch statement above

  } catch (error) {
    console.error('💥 MORALIS PROXY ERROR:', error.message);
    
    // 🛡️ FALLBACK: Return empty result instead of errors
    return res.status(200).json({
      result: [],
      total: 0,
      _error: {
        message: error.message,
        endpoint: 'moralis-tokens',
        timestamp: new Date().toISOString(),
        fallback: 'Use alternative data source'
      }
    });
  }
} 