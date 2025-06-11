// 🎯 ROI DETECTION SERVICE - POWERED BY MORALIS DEFI APIS
// Echte ROI-Erkennung durch DeFi-Positionen, Yields und Unclaimed Rewards

export class ROIDetectionService {
  
  static API_BASE = '/api/moralis-v2';
  
  /**
   * 🏆 COMPLETE ROI ANALYSIS
   * Kombiniert alle ROI-Quellen: DeFi Positions, Transaction History, Portfolio Analysis
   */
  static async getCompleteROIAnalysis(address, chain = '1') {
    try {
      console.log(`🚀 ROI DETECTION: Starting comprehensive analysis for ${address}`);
      
      // Parallel loading aller ROI-Datenquellen
      const [defiSummary, defiPositions, walletStats] = await Promise.all([
        this.getDefiSummary(address, chain),
        this.getDefiPositions(address, chain),
        this.getWalletStats(address, chain)
      ]);
      
      // ROI Analysis aus verschiedenen Quellen
      const roiAnalysis = {
        // DeFi-basierte ROI-Erkennung
        defiROI: this.analyzeDefiROI(defiSummary, defiPositions),
        
        // Activity-basierte ROI-Indikatoren
        activityROI: this.analyzeActivityROI(walletStats),
        
        // Kombinierte ROI-Metriken
        combinedMetrics: this.calculateCombinedROIMetrics(defiSummary, defiPositions, walletStats)
      };
      
      // ROI Score (0-100)
      const roiScore = this.calculateROIScore(roiAnalysis);
      
      // ROI Recommendations
      const recommendations = this.generateROIRecommendations(roiAnalysis);
      
      console.log(`✅ ROI DETECTION COMPLETE: Score: ${roiScore}, Active Sources: ${roiAnalysis.defiROI.activeSources.length}`);
      
      return {
        success: true,
        roiAnalysis,
        roiScore,
        recommendations,
        hasActiveROI: roiAnalysis.defiROI.totalUnclaimedUSD > 0,
        source: 'roi_detection_service'
      };
      
    } catch (error) {
      console.error('💥 ROI Detection Error:', error);
      return {
        success: false,
        error: error.message,
        roiAnalysis: null
      };
    }
  }
  
  /**
   * 🎯 DEFI SUMMARY - ROI Potential Detection
   */
  static async getDefiSummary(address, chain) {
    try {
      const response = await fetch(`${this.API_BASE}?endpoint=defi-summary&address=${address}&chain=${chain}`);
      const data = await response.json();
      
      if (data._error) {
        console.warn('⚠️ DeFi Summary not available:', data._error.message);
        return {
          success: false,
          summary: {
            active_protocols: '0',
            total_positions: '0',
            total_usd_value: '0',
            total_unclaimed_usd_value: '0'
          }
        };
      }
      
      return {
        success: true,
        summary: data.result
      };
      
    } catch (error) {
      console.error('💥 DeFi Summary Error:', error);
      return {
        success: false,
        summary: null
      };
    }
  }
  
  /**
   * 🏅 DEFI POSITIONS - Detailed ROI Sources
   */
  static async getDefiPositions(address, chain) {
    try {
      const response = await fetch(`${this.API_BASE}?endpoint=defi-positions&address=${address}&chain=${chain}`);
      const data = await response.json();
      
      if (data._error) {
        console.warn('⚠️ DeFi Positions not available:', data._error.message);
        return {
          success: false,
          positions: []
        };
      }
      
      return {
        success: true,
        positions: Array.isArray(data.result) ? data.result : []
      };
      
    } catch (error) {
      console.error('💥 DeFi Positions Error:', error);
      return {
        success: false,
        positions: []
      };
    }
  }
  
  /**
   * 📊 WALLET STATS - Activity Indicators
   */
  static async getWalletStats(address, chain) {
    try {
      const response = await fetch(`${this.API_BASE}?endpoint=stats&address=${address}&chain=${chain}`);
      const data = await response.json();
      
      if (data._error) {
        console.warn('⚠️ Wallet Stats not available:', data._error.message);
        return {
          success: false,
          stats: {
            transactions: { total: '0' },
            token_transfers: { total: '0' },
            nft_transfers: { total: '0' }
          }
        };
      }
      
      return {
        success: true,
        stats: data.result
      };
      
    } catch (error) {
      console.error('💥 Wallet Stats Error:', error);
      return {
        success: false,
        stats: null
      };
    }
  }
  
