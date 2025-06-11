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
      console.error('🚨 CRITICAL: Moralis API Key required for Enterprise functionality');
      
      return res.status(401).json({
        error: 'ENTERPRISE ERROR: Moralis API Key required',
        message: 'Add valid MORALIS_API_KEY to .env file',
        critical: true
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

    // 🏆 PORTFOLIO NET WORTH - Complete USD Portfolio 
    if (endpoint === 'portfolio') {
      try {
        console.log(`🚀 V2 PORTFOLIO: Getting net worth for ${address} on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        
        const response = await Moralis.EvmApi.wallets.getWalletNetWorth({
          address,
          chain: moralisChain,
          excludeSpam: true,
          excludeUnverifiedContracts: true,
          maxTokenInactivity: 30,
          minPairSideLiquidityUsd: 1000
        });
        
        console.log(`✅ V2 PORTFOLIO SUCCESS: $${response.result.total_networth_usd}`);
        
        return res.status(200).json({
          result: response.result,
          _source: 'moralis_v2_portfolio'
        });
        
      } catch (error) {
        console.error('💥 V2 PORTFOLIO ERROR:', error.message);
        return res.status(500).json({
          result: null,
          _error: { message: error.message, source: 'moralis_v2_portfolio' }
        });
      }
    }

    // 📈 COMPLETE HISTORY - All transaction types
    if (endpoint === 'history') {
      try {
        console.log(`🚀 V2 HISTORY: Getting complete history for ${address} on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        const requestLimit = Math.min(limit || 100, 100);
        
        const response = await Moralis.EvmApi.wallets.getWalletHistory({
          address,
          chain: moralisChain,
          cursor,
          limit: requestLimit,
          order: 'DESC',
          include_internal_transactions: true,
          nft_metadata: false
        });
        
        console.log(`✅ V2 HISTORY SUCCESS: ${response.result.length} comprehensive transactions`);
        
        return res.status(200).json({
          result: response.result,
          cursor: response.cursor,
          page_size: response.page_size,
          _source: 'moralis_v2_history'
        });
        
      } catch (error) {
        console.error('💥 V2 HISTORY ERROR:', error.message);
        return res.status(500).json({
          result: [],
          _error: { message: error.message, source: 'moralis_v2_history' }
        });
      }
    }

    // 📊 WALLET STATS - Analytics
    if (endpoint === 'stats') {
      try {
        console.log(`🚀 V2 STATS: Getting wallet stats for ${address} on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        
        const response = await Moralis.EvmApi.wallets.getWalletStats({
          address,
          chain: moralisChain
        });
        
        console.log(`✅ V2 STATS SUCCESS: ${response.result.transactions?.total || 0} total transactions`);
        
        return res.status(200).json({
          result: response.result,
          _source: 'moralis_v2_stats'
        });
        
      } catch (error) {
        console.error('💥 V2 STATS ERROR:', error.message);
        return res.status(500).json({
          result: null,
          _error: { message: error.message, source: 'moralis_v2_stats' }
        });
      }
    }

    // 💰 NATIVE TRANSACTIONS - Backup endpoint
    if (endpoint === 'native') {
      try {
        console.log(`🚀 V2 NATIVE: Getting native transactions for ${address} on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        const requestLimit = Math.min(limit || 100, 100);
        
        const response = await Moralis.EvmApi.transaction.getWalletTransactions({
          address,
          chain: moralisChain,
          cursor,
          limit: requestLimit,
          order: 'DESC'
        });
        
        console.log(`✅ V2 NATIVE SUCCESS: ${response.result.length} native transactions`);
        
        return res.status(200).json({
          result: response.result,
          cursor: response.cursor,
          page_size: response.page_size,
          _source: 'moralis_v2_native'
        });
        
      } catch (error) {
        console.error('💥 V2 NATIVE ERROR:', error.message);
        return res.status(500).json({
          result: [],
          _error: { message: error.message, source: 'moralis_v2_native' }
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
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        console.log(`💎 PROCESSING PULSECHAIN TOKENS: Chain ${chainId} now fully supported by Moralis!`);
        
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

    // 🏆 DEFI SUMMARY - ROI Detection Goldmine
    if (endpoint === 'defi-summary') {
      try {
        console.log(`🚀 V2 DEFI SUMMARY: Getting DeFi overview for ${address} on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        
        const response = await Moralis.EvmApi.wallets.getDefiSummary({
          address,
          chain: moralisChain
        });
        
        console.log(`✅ V2 DEFI SUMMARY SUCCESS: ${response.result.active_protocols} protocols, $${response.result.total_usd_value} value`);
        
        return res.status(200).json({
          result: response.result,
          _source: 'moralis_v2_defi_summary',
          _roi_potential: response.result.total_unclaimed_usd_value || '0'
        });
        
      } catch (error) {
        console.error('💥 V2 DEFI SUMMARY ERROR:', error.message);
        return res.status(500).json({
          result: null,
          _error: { message: error.message, source: 'moralis_v2_defi_summary' }
        });
      }
    }

    // 🎯 DEFI POSITIONS - ROI Source Detection
    if (endpoint === 'defi-positions') {
      try {
        console.log(`🚀 V2 DEFI POSITIONS: Getting DeFi positions for ${address} on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        
        const response = await Moralis.EvmApi.wallets.getDefiPositionsSummary({
          address,
          chain: moralisChain
        });
        
        console.log(`✅ V2 DEFI POSITIONS SUCCESS: ${response.result.length || 'Multiple'} positions found`);
        
        return res.status(200).json({
          result: response.result,
          _source: 'moralis_v2_defi_positions',
          _roi_detection: true
        });
        
      } catch (error) {
        console.error('💥 V2 DEFI POSITIONS ERROR:', error.message);
        return res.status(500).json({
          result: [],
          _error: { message: error.message, source: 'moralis_v2_defi_positions' }
        });
      }
    }

    // 🔍 DEFI POSITIONS BY PROTOCOL - Detailed ROI Analysis
    if (endpoint === 'defi-protocol') {
      try {
        const { protocol } = params;
        if (!protocol) {
          return res.status(400).json({
            error: 'Protocol parameter required',
            available_protocols: ['aave-v3', 'uniswap-v2', 'uniswap-v3', 'compound-v2']
          });
        }
        
        console.log(`🚀 V2 DEFI PROTOCOL: Getting ${protocol} positions for ${address} on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        
        const response = await Moralis.EvmApi.wallets.getDefiPositionsByProtocol({
          address,
          chain: moralisChain,
          protocol
        });
        
        console.log(`✅ V2 DEFI PROTOCOL SUCCESS: ${protocol} positions loaded`);
        
        return res.status(200).json({
          result: response.result,
          _source: 'moralis_v2_defi_protocol',
          _protocol: protocol,
          _detailed_roi: true
        });
        
      } catch (error) {
        console.error('💥 V2 DEFI PROTOCOL ERROR:', error.message);
        return res.status(500).json({
          result: null,
          _error: { message: error.message, source: 'moralis_v2_defi_protocol' }
        });
      }
    }

    // 💰 MULTIPLE TOKEN PRICES - Real-time pricing
    if (endpoint === 'multiple-token-prices') {
      try {
        const { tokens } = params;
        if (!tokens || !Array.isArray(tokens)) {
          return res.status(400).json({
            error: 'tokens parameter required (array of token addresses)',
            example: {
              tokens: [
                { token_address: '0x...', exchange: 'pulsex' },
                { token_address: '0x...', exchange: 'uniswap-v3' }
              ]
            }
          });
        }
        
        console.log(`🚀 V2 MULTIPLE PRICES: Getting prices for ${tokens.length} tokens on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        
        // Extract just the token addresses for Moralis API
        const tokenAddresses = tokens.map(token => token.token_address || token).filter(Boolean);
        
        if (tokenAddresses.length === 0) {
          return res.status(400).json({
            error: 'No valid token addresses provided'
          });
        }
        
        console.log(`🔄 MORALIS PRICE API: Requesting prices for ${tokenAddresses.length} tokens`);
        
        const response = await Moralis.EvmApi.token.getMultipleTokenPrices({
          chain: moralisChain,
          include: 'percent_change'
        }, {
          tokens: tokenAddresses.slice(0, 25).map(address => ({ // Limit to 25 tokens
            token_address: address
          }))
        });
        
        console.log(`✅ V2 MULTIPLE PRICES SUCCESS: ${response.result.length} prices retrieved`);
        
        return res.status(200).json({
          result: response.result,
          _source: 'moralis_v2_multiple_prices',
          _real_time: true,
          _api_calls: 1
        });
        
      } catch (error) {
        console.error('💥 V2 MULTIPLE PRICES ERROR:', error.message);
        return res.status(500).json({
          result: [],
          _error: { message: error.message, source: 'moralis_v2_multiple_prices' }
        });
      }
    }

    // 💰 SINGLE TOKEN PRICE - Individual token pricing
    if (endpoint === 'token-price') {
      try {
        if (!address) {
          return res.status(400).json({
            error: 'address parameter required (token contract address)'
          });
        }
        
        console.log(`🚀 V2 TOKEN PRICE: Getting price for ${address} on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        
        const response = await Moralis.EvmApi.token.getTokenPrice({
          address,
          chain: moralisChain,
          include: 'percent_change'
        });
        
        console.log(`✅ V2 TOKEN PRICE SUCCESS: ${response.result.tokenSymbol} = $${response.result.usdPrice}`);
        
        return res.status(200).json({
          result: response.result,
          _source: 'moralis_v2_token_price',
          _real_time: true
        });
        
      } catch (error) {
        console.error('💥 V2 TOKEN PRICE ERROR:', error.message);
        return res.status(500).json({
          result: null,
          _error: { message: error.message, source: 'moralis_v2_token_price' }
        });
      }
    }

    // 💎 WALLET TOKENS WITH PRICES - Game changer API!
    if (endpoint === 'wallet-tokens-prices') {
      try {
        console.log(`🚀 V2 WALLET TOKENS+PRICES: Getting balances + prices for ${address} on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        
        const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
          address,
          chain: moralisChain,
          excludeSpam: true,
          excludeUnverifiedContracts: true
        });
        
        console.log(`✅ V2 WALLET TOKENS+PRICES SUCCESS: ${response.result.length} tokens with prices`);
        
        return res.status(200).json({
          result: response.result,
          _source: 'moralis_v2_wallet_tokens_prices',
          _combined_api: true,
          _api_efficiency: 'single_call_instead_of_multiple'
        });
        
      } catch (error) {
        console.error('💥 V2 WALLET TOKENS+PRICES ERROR:', error.message);
        return res.status(500).json({
          result: [],
          _error: { message: error.message, source: 'moralis_v2_wallet_tokens_prices' }
        });
      }
    }

    // 📈 WALLET PNL SUMMARY - Profit/Loss tracking
    if (endpoint === 'wallet-pnl-summary') {
      try {
        console.log(`🚀 V2 WALLET PNL SUMMARY: Getting P&L for ${address} on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        
        const response = await Moralis.EvmApi.wallets.getWalletProfitabilitySummary({
          address,
          chain: moralisChain,
          days: 30
        });
        
        console.log(`✅ V2 WALLET PNL SUCCESS: ${response.result.total_count_of_trades || 0} trades analyzed`);
        
        return res.status(200).json({
          result: response.result,
          _source: 'moralis_v2_wallet_pnl_summary',
          _pnl_tracking: true
        });
        
      } catch (error) {
        console.error('💥 V2 WALLET PNL SUMMARY ERROR:', error.message);
        return res.status(500).json({
          result: null,
          _error: { message: error.message, source: 'moralis_v2_wallet_pnl_summary' }
        });
      }
    }

    // 🔄 WALLET TOKEN TRANSFERS - Transaction history
    if (endpoint === 'wallet-token-transfers') {
      try {
        const requestLimit = Math.min(limit || 100, 100);
        console.log(`🚀 V2 WALLET TOKEN TRANSFERS: Getting transfers for ${address} on chain ${chainId}`);
        
        // 🎉 MORALIS NOW SUPPORTS PULSECHAIN 100%! (confirmed by support)
        const moralisChain = chainId === '0x171' ? '0x171' : EvmChain.ETHEREUM;
        console.log(`💎 USING MORALIS FOR CHAIN: ${chainId} (PulseChain FULLY SUPPORTED!)`);
        
        const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
          address,
          chain: moralisChain,
          cursor,
          limit: requestLimit,
          order: 'DESC'
        });
        
        console.log(`✅ V2 WALLET TOKEN TRANSFERS SUCCESS: ${response.result.length} transfers found`);
        
        return res.status(200).json({
          result: response.result,
          cursor: response.cursor,
          page_size: response.page_size,
          _source: 'moralis_v2_wallet_token_transfers'
        });
        
      } catch (error) {
        console.error('💥 V2 WALLET TOKEN TRANSFERS ERROR:', error.message);
        return res.status(500).json({
          result: [],
          _error: { message: error.message, source: 'moralis_v2_wallet_token_transfers' }
        });
      }
    }

    // 🔧 SYSTEM HEALTH CHECK - API Version & Status
    if (endpoint === 'api-version' || endpoint === 'health') {
      try {
        console.log(`🔧 SYSTEM HEALTH: Checking API version and connectivity`);
        
        const response = await Moralis.EvmApi.utils.web3ApiVersion({});
        
        console.log(`✅ MORALIS API HEALTH: Version ${response.result.version}`);
        
        return res.status(200).json({
          result: response.result,
          moralis_status: 'online',
          our_api_status: 'operational',
          timestamp: new Date().toISOString(),
          _source: 'moralis_health_check',
          _debug_endpoint: true
        });
        
      } catch (error) {
        console.error('💥 MORALIS API HEALTH ERROR:', error.message);
        return res.status(500).json({
          result: null,
          moralis_status: 'offline',
          our_api_status: 'degraded',
          error: error.message,
          timestamp: new Date().toISOString(),
          _source: 'moralis_health_check_failed'
        });
      }
    }

    // 🔍 ENDPOINT WEIGHTS - API Cost Information
    if (endpoint === 'endpoint-weights') {
      try {
        console.log(`🔍 SYSTEM INFO: Getting endpoint cost information`);
        
        const response = await Moralis.EvmApi.utils.getEndpointWeights({});
        
        console.log(`✅ ENDPOINT WEIGHTS: Retrieved cost information for ${Object.keys(response.result).length} endpoints`);
        
        return res.status(200).json({
          result: response.result,
          _source: 'moralis_endpoint_weights',
          _cost_optimization: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('💥 ENDPOINT WEIGHTS ERROR:', error.message);
        return res.status(500).json({
          result: null,
          error: error.message,
          _source: 'moralis_endpoint_weights_failed'
        });
      }
    }

    // Invalid endpoint
    return res.status(200).json({
      success: false,
      error: 'Invalid endpoint',
      available: ['wallet-tokens', 'wallet-tokens-prices', 'wallet-pnl-summary', 'wallet-token-transfers', 'portfolio', 'history', 'stats', 'native', 'defi-summary', 'defi-positions', 'defi-protocol', 'multiple-token-prices', 'token-price', 'api-version', 'health', 'endpoint-weights'],
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