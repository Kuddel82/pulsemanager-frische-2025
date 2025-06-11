// 🎯 TRANSACTION HISTORY SERVICE - 100% MORALIS ENTERPRISE ONLY
// Eliminiert ALLE kostenlosen APIs für maximale Zuverlässigkeit
// Datum: 2025-01-11 - ENTERPRISE ONLY: Nur bezahlte Moralis APIs

import { supabase } from '@/lib/supabaseClient';
import { TokenPriceService } from './tokenPriceService';

export class TransactionHistoryService {
  
  // 🚀 100% MORALIS ENTERPRISE ENDPOINTS
  static MORALIS_ENDPOINTS = {
    tokenTransfers: '/api/moralis-token-transfers',
    transactions: '/api/moralis-transactions',
    prices: '/api/moralis-prices'
  };
  
  static MAX_TRANSACTIONS_PER_CALL = 100; // Moralis limit
  static RETRY_ATTEMPTS = 3;
  static RETRY_DELAY = 2000; // 2 seconds
  
  // 🏷️ ROI Transaction Classifications
  static ROI_INDICATORS = {
    KNOWN_ROI_TOKENS: [
      '0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d', // INC
      '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', // HEX
    ],
    MIN_ROI_VALUE: 0.001,
    MAX_SINGLE_ROI: 10000,
    KNOWN_ROI_SOURCES: [
      '0x0000000000000000000000000000000000000000', // Mint/Burn
    ]
  };

