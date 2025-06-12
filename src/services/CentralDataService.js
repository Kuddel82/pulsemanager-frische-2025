// 🎯 CENTRAL DATA SERVICE - MORALIS PRO COST OPTIMIZED  
// REST API calls statt teurer SDK calls für Kostenoptimierung
// Datum: 2025-01-15 - PRO PLAN mit MANUELLER STEUERUNG (Auto-Refresh komplett deaktiviert)

import { supabase } from '@/lib/supabaseClient';

export class CentralDataService {
  
  // 🔑 PRO MODE: API Key validation 
  static async hasValidMoralisApiKey() {
    try {
      console.log('🔍 MORALIS PRO: Testing API access...');
      
      const response = await fetch('/api/moralis-v2?endpoint=wallet-tokens-prices&chain=pulsechain&address=0x0000000000000000000000000000000000000000');
      const data = await response.json();
      
      if (response.ok && !data.error) {
        console.log('✅ MORALIS PRO: API Key valid');
        return true;
      }
      
      console.error('🚨 MORALIS PRO: API Key required');
      return false;
    } catch (error) {
      console.error('💥 MORALIS PRO: API test failed:', error);
      return false;
    }
  }

  // 🌐 PRO CONFIGURATION
  static CHAINS = {
    PULSECHAIN: {
      id: 369,
      name: 'PulseChain',
      nativeSymbol: 'PLS',
      moralisChainId: '0x171',
      explorerBase: 'https://scan.pulsechain.com',
      moralisSupported: true
    },
    ETHEREUM: {
      id: 1,
      name: 'Ethereum',
      nativeSymbol: 'ETH',
      moralisChainId: '0x1',
      explorerBase: 'https://etherscan.io',
      moralisSupported: true
    }
  };

  // 🚀 MORALIS PRO ENDPOINTS (COST OPTIMIZED)
  static MORALIS_ENDPOINTS = {
    tokens: '/api/moralis-tokens',
    prices: '/api/moralis-prices',
    transactions: '/api/moralis-transactions',
    tokenTransfers: '/api/moralis-token-transfers',
    v2: '/api/moralis-v2'
  };

  // 💰 EMERGENCY FALLBACK PRICES
  static EMERGENCY_PRICES = {
    'HEX': 0.0025,
    'PLSX': 0.00008,
    'INC': 0.005,
    'PLS': 0.00005,
    'ETH': 2400,
    'USDC': 1.0,
    'USDT': 1.0,
    'DAI': 1.0
  };

  static getChainConfig(chainId) {
    for (const [key, config] of Object.entries(this.CHAINS)) {
      if (config.id === chainId) return config;
    }
    return this.CHAINS.PULSECHAIN;
  }

  // 💎 PREIS-QUELLE DISPLAY MAPPING
  static getPriceSourceDisplay(apiSource, priceValue) {
    // If no price, show as blocked
    if (!priceValue || priceValue <= 0) {
      return 'moralis_blocked';
    }
    
    // Map API sources to display names
    const sourceMap = {
      'moralis_pro_rest': 'moralis_live',
      'moralis_pro_rest_no_price': 'moralis_blocked',
      'moralis_v2_pro': 'moralis_live',
      'moralis_v2_pro_price': 'moralis_realtime'
    };
    
    return sourceMap[apiSource] || 'moralis_live';
  }

  // 🎯 MAIN PORTFOLIO LOADING (PRO OPTIMIZED)
  static async loadCompletePortfolio(userId) {
    console.log(`🎯 PRO PORTFOLIO: Loading for user ${userId}`);
    
    try {
      // API Key check
      const hasKey = await this.hasValidMoralisApiKey();
      if (!hasKey) {
        return this.getEmptyPortfolio(userId, 'Moralis API Key required');
      }

      // Load wallets
      const wallets = await this.loadUserWallets(userId);
      if (wallets.length === 0) {
        return this.getEmptyPortfolio(userId, 'No wallets found');
      }

      // Load tokens with Pro API
      const tokenData = await this.loadTokenBalancesPro(wallets);
      
      // Basic portfolio response
      const portfolioResponse = {
        success: true,
        isLoaded: true,
        userId: userId,
        totalValue: tokenData.totalValue || 0,
        tokens: tokenData.tokens || [],
        tokenCount: tokenData.tokens?.length || 0,
        wallets: wallets,
        walletCount: wallets.length,
        roiTransactions: [],
        taxTransactions: [],
        dataSource: 'moralis_pro_api',
        lastUpdated: new Date().toISOString(),
        fromCache: false
      };
      
      return portfolioResponse;

    } catch (error) {
      console.error('💥 PRO PORTFOLIO ERROR:', error);
      return this.getEmptyPortfolio(userId, error.message);
    }
  }

