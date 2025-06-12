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
  
  /**
   * ❌ DEFI SUMMARY REMOVED - Enterprise feature not available in Pro Plan
   * Ersetzt durch: Transaction-based ROI analysis
   */
  static async getDefiSummary(address, chain = '1') {
    console.log(`🚨 DEFI SUMMARY DISABLED: Enterprise feature removed for Pro Plan cost reduction`);
    
    // Return empty DeFi data to prevent breaking existing code
    return {
      success: true,
      defiSummary: {
        active_protocols: 0,
        total_usd_value: 0,
        total_unclaimed_usd_value: 0,
        total_positions: 0
      },
      roiAnalysis: {
        hasActivePositions: false,
        hasUnclaimedRewards: false,
        totalValue: 0,
        unclaimedValue: 0,
        activeProtocols: 0,
        roiPotential: 'none'
      },
      _enterprise_disabled: true,
      source: 'moralis_v2_defi_disabled',
      _note: 'Use transaction-based ROI analysis instead'
    };
  }
  
  /**
   * ❌ DEFI POSITIONS REMOVED - Enterprise feature not available in Pro Plan
   * Ersetzt durch: Transaction-based position tracking
   */
  static async getDefiPositions(address, chain = '1') {
    console.log(`🚨 DEFI POSITIONS DISABLED: Enterprise feature removed for Pro Plan cost reduction`);
    
    // Return empty positions data to prevent breaking existing code
    return {
      success: true,
      positions: [],
      roiSources: [],
      roiAnalysis: {
        totalPositions: 0,
        roiSourcesCount: 0,
        totalROIValue: 0,
        totalDailyROI: 0,
        estimatedMonthlyROI: 0,
        hasActiveROI: false
      },
      _enterprise_disabled: true,
      source: 'moralis_v2_positions_disabled',
      _note: 'Use transaction analysis for position tracking instead'
    };
  }
  
  /**
   * 📊 ENHANCED WALLET STATS - Combined Analytics
   * Kombiniert: Basic Stats + DeFi Data + ROI Analysis
   */
  static async getEnhancedWalletStats(address, chain = '1') {
    try {
      console.log(`🚀 V2 ENHANCED STATS: Loading enhanced analytics for ${address}`);
      
      // Parallel loading für Performance
      const [statsResult, defiSummaryResult] = await Promise.all([
        this.getWalletStats(address, chain),
        this.getDefiSummary(address, chain)
      ]);
      
      const stats = statsResult.stats || {};
      const defiSummary = defiSummaryResult.defiSummary || {};
      
      // Enhanced analytics
      const enhancedStats = {
        // Basic Stats
        nfts: parseInt(stats.nfts) || 0,
        collections: parseInt(stats.collections) || 0,
        totalTransactions: parseInt(stats.transactions?.total) || 0,
        nftTransfers: parseInt(stats.nft_transfers?.total) || 0,
        tokenTransfers: parseInt(stats.token_transfers?.total) || 0,
        
        // DeFi Stats
        defiProtocols: parseInt(defiSummary.active_protocols) || 0,
        defiPositions: parseInt(defiSummary.total_positions) || 0,
        defiValueUsd: parseFloat(defiSummary.total_usd_value) || 0,
        defiUnclaimedUsd: parseFloat(defiSummary.total_unclaimed_usd_value) || 0,
        
        // Activity Score (0-100)
        activityScore: this.calculateActivityScore(stats, defiSummary),
        
        // User Classification
        userType: this.determineUserType(stats, defiSummary),
        
        // ROI Analysis
        roiProfile: {
          hasDefiPositions: parseInt(defiSummary.total_positions) > 0,
          hasUnclaimedRewards: parseFloat(defiSummary.total_unclaimed_usd_value) > 0,
          roiPotential: this.calculateROIPotential(defiSummary),
          riskProfile: this.assessRiskProfile(stats, defiSummary)
        }
      };
      
      console.log(`✅ V2 ENHANCED STATS: Activity Score: ${enhancedStats.activityScore}, User Type: ${enhancedStats.userType}`);
      
      return {
        success: true,
        enhancedStats: enhancedStats,
        rawStats: stats,
        rawDefi: defiSummary,
        source: 'moralis_v2_enhanced_stats'
      };
      
    } catch (error) {
      console.error('💥 V2 Enhanced Stats Error:', error);
      return { 
        success: false, 
        error: error.message,
        enhancedStats: null
      };
    }
  }
  
  /**
   * 🔍 COMPLETE ROI ANALYSIS
   * Kombiniert: Transaction History + DeFi Positions + Portfolio Analysis
   */
  static async getCompleteROIAnalysis(address, chain = '1', options = {}) {
    try {
      console.log(`🚀 V2 COMPLETE ROI: Starting comprehensive ROI analysis for ${address}`);
      
      // Parallel loading aller ROI-relevanten Daten
      const [historyResult, defiPositionsResult, portfolioResult] = await Promise.all([
        this.getCompleteHistory(address, chain, { 
          getAllPages: false, // Begrenzt für Performance
          limit: 100
        }),
        this.getDefiPositions(address, chain),
        this.getPortfolioNetWorth(address, chain)
      ]);
      
      // ROI Analysis aus verschiedenen Quellen
      const roiAnalysis = {
        // Transaction-basiertes ROI
        transactionROI: this.analyzeTransactionROI(historyResult.transactions || []),
        
        // DeFi-basiertes ROI
        defiROI: defiPositionsResult.roiAnalysis || {},
        
        // Portfolio-basiertes ROI
        portfolioROI: this.analyzePortfolioROI(portfolioResult),
        
        // Kombinierte Metriken
        combinedMetrics: this.calculateCombinedROIMetrics(historyResult, defiPositionsResult, portfolioResult)
      };
      
      console.log(`✅ V2 COMPLETE ROI: Analysis complete - DeFi ROI: $${roiAnalysis.defiROI.totalROIValue || 0}, Portfolio: $${portfolioResult.total_networth_usd || 0}`);
      
      return {
        success: true,
        roiAnalysis: roiAnalysis,
        source: 'moralis_v2_complete_roi',
        dataQuality: {
          hasTransactionHistory: (historyResult.transactions || []).length > 0,
          hasDefiPositions: (defiPositionsResult.positions || []).length > 0,
          hasPortfolioData: parseFloat(portfolioResult.total_networth_usd || '0') > 0
        }
      };
      
    } catch (error) {
      console.error('💥 V2 Complete ROI Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        roiAnalysis: null
      };
    }
  }
  
  // Helper: Calculate Activity Score
  static calculateActivityScore(stats, defiSummary) {
    const transactions = parseInt(stats.transactions?.total) || 0;
    const nfts = parseInt(stats.nfts) || 0;
    const defiProtocols = parseInt(defiSummary.active_protocols) || 0;
    const defiValue = parseFloat(defiSummary.total_usd_value) || 0;
    
    return Math.min(100, 
      Math.min(30, transactions / 100 * 30) +          // 30% weight on transactions
      Math.min(20, nfts / 10 * 20) +                   // 20% weight on NFTs
      Math.min(25, defiProtocols * 5) +                // 25% weight on DeFi protocols
      Math.min(25, defiValue / 10000 * 25)             // 25% weight on DeFi value
    );
  }
  
  // Helper: Determine User Type
  static determineUserType(stats, defiSummary) {
    const transactions = parseInt(stats.transactions?.total) || 0;
    const nfts = parseInt(stats.nfts) || 0;
    const defiProtocols = parseInt(defiSummary.active_protocols) || 0;
    const defiValue = parseFloat(defiSummary.total_usd_value) || 0;
    
    if (defiValue > 100000 || defiProtocols > 5) return 'defi_whale';
    if (defiProtocols > 2 || defiValue > 10000) return 'defi_user';
    if (nfts > 50) return 'nft_collector';
    if (nfts > 10) return 'nft_user';
    if (transactions > 1000) return 'active_trader';
    if (transactions > 100) return 'regular_user';
    return 'beginner';
  }
  
  // Helper: Calculate ROI Potential
  static calculateROIPotential(defiSummary) {
    const unclaimed = parseFloat(defiSummary.total_unclaimed_usd_value) || 0;
    const protocols = parseInt(defiSummary.active_protocols) || 0;
    
    if (unclaimed > 1000 || protocols > 3) return 'high';
    if (unclaimed > 100 || protocols > 1) return 'medium';
    if (unclaimed > 0 || protocols > 0) return 'low';
    return 'none';
  }
  
  // Helper: Assess Risk Profile
  static assessRiskProfile(stats, defiSummary) {
    const defiValue = parseFloat(defiSummary.total_usd_value) || 0;
    const protocols = parseInt(defiSummary.active_protocols) || 0;
    const transactions = parseInt(stats.transactions?.total) || 0;
    
    if (defiValue > 50000 && protocols > 4) return 'high_risk_high_reward';
    if (defiValue > 10000 && protocols > 2) return 'moderate_risk';
    if (defiValue > 1000 || protocols > 0) return 'low_risk';
    if (transactions > 100) return 'explorer';
    return 'beginner';
  }
  
  // Helper: Analyze Transaction ROI
  static analyzeTransactionROI(transactions) {
    // Simplified transaction ROI analysis
    const incomingTransactions = transactions.filter(tx => {
      return tx.erc20_transfer?.some(transfer => 
        transfer.direction === 'incoming' || 
        transfer.to_address?.toLowerCase() === tx.to_address?.toLowerCase()
      ) || tx.native_transfers?.some(transfer => 
        transfer.direction === 'incoming'
      );
    });
    
    return {
      totalTransactions: transactions.length,
      incomingCount: incomingTransactions.length,
      estimatedROITransactions: incomingTransactions.length,
      roiRatio: transactions.length > 0 ? 
        (incomingTransactions.length / transactions.length * 100).toFixed(2) : '0'
    };
  }
  
  // Helper: Analyze Portfolio ROI
  static analyzePortfolioROI(portfolioResult) {
    const totalValue = parseFloat(portfolioResult.total_networth_usd || '0');
    
    return {
      portfolioValue: totalValue,
      hasSignificantValue: totalValue > 1000,
      valueCategory: totalValue > 100000 ? 'whale' : 
                   totalValue > 10000 ? 'large' :
                   totalValue > 1000 ? 'medium' : 'small'
    };
  }
  
  // Helper: Calculate Combined ROI Metrics
  static calculateCombinedROIMetrics(historyResult, defiResult, portfolioResult) {
    const defiROI = defiResult.roiAnalysis || {};
    const portfolioValue = parseFloat(portfolioResult.total_networth_usd || '0');
    
    return {
      totalEstimatedROI: defiROI.totalROIValue || 0,
      dailyROIEstimate: defiROI.totalDailyROI || 0,
      monthlyROIEstimate: defiROI.estimatedMonthlyROI || 0,
      portfolioROIRatio: portfolioValue > 0 ? 
        ((defiROI.totalROIValue || 0) / portfolioValue * 100).toFixed(2) : '0',
      overallROIScore: this.calculateOverallROIScore(defiResult, portfolioResult)
    };
  }
  
  // Helper: Calculate Overall ROI Score
  static calculateOverallROIScore(defiResult, portfolioResult) {
    const roiValue = defiResult.roiAnalysis?.totalROIValue || 0;
    const portfolioValue = parseFloat(portfolioResult.total_networth_usd || '0');
    const roiSources = defiResult.roiAnalysis?.roiSourcesCount || 0;
    
    let score = 0;
    if (roiValue > 1000) score += 40;
    else if (roiValue > 100) score += 25;
    else if (roiValue > 0) score += 10;
    
    if (roiSources > 3) score += 30;
    else if (roiSources > 1) score += 20;
    else if (roiSources > 0) score += 10;
    
    if (portfolioValue > 50000) score += 30;
    else if (portfolioValue > 10000) score += 20;
    else if (portfolioValue > 1000) score += 10;
    
    return Math.min(100, score);
  }
} 