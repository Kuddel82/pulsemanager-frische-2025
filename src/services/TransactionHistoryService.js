// 💰 TRANSACTION HISTORY SERVICE - PulseChain ROI & Tax Analysis
// Holt alle historischen Token-Transfers und klassifiziert ROI-Transaktionen

import { supabase } from '@/lib/supabaseClient';
import { TokenPriceService } from './tokenPriceService';

export class TransactionHistoryService {
  
  // 🌐 PulseChain Scan API Configuration
  static PULSECHAIN_API = 'https://scan.pulsechain.com/api';
  static MAX_TRANSACTIONS_PER_CALL = 10000; // API Limit
  static RETRY_ATTEMPTS = 3;
  static RETRY_DELAY = 2000; // 2 seconds
  
  // 🏷️ ROI Transaction Classifications
  static ROI_INDICATORS = {
    // Token addresses that typically generate ROI (staking, dividends, etc.)
    KNOWN_ROI_TOKENS: [
      '0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d', // INC (known dividend token)
      '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', // HEX (staking rewards)
      // Add more as needed
    ],
    
    // Transaction value patterns indicating ROI
    MIN_ROI_VALUE: 0.001, // Minimum USD value to consider as ROI
    MAX_SINGLE_ROI: 10000, // Max single transaction considered automatic ROI
    
    // Common ROI sources (from_address patterns)
    KNOWN_ROI_SOURCES: [
      '0x0000000000000000000000000000000000000000', // Mint/Burn address
      // Add known staking contract addresses
    ]
  };
  
  /**
   * 🎯 MAIN: Fetch and store all historical transactions for a wallet
   */
  static async fetchAndStoreTransactionHistory(walletAddress, userId, options = {}) {
    const {
      startBlock = 0,
      endBlock = 'latest',
      onProgress = null,
      forceRefresh = false
    } = options;
    
    console.log(`🚀 STARTING TRANSACTION HISTORY FETCH for ${walletAddress}`);
    
    try {
      // 1. Check if we already have recent data (unless force refresh)
      if (!forceRefresh) {
        const existingData = await this.getLatestTransactionTimestamp(userId, walletAddress);
        if (existingData && this.isRecentEnough(existingData.timestamp)) {
          console.log(`✅ Recent transaction data exists, skipping full fetch`);
          return await this.getStoredTransactions(userId, walletAddress);
        }
      }
      
      // 2. Fetch all token transactions from PulseChain
      const allTransactions = await this.fetchAllTokenTransactions(walletAddress, startBlock, endBlock, onProgress);
      
      // 3. Process and classify transactions
      const processedTransactions = await this.processTransactions(allTransactions, walletAddress, userId);
      
      // 4. Store in Supabase (with deduplication)
      const storedCount = await this.storeTransactions(processedTransactions, userId);
      
      console.log(`✅ TRANSACTION HISTORY COMPLETE: ${storedCount} transactions stored`);
      
      return {
        success: true,
        totalFetched: allTransactions.length,
        totalProcessed: processedTransactions.length,
        totalStored: storedCount,
        transactions: processedTransactions
      };
      
    } catch (error) {
      console.error('❌ Transaction history fetch failed:', error);
      throw error;
    }
  }
  