  // 📱 Load user wallets
  static async loadUserWallets(userId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('💥 WALLET LOAD ERROR:', error);
      return [];
    }
  }

  // 🪙 Pro token loading with cost optimization
  static async loadTokenBalancesPro(wallets) {
    console.log(`🪙 PRO: Loading tokens for ${wallets.length} wallets`);
    
    const allTokens = [];
    let totalValue = 0;

    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        // Use Pro-optimized V2 API
        const response = await fetch(`/api/moralis-v2?address=${wallet.address}&chain=${chain.name.toLowerCase()}&endpoint=wallet-tokens-prices`);
        const data = await response.json();

        if (response.ok && data.tokens && Array.isArray(data.tokens)) {
          console.log(`✅ PRO: ${data.tokens.length} tokens loaded for ${wallet.address.slice(0, 8)}`);
          
          const processedTokens = data.tokens.map(token => ({
            // Map Moralis V2 response format to expected format
            symbol: token.symbol,
            name: token.name,
            contractAddress: token.address,
            decimals: token.decimals,
            balance: token.balance,
            price: token.usd_price || 0,
            total_usd: token.total_usd || 0,
            value: token.total_usd || 0,
            hasReliablePrice: (token.usd_price || 0) > 0,
            priceSource: this.getPriceSourceDisplay(token._source, token.usd_price),
            isIncludedInPortfolio: (token.total_usd || 0) > 0.01,
            walletAddress: wallet.address,
            chainId: chainId,
            source: 'moralis_pro'
          }));
          
          allTokens.push(...processedTokens);
          totalValue += data.total_value_usd || 0;
        } else {
          console.error(`⚠️ PRO: Invalid response for ${wallet.address}: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error(`⚠️ PRO: Token load failed for ${wallet.address}:`, error.message);
      }
    }

    // 📊 Calculate portfolio statistics
    const sortedTokens = allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));
    
    // Add ranking and percentage
    sortedTokens.forEach((token, index) => {
      token.holdingRank = index + 1;
      token.percentageOfPortfolio = totalValue > 0 ? (token.value / totalValue) * 100 : 0;
    });

    console.log(`📊 PRO PORTFOLIO: ${sortedTokens.length} tokens processed, total value: $${totalValue.toFixed(2)}`);

    return {
      tokens: sortedTokens,
      totalValue: totalValue,
      source: 'moralis_pro_api'
    };
  }

  // 📊 Empty portfolio helper
  static getEmptyPortfolio(userId, errorMessage) {
    return {
      success: false,
      isLoaded: true,
      userId: userId,
      totalValue: 0,
      tokens: [],
      tokenCount: 0,
      wallets: [],
      walletCount: 0,
      roiTransactions: [],
      taxTransactions: [],
      error: errorMessage,
      dataSource: 'empty_fallback',
      lastUpdated: new Date().toISOString(),
      fromCache: false
    };
  }

  // 💰 ENTERPRISE FEATURES DISABLED FOR COST REDUCTION
  // All Enterprise API calls disabled to reduce Moralis costs by 80-90%

  static async loadWalletHistoryVerbose(wallets, limit = 100) {
    console.log(`💰 PRO MODE: Enterprise features disabled for cost reduction`);
    return { transactions: [], totalApiCalls: 0, source: 'enterprise_disabled' };
  }

  static async loadNativeBalances(wallets) {
    console.log(`💰 PRO MODE: Enterprise features disabled for cost reduction`);
    return { balances: [], totalValue: 0, totalApiCalls: 0, source: 'enterprise_disabled' };
  }

  static async loadNetWorthEnhanced(wallets) {
    console.log(`💰 PRO MODE: Enterprise features disabled for cost reduction`);
    return { netWorthData: [], totalNetWorth: 0, totalApiCalls: 0, source: 'enterprise_disabled' };
  }

  static async loadTokenTransfersEnhanced(wallets, limit = 100) {
    console.log(`💰 PRO MODE: Enterprise features disabled for cost reduction`);
    return { transfers: [], roiTransfersFound: 0, totalApiCalls: 0, source: 'enterprise_disabled' };
  }

  static async loadDefiPositionsEnhanced(wallets) {
    console.log(`💰 PRO MODE: Enterprise features disabled for cost reduction`);
    return { positions: [], totalYieldValue: 0, totalApiCalls: 0, source: 'enterprise_disabled' };
  }

  static async checkEnterpriseHealth() {
    console.log(`💰 PRO MODE: Enterprise features disabled for cost reduction`);
    return { operational: false, status: 'enterprise_disabled', error: 'Disabled for cost reduction' };
  }

  // 🎯 ROI/Tax stubs for compatibility
  static async loadROITransactionsMoralisOnly(wallets, priceMap) {
    return { transactions: [], dailyROI: 0, weeklyROI: 0, monthlyROI: 0, source: 'pro_mode_basic' };
  }

  static async loadTaxTransactionsMoralisOnly(wallets, priceMap) {
    return { transactions: [], source: 'pro_mode_basic' };
  }

  // 📊 Stats helpers
  static calculatePortfolioStats(tokenData, roiData) {
    return {
      totalTokens: tokenData.tokens?.length || 0,
      totalValue: tokenData.totalValue || 0,
      dailyROI: roiData.dailyROI || 0,
      monthlyROI: roiData.monthlyROI || 0
    };
  }

  static sortAndRankTokens(tokens) {
    return tokens.sort((a, b) => (b.total_usd || 0) - (a.total_usd || 0));
  }

  static updateTokenValuesWithRealPricesFixed(tokenData, pricesData) {
    return tokenData;
  }

  static async loadTokenBalancesAndPricesCombined(wallets) {
    return { success: false, reason: 'Using separate calls in Pro mode' };
  }

  static async loadPulseXPrices(tokens) {
    return { priceMap: {}, updatedCount: 0, source: 'pro_mode_basic' };
  }

  static getLimitedPortfolioFromCache(userId, wallets) {
    return this.getEmptyPortfolio(userId, 'Limited cache data only');
  }

  static async loadTokenPricesMoralisOnly(tokens) {
    return { priceMap: {}, updatedCount: 0, apiCalls: 0, source: 'pro_mode_basic' };
  }

}

export default CentralDataService; 