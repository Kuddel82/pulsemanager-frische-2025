/*
📊 TAX SERVICE: Serverseitiges Caching + korrekte Steuerlogik
Ziel: Unbegrenzte Transaktionen + DSGVO-konforme Steuerberichte
FIXED: Nutzt jetzt korrekt vorhandene Moralis APIs
*/

import { logger } from '@/lib/logger';
import { TokenPriceService } from './tokenPriceService';
import { TransactionHistoryService } from './TransactionHistoryService';

/**
 * 🎯 TAX SERVICE
 * Generiert Steuerberichte basierend auf Transaktionshistorie
 */
export class TaxService {
  // 🔧 PERFORMANCE SETTINGS
  static CONFIG = {
    MAX_API_CALLS: 100,         // Standard Limit
    RATE_LIMIT_DELAY: 200,      // 200ms zwischen API Calls
    BATCH_SIZE: 50,             // Batch-Größe für Transaktionen
    CACHE_DURATION: 10 * 60 * 1000, // 10 Minuten Cache
  };

  static cache = new Map();

  /**
   * 🎯 MAIN: Generate Tax Report
   * @param {string} walletAddress - Wallet für Steuerreport
   * @param {Object} options - Optionen {year, startDate, endDate}
   * @returns {Promise<Object>} Tax report data
   */
  static async generateTaxReport(walletAddress, options = {}) {
    const {
      year = new Date().getFullYear(),
      startDate = null,
      endDate = null
    } = options;

    if (!walletAddress) {
      throw new Error('Wallet address is required for tax report');
    }

    const cacheKey = `tax_${walletAddress}_${year}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CONFIG.CACHE_DURATION)) {
      logger.info('✅ Returning cached tax report');
      return cached.data;
    }

    logger.info(`🎯 Generating tax report for ${walletAddress} (${year})`);

    try {
      // 1. Fetch transaction history
      const transactionData = await TransactionHistoryService.getTransactionHistory(
        walletAddress, 
        'eth', 
        1000
      );

      if (!transactionData.success) {
        throw new Error('Failed to fetch transaction history');
      }

      // 2. Filter by date range
      const filteredTransactions = this.filterTransactionsByDate(
        transactionData.transactions, 
        startDate || `${year}-01-01`, 
        endDate || `${year}-12-31`
      );

      // 3. Process transactions for tax purposes
      const processedTransactions = await this.processTransactionsForTax(
        filteredTransactions, 
        walletAddress
      );

      // 4. Generate tax summary
      const taxSummary = this.generateTaxSummary(processedTransactions, year);

      // 5. Create final report
      const report = {
        wallet: walletAddress,
        year: year,
        period: {
          start: startDate || `${year}-01-01`,
          end: endDate || `${year}-12-31`
        },
        summary: taxSummary,
        transactions: processedTransactions,
        metadata: {
          totalTransactions: processedTransactions.length,
          reportGenerated: new Date().toISOString(),
          source: 'moralis'
        }
      };

      // Cache result
      this.cache.set(cacheKey, {
        data: report,
        timestamp: Date.now()
      });

      logger.info(`✅ Tax report generated: ${processedTransactions.length} transactions`);
      return report;

    } catch (error) {
      logger.error('Tax report generation failed:', error);
      throw error;
    }
  }

  /**
   * 🔄 Filter transactions by date range
   */
  static filterTransactionsByDate(transactions, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate >= start && txDate <= end;
    });
  }

  /**
   * 🔄 Process transactions for tax calculation
   */
  static async processTransactionsForTax(transactions, walletAddress) {
    const processed = [];

    logger.info(`🔄 Processing ${transactions.length} transactions for tax calculation`);

    for (const tx of transactions) {
      try {
        // Determine transaction type for tax purposes
        const taxType = this.determineTaxType(tx, walletAddress);
        
        // Get price at transaction time (if not available)
        let usdValue = tx.usdValue || 0;
        if (!usdValue && tx.valueFormatted && tx.symbol) {
          try {
            const priceData = await TokenPriceService.getTokenPrice(
              tx.tokenAddress || tx.address,
              'eth',
              tx.symbol
            );
            usdValue = tx.valueFormatted * (priceData.price || 0);
          } catch (priceError) {
            logger.warn(`Price lookup failed for ${tx.symbol}:`, priceError);
          }
        }

        const processedTx = {
          hash: tx.hash,
          timestamp: tx.timestamp,
          type: taxType,
          direction: tx.direction,
          symbol: tx.symbol,
          amount: tx.valueFormatted || 0,
          usdValue: usdValue,
          from: tx.from,
          to: tx.to,
          blockNumber: tx.blockNumber,
          // Tax-specific fields
          taxable: this.isTaxable(taxType, tx.direction),
          category: this.getTaxCategory(taxType, tx.direction),
          notes: this.generateTaxNotes(tx, taxType)
        };

        processed.push(processedTx);

        // Rate limiting
        await this.delay(this.CONFIG.RATE_LIMIT_DELAY);

      } catch (error) {
        logger.error(`Error processing transaction ${tx.hash}:`, error);
      }
    }

    return processed;
  }

  /**
   * 🏷️ Determine tax type of transaction
   */
  static determineTaxType(tx, walletAddress) {
    // Native transactions (ETH/PLS)
    if (tx.type === 'native') {
      return tx.direction === 'in' ? 'receive_native' : 'send_native';
    }

    // Token transactions
    if (tx.type === 'token') {
      // Check for special cases
      if (tx.from === '0x0000000000000000000000000000000000000000') {
        return 'mint';
      }
      if (tx.to === '0x0000000000000000000000000000000000000000') {
        return 'burn';
      }
      
      return tx.direction === 'in' ? 'receive_token' : 'send_token';
    }

    return 'unknown';
  }

  /**
   * 🏷️ Determine if transaction is taxable
   */
  static isTaxable(taxType, direction) {
    const taxableTypes = [
      'receive_native',
      'receive_token',
      'mint',
      'send_native', // Capital gains
      'send_token'   // Capital gains
    ];

    return taxableTypes.includes(taxType);
  }

  /**
   * 🏷️ Get tax category
   */
  static getTaxCategory(taxType, direction) {
    switch (taxType) {
      case 'receive_native':
      case 'receive_token':
      case 'mint':
        return 'income';
      case 'send_native':
      case 'send_token':
        return 'capital_gains';
      default:
        return 'other';
    }
  }

  /**
   * 📝 Generate tax notes
   */
  static generateTaxNotes(tx, taxType) {
    switch (taxType) {
      case 'mint':
        return 'Token mint - possible airdrop or reward';
      case 'receive_token':
        return 'Token received - possible income';
      case 'receive_native':
        return 'Native token received';
      case 'send_token':
      case 'send_native':
        return 'Token sent - possible capital gains event';
      default:
        return '';
    }
  }

  /**
   * 📊 Generate tax summary
   */
  static generateTaxSummary(transactions, year) {
    const summary = {
      year: year,
      income: {
        totalTransactions: 0,
        totalValue: 0,
        byToken: {}
      },
      capitalGains: {
        totalTransactions: 0,
        totalValue: 0,
        byToken: {}
      },
      totals: {
        allTransactions: transactions.length,
        taxableTransactions: 0,
        totalTaxableValue: 0
      }
    };

    transactions.forEach(tx => {
      if (!tx.taxable) return;

      summary.totals.taxableTransactions++;
      summary.totals.totalTaxableValue += tx.usdValue || 0;

      if (tx.category === 'income') {
        summary.income.totalTransactions++;
        summary.income.totalValue += tx.usdValue || 0;
        
        if (!summary.income.byToken[tx.symbol]) {
          summary.income.byToken[tx.symbol] = { count: 0, value: 0 };
        }
        summary.income.byToken[tx.symbol].count++;
        summary.income.byToken[tx.symbol].value += tx.usdValue || 0;
      }

      if (tx.category === 'capital_gains') {
        summary.capitalGains.totalTransactions++;
        summary.capitalGains.totalValue += tx.usdValue || 0;
        
        if (!summary.capitalGains.byToken[tx.symbol]) {
          summary.capitalGains.byToken[tx.symbol] = { count: 0, value: 0 };
        }
        summary.capitalGains.byToken[tx.symbol].count++;
        summary.capitalGains.byToken[tx.symbol].value += tx.usdValue || 0;
      }
    });

    return summary;
  }

  /**
   * 🧹 Clear cache
   */
  static clearCache() {
    this.cache.clear();
    logger.info('🧹 Tax service cache cleared');
  }

  /**
   * 🕐 Delay utility
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default TaxService; 