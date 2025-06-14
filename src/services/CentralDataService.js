// 🎯 CENTRAL DATA SERVICE - SAUBERE PREISLOGIK STRUKTURIERT
// Stand: 14.06.2025 - Implementierung nach User-Spezifikationen
// ✅ Moralis First → DexScreener Fallback → PulseWatch Preferred → Emergency Fallback

import { supabase } from '@/lib/supabaseClient';
import { TokenPricingService } from './TokenPricingService';
// 🎯 NEUE PREISLOGIK: Strukturierte Preis-Resolution ohne willkürliche Blockierungen

export class CentralDataService {
  
  // 🔑 PRO MODE: API Key validation 
  static async hasValidMoralisApiKey() {
    try {
      console.log('🔍 MORALIS PRO: Testing API access...');
      
      // Test with simple erc20 endpoint instead of enterprise endpoint
      const response = await fetch('/api/moralis-v2?endpoint=erc20&chain=pulsechain&address=0x0000000000000000000000000000000000000000');
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

  // 🎯 NEUE STRUKTURIERTE PREISLOGIK - IMPORT TokenPricingService
  // Verwende den neuen TokenPricingService für saubere Preis-Resolution

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

  // 🎯 MAIN PORTFOLIO LOADING (PRO OPTIMIZED) - COST REDUCED!
  static async loadCompletePortfolio(userId, options = {}) {
    console.log(`🎯 PRO PORTFOLIO: Loading for user ${userId}`);
    
    // 🚨 COST REDUCTION: Don't load ROI/Tax by default (40k CUs saved!)
    const { includeROI = false, includeTax = false } = options;
    
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
      
      // 🚨 COST REDUCTION: Only load ROI/Tax when explicitly requested
      let roiData = { transactions: [], dailyROI: 0, weeklyROI: 0, monthlyROI: 0, totalApiCalls: 0 };
      let taxData = { transactions: [], totalApiCalls: 0 };
      
      if (includeROI) {
        console.log('🚀 LOADING ROI DATA (explicitly requested)...');
        roiData = await this.loadROITransactionsMoralisOnly(wallets, {});
      }
      
      if (includeTax) {
        console.log('🚀 LOADING TAX DATA (explicitly requested)...');
        taxData = await this.loadTaxTransactionsMoralisOnly(wallets, {});
      }
      
      // Portfolio response with optional ROI/Tax data
      const portfolioResponse = {
        success: true,
        isLoaded: true,
        userId: userId,
        totalValue: tokenData.totalValue || 0,
        tokens: tokenData.tokens || [],
        tokenCount: tokenData.tokens?.length || 0,
        wallets: wallets,
        walletCount: wallets.length,
        
        // ROI Data (empty unless requested)
        roiTransactions: roiData.transactions || [],
        dailyROI: roiData.dailyROI || 0,
        weeklyROI: roiData.weeklyROI || 0,
        monthlyROI: roiData.monthlyROI || 0,
        
        // Tax Data (empty unless requested)
        taxTransactions: taxData.transactions || [],
        
        // Metadata
        dataSource: includeROI || includeTax ? 'moralis_pro_separate_complete' : 'moralis_pro_separate_basic',
        lastUpdated: new Date().toISOString(),
        fromCache: false,
        apiCalls: (tokenData.apiCallsUsed || 0) + (roiData.totalApiCalls || 0) + (taxData.totalApiCalls || 0),
        
        // Debug Information for CU tracking
        debug: tokenData.debug || {
          pricesUpdated: new Date().toLocaleString('de-DE'),
          priceSource: 'moralis_pro_batch_prices',
          apiCalls: tokenData.apiCallsUsed || 0,
          lastPriceUpdate: new Date().toISOString()
        },
        
        // Summary stats
        summary: {
          totalTokens: tokenData.tokens?.length || 0,
          totalValue: tokenData.totalValue || 0,
          roiTransactions: roiData.transactions?.length || 0,
          taxTransactions: taxData.transactions?.length || 0,
          monthlyROI: roiData.monthlyROI || 0
        }
      };
      
      console.log(`✅ PRO PORTFOLIO: Basic load complete (ROI: ${includeROI}, Tax: ${includeTax}, CUs: ${portfolioResponse.apiCalls})`);
      
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

  // 🪙 Pro token loading with separate API calls (cost optimized for Pro Plan)
  // 🎯 NEUE STRUKTURIERTE TOKEN-LOADING-LOGIK
  static async loadTokenBalancesPro(wallets) {
    console.log(`🎯 STRUCTURED: Loading tokens for ${wallets.length} wallets`);
    
    const allTokens = [];
    let totalValue = 0;
    let apiCallsUsed = 0;
    const debug = {
      pricesUpdated: new Date().toLocaleString('de-DE'),
      priceSource: 'structured_token_pricing_service',
      apiCalls: 0,
      lastPriceUpdate: new Date().toISOString()
    };

    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        // 🚀 SCHRITT 1: Wallet Tokens via Moralis laden (nur Balances!)
        console.log(`📊 TOKENS: Loading balances for ${wallet.address.slice(0,8)}... on ${chain.name}`);
        
        const tokensResponse = await fetch(`/api/moralis-v2?address=${wallet.address}&chain=${chain.name.toLowerCase()}&endpoint=erc20`);
        apiCallsUsed++;
        
        if (!tokensResponse.ok) {
          console.error(`⚠️ TOKENS: Failed to load for ${wallet.address}: ${tokensResponse.status}`);
          continue;
        }
        
        const tokensData = await tokensResponse.json();
        const rawTokens = tokensData.result || [];
        
        console.log(`✅ TOKENS: ${rawTokens.length} tokens found for ${wallet.address.slice(0, 8)}`);
        
        // 🚀 SCHRITT 2: Preise über TokenPricingService strukturiert laden
        if (rawTokens.length > 0) {
          // Vorbereite Token-Array für Pricing-Service
          const tokensForPricing = rawTokens.map(token => ({
            address: token.token_address,
            symbol: token.symbol,
            chain: chain.moralisChainId || '0x171'
          }));
          
          console.log(`🎯 PRICING: Loading structured prices for ${tokensForPricing.length} tokens`);
          
          // Verwende den neuen TokenPricingService
          const pricesData = await TokenPricingService.getTokenPrices(tokensForPricing);
          
          // 🚀 SCHRITT 3: Token-Processing ohne willkürliche Blockierungen
          const processedTokens = rawTokens.map((token) => {
            try {
              // Token-Balance berechnen
              const balanceReadable = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
              const tokenAddress = token.token_address?.toLowerCase();
              const tokenSymbol = token.symbol?.toUpperCase();
              
              console.log(`📊 PROCESSING: ${tokenSymbol} = ${balanceReadable.toLocaleString()} tokens`);
              
              // Skip Zero-Balance Tokens
              if (balanceReadable === 0) {
                console.log(`⚪ SKIPPING: ${tokenSymbol} has zero balance`);
                return null;
              }
              
              // Hole strukturierte Preis-Daten
              const priceData = pricesData[tokenAddress] || {};
              const finalPrice = priceData.final || 0;
              const priceSource = priceData.source || 'no_price';
              const isReliable = priceData.status === 'verified';
              
              const totalUsd = balanceReadable * finalPrice;
              
              // 📈 DEBUG: Log alle Token mit Werten über $100
              if (totalUsd > 100) {
                console.log(`💎 HIGH VALUE: ${tokenSymbol} - Balance: ${balanceReadable.toLocaleString()}, Price: $${finalPrice} (${priceSource}), Value: $${totalUsd.toLocaleString()}`);
              }
              
              return {
                symbol: token.symbol,
                name: token.name,
                contractAddress: token.token_address,
                decimals: token.decimals,
                balance: balanceReadable,
                price: finalPrice,
                total_usd: totalUsd,
                value: totalUsd,
                hasReliablePrice: isReliable,
                priceSource: `${priceSource} (${priceData.token || tokenSymbol})`,
                isIncludedInPortfolio: totalUsd > 0.01,
                walletAddress: wallet.address,
                chainId: chainId,
                source: 'structured_pricing_service',
                _rawBalance: token.balance,
                _rawDecimals: token.decimals,
                _priceData: priceData // Vollständige Preis-Informationen
              };
              
            } catch (tokenError) {
              console.warn(`⚠️ TOKEN PROCESSING: Error for ${token.symbol} - ${tokenError.message}`);
              
              // Fallback für fehlerhafte Token
              const balanceReadable = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
              const tokenSymbol = token.symbol?.toUpperCase();
              
              return {
                symbol: token.symbol,
                name: token.name,
                contractAddress: token.token_address,
                decimals: token.decimals,
                balance: balanceReadable,
                price: 0,
                total_usd: 0,
                value: 0,
                hasReliablePrice: false,
                priceSource: 'processing_error',
                isIncludedInPortfolio: false,
                walletAddress: wallet.address,
                chainId: chainId,
                source: 'error_fallback',
                _rawBalance: token.balance,
                _rawDecimals: token.decimals,
                _error: tokenError.message
              };
            }
          }).filter(token => token !== null); // Entferne null-Werte
          
          allTokens.push(...processedTokens);
          totalValue += processedTokens.reduce((sum, token) => sum + (token.value || 0), 0);
          
          console.log(`✅ WALLET: ${processedTokens.length} tokens processed for ${wallet.address.slice(0,8)}`);
        }
        
      } catch (error) {
        console.error(`⚠️ WALLET LOAD: Failed for ${wallet.address} - ${error.message}`);
      }
    }

    // 📊 Portfolio-Statistiken berechnen
    const sortedTokens = allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));
    
