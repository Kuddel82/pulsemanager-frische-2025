// 🚀 TRANSACTION API - 100% MORALIS ONLY
// Enterprise-grade APIs für PulseManager mit echtem Moralis SDK

import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

let moralisInitialized = false;

export default async function handler(req, res) {
  console.log('🔥 TRANSACTION API: 100% MORALIS ONLY');
  console.log('🔥 Method:', req.method);
  
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
    const { endpoint, chain, address, type, limit } = params;
    
    console.log('🔥 Parameters:', { endpoint, chain, address, type, limit });

    // 🔑 Moralis API Configuration
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      return res.status(200).json({
        result: [],
        _error: { message: 'Moralis API Key not configured' }
      });
    }

    // 🎉 INITIALIZE MORALIS SDK - 100% MORALIS
    if (!moralisInitialized) {
      try {
        await Moralis.start({ apiKey: MORALIS_API_KEY });
        moralisInitialized = true;
        console.log('✅ MORALIS SDK INITIALIZED - 100% MORALIS ONLY');
      } catch (initError) {
        return res.status(500).json({
          result: [],
          _error: { message: 'Moralis SDK initialization failed' }
        });
      }
    }

    // 📊 Transaction Handling - 100% MORALIS ONLY
    if (endpoint === 'wallet-transactions') {
      
      try {
        console.log(`🚀 MORALIS TRANSACTIONS: ${address}`);
        
        // Default to Ethereum - 100% MORALIS
        const response = await Moralis.EvmApi.transaction.getWalletTransactions({
          address,
          chain: EvmChain.ETHEREUM
        });
        
        console.log(`✅ MORALIS SUCCESS: ${response.result.length} transactions`);
        
        return res.status(200).json({
          ...response,
          _moralis_only: true,
          _source: '100_percent_moralis'
        });
        
      } catch (moralisError) {
        console.error('💥 MORALIS ERROR:', moralisError.message);
        
        return res.status(500).json({
          result: [],
          _error: { 
            message: moralisError.message,
            source: '100_percent_moralis'
          }
        });
      }
    }

    // Invalid endpoint
    return res.status(400).json({
      success: false,
      error: 'Invalid endpoint',
      available: ['wallet-transactions'],
      _moralis_only: true
    });

  } catch (error) {
    console.error('💥 API ERROR:', error.message);
    return res.status(500).json({
      result: [],
      _error: { message: error.message }
    });
  }
} 