// 🚀 MORALIS V2 SERVICE - MODERNE WALLET APIS
// Ersetzt fragmentierte API-Calls durch holistische Wallet-Endpunkte

export class MoralisV2Service {
  
  static API_BASE = '/api/moralis-v2';
  
  /**
   * 🏆 PORTFOLIO NET WORTH - Complete USD Portfolio
   * Ersetzt: Token-Balances + Prices + Manual Calculation
   */
  static async getPortfolioNetWorth(address, chain = '1') {
    try {
      console.log(`🚀 V2: Loading portfolio net worth for ${address}`);
      
      const response = await fetch(`${this.API_BASE}?endpoint=portfolio&address=${address}&chain=${chain}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data._error) {
        console.warn('⚠️ V2 Portfolio API Error:', data._error.message);
        return { 
          success: false, 
          error: data._error.message,
          total_networth_usd: '0',
          chains: []
        };
      }
      
      console.log(`✅ V2: Portfolio loaded - $${data.result.total_networth_usd}`);
      
      return {
        success: true,
        total_networth_usd: data.result.total_networth_usd || '0',
        chains: data.result.chains || [],
        source: 'moralis_v2_portfolio'
      };
      
    } catch (error) {
      console.error('💥 V2 Portfolio Service Error:', error);
      return { 
        success: false, 
        error: error.message,
        total_networth_usd: '0',
        chains: []
      };
    }
  }
  
  /**
   * 📈 COMPLETE TRANSACTION HISTORY
   * Ersetzt: Separate ERC20 + Native + NFT calls
   */
  static async getCompleteHistory(address, chain = '1', options = {}) {
    try {
      const { cursor, limit = 100, getAllPages = false } = options;
      
      console.log(`🚀 V2: Loading complete history for ${address}`);
      
      let allTransactions = [];
      let currentCursor = cursor;
      let hasMore = true;
      
      while (hasMore) {
        const url = new URL(`${window.location.origin}${this.API_BASE}`);
        url.searchParams.set('endpoint', 'history');
        url.searchParams.set('address', address);
        url.searchParams.set('chain', chain);
        url.searchParams.set('limit', limit.toString());
        if (currentCursor) url.searchParams.set('cursor', currentCursor);
        
        const response = await fetch(url.toString());
        const data = await response.json();
        
        if (data._error) {
          console.warn('⚠️ V2 History API Error:', data._error.message);
          break;
        }
        
        allTransactions.push(...(data.result || []));
        
        // Check if we should continue fetching
        currentCursor = data.cursor;
        hasMore = getAllPages && currentCursor && data.result?.length === limit;
        
        if (!getAllPages) break; // Single page only
      }
      
      console.log(`✅ V2: History loaded - ${allTransactions.length} comprehensive transactions`);
      
      return {
        success: true,
        transactions: allTransactions,
        cursor: currentCursor,
        total: allTransactions.length,
        source: 'moralis_v2_comprehensive'
      };
      
    } catch (error) {
      console.error('💥 V2 History Service Error:', error);
      return { 
        success: false, 
        error: error.message,
        transactions: []
      };
    }
  }
  
  /**
   * 📊 WALLET ANALYTICS
   * Für Dashboard-KPIs und User-Segmentierung
   */
  static async getWalletStats(address, chain = '1') {
    try {
      console.log(`🚀 V2: Loading wallet stats for ${address}`);
      
      const response = await fetch(`${this.API_BASE}?endpoint=stats&address=${address}&chain=${chain}`, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (data._error) {
        console.warn('⚠️ V2 Stats API Error:', data._error.message);
        return {
          success: false,
          error: data._error.message,
          stats: null
        };
      }
      
      console.log(`✅ V2: Stats loaded - ${data.result.transactions?.total || 0} total transactions`);
      
      return {
        success: true,
        stats: data.result,
        source: 'moralis_v2_stats'
      };
      
    } catch (error) {
      console.error('💥 V2 Stats Service Error:', error);
      return { 
        success: false, 
        error: error.message,
        stats: null
      };
    }
  }
  
  /**
   * 🎯 SMART PORTFOLIO LOAD
   * Kombiniert Net Worth + Stats für komplettes Dashboard
   */
  static async loadCompletePortfolio(address, chain = '1') {
    try {
      console.log(`🚀 V2: Loading complete portfolio for ${address}`);
      
      // Parallel loading für Performance
      const [portfolioResult, statsResult] = await Promise.all([
        this.getPortfolioNetWorth(address, chain),
        this.getWalletStats(address, chain)
      ]);
      
      return {
        success: true,
        portfolio: portfolioResult,
        stats: statsResult,
        total_value_usd: portfolioResult.total_networth_usd || '0',
        source: 'moralis_v2_complete'
      };
      
    } catch (error) {
      console.error('💥 V2 Complete Portfolio Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 🏆 ROI TRANSACTION DETECTION
   * Analysiert History für ROI-relevante Transaktionen
   */
  static async getROITransactions(address, chain = '1', options = {}) {
    try {
      console.log(`🚀 V2: Analyzing ROI transactions for ${address}`);
      
      const historyResult = await this.getCompleteHistory(address, chain, {
        ...options,
        getAllPages: true // ROI needs complete history
      });
      
      if (!historyResult.success) {
        return historyResult;
      }
      
      // ROI Detection Logic
      const roiTransactions = historyResult.transactions.filter(tx => {
        // Check for incoming transfers (potential ROI)
        const hasIncomingERC20 = tx.erc20_transfer?.some(transfer => 
          transfer.to_address?.toLowerCase() === address.toLowerCase()
        );
        
        const hasIncomingNative = tx.native_transfers?.some(transfer =>
          transfer.to_address?.toLowerCase() === address.toLowerCase() &&
          transfer.direction === 'incoming'
        );
        
        // ROI indicators (simplified)
        const isLikelyROI = hasIncomingERC20 || hasIncomingNative;
        
        return isLikelyROI;
      });
      
      console.log(`✅ V2: ROI Analysis complete - ${roiTransactions.length} potential ROI transactions`);
      
      return {
        success: true,
        roiTransactions,
        totalROI: roiTransactions.length,
        totalTransactions: historyResult.transactions.length,
        roiRatio: historyResult.transactions.length > 0 ? 
          (roiTransactions.length / historyResult.transactions.length * 100).toFixed(2) : '0',
        source: 'moralis_v2_roi_analysis'
      };
      
    } catch (error) {
      console.error('💥 V2 ROI Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        roiTransactions: []
      };
    }
  }
  
  /**
   * 📋 TAX REPORT DATA
   * Optimiert für Steuerberichte mit vollständiger Historie
   */
  static async getTaxReportData(address, chain = '1', options = {}) {
    try {
      console.log(`🚀 V2: Generating tax report data for ${address}`);
      
      const [historyResult, portfolioResult] = await Promise.all([
        this.getCompleteHistory(address, chain, { 
          getAllPages: true, // Tax needs all transactions
          limit: 100
        }),
        this.getPortfolioNetWorth(address, chain)
      ]);
      
      if (!historyResult.success) {
        return historyResult;
      }
      
      // Tax categorization (simplified)
      const taxableTransactions = historyResult.transactions.filter(tx => {
        // Look for incoming transfers (potential taxable events)
        return tx.erc20_transfer?.some(transfer => 
          transfer.to_address?.toLowerCase() === address.toLowerCase()
        );
      });
      
      console.log(`✅ V2: Tax report complete - ${taxableTransactions.length} taxable transactions`);
      
      return {
        success: true,
        allTransactions: historyResult.transactions,
        taxableTransactions,
        portfolio: portfolioResult,
        summary: {
          totalTransactions: historyResult.transactions.length,
          taxableCount: taxableTransactions.length,
          portfolioValue: portfolioResult.total_networth_usd
        },
        source: 'moralis_v2_tax_report'
      };
      
    } catch (error) {
      console.error('💥 V2 Tax Report Error:', error);
      return {
        success: false,
        error: error.message,
        allTransactions: [],
        taxableTransactions: []
      };
    }
  }
} 