  /**
   * 🎯 ANALYZE DEFI ROI
   * Analysiert DeFi-Positionen für ROI-Quellen
   */
  static analyzeDefiROI(defiSummaryResult, defiPositionsResult) {
    const summary = defiSummaryResult.summary || {};
    const positions = defiPositionsResult.positions || [];
    
    // Parse summary data
    const activeProtocols = parseInt(summary.active_protocols) || 0;
    const totalPositions = parseInt(summary.total_positions) || 0;
    const totalValueUSD = parseFloat(summary.total_usd_value) || 0;
    const totalUnclaimedUSD = parseFloat(summary.total_unclaimed_usd_value) || 0;
    
    // Analyze individual positions for ROI sources
    const roiSources = positions.map(position => {
      const balanceUsd = parseFloat(position.balance_usd) || 0;
      const unclaimedUsd = parseFloat(position.total_unclaimed_usd_value) || 0;
      const apy = position.position_details?.apy || 0;
      
      return {
        protocol: position.protocol_name || 'Unknown',
        protocolId: position.protocol_id || 'unknown',
        type: position.label || 'position',
        balanceUsd,
        unclaimedUsd,
        apy,
        
        // ROI Analysis
        isActiveROI: unclaimedUsd > 0,
        hasYield: apy > 0,
        dailyROIEstimate: apy > 0 ? (apy * balanceUsd / 365 / 100) : 0,
        
        // Position Classification
        riskLevel: this.classifyPositionRisk(position),
        roiType: this.classifyROIType(position),
        
        tokens: position.tokens?.map(token => ({
          symbol: token.symbol,
          name: token.name,
          balance: token.balance_formatted,
          usdValue: token.usd_value
        })) || []
      };
    }).filter(source => source.isActiveROI || source.hasYield);
    
    // Calculate aggregated metrics
    const activeSources = roiSources.filter(s => s.isActiveROI);
    const totalDailyROI = roiSources.reduce((sum, s) => sum + s.dailyROIEstimate, 0);
    
    return {
      // Summary Metrics
      activeProtocols,
      totalPositions,
      totalValueUSD,
      totalUnclaimedUSD,
      
      // ROI Sources
      roiSources,
      activeSources,
      roiSourcesCount: roiSources.length,
      activeSourcesCount: activeSources.length,
      
      // ROI Calculations
      totalDailyROI,
      totalWeeklyROI: totalDailyROI * 7,
      totalMonthlyROI: totalDailyROI * 30,
      
      // ROI Quality Assessment
      roiQuality: this.assessROIQuality(roiSources, totalUnclaimedUSD),
      hasSignificantROI: totalUnclaimedUSD > 100 || totalDailyROI > 10
    };
  }
  
  /**
   * 📈 ANALYZE ACTIVITY ROI
   * Analysiert Wallet-Aktivität für ROI-Indikatoren
   */
  static analyzeActivityROI(walletStatsResult) {
    const stats = walletStatsResult.stats || {};
    
    const totalTransactions = parseInt(stats.transactions?.total) || 0;
    const tokenTransfers = parseInt(stats.token_transfers?.total) || 0;
    const nftTransfers = parseInt(stats.nft_transfers?.total) || 0;
    
    // Activity-basierte ROI-Indikatoren
    const activityScore = Math.min(100, 
      Math.min(40, totalTransactions / 100 * 40) +
      Math.min(30, tokenTransfers / 50 * 30) +
      Math.min(30, nftTransfers / 20 * 30)
    );
    
    return {
      totalTransactions,
      tokenTransfers,
      nftTransfers,
      activityScore,
      
      // Activity-based ROI indicators
      isActiveTrader: totalTransactions > 500,
      isFrequentUser: tokenTransfers > 100,
      isNFTActive: nftTransfers > 10,
      
      // ROI likelihood based on activity
      roiLikelihood: this.calculateROILikelihood(totalTransactions, tokenTransfers),
      userType: this.classifyUserType(totalTransactions, tokenTransfers, nftTransfers)
    };
  }
  
