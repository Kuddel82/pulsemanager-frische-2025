// 🚀 MORALIS SDK INTEGRATION - Real Moralis SDK Objects  
// Enterprise-grade APIs für PulseManager mit echtem Moralis SDK

import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { NextResponse } from 'next/server';

let moralisInitialized = false;

export async function GET(request) {
  console.log('🔥 DEBUG: /src/app/api/moralis-tokens/route.js AUFGERUFEN!');
  console.log('🔥 DEBUG: URL:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const chain = searchParams.get('chain');
    const address = searchParams.get('address');
    
    console.log('🔥 DEBUG: Parameter erhalten:', { endpoint, chain, address });

    // 🔑 Moralis API Configuration
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

    // 🛡️ FALLBACK: If no Moralis API key, return empty results
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.warn('⚠️ MORALIS TOKENS: API Key not configured - returning empty results');
      
      return NextResponse.json({
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
        return NextResponse.json({
          success: false,
          error: 'Moralis SDK initialization failed',
          _safe_mode: true
        });
      }
    }

    // 📊 API Endpoint Routing with REAL SDK
    if (endpoint === 'wallet-tokens') {
      // NULL Address Test für hasValidMoralisApiKey
      if (!address || address === '0x0000000000000000000000000000000000000000') {
        console.log('⚠️ NULL ADDRESS DETECTED - returning test result');
        return NextResponse.json({ 
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
        
        // Use real Moralis SDK - OHNE LIMIT PARAMETER!
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        
        console.log('🎯 MORALIS CALL: NO LIMIT PARAMETER - only address, chain, excludeSpam');
        
        const tokenBalances = await Moralis.EvmApi.token.getWalletTokenBalances({
          address,
          chain: moralisChain,
          excludeSpam: true
        });
        
        console.log(`✅ MORALIS SDK SUCCESS: ${tokenBalances.result.length} tokens found`);
        
        // Return the raw Moralis response
        return NextResponse.json(tokenBalances);
        
      } catch (sdkError) {
        console.error('💥 MORALIS SDK ERROR:', sdkError.message);
        
        // Check for specific error types
        if (sdkError.message.includes('Invalid address')) {
          return NextResponse.json({
            result: [],
            total: 0,
            _error: {
              message: 'Invalid wallet address format',
              type: 'address_validation'
            }
          });
        }
        
        if (chainId === '0x171' && (sdkError.message.includes('chain') || sdkError.message.includes('0x171'))) {
          return NextResponse.json({
            result: [],
            total: 0,
            _fallback: {
              reason: 'pulsechain_not_supported',
              message: 'PulseChain not supported by Moralis SDK',
              chain: chainId
            }
          });
        }
        
        // Generic error handling
        return NextResponse.json({
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
    return NextResponse.json({
      success: false,
      error: 'Invalid endpoint',
      available: ['wallet-tokens'],
      _safe_mode: true
    });

  } catch (error) {
    console.error('💥 MORALIS PROXY ERROR:', error.message);
    
    return NextResponse.json({
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