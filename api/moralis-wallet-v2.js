// 🚀 MORALIS WALLET API V2 - MODERNE ENDPUNKTE
// Verwendet die neuen Moralis Wallet APIs für maximale Performance

import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

let moralisInitialized = false;

// 🗺️ SUPPORTED CHAINS (PulseChain noch nicht supported)
const SUPPORTED_CHAINS = {
  '1': EvmChain.ETHEREUM,
  '56': EvmChain.BSC,
  '137': EvmChain.POLYGON,
  '43114': EvmChain.AVALANCHE,
  '250': EvmChain.FANTOM
};

export default async function handler(req, res) {
  console.log('🔥 MORALIS WALLET API V2 - MODERNE ENDPUNKTE');
  console.log('🔥 Method:', req.method);
  console.log('🔥 Endpoint:', req.query.endpoint);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract parameters
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { endpoint, chain = '1', address } = params;
    
    console.log('🔥 Parameters:', { endpoint, chain, address });

    // 🔑 Moralis API Configuration
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      return res.status(200).json({
        result: null,
        _error: { message: 'Moralis API Key not configured' }
      });
    }

    // 🎉 INITIALIZE MORALIS SDK
    if (!moralisInitialized) {
      try {
        await Moralis.start({ apiKey: MORALIS_API_KEY });
        moralisInitialized = true;
        console.log('✅ MORALIS SDK INITIALIZED - V2 APIs');
      } catch (initError) {
        console.error('💥 Moralis init failed:', initError);
        return res.status(500).json({
          result: null,
          _error: { message: 'Moralis SDK initialization failed' }
        });
      }
    }

    // ⚠️ CHECK CHAIN SUPPORT
    if (chain === '369') {
      console.warn('⚠️ PulseChain (369) not supported by Moralis Enterprise APIs');
      return res.status(200).json({
        result: null,
        _error: { 
          message: 'PulseChain (369) is not supported by Moralis Enterprise APIs',
          chain: chain,
          supported_chains: Object.keys(SUPPORTED_CHAINS),
          _moralis_limitation: true
        }
      });
    }

    const moralisChain = SUPPORTED_CHAINS[chain] || EvmChain.ETHEREUM;

    // 🚀 API ENDPOINTS

    // 📊 WALLET NET WORTH - Portfolio in USD
    if (endpoint === 'net-worth') {
      try {
        console.log(`🚀 WALLET NET WORTH: ${address} on chain ${chain}`);
        
        const response = await Moralis.EvmApi.wallets.getWalletNetWorth({
          address,
          chain: moralisChain,
          excludeSpam: true,
          excludeUnverifiedContracts: true,
          maxTokenInactivity: 30, // 30 days
          minPairSideLiquidityUsd: 1000 // $1000 min liquidity
        });
        
        console.log(`✅ NET WORTH SUCCESS: $${response.result.total_networth_usd}`);
        
        return res.status(200).json({
          result: response.result,
          _moralis_v2: true,
          _source: 'wallet_net_worth_api',
          _filters_applied: {
            spam_excluded: true,
            unverified_excluded: true,
            min_liquidity_usd: 1000,
            max_token_inactivity_days: 30
          }
        });
        
      } catch (error) {
        console.error('💥 NET WORTH ERROR:', error.message);
        return res.status(500).json({
          result: null,
          _error: { message: error.message, source: 'wallet_net_worth_api' }
        });
      }
    }

    // 📈 WALLET HISTORY - Complete Transaction History
    if (endpoint === 'history') {
      try {
        const { cursor, limit = 100, include_internal_transactions = true } = params;
        
        console.log(`🚀 WALLET HISTORY: ${address} on chain ${chain}`);
        
        const response = await Moralis.EvmApi.wallets.getWalletHistory({
          address,
          chain: moralisChain,
          cursor,
          limit: Math.min(limit, 100), // Max 100 per call
          order: 'DESC',
          include_internal_transactions,
          nft_metadata: false // Disable for performance
        });
        
        console.log(`✅ HISTORY SUCCESS: ${response.result.length} transactions`);
        
        return res.status(200).json({
          result: response.result,
          cursor: response.cursor,
          page_size: response.page_size,
          _moralis_v2: true,
          _source: 'wallet_history_api',
          _includes: {
            erc20_transfers: true,
            nft_transfers: true,
            native_transfers: true,
            internal_transactions: include_internal_transactions
          }
        });
        
      } catch (error) {
        console.error('💥 HISTORY ERROR:', error.message);
        return res.status(500).json({
          result: [],
          _error: { message: error.message, source: 'wallet_history_api' }
        });
      }
    }

    // 📊 WALLET STATS - Analytics
    if (endpoint === 'stats') {
      try {
        console.log(`🚀 WALLET STATS: ${address} on chain ${chain}`);
        
        const response = await Moralis.EvmApi.wallets.getWalletStats({
          address,
          chain: moralisChain
        });
        
        console.log(`✅ STATS SUCCESS: ${response.result.transactions.total} total transactions`);
        
        return res.status(200).json({
          result: response.result,
          _moralis_v2: true,
          _source: 'wallet_stats_api'
        });
        
      } catch (error) {
        console.error('💥 STATS ERROR:', error.message);
        return res.status(500).json({
          result: null,
          _error: { message: error.message, source: 'wallet_stats_api' }
        });
      }
    }

    // 💰 WALLET TRANSACTIONS - Native Transactions (Backup)
    if (endpoint === 'transactions') {
      try {
        const { cursor, limit = 100, include = 'internal_transactions' } = params;
        
        console.log(`🚀 WALLET TRANSACTIONS: ${address} on chain ${chain}`);
        
        const response = await Moralis.EvmApi.transaction.getWalletTransactions({
          address,
          chain: moralisChain,
          cursor,
          limit: Math.min(limit, 100),
          order: 'DESC',
          include
        });
        
        console.log(`✅ TRANSACTIONS SUCCESS: ${response.result.length} native transactions`);
        
        return res.status(200).json({
          result: response.result,
          cursor: response.cursor,
          page_size: response.page_size,
          _moralis_v2: true,
          _source: 'wallet_transactions_api',
          _type: 'native_transactions_only'
        });
        
      } catch (error) {
        console.error('💥 TRANSACTIONS ERROR:', error.message);
        return res.status(500).json({
          result: [],
          _error: { message: error.message, source: 'wallet_transactions_api' }
        });
      }
    }

    // Invalid endpoint
    return res.status(400).json({
      success: false,
      error: 'Invalid endpoint',
      available_endpoints: ['net-worth', 'history', 'stats', 'transactions'],
      _moralis_v2: true
    });

  } catch (error) {
    console.error('💥 API ERROR:', error.message);
    return res.status(500).json({
      result: null,
      _error: { message: error.message }
    });
  }
} 