  /**
   * 🔄 CALCULATE COMBINED ROI METRICS
   * Kombiniert alle ROI-Quellen zu Gesamtmetriken
   */
  static calculateCombinedROIMetrics(defiSummary, defiPositions, walletStats) {
    const defiResult = this.analyzeDefiROI(defiSummary, defiPositions);
    const activityResult = this.analyzeActivityROI(walletStats);
    
    return {
      // Combined ROI Value
      totalROIValue: defiResult.totalUnclaimedUSD,
      estimatedDailyROI: defiResult.totalDailyROI,
      estimatedMonthlyROI: defiResult.totalMonthlyROI,
      
      // ROI Diversity
      roiDiversification: defiResult.activeProtocols,
      roiSourceDiversity: defiResult.roiSourcesCount,
      
      // Combined Scores
      overallROIScore: this.calculateOverallROIScore(defiResult, activityResult),
      riskAdjustedROI: this.calculateRiskAdjustedROI(defiResult),
      
      // User Classification
      roiProfile: this.determineROIProfile(defiResult, activityResult),
      investorType: this.classifyInvestorType(defiResult, activityResult)
    };
  }
  
  /**
   * 📊 CALCULATE ROI SCORE (0-100)
   */
  static calculateROIScore(roiAnalysis) {
    const defi = roiAnalysis.defiROI;
    const activity = roiAnalysis.activityROI;
    const combined = roiAnalysis.combinedMetrics;
    
    let score = 0;
    
    // DeFi ROI (60% weight)
    if (defi.totalUnclaimedUSD > 1000) score += 30;
    else if (defi.totalUnclaimedUSD > 100) score += 20;
    else if (defi.totalUnclaimedUSD > 0) score += 10;
    
    if (defi.totalDailyROI > 50) score += 20;
    else if (defi.totalDailyROI > 10) score += 15;
    else if (defi.totalDailyROI > 0) score += 5;
    
    if (defi.activeProtocols > 3) score += 10;
    else if (defi.activeProtocols > 1) score += 5;
    
    // Activity ROI (40% weight)
    score += Math.min(20, activity.activityScore / 5);
    
    if (activity.isActiveTrader) score += 10;
    if (activity.isFrequentUser) score += 5;
    if (activity.isNFTActive) score += 5;
    
    return Math.min(100, score);
  }
  
  /**
   * 💡 GENERATE ROI RECOMMENDATIONS
   */
  static generateROIRecommendations(roiAnalysis) {
    const recommendations = [];
    const defi = roiAnalysis.defiROI;
    const activity = roiAnalysis.activityROI;
    
    // DeFi-based recommendations
    if (defi.totalUnclaimedUSD > 0) {
      recommendations.push({
        type: 'claim_rewards',
        priority: 'high',
        title: 'Unclaimed Rewards Available',
        description: `You have $${defi.totalUnclaimedUSD.toFixed(2)} in unclaimed DeFi rewards`,
        action: 'Claim your pending rewards to realize ROI',
        protocols: defi.activeSources.map(s => s.protocol)
      });
    }
    
    if (defi.totalDailyROI > 0) {
      recommendations.push({
        type: 'optimize_yields',
        priority: 'medium',
        title: 'Optimize Your Yields',
        description: `Your positions generate $${defi.totalDailyROI.toFixed(2)} daily`,
        action: 'Consider compounding or optimizing position sizes',
        estimatedMonthly: defi.totalMonthlyROI
      });
    }
    
    if (defi.activeProtocols === 0) {
      recommendations.push({
        type: 'explore_defi',
        priority: 'low',
        title: 'Explore DeFi Opportunities',
        description: 'No active DeFi positions detected',
        action: 'Consider staking, liquidity providing, or lending for passive income'
      });
    }
    
    // Activity-based recommendations
    if (activity.isActiveTrader && defi.activeProtocols === 0) {
      recommendations.push({
        type: 'defi_for_traders',
        priority: 'medium',
        title: 'DeFi for Active Traders',
        description: 'Your trading activity suggests you might benefit from DeFi yield strategies',
        action: 'Explore lending protocols or yield farming'
      });
    }
    
    return recommendations;
  }
  
  // Helper Methods
  static classifyPositionRisk(position) {
    const apy = position.position_details?.apy || 0;
    const isDebt = position.position_details?.is_debt || false;
    
    if (isDebt) return 'high';
    if (apy > 20) return 'high';
    if (apy > 5) return 'medium';
    return 'low';
  }
  
  static classifyROIType(position) {
    const label = position.label?.toLowerCase() || '';
    const isDebt = position.position_details?.is_debt || false;
    
    if (isDebt) return 'lending';
    if (label.includes('liquidity')) return 'liquidity_mining';
    if (label.includes('staking')) return 'staking';
    return 'other';
  }
  
