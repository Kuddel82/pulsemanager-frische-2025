// 🚀 ENTERPRISE INTEGRATION SERVICE
// Integriert die neuen Moralis Enterprise APIs nahtlos in den bestehenden Portfolio-Flow
// Datum: 2025-01-11 - ENTERPRISE ENHANCEMENT LAYER

import CentralDataService from './CentralDataService';

export class EnterpriseIntegrationService {
  
  /**
   * 🚀 Enhanced Portfolio Loading with Enterprise Features
   * Erweitert die normale Portfolio-Ladung um Enterprise-Features
   */
  static async loadEnhancedPortfolio(userId) {
    console.log(`🚀 ENTERPRISE INTEGRATION: Loading enhanced portfolio for user ${userId}`);
    
    try {
      // 1. Load standard portfolio first (with existing caching)
      const standardPortfolio = await CentralDataService.loadCompletePortfolio(userId);
      
      if (!standardPortfolio.success || !standardPortfolio.wallets?.length) {
        console.log('⚠️ ENTERPRISE: No standard portfolio data available, skipping enterprise enhancements');
        return standardPortfolio;
      }
      
      console.log(`📊 ENTERPRISE: Standard portfolio loaded, enhancing with Enterprise APIs...`);
      
      // 2. Check if Enterprise APIs are available
      const enterpriseHealth = await CentralDataService.checkEnterpriseHealth();
      
      if (!enterpriseHealth.operational) {
        console.log('⚠️ ENTERPRISE: Advanced APIs not available, using standard portfolio');
        return {
          ...standardPortfolio,
          enterpriseStatus: 'unavailable',
          enterpriseFeatures: {
            available: false,
            reason: enterpriseHealth.error || 'Service unavailable'
          }
        };
      }
      
      console.log('✅ ENTERPRISE: Advanced APIs operational, loading enhanced data...');
      
      // 3. Load Enhanced Data in Parallel
      const enhancements = await Promise.allSettled([
        this.loadWalletHistoryEnhancement(standardPortfolio.wallets),
        this.loadNativeBalanceEnhancement(standardPortfolio.wallets),
        this.loadNetWorthEnhancement(standardPortfolio.wallets),
        this.loadTransferEnhancement(standardPortfolio.wallets),
        this.loadDefiEnhancement(standardPortfolio.wallets)
      ]);
      
      // 4. Process Enhancement Results
      const [historyResult, nativeResult, netWorthResult, transferResult, defiResult] = enhancements;
      
      const enhancedData = {
        ...standardPortfolio,
        enterpriseStatus: 'enhanced',
        enterpriseFeatures: {
          available: true,
          health: enterpriseHealth,
          enhancements: {}
        }
      };
      
      // Add successful enhancements
      if (historyResult.status === 'fulfilled' && historyResult.value) {
        enhancedData.enterpriseFeatures.enhancements.verboseHistory = historyResult.value;
        enhancedData.verboseTransactionCount = historyResult.value.transactions?.length || 0;
      }
      
      if (nativeResult.status === 'fulfilled' && nativeResult.value) {
        enhancedData.enterpriseFeatures.enhancements.nativeBalances = nativeResult.value;
        enhancedData.totalNativeValue = nativeResult.value.totalValue || 0;
        enhancedData.totalValue = (enhancedData.totalValue || 0) + (nativeResult.value.totalValue || 0);
      }
      
      if (netWorthResult.status === 'fulfilled' && netWorthResult.value) {
        enhancedData.enterpriseFeatures.enhancements.netWorth = netWorthResult.value;
        enhancedData.enterpriseNetWorth = netWorthResult.value.totalNetWorth || 0;
      }
      
      if (transferResult.status === 'fulfilled' && transferResult.value) {
        enhancedData.enterpriseFeatures.enhancements.enhancedTransfers = transferResult.value;
        enhancedData.roiTransfersDetected = transferResult.value.roiTransfersFound || 0;
      }
      
      if (defiResult.status === 'fulfilled' && defiResult.value) {
        enhancedData.enterpriseFeatures.enhancements.defiPositions = defiResult.value;
        enhancedData.defiPositionCount = defiResult.value.positions?.length || 0;
      }
      
      // 5. Calculate Enhancement Statistics
      const enhancementCount = Object.keys(enhancedData.enterpriseFeatures.enhancements).length;
      enhancedData.enterpriseFeatures.enhancementCount = enhancementCount;
      enhancedData.enterpriseFeatures.coverage = (enhancementCount / 5) * 100; // 5 total enhancements
      
      console.log(`✅ ENTERPRISE INTEGRATION COMPLETE: ${enhancementCount}/5 enhancements loaded`);
      console.log(`💎 Enhanced Portfolio Value: $${enhancedData.totalValue.toFixed(2)}`);
      
      return enhancedData;
      
    } catch (error) {
      console.error('💥 ENTERPRISE INTEGRATION ERROR:', error);
      
      // Fallback to standard portfolio on error
      return {
        ...standardPortfolio,
        enterpriseStatus: 'error',
        enterpriseFeatures: {
          available: false,
          error: error.message
        }
      };
    }
  }

