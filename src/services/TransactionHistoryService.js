// 🎯 TRANSACTION HISTORY SERVICE - MORALIS API
// Version: 2.0
// Datum: 2025-01-11 - Standard Moralis APIs

import { logger } from '@/lib/logger';

/**
 * 🎯 TRANSACTION HISTORY SERVICE
 * Fetches transaction history via Moralis APIs
 */

// 🚀 MORALIS API ENDPOINTS
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

export class TransactionHistoryService {
  static API_TIMEOUT = 30000; // 30 Sekunden
  static MAX_TRANSACTIONS = 1000; // Limit für Performance
  static SUPPORTED_CHAINS = ['eth', 'pulsechain'];

  static transactionCache = new Map();
  static CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

  /**
   * 🔑 Check Moralis Access
   */
  static checkMoralisAccess() {
    const apiKey = import.meta.env.VITE_MORALIS_API_KEY;
    if (!apiKey) {
      throw new Error('MORALIS API KEY REQUIRED: Transaction history needs Moralis API access');
    }
    return apiKey;
  }

  /**
   * 🎯 MAIN: Fetch transaction history (Standard MORALIS)
   * @param {string} walletAddress - Wallet to analyze
   * @param {string} chain - Blockchain (eth, pulsechain)
   * @param {number} limit - Max transactions to fetch
   * @returns {Promise<Object>} Transaction history data
   */
  static async getTransactionHistory(walletAddress, chain = 'eth', limit = 300000) {
    if (!walletAddress || !this.SUPPORTED_CHAINS.includes(chain)) {
      throw new Error('Invalid wallet address or unsupported chain');
    }

    console.log(`🚀 MORALIS: Starting transaction history for ${walletAddress}`);

    // 🔑 CHECK MORALIS ACCESS
    let apiKey;
    try {
      apiKey = this.checkMoralisAccess();
    } catch (error) {
      console.error(`🚨 CRITICAL: Moralis API not available! Transaction history requires paid Moralis API key.`);
      throw new Error('API ERROR: Moralis API Key required for transaction history');
    }

    const cacheKey = `${walletAddress}_${chain}_${limit}`;
    
    // Check cache
    const cached = this.transactionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_DURATION)) {
      console.log(`✅ Returning cached transaction history for ${walletAddress}`);
      return cached.data;
    }

    try {
      // 🔄 CSP FIX: Verwende Proxy-API statt direkter Moralis-Aufrufe
      console.log(`🔍 Fetching transaction history via PROXY: ${limit} transactions max`);

      const [nativeResponse, erc20Response] = await Promise.all([
        fetch(`/api/moralis-proxy?endpoint=transactions&address=${walletAddress}&chain=${chain}&limit=${limit}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }),
        fetch(`/api/moralis-proxy?endpoint=erc20-transfers&address=${walletAddress}&chain=${chain}&limit=${limit}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })
      ]);

      if (!nativeResponse.ok || !erc20Response.ok) {
        throw new Error(`Proxy API Error: ${nativeResponse.status || erc20Response.status}`);
      }

      const [nativeData, erc20Data] = await Promise.all([
        nativeResponse.json(),
        erc20Response.json()
      ]);

      // 3. Process and combine transactions
      const nativeTransactions = this.processNativeTransactions(nativeData.result || [], walletAddress);
      const tokenTransactions = this.processTokenTransactions(erc20Data.result || [], walletAddress);
      
      // 4. Combine and sort by timestamp
      const allTransactions = [...nativeTransactions, ...tokenTransactions]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      // 5. Calculate summary statistics
      const summary = this.calculateTransactionSummary(allTransactions, walletAddress);

      const result = {
        wallet: walletAddress,
        chain: chain,
        transactions: allTransactions,
        count: allTransactions.length,
        summary: summary,
        timestamp: new Date().toISOString(),
        source: 'moralis',
        success: true
      };

      // Cache result
      this.transactionCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`✅ Transaction history completed: ${allTransactions.length} transactions found`);
      return result;

    } catch (error) {
      console.error(`💥 Transaction history error for ${walletAddress}:`, error);
      
      return {
        wallet: walletAddress,
        chain: chain,
        transactions: [],
        count: 0,
        error: error.message,
        timestamp: new Date().toISOString(),
        source: 'moralis'
      };
    }
  }

  /**
   * 🔄 Process Native Transactions (ETH/PLS transfers)
   */
  static processNativeTransactions(transactions, walletAddress) {
    return transactions.map(tx => ({
      hash: tx.hash,
      type: 'native',
      direction: tx.from_address?.toLowerCase() === walletAddress.toLowerCase() ? 'out' : 'in',
      from: tx.from_address,
      to: tx.to_address,
      value: tx.value,
      valueFormatted: parseFloat(tx.value) / Math.pow(10, 18),
      symbol: tx.native_token?.symbol || 'ETH',
      gasUsed: tx.gas_used,
      gasPrice: tx.gas_price,
      timestamp: tx.block_timestamp,
      blockNumber: tx.block_number,
      status: tx.receipt_status === '1' ? 'success' : 'failed'
    }));
  }

  /**
   * 🔄 Process Token Transactions (ERC20 transfers)
   */
  static processTokenTransactions(transfers, walletAddress) {
    return transfers.map(transfer => ({
      hash: transfer.transaction_hash,
      type: 'token',
      direction: transfer.from_address?.toLowerCase() === walletAddress.toLowerCase() ? 'out' : 'in',
      from: transfer.from_address,
      to: transfer.to_address,
      value: transfer.value,
      valueFormatted: parseFloat(transfer.value) / Math.pow(10, transfer.token?.decimals || 18),
      symbol: transfer.token?.symbol || 'TOKEN',
      tokenAddress: transfer.token?.contract_address,
      timestamp: transfer.block_timestamp,
      blockNumber: transfer.block_number
    }));
  }

  /**
   * 📊 Calculate Transaction Summary
   */
  static calculateTransactionSummary(transactions, walletAddress) {
    const summary = {
      total: transactions.length,
      incoming: 0,
      outgoing: 0,
      failed: 0,
      totalVolume: 0,
      uniqueTokens: new Set(),
      dateRange: {
        first: null,
        last: null
      }
    };

    transactions.forEach(tx => {
      if (tx.direction === 'in') summary.incoming++;
      if (tx.direction === 'out') summary.outgoing++;
      if (tx.status === 'failed') summary.failed++;
      
      summary.totalVolume += tx.valueFormatted || 0;
      summary.uniqueTokens.add(tx.symbol);
      
      const txDate = new Date(tx.timestamp);
      if (!summary.dateRange.first || txDate < summary.dateRange.first) {
        summary.dateRange.first = txDate;
      }
      if (!summary.dateRange.last || txDate > summary.dateRange.last) {
        summary.dateRange.last = txDate;
      }
    });

    summary.uniqueTokens = summary.uniqueTokens.size;
    return summary;
  }

  /**
   * 🔍 Get Transaction by Hash
   */
  static async getTransactionByHash(hash, chain = 'eth') {
    const apiKey = this.checkMoralisAccess();

    try {
      const response = await fetch(`${MORALIS_BASE_URL}/transaction/${hash}?chain=${chain}`, {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Transaction not found: ${hash}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`Failed to get transaction ${hash}:`, error);
      throw error;
    }
  }

  /**
   * 🧹 Clear Transaction Cache
   */
  static clearCache() {
    this.transactionCache.clear();
    console.log('🧹 Transaction history cache cleared');
  }
}

export default TransactionHistoryService; 