  static assessROIQuality(roiSources, totalUnclaimed) {
    const avgAPY = roiSources.reduce((sum, s) => sum + s.apy, 0) / roiSources.length || 0;
    const sourceCount = roiSources.length;
    
    if (totalUnclaimed > 1000 && avgAPY > 10 && sourceCount > 2) return 'excellent';
    if (totalUnclaimed > 100 && avgAPY > 5 && sourceCount > 1) return 'good';
    if (totalUnclaimed > 0 || avgAPY > 0) return 'fair';
    return 'poor';
  }
  
  static calculateROILikelihood(transactions, tokenTransfers) {
    if (transactions > 1000 && tokenTransfers > 100) return 'very_high';
    if (transactions > 500 && tokenTransfers > 50) return 'high';
    if (transactions > 100 && tokenTransfers > 20) return 'medium';
    if (transactions > 10) return 'low';
    return 'very_low';
  }
  
  static classifyUserType(transactions, tokenTransfers, nftTransfers) {
    if (transactions > 1000) return 'power_user';
    if (tokenTransfers > 100) return 'active_trader';
    if (nftTransfers > 20) return 'nft_enthusiast';
    if (transactions > 100) return 'regular_user';
    return 'beginner';
  }
  
  static calculateOverallROIScore(defiResult, activityResult) {
    const defiScore = Math.min(60, 
      (defiResult.totalUnclaimedUSD / 1000 * 30) +
      (defiResult.activeProtocols * 10) +
      (defiResult.totalDailyROI / 10 * 20)
    );
    
    const activityScore = Math.min(40, activityResult.activityScore * 0.4);
    
    return Math.min(100, defiScore + activityScore);
  }
  
  static calculateRiskAdjustedROI(defiResult) {
    // Simplified risk adjustment based on protocol diversification
    const diversificationFactor = Math.min(1, defiResult.activeProtocols / 3);
    return defiResult.totalDailyROI * diversificationFactor;
  }
  
  static determineROIProfile(defiResult, activityResult) {
    const unclaimedValue = defiResult.totalUnclaimedUSD;
    const dailyROI = defiResult.totalDailyROI;
    const protocols = defiResult.activeProtocols;
    
    if (unclaimedValue > 1000 && protocols > 3) return 'defi_whale';
    if (unclaimedValue > 100 && protocols > 1) return 'defi_farmer';
    if (dailyROI > 0 || protocols > 0) return 'defi_explorer';
    if (activityResult.isActiveTrader) return 'trader';
    return 'holder';
  }
  
  static classifyInvestorType(defiResult, activityResult) {
    const riskScore = defiResult.roiSources.reduce((sum, s) => {
      return sum + (s.riskLevel === 'high' ? 3 : s.riskLevel === 'medium' ? 2 : 1);
    }, 0);
    
    const avgRisk = riskScore / defiResult.roiSources.length || 0;
    
    if (avgRisk > 2.5) return 'aggressive';
    if (avgRisk > 1.5) return 'moderate';
    if (defiResult.roiSources.length > 0) return 'conservative';
    return 'passive';
  }

  /**
   * 🎯 DETECT ROI SOURCES (Simplified wrapper for frontend compatibility)
   * Wrapper um getCompleteROIAnalysis für einfachere ROI-Erkennung
   */
  static async detectROISources(address, chain = '1') {
    try {
      console.log(`🎯 Detecting ROI sources for ${address}`);
      
      const completeAnalysis = await this.getCompleteROIAnalysis(address, chain);
      
      if (!completeAnalysis.success) {
        return {
          success: false,
          error: completeAnalysis.error,
          sources: []
        };
      }
      
      // Extract ROI sources from complete analysis
      const roiSources = completeAnalysis.roiAnalysis.defiROI.roiSources || [];
      const activeSources = completeAnalysis.roiAnalysis.defiROI.activeSources || [];
      
      return {
        success: true,
        sources: roiSources,
        activeSources: activeSources,
        totalUnclaimedUSD: completeAnalysis.roiAnalysis.defiROI.totalUnclaimedUSD || 0,
        totalDailyROI: completeAnalysis.roiAnalysis.defiROI.totalDailyROI || 0,
        roiScore: completeAnalysis.roiScore || 0,
        hasActiveROI: completeAnalysis.hasActiveROI || false,
        source: 'roi_detection_wrapper'
      };
      
    } catch (error) {
      console.error('💥 detectROISources Error:', error);
      return {
        success: false,
        error: error.message,
        sources: []
      };
    }
  }
} 