  /**
   * 📥 Fetch all token transactions from PulseChain Scan API
   */
  static async fetchAllTokenTransactions(walletAddress, startBlock = 0, endBlock = 'latest', onProgress = null) {
    const allTransactions = [];
    let page = 1;
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      try {
        console.log(`📦 Fetching page ${page}, offset ${offset}...`);
        
        const url = `${this.PULSECHAIN_API}` +
          `?module=account` +
          `&action=tokentx` +
          `&address=${walletAddress}` +
          `&startblock=${startBlock}` +
          `&endblock=${endBlock}` +
          `&page=${page}` +
          `&offset=${this.MAX_TRANSACTIONS_PER_CALL}` +
          `&sort=desc`;
        
        const response = await this.makeAPIRequest(url);
        
        if (response.status === '1' && response.result && Array.isArray(response.result)) {
          const transactions = response.result;
          allTransactions.push(...transactions);
          
          console.log(`📊 Page ${page}: ${transactions.length} transactions`);
          
          // Progress callback
          if (onProgress) {
            onProgress({
              page,
              currentCount: allTransactions.length,
              lastBatch: transactions.length
            });
          }
          
          // Check if we got fewer than max (indicating last page)
          if (transactions.length < this.MAX_TRANSACTIONS_PER_CALL) {
            hasMore = false;
          } else {
            page++;
            offset += this.MAX_TRANSACTIONS_PER_CALL;
          }
        } else {
          console.log(`⚠️ No more results or API error: ${response.message || 'Unknown'}`);
          hasMore = false;
        }
        
        // Rate limiting delay
        await this.delay(500);
        
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error);
        hasMore = false;
      }
    }
    
    console.log(`🎯 TOTAL TRANSACTIONS FETCHED: ${allTransactions.length}`);
    return allTransactions;
  }
  
  /**
   * ⚙️ Process and classify transactions
   */
  static async processTransactions(rawTransactions, walletAddress, userId) {
    const processed = [];
    
    console.log(`🔄 Processing ${rawTransactions.length} transactions...`);
    
    for (const tx of rawTransactions) {
      try {
        // Skip if transaction is TO the wallet (outgoing) - we only want incoming ROI
        if (tx.to.toLowerCase() !== walletAddress.toLowerCase()) {
          continue;
        }
        
        // Get token price at transaction time (if possible)
        const tokenPrice = await this.getHistoricalTokenPrice(tx.contractAddress, tx.timeStamp);
        
        // Calculate USD value
        const amountFormatted = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || 18));
        const valueUSD = tokenPrice ? amountFormatted * tokenPrice : null;
        
        // Classify as ROI transaction
        const isROI = this.classifyAsROI(tx, amountFormatted, valueUSD);
        const sourceType = this.determineSourceType(tx);
        
        const processedTx = {
          tx_hash: tx.hash,
          block_number: parseInt(tx.blockNumber),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          
          // Token details
          token_address: tx.contractAddress,
          token_symbol: tx.tokenSymbol,
          token_name: tx.tokenName,
          token_decimals: parseInt(tx.tokenDecimal || 18),
          
          // Transfer details
          amount_raw: tx.value,
          amount_formatted: amountFormatted,
          direction: 'in', // We filtered for incoming only
          
          // Price & value
          token_price_usd: tokenPrice,
          value_usd: valueUSD,
          
          // Classification
          transaction_type: 'transfer',
          is_roi_transaction: isROI,
          source_type: sourceType,
          
          // Addresses
          from_address: tx.from,
          to_address: tx.to,
          wallet_address: walletAddress,
          
          // URLs
          explorer_url: `https://scan.pulsechain.com/tx/${tx.hash}`,
          dex_screener_url: tx.contractAddress ? `https://dexscreener.com/pulsechain/${tx.contractAddress}` : null,
          
          // Gas (if available)
          gas_used: tx.gasUsed ? parseInt(tx.gasUsed) : null,
          gas_price: tx.gasPrice ? parseInt(tx.gasPrice) : null,
          
          // Metadata
          user_id: userId
        };
        
        processed.push(processedTx);
        
      } catch (error) {
        console.error(`❌ Error processing transaction ${tx.hash}:`, error);
      }
    }
    
    // Sort by timestamp (newest first)
    processed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    console.log(`✅ Processed ${processed.length} transactions (${processed.filter(t => t.is_roi_transaction).length} ROI)`);
    return processed;
  }
  
  /**
   * 🤖 Classify transaction as ROI based on patterns
   */
  static classifyAsROI(tx, amount, valueUSD) {
    // 1. Known ROI token addresses
    if (this.ROI_INDICATORS.KNOWN_ROI_TOKENS.includes(tx.contractAddress)) {
      return true;
    }
    
    // 2. Mint transactions (from 0x000... address)
    if (tx.from === '0x0000000000000000000000000000000000000000') {
      return true;
    }
    
    // 3. Small regular amounts (typical of staking rewards)
    if (valueUSD && valueUSD >= this.ROI_INDICATORS.MIN_ROI_VALUE && valueUSD <= this.ROI_INDICATORS.MAX_SINGLE_ROI) {
      // Additional heuristics could be added here
      return true;
    }
    
    // 4. Regular time intervals (could be enhanced with timestamp analysis)
    // TODO: Add time-based pattern recognition
    
    return false; // Default to not ROI
  }
  
  /**
   * 🏷️ Determine transaction source type
   */
  static determineSourceType(tx) {
    if (tx.from === '0x0000000000000000000000000000000000000000') {
      return 'mint';
    }
    
    // Could add more sophisticated classification here
    // e.g., known staking contract addresses, DEX addresses, etc.
    
    return 'transfer';
  }
  
  /**
   * 💾 Store transactions in Supabase with deduplication
   */
  static async storeTransactions(transactions, userId) {
    if (!transactions.length) return 0;
    
    console.log(`💾 Storing ${transactions.length} transactions in Supabase...`);
    
    let storedCount = 0;
    const batchSize = 100; // Process in batches to avoid memory issues
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      try {
        // Use UPSERT to handle duplicates
        const { data, error } = await supabase
          .from('transactions')
          .upsert(batch, { 
            onConflict: 'user_id,tx_hash',
            ignoreDuplicates: true 
          });
        
        if (error) {
          console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error);
        } else {
          storedCount += batch.length;
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transactions.length/batchSize)} stored`);
        }
        
      } catch (error) {
        console.error(`❌ Error storing batch:`, error);
      }
    }
    
    console.log(`✅ STORAGE COMPLETE: ${storedCount} transactions stored`);
    return storedCount;
  }
  
  /**
   * 📈 Get historical token price (simplified - could be enhanced)
   */
  static async getHistoricalTokenPrice(tokenAddress, timestamp) {
    try {
      // For now, use current price - historical prices would need separate API
      const currentPrice = await TokenPriceService.getTokenPrice(tokenAddress);
      return currentPrice;
    } catch (error) {
      console.warn(`⚠️ Could not get price for ${tokenAddress}:`, error);
      return null;
    }
  }
  
  /**
   * 🔍 Get stored transactions from Supabase
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
      .order('timestamp', { ascending: false });
    
    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    }
    
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    
    if (endDate) {
      query = query.lte('timestamp', endDate);
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
   * ⏰ Helper functions
   */
  static async makeAPIRequest(url, attempt = 1) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      if (attempt < this.RETRY_ATTEMPTS) {
        console.log(`🔄 Retry attempt ${attempt + 1} for API request...`);
        await this.delay(this.RETRY_DELAY * attempt);
        return this.makeAPIRequest(url, attempt + 1);
      }
      throw error;
    }
  }
  
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static async getLatestTransactionTimestamp(userId, walletAddress) {
    const { data, error } = await supabase
      .from('transactions')
      .select('timestamp')
      .eq('user_id', userId)
      .eq('wallet_address', walletAddress)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (error || !data || !data.length) return null;
    return data[0];
  }
  
  static isRecentEnough(timestamp, hoursAgo = 4) {
    const now = new Date();
    const txTime = new Date(timestamp);
    const diffHours = (now - txTime) / (1000 * 60 * 60);
    return diffHours < hoursAgo;
  }
  
  /**
   * 📊 Generate tax report data
   */
  static async generateTaxReport(userId, options = {}) {
    const {
      startDate = null,
      endDate = null,
      walletAddress = null,
      groupBy = 'month' // 'day', 'week', 'month', 'year'
    } = options;
    
    console.log(`📊 Generating tax report for user ${userId}...`);
    
    const transactions = await this.getStoredTransactions(userId, walletAddress, {
      startDate,
      endDate,
      limit: 50000 // High limit for tax reports
    });
    
    // Calculate totals and aggregations
    const report = {
      summary: {
        totalTransactions: transactions.length,
        totalROITransactions: transactions.filter(t => t.is_roi_transaction).length,
        totalValueUSD: transactions.reduce((sum, t) => sum + (t.value_usd || 0), 0),
        totalROIValueUSD: transactions.filter(t => t.is_roi_transaction).reduce((sum, t) => sum + (t.value_usd || 0), 0)
      },
      
      byToken: this.aggregateByToken(transactions),
      byMonth: this.aggregateByPeriod(transactions, 'month'),
      transactions: transactions // Raw data for CSV export
    };
    
    console.log(`✅ Tax report generated: ${report.summary.totalTransactions} transactions`);
    return report;
  }
  
  static aggregateByToken(transactions) {
    const tokenMap = {};
    
    transactions.forEach(tx => {
      const key = tx.token_symbol || tx.token_address;
      if (!tokenMap[key]) {
        tokenMap[key] = {
          symbol: tx.token_symbol,
          name: tx.token_name,
          address: tx.token_address,
          totalAmount: 0,
          totalValueUSD: 0,
          transactionCount: 0,
          roiTransactionCount: 0,
          firstSeen: tx.timestamp,
          lastSeen: tx.timestamp
        };
      }
      
      const token = tokenMap[key];
      token.totalAmount += tx.amount_formatted || 0;
      token.totalValueUSD += tx.value_usd || 0;
      token.transactionCount++;
      
      if (tx.is_roi_transaction) {
        token.roiTransactionCount++;
      }
      
      if (new Date(tx.timestamp) < new Date(token.firstSeen)) {
        token.firstSeen = tx.timestamp;
      }
      if (new Date(tx.timestamp) > new Date(token.lastSeen)) {
        token.lastSeen = tx.timestamp;
      }
    });
    
    return Object.values(tokenMap).sort((a, b) => b.totalValueUSD - a.totalValueUSD);
  }
  
  static aggregateByPeriod(transactions, period = 'month') {
    const periodMap = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp);
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
          totalROIValueUSD: 0,
          uniqueTokens: new Set()
        };
      }
      
      const p = periodMap[key];
      p.totalTransactions++;
      p.totalValueUSD += tx.value_usd || 0;
      p.uniqueTokens.add(tx.token_symbol || tx.token_address);
      
      if (tx.is_roi_transaction) {
        p.totalROITransactions++;
        p.totalROIValueUSD += tx.value_usd || 0;
      }
    });
    
    // Convert Set to count and sort by period
    return Object.values(periodMap)
      .map(p => ({ ...p, uniqueTokenCount: p.uniqueTokens.size, uniqueTokens: undefined }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }
} 