  /**
   * 📜 Load Wallet History Enhancement
   */
  static async loadWalletHistoryEnhancement(wallets) {
    try {
      console.log('📜 ENTERPRISE: Loading verbose transaction history...');
      const historyData = await CentralDataService.loadWalletHistoryVerbose(wallets, 50);
      
      if (historyData.transactions?.length > 0) {
        console.log(`✅ VERBOSE HISTORY: ${historyData.transactions.length} enhanced transactions loaded`);
        return historyData;
      }
      
      return null;
    } catch (error) {
      console.error('💥 VERBOSE HISTORY ERROR:', error);
      return null;
    }
  }

  /**
   * 💰 Load Native Balance Enhancement
   */
  static async loadNativeBalanceEnhancement(wallets) {
    try {
      console.log('💰 ENTERPRISE: Loading native balances...');
      const nativeData = await CentralDataService.loadNativeBalances(wallets);
      
      if (nativeData.balances?.length > 0) {
        console.log(`✅ NATIVE BALANCES: ${nativeData.balances.length} balances loaded, total: $${nativeData.totalValue.toFixed(2)}`);
        return nativeData;
      }
      
      return null;
    } catch (error) {
      console.error('💥 NATIVE BALANCE ERROR:', error);
      return null;
    }
  }

  /**
   * 💎 Load Net Worth Enhancement
   */
  static async loadNetWorthEnhancement(wallets) {
    try {
      console.log('💎 ENTERPRISE: Loading enhanced net worth...');
      const netWorthData = await CentralDataService.loadNetWorthEnhanced(wallets);
      
      if (netWorthData.netWorthData?.length > 0) {
        console.log(`✅ NET WORTH: Enhanced analysis complete, total: $${netWorthData.totalNetWorth.toFixed(2)}`);
        return netWorthData;
      }
      
      return null;
    } catch (error) {
      console.error('💥 NET WORTH ERROR:', error);
      return null;
    }
  }

  /**
   * 🔄 Load Transfer Enhancement
   */
  static async loadTransferEnhancement(wallets) {
    try {
      console.log('🔄 ENTERPRISE: Loading enhanced token transfers...');
      const transferData = await CentralDataService.loadTokenTransfersEnhanced(wallets, 100);
      
      if (transferData.transfers?.length > 0) {
        console.log(`✅ ENHANCED TRANSFERS: ${transferData.transfers.length} transfers loaded, ${transferData.roiTransfersFound} ROI candidates`);
        return transferData;
      }
      
      return null;
    } catch (error) {
      console.error('💥 ENHANCED TRANSFERS ERROR:', error);
      return null;
    }
  }

  /**
   * 🎯 Load DeFi Enhancement
   */
  static async loadDefiEnhancement(wallets) {
    try {
      console.log('🎯 ENTERPRISE: Loading DeFi positions...');
      const defiData = await CentralDataService.loadDefiPositionsEnhanced(wallets);
      
      if (defiData.positions?.length > 0) {
        console.log(`✅ DEFI POSITIONS: ${defiData.positions.length} positions loaded`);
        return defiData;
      }
      
      return null;
    } catch (error) {
      console.error('💥 DEFI POSITIONS ERROR:', error);
      return null;
    }
  }