    // Ranking und Prozent-Anteil hinzufügen
    sortedTokens.forEach((token, index) => {
      token.holdingRank = index + 1;
      token.percentageOfPortfolio = totalValue > 0 ? (token.value / totalValue) * 100 : 0;
    });

    debug.apiCalls = apiCallsUsed;
    
    console.log(`✅ PORTFOLIO: ${sortedTokens.length} tokens, $${totalValue.toFixed(2)} total value, ${apiCallsUsed} API calls`);

    return {
      tokens: sortedTokens,
      totalValue: totalValue,
      source: 'structured_token_pricing_service',
      debug: debug,
      apiCallsUsed: apiCallsUsed
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

  // 🎯 ROI/Tax REAL IMPLEMENTATIONS for Tax & ROI Views
  static async loadROITransactionsMoralisOnly(wallets, priceMap) {
    console.log(`🚀 ROI: Loading ROI transactions for ${wallets.length} wallets (CURRENT MONTH ONLY)`);
    
    const allROITransactions = [];
    let totalApiCalls = 0;
    
    // 📅 NUR LAUFENDER MONAT - User-Wunsch
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        // Call ROI cache API mit Monat-Filter
        const response = await fetch(`/api/roi-cache?wallet=${wallet.address}&chain=${chain.name.toLowerCase()}&from=${currentMonthStart.toISOString()}`);
        totalApiCalls++;
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.roiTransactions) {
            // Zusätzlich client-seitig filtern für laufenden Monat
            const monthlyROITransactions = data.roiTransactions.filter(tx => {
              const txDate = new Date(tx.timestamp);
              return txDate >= currentMonthStart;
            });
            allROITransactions.push(...monthlyROITransactions);
          }
        }
      } catch (error) {
        console.error(`⚠️ ROI load failed for ${wallet.address}:`, error.message);
      }
    }
    
    // Calculate ROI stats für LAUFENDEN MONAT
    const nowTimestamp = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    const dailyTransactions = allROITransactions.filter(tx => 
      new Date(tx.timestamp).getTime() > (nowTimestamp - dayMs)
    );
    const weeklyTransactions = allROITransactions.filter(tx => 
      new Date(tx.timestamp).getTime() > (nowTimestamp - 7 * dayMs)
    );
    const monthlyTransactions = allROITransactions; // Bereits auf Monat gefiltert
    
    const dailyROI = dailyTransactions.reduce((sum, tx) => sum + (tx.value || 0), 0);
    const weeklyROI = weeklyTransactions.reduce((sum, tx) => sum + (tx.value || 0), 0);
    const monthlyROI = monthlyTransactions.reduce((sum, tx) => sum + (tx.value || 0), 0);
    
    console.log(`✅ ROI CURRENT MONTH: ${allROITransactions.length} transactions, $${monthlyROI.toFixed(2)} monthly`);
    
    return { 
      transactions: allROITransactions, 
      dailyROI, 
      weeklyROI, 
      monthlyROI, 
      source: 'roi_cache_api_current_month',
      totalApiCalls,
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear()
    };
  }

  static async loadTaxTransactionsMoralisOnly(wallets, priceMap) {
    console.log(`🚀 TAX: Loading tax transactions for ${wallets.length} wallets`);
    
    const allTaxTransactions = [];
    let totalApiCalls = 0;
    
    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        // Call tax-report API with full pagination
        const response = await fetch(`/api/tax-report?wallet=${wallet.address}&chain=${chain.name.toLowerCase()}&getAllPages=true&maxTransactions=100000`);
        totalApiCalls++;
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.transactions) {
            allTaxTransactions.push(...data.transactions.map(tx => ({
              ...tx,
              walletAddress: wallet.address,
              chainId: chainId
            })));
          }
        }
      } catch (error) {
        console.error(`⚠️ TAX load failed for ${wallet.address}:`, error.message);
      }
    }
    
    console.log(`✅ TAX: ${allTaxTransactions.length} transactions loaded`);
    
    return { 
      transactions: allTaxTransactions, 
      source: 'tax_report_api',
      totalApiCalls
    };
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