  /**
   * 🔑 Check Moralis Enterprise Access
   */
  static async checkMoralisAccess() {
    try {
      const response = await fetch('/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=0x0000000000000000000000000000000000000000&limit=1');
      const data = await response.json();
      return !data._fallback && !data._error && response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 🎯 MAIN: Fetch transaction history (100% MORALIS ENTERPRISE)
   */
  static async fetchAndStoreTransactionHistory(walletAddress, userId, options = {}) {
    const {
      forceRefresh = false,
      onProgress = null
    } = options;
    
    console.log(`🚀 MORALIS ENTERPRISE: Starting transaction history for ${walletAddress}`);
    
    // 🔑 CHECK MORALIS ENTERPRISE ACCESS
    const hasMoralisAccess = await this.checkMoralisAccess();
    
    if (!hasMoralisAccess) {
      console.error(`🚨 CRITICAL: Moralis Enterprise API not available! Transaction history requires paid Moralis API key.`);
      throw new Error('ENTERPRISE ERROR: Moralis API Key required for transaction history');
    }

    try {
      // 1. Check existing data (unless force refresh)
      if (!forceRefresh) {
        const existingData = await this.getLatestTransactionTimestamp(userId, walletAddress);
        if (existingData && this.isRecentEnough(existingData.timestamp)) {
          console.log(`✅ Recent transaction data exists, returning stored data`);
          return await this.getStoredTransactions(userId, walletAddress);
        }
      }
      
      // 2. Fetch all token transfers via Moralis Enterprise
      const allTransactions = await this.fetchAllTokenTransfersMoralis(walletAddress, onProgress);
      
      // 3. Process and classify transactions
      const processedTransactions = await this.processTransactions(allTransactions, walletAddress, userId);
      
      // 4. Store in Supabase
      const storedCount = await this.storeTransactions(processedTransactions, userId);
      
      console.log(`✅ MORALIS ENTERPRISE HISTORY COMPLETE: ${storedCount} transactions stored`);
      
      return {
        success: true,
        totalFetched: allTransactions.length,
        totalProcessed: processedTransactions.length,
        totalStored: storedCount,
        transactions: processedTransactions,
        source: 'moralis_enterprise'
      };
      
    } catch (error) {
      console.error('❌ MORALIS ENTERPRISE: Transaction history fetch failed:', error);
      throw error;
    }
  }
  
  /**
   * 📥 Fetch token transfers via Moralis Enterprise
   */
  static async fetchAllTokenTransfersMoralis(walletAddress, onProgress = null) {
    const allTransactions = [];
    let cursor = null;
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      try {
        console.log(`📦 MORALIS: Fetching page ${page}...`);
        
        const requestBody = {
          address: walletAddress,
          chain: '0x171', // PulseChain
          limit: this.MAX_TRANSACTIONS_PER_CALL
        };
        
        if (cursor) {
          requestBody.cursor = cursor;
        }
        
        const response = await fetch(this.MORALIS_ENDPOINTS.tokenTransfers, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          console.error(`❌ MORALIS API Error: ${response.status}`);
          break;
        }
        
        const data = await response.json();
        
        if (data.result && Array.isArray(data.result)) {
          const transactions = data.result;
          allTransactions.push(...transactions);
          
          console.log(`📊 MORALIS Page ${page}: ${transactions.length} transactions`);
          
          // Progress callback
          if (onProgress) {
            onProgress({
              page,
              currentCount: allTransactions.length,
              lastBatch: transactions.length,
              source: 'moralis_enterprise'
            });
          }
          
          // Check for more pages
          if (data.cursor && transactions.length === this.MAX_TRANSACTIONS_PER_CALL) {
            cursor = data.cursor;
            page++;
          } else {
            hasMore = false;
          }
        } else {
          console.log(`⚠️ MORALIS: No more results or API error`);
          hasMore = false;
        }
        
        // Rate limiting delay
        await this.delay(200);
        
      } catch (error) {
        console.error(`❌ MORALIS: Error fetching page ${page}:`, error);
        hasMore = false;
      }
    }
    
    console.log(`🎯 MORALIS TOTAL TRANSACTIONS FETCHED: ${allTransactions.length}`);
    return allTransactions;
  }
  
  /**
   * ⚙️ Process Moralis transactions
   */
  static async processTransactions(rawTransactions, walletAddress, userId) {
    const processed = [];
    
    console.log(`🔄 MORALIS: Processing ${rawTransactions.length} transactions...`);
    
    for (const tx of rawTransactions) {
      try {
        // Skip outgoing transactions - focus on incoming (ROI)
        if (tx.to_address?.toLowerCase() !== walletAddress.toLowerCase()) {
          continue;
        }
        
        // Get token price via Moralis
        const tokenPrice = await TokenPriceService.getTokenPrice(
          tx.token_symbol, 
          tx.address, 
          '0x171'
        );
        
        // Calculate amounts
        const amountFormatted = parseFloat(tx.value) / Math.pow(10, parseInt(tx.token_decimals || 18));
        const valueUSD = tokenPrice ? amountFormatted * tokenPrice : null;
        
        // Classify as ROI
        const isROI = this.classifyAsROI(tx, amountFormatted, valueUSD);
        const sourceType = this.determineSourceType(tx);
        
        const processedTx = {
          tx_hash: tx.transaction_hash,
          block_number: parseInt(tx.block_number),
          block_timestamp: new Date(tx.block_timestamp).toISOString(),
          
          // Token details from Moralis
          contract_address: tx.address,
          token_symbol: tx.token_symbol,
          token_name: tx.token_name,
          decimals: parseInt(tx.token_decimals || 18),
          
          // Transfer details
          amount_raw: tx.value,
          amount: amountFormatted,
          direction: 'in',
          
          // Price & value via Moralis
          value_usd: valueUSD,
          
          // Classification
          tx_type: 'transfer',
          is_roi_transaction: isROI,
          roi_source_type: sourceType,
          
          // Addresses
          from_address: tx.from_address,
          to_address: tx.to_address,
          wallet_address: walletAddress,
          
          // Chain info
          chain_id: 369, // PulseChain
          
          // Metadata
          user_id: userId,
          data_source: 'moralis_enterprise'
        };
        
        processed.push(processedTx);
        
      } catch (error) {
        console.error(`❌ MORALIS: Error processing transaction ${tx.transaction_hash}:`, error);
      }
    }
    
    // Sort by timestamp (newest first)
    processed.sort((a, b) => new Date(b.block_timestamp) - new Date(a.block_timestamp));
    
    console.log(`✅ MORALIS: Processed ${processed.length} transactions (${processed.filter(t => t.is_roi_transaction).length} ROI)`);
    return processed;
  }
  
  /**
   * 🤖 Classify transaction as ROI (same logic)
   */
  static classifyAsROI(tx, amount, valueUSD) {
    // Known ROI tokens
    if (this.ROI_INDICATORS.KNOWN_ROI_TOKENS.includes(tx.address)) {
      return true;
    }
    
    // Mint transactions
    if (tx.from_address === '0x0000000000000000000000000000000000000000') {
      return true;
    }
    
    // Value-based classification
    if (valueUSD && valueUSD >= this.ROI_INDICATORS.MIN_ROI_VALUE && valueUSD <= this.ROI_INDICATORS.MAX_SINGLE_ROI) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 🏷️ Determine source type (same logic)
   */
  static determineSourceType(tx) {
    if (tx.from_address === '0x0000000000000000000000000000000000000000') {
      return 'mint';
    }
    return 'transfer';
  }
  
  /**
   * 💾 Store transactions (same logic)
   */
  static async storeTransactions(transactions, userId) {
    if (!transactions.length) return 0;
    
    console.log(`💾 MORALIS: Storing ${transactions.length} transactions...`);
    
    let storedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('transactions')
          .upsert(batch, { 
            onConflict: 'user_id,tx_hash',
            ignoreDuplicates: true 
          });
        
        if (error) {
          console.error(`❌ MORALIS: Batch ${Math.floor(i/batchSize) + 1} failed:`, error);
        } else {
          storedCount += batch.length;
          console.log(`✅ MORALIS: Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transactions.length/batchSize)} stored`);
        }
        
      } catch (error) {
        console.error(`❌ MORALIS: Error storing batch:`, error);
      }
    }
    
    console.log(`✅ MORALIS STORAGE COMPLETE: ${storedCount} transactions stored`);
    return storedCount;
  }
  
