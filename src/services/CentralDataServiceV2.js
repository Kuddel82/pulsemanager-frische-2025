// 🚀 CENTRAL DATA SERVICE V2 - MODERNE MORALIS APIS
// Nutzt die neuen Moralis Wallet-APIs für maximale Performance und weniger API-Calls

import { MoralisV2Service } from './MoralisV2Service.js';
import { supabase } from '@/lib/supabaseClient';
import { GlobalCacheService } from './GlobalCacheService.js';

export class CentralDataServiceV2 {
  
  // 🎯 MAIN: Lade komplettes Portfolio mit V2 APIs
  static async loadCompletePortfolio(userId) {
    console.log(`🚀 CENTRAL DATA V2: Loading portfolio for user ${userId}`);
    
    try {
      // 1. Check Cache first
      const cachedData = GlobalCacheService.getCachedPortfolioData(userId);
      if (cachedData) {
        console.log(`✅ CACHE HIT: Portfolio loaded from cache`);
        return {
          ...cachedData,
          source: 'cache',
          cached: true
        };
      }
      
      // 2. Load User Wallets
      const wallets = await this.loadUserWallets(userId);
      if (wallets.length === 0) {
        return this.getEmptyPortfolio(userId, 'Keine Wallets gefunden. Fügen Sie Ihre Wallet-Adressen hinzu.');
      }
      
      console.log(`📱 Loaded ${wallets.length} wallets`);
      
      // 3. Load Portfolio Data mit V2 APIs (parallel für Performance)
      const portfolioPromises = wallets.map(wallet => this.loadWalletPortfolioV2(wallet));
      const portfolioResults = await Promise.all(portfolioPromises);
      
      // 4. Aggregate Results
      const aggregatedPortfolio = this.aggregatePortfolioResults(portfolioResults, wallets);
      
      // 5. Cache Result
      GlobalCacheService.cachePortfolioData(userId, aggregatedPortfolio);
      
      console.log(`✅ V2 PORTFOLIO COMPLETE: $${aggregatedPortfolio.totalValue} across ${aggregatedPortfolio.tokenCount} tokens`);
      
      return {
        success: true,
        userId,
        ...aggregatedPortfolio,
        source: 'moralis_v2_apis',
        cached: false,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('💥 V2 Portfolio Error:', error);
      return this.getEmptyPortfolio(userId, `V2 API Error: ${error.message}`);
    }
  }
  
  // 📱 Load User Wallets
  static async loadUserWallets(userId) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
  
  // 🏆 Load Single Wallet Portfolio mit V2 APIs
  static async loadWalletPortfolioV2(wallet) {
    try {
      const chainId = wallet.chain_id || 1; // Default to Ethereum
      const address = wallet.address;
      
      console.log(`🔍 V2: Loading wallet ${address.slice(0, 8)}... on chain ${chainId}`);
      
      // Skip PulseChain wallets (not supported by Moralis V2)
      if (chainId === 369) {
        console.warn(`⚠️ PulseChain wallet ${address.slice(0, 8)}... skipped (not supported by Moralis V2)`);
        return {
          success: false,
          wallet,
          error: 'PulseChain not supported by Moralis V2 APIs',
          portfolio: null,
          stats: null
        };
      }
      
      // Use V2 Service for parallel loading
      const portfolioResult = await MoralisV2Service.loadCompletePortfolio(address, chainId.toString());
      
      if (!portfolioResult.success) {
        console.warn(`⚠️ V2: Wallet ${address.slice(0, 8)}... failed: ${portfolioResult.error}`);
        return {
          success: false,
          wallet,
          error: portfolioResult.error,
          portfolio: null,
          stats: null
        };
      }
      
      console.log(`✅ V2: Wallet ${address.slice(0, 8)}... loaded - $${portfolioResult.total_value_usd}`);
      
      return {
        success: true,
        wallet,
        portfolio: portfolioResult.portfolio,
        stats: portfolioResult.stats,
        totalValue: parseFloat(portfolioResult.total_value_usd || '0')
      };
      
    } catch (error) {
      console.error(`💥 V2 Wallet Error for ${wallet.address}:`, error);
      return {
        success: false,
        wallet,
        error: error.message,
        portfolio: null,
        stats: null
      };
    }
  }
  
  // 📊 Aggregate Portfolio Results
  static aggregatePortfolioResults(portfolioResults, wallets) {
    const successfulResults = portfolioResults.filter(r => r.success);
    const failedResults = portfolioResults.filter(r => !r.success);
    
    // Calculate totals
    const totalValue = successfulResults.reduce((sum, r) => sum + (r.totalValue || 0), 0);
    
    // Aggregate tokens (simplified - V2 APIs handle this better)
    const allTokens = [];
    const walletStats = [];
    
    successfulResults.forEach(result => {
      if (result.portfolio?.success && result.portfolio.chains) {
        // Extract token data from Moralis Net Worth response
        result.portfolio.chains.forEach(chain => {
          // Simplified token representation
          allTokens.push({
            symbol: chain.chain?.toUpperCase() || 'UNKNOWN',
            name: `${chain.chain} Balance`,
            balance: chain.native_balance_formatted || '0',
            valueUSD: parseFloat(chain.networth_usd || '0'),
            contractAddress: 'native',
            source: 'moralis_v2_networth',
            wallet: result.wallet
          });
        });
      }
      
      if (result.stats?.success) {
        walletStats.push({
          wallet: result.wallet,
          stats: result.stats.stats
        });
      }
    });
    
    return {
      totalValue,
      tokens: allTokens,
      tokenCount: allTokens.length,
      uniqueTokens: new Set(allTokens.map(t => t.symbol)).size,
      
      wallets: wallets,
      walletCount: wallets.length,
      successfulWallets: successfulResults.length,
      failedWallets: failedResults.length,
      
      walletStats,
      
      errors: failedResults.map(r => ({
        wallet: r.wallet.address,
        error: r.error
      })),
      
      // V2 Metadata
      apiVersion: 'moralis_v2',
      comprehensiveData: true,
      reducedApiCalls: true
    };
  }
  
  // 📈 ROI Tracker mit V2 APIs
  static async loadROIDataV2(userId) {
    try {
      console.log(`🚀 V2 ROI: Loading ROI data for user ${userId}`);
      
      // Check Cache
      const cachedData = GlobalCacheService.getCachedROIData(userId);
      if (cachedData) {
        return {
          ...cachedData,
          source: 'cache'
        };
      }
      
      // Load wallets
      const wallets = await this.loadUserWallets(userId);
      
      // Parallel ROI analysis for all wallets
      const roiPromises = wallets.map(wallet => this.analyzeWalletROIV2(wallet));
      const roiResults = await Promise.all(roiPromises);
      
      // Aggregate ROI data
      const aggregatedROI = this.aggregateROIResults(roiResults);
      
      // Cache result
      GlobalCacheService.cacheROIData(userId, aggregatedROI);
      
      console.log(`✅ V2 ROI COMPLETE: ${aggregatedROI.totalROITransactions} ROI transactions found`);
      
      return {
        success: true,
        ...aggregatedROI,
        source: 'moralis_v2_roi'
      };
      
    } catch (error) {
      console.error('💥 V2 ROI Error:', error);
      return {
        success: false,
        error: error.message,
        roiTransactions: []
      };
    }
  }
  
  // 🎯 Analyze Single Wallet ROI
  static async analyzeWalletROIV2(wallet) {
    try {
      const chainId = wallet.chain_id || 1;
      
      // Skip PulseChain
      if (chainId === 369) {
        return {
          success: false,
          wallet,
          error: 'PulseChain not supported'
        };
      }
      
      // Use V2 Service for ROI analysis
      const roiResult = await MoralisV2Service.getROITransactions(wallet.address, chainId.toString(), {
        getAllPages: false, // Limit for performance
        limit: 100
      });
      
      return {
        success: roiResult.success,
        wallet,
        roiData: roiResult
      };
      
    } catch (error) {
      return {
        success: false,
        wallet,
        error: error.message
      };
    }
  }
  
  // 📊 Aggregate ROI Results
  static aggregateROIResults(roiResults) {
    const successfulResults = roiResults.filter(r => r.success);
    
    const allROITransactions = [];
    let totalROIValue = 0;
    
    successfulResults.forEach(result => {
      if (result.roiData?.roiTransactions) {
        allROITransactions.push(...result.roiData.roiTransactions);
        // Calculate ROI value (simplified)
        result.roiData.roiTransactions.forEach(tx => {
          // Extract value from transaction (this would need more sophisticated logic)
          totalROIValue += 0; // Placeholder
        });
      }
    });
    
    return {
      totalROITransactions: allROITransactions.length,
      roiTransactions: allROITransactions.slice(0, 500), // Limit for performance
      totalROIValue,
      walletCount: successfulResults.length,
      
      // ROI Metrics
      dailyROI: 0, // Would need time-based calculation
      weeklyROI: 0,
      monthlyROI: 0
    };
  }
  
  // 📋 Tax Report mit V2 APIs
  static async loadTaxDataV2(userId) {
    try {
      console.log(`🚀 V2 TAX: Loading tax data for user ${userId}`);
      
      // Check Cache
      const cachedData = GlobalCacheService.getCachedTaxData(userId);
      if (cachedData) {
        return {
          ...cachedData,
          source: 'cache'
        };
      }
      
      // Load wallets
      const wallets = await this.loadUserWallets(userId);
      
      // Parallel tax analysis
      const taxPromises = wallets.map(wallet => this.analyzeWalletTaxV2(wallet));
      const taxResults = await Promise.all(taxPromises);
      
      // Aggregate tax data
      const aggregatedTax = this.aggregateTaxResults(taxResults);
      
      // Cache result
      GlobalCacheService.cacheTaxData(userId, aggregatedTax);
      
      console.log(`✅ V2 TAX COMPLETE: ${aggregatedTax.totalTaxableTransactions} taxable transactions found`);
      
      return {
        success: true,
        ...aggregatedTax,
        source: 'moralis_v2_tax'
      };
      
    } catch (error) {
      console.error('💥 V2 Tax Error:', error);
      return {
        success: false,
        error: error.message,
        allTransactions: [],
        taxableTransactions: []
      };
    }
  }
  
  // 📋 Analyze Single Wallet Tax
  static async analyzeWalletTaxV2(wallet) {
    try {
      const chainId = wallet.chain_id || 1;
      
      // Skip PulseChain
      if (chainId === 369) {
        return {
          success: false,
          wallet,
          error: 'PulseChain not supported'
        };
      }
      
      // Use V2 Service for tax analysis
      const taxResult = await MoralisV2Service.getTaxReportData(wallet.address, chainId.toString(), {
        getAllPages: true // Tax needs complete history
      });
      
      return {
        success: taxResult.success,
        wallet,
        taxData: taxResult
      };
      
    } catch (error) {
      return {
        success: false,
        wallet,
        error: error.message
      };
    }
  }
  
  // 📊 Aggregate Tax Results  
  static aggregateTaxResults(taxResults) {
    const successfulResults = taxResults.filter(r => r.success);
    
    const allTransactions = [];
    const taxableTransactions = [];
    
    successfulResults.forEach(result => {
      if (result.taxData?.allTransactions) {
        allTransactions.push(...result.taxData.allTransactions);
      }
      if (result.taxData?.taxableTransactions) {
        taxableTransactions.push(...result.taxData.taxableTransactions);
      }
    });
    
    return {
      allTransactions: allTransactions.slice(0, 10000), // Limit for performance
      taxableTransactions: taxableTransactions.slice(0, 5000),
      totalTransactions: allTransactions.length,
      totalTaxableTransactions: taxableTransactions.length,
      
      summary: {
        totalTransactions: allTransactions.length,
        taxableCount: taxableTransactions.length,
        taxableRatio: allTransactions.length > 0 ? 
          (taxableTransactions.length / allTransactions.length * 100).toFixed(2) : '0'
      }
    };
  }
  
  // 🗄️ Empty Portfolio Fallback
  static getEmptyPortfolio(userId, errorMessage) {
    return {
      success: false,
      userId,
      error: errorMessage,
      totalValue: 0,
      tokens: [],
      tokenCount: 0,
      wallets: [],
      walletCount: 0,
      source: 'empty_fallback'
    };
  }
} 