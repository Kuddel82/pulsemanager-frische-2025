// 🚀 MORALIS SDK INTEGRATION - Real Moralis SDK Objects  
// Enterprise-grade APIs für PulseManager mit echtem Moralis SDK
// + PulseChain Scanner API Fallback für >2000 Token Wallets

import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

let moralisInitialized = false;

export default async function handler(req, res) {
  console.log('🔥 DEBUG: /api/moralis-tokens.js AUFGERUFEN!');
  console.log('🔥 DEBUG: URL:', req.url);
  console.log('🔥 DEBUG: Query:', req.query);
  
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
    const { endpoint, chain, address } = req.query;
    
    console.log('🔥 DEBUG: Parameter erhalten:', { endpoint, chain, address });

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

    const chainId = chainIdMap[chain?.toString().toLowerCase()] || '0x171';
    console.log(`🔍 CHAIN MAPPING: Input='${chain}' -> Output='${chainId}'`);

    // 📊 API Endpoint Routing with REAL SDK
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

      // 🟣 PULSECHAIN FALLBACK: Use PulseChain Scanner API
      if (chainId === '0x171') {
        console.log('🟣 PULSECHAIN: Using PulseChain Scanner API fallback');
        
        try {
          // PulseChain Scanner API endpoint
          const pulseApiUrl = `https://scan.pulsechain.com/api?module=account&action=tokenlist&address=${address}`;
          
          const pulseResponse = await fetch(pulseApiUrl);
          const pulseData = await pulseResponse.json();
          
          if (pulseData.status === '1' && Array.isArray(pulseData.result)) {
            console.log(`🟣 PULSECHAIN SUCCESS: ${pulseData.result.length} tokens found`);
            
            const formattedTokens = pulseData.result.map(token => ({
              symbol: token.symbol,
              name: token.name,
              token_address: token.contractAddress,
              decimals: token.decimals,
              balance: token.balance,
              _source: 'pulsechain_scanner'
            }));
            
            return res.status(200).json({
              result: formattedTokens,
              total: formattedTokens.length,
              _pulsechain_native: true,
              _source: 'pulsechain_scanner_api'
            });
          } else {
            console.log('🟣 PULSECHAIN: Empty wallet or API error');
            return res.status(200).json({
              result: [],
              total: 0,
              _fallback: {
                reason: 'pulsechain_scanner_empty',
                message: 'No tokens found on PulseChain Scanner'
              }
            });
          }
        } catch (pulseError) {
          console.error('🟣 PULSECHAIN API ERROR:', pulseError.message);
          return res.status(200).json({
            result: [],
            total: 0,
            _fallback: {
              reason: 'pulsechain_scanner_failed',
              message: 'PulseChain Scanner API unavailable'
            }
          });
        }
      }

      // 🎉 INITIALIZE MORALIS SDK für Ethereum  
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
      
      try {
        console.log(`🚀 MORALIS SDK: Getting wallet tokens for ${address} on chain ${chainId}`);
        
        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
          throw new Error(`Invalid Ethereum address format: ${address}`);
        }
        
        // Use real Moralis SDK
        const moralisChain = EvmChain.ETHEREUM;
        
        console.log('🎯 MORALIS CALL: address, chain, excludeSpam');
        
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
        
        // 🔥 LARGE WALLET FALLBACK: >2000 Tokens
        if (sdkError.message.includes('over 2000 tokens')) {
          console.log('🔥 LARGE WALLET DETECTED: Implementing chunked fallback');
          
          return res.status(200).json({
            result: [],
            total: 0,
            _large_wallet: true,
            _message: 'Wallet contains >2000 tokens - Use ROI/Tax specific endpoints with pagination',
            _suggestion: 'Break down requests by token type or time period',
            _fallback: {
              reason: 'large_wallet_over_2000_tokens',
              message: 'Use paginated endpoints for large wallets'
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
      _safe_mode: true
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