  /**
   * 🔍 Get stored transactions from Supabase (unchanged)
   */
  static async getStoredTransactions(userId, walletAddress = null, options = {}) {
    const {
      startDate = null,
      endDate = null,
      roiOnly = false,
      limit = 1000,
      offset = 0
    } = options;
    
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('block_timestamp', { ascending: false });
    
    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    }
    
    if (startDate) {
      query = query.gte('block_timestamp', startDate);
    }
    
    if (endDate) {
      query = query.lte('block_timestamp', endDate);
    }
    
    if (roiOnly) {
      query = query.eq('is_roi_transaction', true);
    }
    
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching stored transactions:', error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * 📊 Generate tax report (100% from stored Moralis data)
   */
  static async generateTaxReport(userId, options = {}) {
    const {
      startDate = null,
      endDate = null,
      walletAddress = null
    } = options;
    
    console.log(`📊 MORALIS: Generating tax report for user ${userId}...`);
    
    const transactions = await this.getStoredTransactions(userId, walletAddress, {
      startDate,
      endDate,
      limit: 50000
    });
    
    const report = {
      summary: {
        totalTransactions: transactions.length,
        totalROITransactions: transactions.filter(t => t.is_roi_transaction).length,
        totalValueUSD: transactions.reduce((sum, t) => sum + (t.value_usd || 0), 0),
        totalROIValueUSD: transactions.filter(t => t.is_roi_transaction).reduce((sum, t) => sum + (t.value_usd || 0), 0)
      },
      byToken: this.aggregateByToken(transactions),
      byMonth: this.aggregateByPeriod(transactions, 'month'),
      transactions: transactions,
      dataSource: 'moralis_enterprise'
    };
    
    console.log(`✅ MORALIS: Tax report generated with ${report.summary.totalTransactions} transactions`);
    return report;
  }

  // Helper functions (unchanged)
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static async getLatestTransactionTimestamp(userId, walletAddress) {
    const { data, error } = await supabase
      .from('transactions')
      .select('block_timestamp')
      .eq('user_id', userId)
      .eq('wallet_address', walletAddress)
      .order('block_timestamp', { ascending: false })
      .limit(1);
    
    if (error || !data || !data.length) return null;
    return { timestamp: data[0].block_timestamp };
  }
  
  static isRecentEnough(timestamp, hoursAgo = 4) {
    const now = new Date();
    const txTime = new Date(timestamp);
    const diffHours = (now - txTime) / (1000 * 60 * 60);
    return diffHours < hoursAgo;
  }

  static aggregateByToken(transactions) {
    const tokenMap = {};
    
    transactions.forEach(tx => {
      const key = tx.token_symbol || tx.contract_address;
      if (!tokenMap[key]) {
        tokenMap[key] = {
          symbol: tx.token_symbol,
          name: tx.token_name,
          address: tx.contract_address,
          totalAmount: 0,
          totalValueUSD: 0,
          transactionCount: 0,
          roiTransactionCount: 0,
          firstSeen: tx.block_timestamp,
          lastSeen: tx.block_timestamp
        };
      }
      
      const token = tokenMap[key];
      token.totalAmount += tx.amount || 0;
      token.totalValueUSD += tx.value_usd || 0;
      token.transactionCount++;
      
      if (tx.is_roi_transaction) {
        token.roiTransactionCount++;
      }
      
      if (new Date(tx.block_timestamp) < new Date(token.firstSeen)) {
        token.firstSeen = tx.block_timestamp;
      }
      if (new Date(tx.block_timestamp) > new Date(token.lastSeen)) {
        token.lastSeen = tx.block_timestamp;
      }
    });
    
    return Object.values(tokenMap).sort((a, b) => b.totalValueUSD - a.totalValueUSD);
  }
  
  static aggregateByPeriod(transactions, period = 'month') {
    const periodMap = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.block_timestamp);
      let key;
      
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!periodMap[key]) {
        periodMap[key] = {
          period: key,
          totalTransactions: 0,
          totalROITransactions: 0,
          totalValueUSD: 0,
          totalROIValueUSD: 0
        };
      }
      
      const bucket = periodMap[key];
      bucket.totalTransactions++;
      bucket.totalValueUSD += tx.value_usd || 0;
      
      if (tx.is_roi_transaction) {
        bucket.totalROITransactions++;
        bucket.totalROIValueUSD += tx.value_usd || 0;
      }
    });
    
    return Object.values(periodMap).sort((a, b) => a.period.localeCompare(b.period));
  }
} 