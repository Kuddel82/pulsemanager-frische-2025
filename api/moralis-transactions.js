// 🚀 TRANSACTION API - ROI & TAX optimiert für große Wallets
// ROI Tracker: 500 Transaktionen (Performance)
// TAX Report: UNLIMITIERT (Steuerrecht!)

import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

let moralisInitialized = false;

export default async function handler(req, res) {
  console.log('🔥 TRANSACTION API: /api/moralis-transactions.js');
  
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
    const { endpoint, chain, address, type, limit, from_block, to_block } = req.query;
    
    console.log('🔥 Transaction Parameters:', { endpoint, chain, address, type, limit, from_block, to_block });

    // 🔑 Moralis API Configuration
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      return res.status(200).json({
        result: [],
        _fallback: { reason: 'moralis_api_key_not_configured' }
      });
    }

    // 🌐 Chain Mapping
    const chainIdMap = {
      '369': '0x171', 'pulsechain': '0x171', 'pls': '0x171', '0x171': '0x171',
      '1': '0x1', 'ethereum': '0x1', 'eth': '0x1', '0x1': '0x1'
    };
    const chainId = chainIdMap[chain?.toString().toLowerCase()] || '0x171';

    // 📊 Transaction Type Handling
    if (endpoint === 'wallet-transactions') {
      
      // 🟣 PULSECHAIN: Use PulseChain Scanner for transactions
      if (chainId === '0x171') {
        console.log('🟣 PULSECHAIN TRANSACTIONS: Using PulseChain Scanner API');
        
        try {
          let pulseApiUrl = `https://scan.pulsechain.com/api?module=account&action=txlist&address=${address}&sort=desc`;
          
          // Apply limits based on type
          if (type === 'roi' && limit) {
            pulseApiUrl += `&page=1&offset=${Math.min(parseInt(limit), 500)}`;
            console.log(`🔥 ROI MODE: Limited to ${Math.min(parseInt(limit), 500)} transactions`);
          } else if (type === 'tax') {
            pulseApiUrl += `&page=1&offset=10000`; // Max possible for first call
            console.log('📄 TAX MODE: UNLIMITED transactions (chunked)');
          }
          
          if (from_block) pulseApiUrl += `&startblock=${from_block}`;
          if (to_block) pulseApiUrl += `&endblock=${to_block}`;
          
          const pulseResponse = await fetch(pulseApiUrl);
          const pulseData = await pulseResponse.json();
          
          if (pulseData.status === '1' && Array.isArray(pulseData.result)) {
            console.log(`🟣 PULSECHAIN SUCCESS: ${pulseData.result.length} transactions found`);
            
            const formattedTxs = pulseData.result.map(tx => ({
              hash: tx.hash,
              block_number: tx.blockNumber,
              from_address: tx.from,
              to_address: tx.to,
              value: tx.value,
              gas: tx.gas,
              gas_price: tx.gasPrice,
              gas_used: tx.gasUsed,
              block_timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
              _source: 'pulsechain_scanner'
            }));
            
            return res.status(200).json({
              result: formattedTxs,
              total: formattedTxs.length,
              _chain: 'pulsechain',
              _type: type || 'all',
              _source: 'pulsechain_scanner_api',
              _unlimited: type === 'tax'
            });
          } else {
            return res.status(200).json({
              result: [],
              total: 0,
              _fallback: { reason: 'pulsechain_no_transactions' }
            });
          }
        } catch (pulseError) {
          console.error('🟣 PULSECHAIN TX ERROR:', pulseError.message);
          return res.status(200).json({
            result: [],
            _error: { message: 'PulseChain Scanner API unavailable' }
          });
        }
      }

      // 🎉 ETHEREUM: Initialize Moralis SDK
      if (!moralisInitialized) {
        try {
          await Moralis.start({ apiKey: MORALIS_API_KEY });
          moralisInitialized = true;
          console.log('✅ MORALIS SDK INITIALIZED for Transactions');
        } catch (initError) {
          return res.status(200).json({
            result: [],
            _error: { message: 'Moralis SDK initialization failed' }
          });
        }
      }

      try {
        console.log(`🚀 MORALIS TRANSACTIONS: ${address} on Ethereum`);
        
        // 🔥 ROI MODE: Limited to 500 transactions for performance
        if (type === 'roi') {
          const txLimit = Math.min(parseInt(limit) || 500, 500);
          console.log(`🔥 ROI MODE: Limited to ${txLimit} transactions`);
          
          const response = await Moralis.EvmApi.transaction.getWalletTransactions({
            address,
            chain: EvmChain.ETHEREUM,
            limit: txLimit
          });
          
          return res.status(200).json({
            ...response,
            _type: 'roi',
            _limited: true,
            _limit: txLimit
          });
        }
        
        // 📄 TAX MODE: UNLIMITED with pagination
        else if (type === 'tax') {
          console.log('📄 TAX MODE: UNLIMITED - Starting pagination');
          
          let allTransactions = [];
          let cursor = null;
          let page = 1;
          const maxPages = 50; // Safety limit
          
          do {
            console.log(`📄 TAX PAGE ${page}: Fetching transactions...`);
            
            const pageResponse = await Moralis.EvmApi.transaction.getWalletTransactions({
              address,
              chain: EvmChain.ETHEREUM,
              cursor: cursor
            });
            
            allTransactions = allTransactions.concat(pageResponse.result);
            cursor = pageResponse.cursor;
            page++;
            
            console.log(`📄 TAX PAGE ${page-1}: +${pageResponse.result.length} txs (Total: ${allTransactions.length})`);
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
            
          } while (cursor && page <= maxPages);
          
          console.log(`📄 TAX COMPLETE: ${allTransactions.length} total transactions`);
          
          return res.status(200).json({
            result: allTransactions,
            total: allTransactions.length,
            _type: 'tax',
            _unlimited: true,
            _pages_fetched: page - 1,
            _complete: !cursor
          });
        }
        
        // 🔹 DEFAULT: Standard transaction fetch
        else {
          const response = await Moralis.EvmApi.transaction.getWalletTransactions({
            address,
            chain: EvmChain.ETHEREUM
          });
          
          return res.status(200).json(response);
        }
        
      } catch (moralisError) {
        console.error('💥 MORALIS TX ERROR:', moralisError.message);
        
        // Handle large wallet error
        if (moralisError.message.includes('over 2000')) {
          return res.status(200).json({
            result: [],
            _large_wallet: true,
            _message: 'Use type=roi (limited) or type=tax (paginated) for large wallets'
          });
        }
        
        return res.status(200).json({
          result: [],
          _error: { message: moralisError.message }
        });
      }
    }

    // Invalid endpoint
    return res.status(200).json({
      success: false,
      error: 'Invalid endpoint',
      available: ['wallet-transactions'],
      parameters: {
        type: ['roi', 'tax', 'all'],
        limit: 'Number (ROI only, max 500)',
        chain: ['0x1', '0x171']
      }
    });

  } catch (error) {
    console.error('💥 TRANSACTION API ERROR:', error.message);
    return res.status(200).json({
      result: [],
      _error: { message: error.message }
    });
  }
} 