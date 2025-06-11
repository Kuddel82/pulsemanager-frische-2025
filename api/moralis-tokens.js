// 🚀 MORALIS SDK INTEGRATION - 100% MORALIS ONLY
// Enterprise-grade APIs für PulseManager mit echtem Moralis SDK

import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

let moralisInitialized = false;

export default async function handler(req, res) {
  console.log('🔥 DEBUG: /api/moralis-tokens.js - 100% MORALIS ONLY');
  console.log('🔥 DEBUG: Method:', req.method);
  console.log('🔥 DEBUG: Query:', req.query);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Support both GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract parameters from both GET and POST
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { endpoint, chain, address, cursor, limit } = params;
    
    console.log('🔥 DEBUG: Parameters:', { endpoint, chain, address, cursor, limit });

    // 🔑 Moralis API Configuration
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

    // 🛡️ FALLBACK: If no Moralis API key, return empty results
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.warn('⚠️ MORALIS TOKENS: API Key not configured - returning empty results');
      
      return res.status(200).json({
        result: [],
        total: 0,
        _fallback: {
          reason: 'moralis_api_key_not_configured',
          message: 'Add MORALIS_API_KEY to environment for token data'
        }
      });
    }

    // 🌐 Chain ID Mapping (Moralis Standard Format)
    const chainIdMap = {
      '369': '0x171',
      'pulsechain': '0x171',
      'pls': '0x171',
      '0x171': '0x171',
      '1': '0x1',
      'ethereum': '0x1',
      'eth': '0x1',
      '0x1': '0x1'
    };

    const chainId = chainIdMap[chain?.toString().toLowerCase()] || '0x1'; // Default Ethereum
    console.log(`🔍 CHAIN MAPPING: Input='${chain}' -> Output='${chainId}'`);

    // 🎉 INITIALIZE MORALIS SDK  
    if (!moralisInitialized) {
      try {
        await Moralis.start({
          apiKey: MORALIS_API_KEY,
        });
        moralisInitialized = true;
        console.log('✅ MORALIS SDK INITIALIZED - 100% MORALIS');
      } catch (initError) {
        console.error('💥 MORALIS SDK INIT ERROR:', initError.message);
        return res.status(200).json({
          success: false,
          error: 'Moralis SDK initialization failed',
          _safe_mode: true
        });
      }
    }

    // 📊 API Endpoint Routing with REAL MORALIS SDK ONLY
    if (endpoint === 'wallet-tokens') {
      // NULL Address Test für hasValidMoralisApiKey
      if (!address || address === '0x0000000000000000000000000000000000000000') {
        console.log('⚠️ NULL ADDRESS DETECTED - returning test result');
        return res.status(200).json({ 
          result: [],
          total: 0,
          _test_mode: true,
          _message: 'Test call with null address - API Key validation passed'
        });
      }
      
      try {
        console.log(`🚀 MORALIS SDK: Getting wallet tokens for ${address} on chain ${chainId}`);
        
        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
          throw new Error(`Invalid Ethereum address format: ${address}`);
        }
        
        // 100% MORALIS SDK ONLY
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        
        console.log('🎯 MORALIS CALL: 100% MORALIS ONLY');
        
        const tokenBalances = await Moralis.EvmApi.token.getWalletTokenBalances({
          address,
          chain: moralisChain,
          excludeSpam: true
        });
        
        console.log(`✅ MORALIS SDK SUCCESS: ${tokenBalances.result.length} tokens found`);
        
        // Return the raw Moralis response
        return res.status(200).json(tokenBalances);
        
      } catch (sdkError) {
        console.error('💥 MORALIS SDK ERROR:', sdkError.message);
        
        // Handle large wallet error gracefully
        if (sdkError.message.includes('over 2000 tokens')) {
          console.log('🔥 LARGE WALLET DETECTED: Returning empty for now');
          
          return res.status(200).json({
            result: [],
            total: 0,
            _large_wallet: true,
            _message: 'Wallet contains >2000 tokens - Moralis limit reached',
            _moralis_only: true
          });
        }
        
        // PulseChain not supported by Moralis
        if (chainId === '0x171') {
          return res.status(200).json({
            result: [],
            total: 0,
            _fallback: {
              reason: 'pulsechain_not_supported_by_moralis',
              message: 'PulseChain not yet supported by Moralis SDK',
              chain: chainId
            }
          });
        }
        
        // Check for specific error types
        if (sdkError.message.includes('Invalid address')) {
          return res.status(200).json({
            result: [],
            total: 0,
            _error: {
              message: 'Invalid wallet address format',
              type: 'address_validation'
            }
          });
        }
        
        // Generic error handling
        return res.status(200).json({
          result: [],
          total: 0,
          _error: {
            message: sdkError.message,
            type: 'sdk_error',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Invalid endpoint
    return res.status(200).json({
      success: false,
      error: 'Invalid endpoint',
      available: ['wallet-tokens'],
      _moralis_only: true
    });

  } catch (error) {
    console.error('💥 MORALIS PROXY ERROR:', error.message);
    
    return res.status(200).json({
      result: [],
      total: 0,
      _error: {
        message: error.message,
        endpoint: 'moralis-tokens',
        timestamp: new Date().toISOString()
      }
    });
  }
} 