  /**
   * 🎯 Get Enterprise Feature Summary
   */
  static getEnterpriseFeatureSummary(portfolioData) {
    if (!portfolioData?.enterpriseFeatures?.available) {
      return {
        status: 'standard',
        message: 'Using standard Moralis APIs',
        features: []
      };
    }
    
    const enhancements = portfolioData.enterpriseFeatures.enhancements || {};
    const features = [];
    
    if (enhancements.verboseHistory) {
      features.push({
        name: 'Verbose Transaction History',
        status: 'active',
        value: `${enhancements.verboseHistory.transactions?.length || 0} enhanced transactions`,
        icon: '📜'
      });
    }
    
    if (enhancements.nativeBalances) {
      features.push({
        name: 'Native Balance Tracking',
        status: 'active',
        value: `$${enhancements.nativeBalances.totalValue?.toFixed(2) || '0.00'} native value`,
        icon: '💰'
      });
    }
    
    if (enhancements.netWorth) {
      features.push({
        name: 'Enhanced Net Worth',
        status: 'active',
        value: `$${enhancements.netWorth.totalNetWorth?.toFixed(2) || '0.00'} enterprise value`,
        icon: '💎'
      });
    }
    
    if (enhancements.enhancedTransfers) {
      features.push({
        name: 'ROI Detection',
        status: 'active',
        value: `${enhancements.enhancedTransfers.roiTransfersFound || 0} ROI transfers detected`,
        icon: '🔄'
      });
    }
    
    if (enhancements.defiPositions) {
      features.push({
        name: 'DeFi Position Analysis',
        status: 'active',
        value: `${enhancements.defiPositions.positions?.length || 0} DeFi positions`,
        icon: '🎯'
      });
    }
    
    return {
      status: 'enterprise',
      message: `Enterprise features active (${features.length}/5)`,
      coverage: portfolioData.enterpriseFeatures.coverage || 0,
      features
    };
  }

  /**
   * 🔧 Quick Enterprise Health Check
   */
  static async quickHealthCheck() {
    try {
      const health = await CentralDataService.checkEnterpriseHealth();
      return {
        operational: health.operational,
        features: health.features || {},
        message: health.operational ? 'All Enterprise APIs operational' : 'Enterprise APIs unavailable'
      };
    } catch (error) {
      return {
        operational: false,
        features: {},
        message: `Health check failed: ${error.message}`
      };
    }
  }

  /**
   * 📊 Generate Enterprise Performance Report
   */
  static generatePerformanceReport(portfolioData) {
    const report = {
      timestamp: new Date().toISOString(),
      status: portfolioData.enterpriseStatus || 'standard',
      totalValue: portfolioData.totalValue || 0,
      standardFeatures: {
        tokenCount: portfolioData.tokenCount || 0,
        walletCount: portfolioData.walletCount || 0,
        roiTransactions: portfolioData.roiTransactions?.length || 0
      }
    };
    
    if (portfolioData.enterpriseFeatures?.available) {
      const enhancements = portfolioData.enterpriseFeatures.enhancements || {};
      
      report.enterpriseFeatures = {
        verboseTransactions: enhancements.verboseHistory?.transactions?.length || 0,
        nativeValue: enhancements.nativeBalances?.totalValue || 0,
        enterpriseNetWorth: enhancements.netWorth?.totalNetWorth || 0,
        roiDetections: enhancements.enhancedTransfers?.roiTransfersFound || 0,
        defiPositions: enhancements.defiPositions?.positions?.length || 0,
        coverage: portfolioData.enterpriseFeatures.coverage || 0
      };
      
      report.valueComparison = {
        standardValue: (portfolioData.totalValue || 0) - (enhancements.nativeBalances?.totalValue || 0),
        enterpriseValue: portfolioData.totalValue || 0,
        enhancement: enhancements.nativeBalances?.totalValue || 0,
        accuracy: 'enterprise'
      };
    }
    
    return report;
  }
}

export default EnterpriseIntegrationService; 