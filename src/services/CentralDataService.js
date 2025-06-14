// 🎯 CENTRAL DATA SERVICE - MORALIS PRO COST OPTIMIZED  
// REST API calls statt teurer SDK calls für Kostenoptimierung
// Datum: 2025-01-15 - PRO PLAN mit MANUELLER STEUERUNG (Auto-Refresh komplett deaktiviert)

import { supabase } from '@/lib/supabaseClient';
// RAW MORALIS DATA: No token parsing service - use exact blockchain data for tax compliance
// Wallet History API ist nur für Transaktionshistorie, nicht für Token-Balances

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
  static async loadTokenBalancesPro(wallets) {
    console.log(`🪙 PRO: Loading tokens for ${wallets.length} wallets (separate API strategy)`);
    
    const allTokens = [];
    let totalValue = 0;
    let apiCallsUsed = 0;
    const debug = {
      pricesUpdated: new Date().toLocaleString('de-DE'),
      priceSource: 'moralis_pro_batch_prices',
      apiCalls: 0,
      lastPriceUpdate: new Date().toISOString()
    };

    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        // Step 1: Get token balances (1 API call per wallet)
        const tokensResponse = await fetch(`/api/moralis-v2?address=${wallet.address}&chain=${chain.name.toLowerCase()}&endpoint=erc20`);
        apiCallsUsed++;
        
        if (!tokensResponse.ok) {
          console.error(`⚠️ PRO: Token fetch failed for ${wallet.address}: ${tokensResponse.status}`);
          continue;
        }
        
        const tokensData = await tokensResponse.json();
        const rawTokens = tokensData.result || [];
        
        console.log(`✅ PRO: ${rawTokens.length} tokens found for ${wallet.address.slice(0, 8)}`);
        
        // Step 2: Get prices for ALL tokens in ONE batch call! 🚀
        console.log(`🚀 BATCH PRICES: Loading prices for ${rawTokens.length} tokens`);
        
        // Sammle alle Token für Batch-Call
        const tokensForPricing = rawTokens.map(token => ({
          address: token.token_address,
          symbol: token.symbol,
          chain: chain.moralisChainId || '0x171'
        }));
        
        // 🚀 ECHTE PREISE: Batch-API-Call für alle Token-Preise
        console.log(`🚀 REAL PRICES: Loading live prices for ${rawTokens.length} tokens via Moralis API`);
        
        // Batch-Call für alle Token-Preise
        let pricesData = {};
        try {
          const batchPriceResponse = await fetch('/api/moralis-batch-prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokens: tokensForPricing,
              chain: chain.moralisChainId || '0x171'
            })
          });
          
          if (batchPriceResponse.ok) {
            const batchData = await batchPriceResponse.json();
            pricesData = batchData.prices || {};
            apiCallsUsed += 1; // Batch-Call zählt als 1 API-Call
            console.log(`✅ BATCH PRICES: Loaded ${Object.keys(pricesData).length} prices`);
          } else {
            console.warn(`⚠️ BATCH PRICES: API failed, using emergency fallback`);
          }
        } catch (priceError) {
          console.warn(`⚠️ BATCH PRICES: Error, using emergency fallback:`, priceError.message);
        }

        // Step 3: Process tokens with REAL prices
        const processedTokens = rawTokens.map((token) => {
          try {
            // 🚀 RAW MORALIS DATA: Use exact blockchain data for tax compliance
            const balanceReadable = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
            console.log(`📊 RAW TOKEN: ${token.symbol} = ${balanceReadable.toLocaleString()} tokens (raw: ${token.balance}, decimals: ${token.decimals})`);
            
            // 🚀 ECHTE PREISE: Verwende Live-Preise von Moralis
            const tokenAddress = token.token_address?.toLowerCase();
            const tokenSymbol = token.symbol?.toUpperCase();
            
            // 1. Versuche Live-Preis von Batch-API
            let usdPrice = pricesData[tokenAddress]?.usdPrice || 0;
            let priceSource = 'moralis_live';
            
            // 2. Fallback zu Emergency-Preisen nur wenn kein Live-Preis
            if (usdPrice === 0 && this.EMERGENCY_PRICES[tokenSymbol]) {
              usdPrice = this.EMERGENCY_PRICES[tokenSymbol];
              priceSource = 'emergency_fallback';
              console.log(`💰 EMERGENCY PRICE: ${tokenSymbol} = $${usdPrice}`);
            }
            
            const totalUsd = balanceReadable * usdPrice;
            
            // 🚨 DEBUG: Log alle Token mit Werten über $100
            if (totalUsd > 100) {
              console.log(`💎 HIGH VALUE TOKEN: ${tokenSymbol} - Balance: ${balanceReadable.toLocaleString()}, Price: $${usdPrice}, Value: $${totalUsd.toLocaleString()}`);
            }
              
            return {
              symbol: token.symbol,
              name: token.name,
              contractAddress: token.token_address,
              decimals: token.decimals,
              balance: balanceReadable,
              price: usdPrice,
              total_usd: totalUsd,
              value: totalUsd,
              hasReliablePrice: usdPrice > 0,
              priceSource: priceSource,
              isIncludedInPortfolio: totalUsd > 0.01,
              walletAddress: wallet.address,
              chainId: chainId,
              source: 'moralis_raw_data',
              _rawBalance: token.balance,
              _rawDecimals: token.decimals
            };
          } catch (priceError) {
            console.warn(`⚠️ PRO: Token processing failed for ${token.symbol}:`, priceError.message);
            // 🚀 RAW MORALIS DATA: Even in error case, use exact blockchain data
            const balanceReadable = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
            
            // Emergency fallback price
            const tokenSymbol = token.symbol?.toUpperCase();
            const emergencyPrice = this.EMERGENCY_PRICES[tokenSymbol] || 0;
            
            return {
              symbol: token.symbol,
              name: token.name,
              contractAddress: token.token_address,
              decimals: token.decimals,
              balance: balanceReadable,
              price: emergencyPrice,
              total_usd: balanceReadable * emergencyPrice,
              value: balanceReadable * emergencyPrice,
              hasReliablePrice: emergencyPrice > 0,
              priceSource: emergencyPrice > 0 ? 'emergency_fallback' : 'no_price',
              isIncludedInPortfolio: emergencyPrice > 0,
              walletAddress: wallet.address,
              chainId: chainId,
              source: 'moralis_raw_data_error',
              _rawBalance: token.balance,
              _rawDecimals: token.decimals
            };
          }
        });
        
        allTokens.push(...processedTokens);
        totalValue += processedTokens.reduce((sum, token) => sum + (token.value || 0), 0);
        
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

    debug.apiCalls = apiCallsUsed;
    
    console.log(`📊 PRO PORTFOLIO: ${sortedTokens.length} tokens processed, total value: $${totalValue.toFixed(2)}, API calls: ${apiCallsUsed} (RAW BLOCKCHAIN DATA + LIVE PRICES!)`);

    return {
      tokens: sortedTokens,
      totalValue: totalValue,
      source: 'moralis_raw_blockchain_data',
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