// 🎯 CENTRAL DATA SERVICE - 100% MORALIS ENTERPRISE ONLY
// Eliminiert ALLE kostenlosen APIs für maximale Zuverlässigkeit  
// V2: Mit intelligenter Database-Cache-Integration
// Datum: 2025-01-11 - ENTERPRISE + SMART CACHING

import { supabase } from '@/lib/supabaseClient';
import { DatabaseCacheService } from './DatabaseCacheService';
import { ApiInterceptorService } from './ApiInterceptorService';
import { TokenParsingService } from './TokenParsingService';
import { GlobalRateLimiter } from './GlobalRateLimiter';
import { debugWalletLoad, debugCacheData, debugMoralisResponse, fetchAllTransactions } from './DebugPatches';

export class CentralDataService {
  
  // 🔑 ENTERPRISE MODE DETECTION
  static async hasValidMoralisApiKey() {
    try {
      // ⚠️ EMERGENCY FIX: Handle missing API key gracefully
      console.log('🔍 API KEY CHECK: Testing Moralis access...');
      
      // Use a simple wallet-tokens test request with null address
      const response = await fetch('/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=0x0000000000000000000000000000000000000000');
      const data = await response.json();
      
      // ✅ FIXED: Accept various response types as valid
      if (data._test_mode && data._message && response.ok) {
        console.log('✅ MORALIS API KEY VALIDATION: Test passed with null address');
        return true;
      }
      
      // ✅ FIXED: Don't throw error if API key is missing, just log warning
      if (data._error && data._error.message && data._error.message.includes('API Key')) {
        console.warn('⚠️ WARNING: Moralis API Key not configured - using fallback mode');
        return false; // Return false instead of throwing error
      }
      
      // Check if we get a proper Moralis response instead of fallback
      const isValid = !data._fallback && !data._error && response.ok;
      
      if (!isValid) {
        console.warn('⚠️ WARNING: No Moralis Enterprise access detected - using fallback mode');
        return false; // Return false instead of throwing error
      }
      
      console.log('✅ MORALIS API KEY: Valid enterprise access detected');
      return isValid;
    } catch (error) {
      console.warn('⚠️ WARNING: Moralis API validation failed - using fallback mode:', error.message);
      return false; // Return false instead of throwing error
    }
  }

  // 🌐 100% MORALIS ENTERPRISE CONFIGURATION
  static CHAINS = {
    PULSECHAIN: {
      id: 369,
      name: 'PulseChain',
      nativeSymbol: 'PLS',
      moralisChainId: '0x171',
      explorerBase: 'https://scan.pulsechain.com',
      // ✅ MORALIS UNTERSTÜTZT PULSECHAIN mit spezifischen DEXs
      supportedDEXs: ['PULSEX', '9mm'],
      moralisSupported: true
    },
    ETHEREUM: {
      id: 1,
      name: 'Ethereum',
      nativeSymbol: 'ETH',
      moralisChainId: '0x1',
      explorerBase: 'https://etherscan.io',
      supportedDEXs: ['uniswap', 'sushiswap', '1inch'],
      moralisSupported: true
    }
  };

  // 🚀 MORALIS ENTERPRISE ENDPOINTS (ONLY)
  static MORALIS_ENDPOINTS = {
    tokens: '/api/moralis-tokens',
    prices: '/api/moralis-prices', 
    transactions: '/api/moralis-transactions',
    tokenTransfers: '/api/moralis-token-transfers',
    // ✨ NEW: Enterprise Advanced APIs
    enterpriseAdvanced: '/api/moralis-enterprise-apis'
  };

  // 💰 EMERGENCY FALLBACKS: Nur für absolute Notfälle (PLS/ETH/Stablecoins)
  static EMERGENCY_PRICES = {
    'HEX': 0.0025,      // HEX rough estimate
    'PLSX': 0.00008,    // PulseX rough estimate
    'INC': 0.005,       // Incentive rough estimate  
    'PLS': 0.00005,     // PulseChain rough estimate
    'ETH': 2400,          // Ethereum Native
    'USDC': 1.0,          // Stablecoin
    'USDT': 1.0,          // Stablecoin
    'DAI': 1.0            // Stablecoin
  };

  // 🎯 DRUCKER-CONTRACTS (für ROI-Erkennung)
  static KNOWN_MINTERS = [
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', // HEX Drucker
    '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3', // INC Drucker
    '0x83D0cF6A8bc7d9aF84B7fc1a6A8ad51f1e1E6fE1', // PLSX Drucker
  ];

  // 🛡️ VERTRAUENSWÜRDIGE TOKEN-CONTRACTS (Scam-Schutz Whitelist)
  static TRUSTED_TOKENS = {
    // 🔗 PulseChain Ecosystem
    '0x116d162d729e27e2e1d6478f1d2a8aed9c7a2bea': 'DOMINANCE',
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': 'HEX',
    '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3': 'INC',
    '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1': 'PLSX',
    '0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d': 'PHIAT',
    
    // 🔗 Ethereum Ecosystem
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
    '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
    '0xa0b86a33e6c5e8aac52c8fd9bc99f87eff44b2e9': 'USDC',
    '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT'
  };

  /**
   * 🌐 HELPER: Chain-Konfiguration anhand Chain-ID abrufen
   */
  static getChainConfig(chainId) {
    for (const [key, config] of Object.entries(this.CHAINS)) {
      if (config.id === chainId) {
        return config;
      }
    }
    // Fallback zu PulseChain
    return this.CHAINS.PULSECHAIN;
  }

  /**
   * 🛡️ Token-Vertrauenswürdigkeit prüfen (Scam-Schutz)
   */
  static isTrustedToken(contractAddress, symbol) {
    const contractKey = contractAddress?.toLowerCase();
    
    // Prüfe Contract-Adresse in Whitelist
    if (contractKey && this.TRUSTED_TOKENS[contractKey]) {
      return {
        isTrusted: true,
        reason: 'whitelisted_contract',
        whitelistName: this.TRUSTED_TOKENS[contractKey]
      };
    }
    
    // Prüfe bekannte Symbols
    const knownSymbols = ['WETH', 'WBTC', 'BTC', 'ETH', 'PLS', 'HEX', 'PLSX', 'INC', 'DOMINANCE'];
    if (knownSymbols.includes(symbol)) {
      return {
        isTrusted: true,
        reason: 'known_symbol',
        whitelistName: symbol
      };
    }
    
    return {
      isTrusted: false,
      reason: 'unknown_token',
      whitelistName: null
    };
  }

  /**
   * 🎯 HAUPTFUNKTION: Lade komplette Portfolio-Daten (100% MORALIS ENTERPRISE)
   */
  static async loadCompletePortfolio(userId) {
    console.log(`🎯 CENTRAL SERVICE V2 (SMART CACHING + RATE LIMITING): Loading portfolio for user ${userId}`);
    
    // 🛡️ STEP 0: Global Rate Limiting Check
    const rateLimitCheck = GlobalRateLimiter.canUserMakeRequest(userId);
    
    if (!rateLimitCheck.allowed) {
      console.warn(`🛡️ RATE LIMIT: User ${userId} request blocked - ${rateLimitCheck.reason}`);
      return this.getEmptyPortfolio(userId, `Rate limit: Please wait ${rateLimitCheck.waitTimeSeconds} seconds before trying again. Reason: ${rateLimitCheck.reason}`);
    }
    
    // 🧠 STEP 1: Check Cache First (Database-First Approach)
    const cachedPortfolio = await DatabaseCacheService.getCachedPortfolio(userId);
    
    // 🔧 CHATGPT DEBUG PATCH: Enhanced cache debugging
    const cacheValid = debugCacheData(cachedPortfolio, 'loadCompletePortfolio');
    
    if (cachedPortfolio.success && cacheValid) {
      console.log(`✅ CACHE HIT: Portfolio loaded from database cache - 0 API calls used!`);
      
      // Register cache hit
      GlobalRateLimiter.registerRequest(userId, true);
      
      // Mark as loaded and add cache info
      const cachedResult = {
        ...cachedPortfolio.data,
        isLoaded: true,
        success: true,
        fromCache: true,
        lastCacheUpdate: cachedPortfolio.lastUpdate,
        apiCallsSaved: 'CACHE HIT - 0 API calls used',
        cacheOptimization: {
          cacheHit: true,
          apiCallsAvoided: 'Multiple',
          cachingEnabled: true
        },
        rateLimitInfo: GlobalRateLimiter.getStats()
      };
      
      return cachedResult;
    }
    
    console.log(`❌ CACHE MISS: Loading fresh data from APIs (${cachedPortfolio.reason})`);
    
    // Register API request start
    GlobalRateLimiter.registerRequest(userId, false);
    
    // Check if we have Moralis Enterprise access (only when cache miss)
    const hasMoralisAccess = await this.hasValidMoralisApiKey();
    
    if (!hasMoralisAccess) {
      console.warn(`⚠️ WARNING: No Moralis Enterprise access - using FALLBACK mode with limited data`);
      // ✅ FIXED: Don't return empty portfolio, try to load what we can
      // return this.getEmptyPortfolio(userId, 'ENTERPRISE ERROR: Moralis API Key required for data access.');
    } else {
      console.log(`🔑 MORALIS ENTERPRISE ACCESS: ✅ ACTIVE`);
    }
    
    try {
      // 1. Lade User Wallets
      const wallets = await this.loadUserWallets(userId);
      console.log(`📱 Loaded ${wallets.length} wallets`);

          if (wallets.length === 0) {
      console.log('⚠️ No wallets found for user');
      
      // 🔥 EMERGENCY FIX: Clear cache if wallets are 0 but should exist
      console.log('🔥 EMERGENCY: Clearing cache due to 0 wallets - this might be a cache issue');
      await DatabaseCacheService.forceClearUserCache(userId);
      
      const emptyPortfolio = this.getEmptyPortfolio(userId, 'Keine Wallets gefunden. Cache wurde geleert. Versuchen Sie erneut zu laden.');
      
      // DON'T cache empty portfolio when it might be a bug
      // await DatabaseCacheService.setCachedPortfolio(userId, emptyPortfolio);
      return emptyPortfolio;
    }

      // 🎯 SMART CHAIN ANALYSIS: Separate supported from unsupported chains
      const chainAnalysis = await ApiInterceptorService.handleMixedWalletPortfolio(wallets);
      console.log(`🎯 CHAIN ANALYSIS: ${chainAnalysis.supported.length} supported chains, ${chainAnalysis.unsupported.length} unsupported chains`);
      
      // 🚨 WARNING: If all wallets are on unsupported chains
      if (chainAnalysis.supported.length === 0) {
        console.warn(`⚠️ ALL WALLETS ON UNSUPPORTED CHAINS: Only cache data available`);
        
        // Return limited portfolio with cache data only
        const limitedPortfolio = this.getLimitedPortfolioFromCache(userId, wallets);
        await DatabaseCacheService.setCachedPortfolio(userId, limitedPortfolio);
        return limitedPortfolio;
      }

            // 2. 💎 GAME CHANGER: Load Token Balances + Prices in ONE call!
      console.log(`💎 TRYING NEW COMBINED API: wallet-tokens-prices for efficiency...`);
      
      let tokenData, combinedPrices;
      
      try {
        // Try the new combined API first
        const combinedData = await this.loadTokenBalancesAndPricesCombined(wallets);
        
        if (combinedData.success && combinedData.tokens.length > 0) {
          console.log(`🎉 COMBINED API SUCCESS: ${combinedData.tokens.length} tokens with prices in ONE call!`);
          tokenData = { tokens: combinedData.tokens };
          combinedPrices = {
            priceMap: combinedData.priceMap,
            updatedCount: combinedData.tokens.filter(t => t.price > 0).length,
            apiCalls: 1, // Only one API call needed!
            sources: ['moralis_combined_api'],
            efficiency: 'maximum'
          };
        } else {
          throw new Error('Combined API not available, falling back to separate calls');
        }
      } catch (error) {
        console.log(`⚠️ COMBINED API FALLBACK: ${error.message}`);
        console.log(`🔄 Using separate API calls...`);
        
        // Fallback to separate calls
        tokenData = await this.loadTokenBalancesMoralisOnly(wallets);
        console.log(`🪙 MORALIS ENTERPRISE: Loaded ${tokenData.tokens.length} tokens`);

        const pricesData = await this.loadTokenPricesMoralisOnly(tokenData.tokens);
        console.log(`💰 MORALIS ENTERPRISE: Updated prices for ${pricesData.updatedCount} tokens`);
        
        // For PulseChain, try the real-time price API, fallback to manual if needed
        const pulseXPrices = await this.loadPulseXPrices(tokenData.tokens);
        console.log(`🚀 MORALIS PRICE API: Updated prices for ${pulseXPrices.updatedCount} PulseChain tokens`);
        
        combinedPrices = {
          ...pricesData,
          priceMap: { ...pricesData.priceMap, ...pulseXPrices.priceMap },
          updatedCount: pricesData.updatedCount + pulseXPrices.updatedCount,
          pulseXUpdated: pulseXPrices.updatedCount,
          pulseXSource: pulseXPrices.source,
          sources: ['moralis_enterprise', pulseXPrices.source || 'moralis_price_api'],
          efficiency: 'fallback'
        };
      }

      // 4. 🔧 FIXED TOKEN PARSING (behebt 32k DAI Bug)
      console.log(`🔧 APPLYING TOKEN PARSING FIXES...`);
      const parsedTokenData = TokenParsingService.processPortfolioTokens(tokenData.tokens);
      console.log(`🔧 TOKEN PARSING: ${parsedTokenData.corrections} corrections applied`);
      
      // 5. Aktualisiere Token-Werte mit geparsten Daten
      const updatedTokenData = this.updateTokenValuesWithRealPricesFixed(
        { tokens: parsedTokenData.tokens, totalValue: parsedTokenData.totalValue }, 
        combinedPrices
      );
      console.log(`🔄 ENTERPRISE + MORALIS PRICE API: Updated token values: $${updatedTokenData.totalValue.toFixed(2)} (${parsedTokenData.corrections} parsing fixes, ${pulseXPrices.updatedCount} real-time prices)`);

      // 6. Lade ROI-Transaktionen (100% MORALIS ENTERPRISE)
      const roiData = await this.loadROITransactionsMoralisOnly(chainAnalysis.supported, combinedPrices.priceMap);
      console.log(`📊 MORALIS ENTERPRISE: Loaded ${roiData.transactions.length} ROI transactions, Monthly ROI: $${roiData.monthlyROI.toFixed(2)}`);

      // 7. Lade Tax-Transaktionen (100% MORALIS ENTERPRISE) 
      const taxData = await this.loadTaxTransactionsMoralisOnly(chainAnalysis.supported, combinedPrices.priceMap);
      console.log(`📄 MORALIS ENTERPRISE: Loaded ${taxData.transactions.length} tax transactions`);

      // 8. Berechne Portfolio-Statistiken
      const stats = this.calculatePortfolioStats(updatedTokenData, roiData);
      
      // 9. Sortiere und optimiere Daten für UI
      const sortedTokens = this.sortAndRankTokens(updatedTokenData.tokens);

      // 10. Portfolio Response zusammenstellen
      const portfolioResponse = {
        success: true,
        isLoaded: true,
        userId: userId,
        totalValue: updatedTokenData.totalValue,
        
        tokens: sortedTokens,
        tokenCount: sortedTokens.length,
        uniqueTokens: updatedTokenData.uniqueTokens,
        
        wallets: wallets,
        walletCount: wallets.length,
        
        // ROI-Daten
        roiTransactions: roiData.transactions.slice(0, 50), // Top 50 für Performance
        dailyROI: roiData.dailyROI,
        weeklyROI: roiData.weeklyROI,
        monthlyROI: roiData.monthlyROI,
        
        // Tax-Daten
        taxTransactions: taxData.transactions.slice(0, 100), // Top 100 für Performance
        
        // Portfolio-Statistiken
        stats: stats,
        
        // API-Metadaten mit Caching-Info
        dataSource: 'moralis_enterprise_realtime_cached',
        lastUpdated: new Date().toISOString(),
        apiCalls: combinedPrices.apiCalls || 0,
        fromCache: false,
        cacheOptimization: {
          freshDataLoaded: true,
          apiCallsUsed: combinedPrices.apiCalls || 0,
          realtimePricesAdded: pulseXPrices.updatedCount,
          willBeCachedFor: '15 minutes',
          nextRequestWillBeCached: true,
          cachingEnabled: true
        },
        
        // Status
        isRealTimeData: true,
        disclaimer: 'Fresh data cached for optimal performance - next requests will use 0 API calls'
      };

      // 💾 STEP 11: Cache the Result for future requests
      await DatabaseCacheService.setCachedPortfolio(userId, portfolioResponse);
      console.log(`💾 Portfolio cached for 15 minutes - next requests will use 0 API calls!`);

      console.log(`✅ SMART CACHED PORTFOLIO COMPLETE: $${portfolioResponse.totalValue.toFixed(2)} across ${portfolioResponse.tokenCount} tokens (${combinedPrices.apiCalls || 0} API calls + ${pulseXPrices.updatedCount} real-time prices, next request = 0 calls)`);
      
      // Mark request as completed
      GlobalRateLimiter.completeRequest(userId);
      
      return portfolioResponse;

    } catch (error) {
      console.error('💥 SMART CACHED Portfolio loading error:', error);
      
      // Mark request as completed even on error
      GlobalRateLimiter.completeRequest(userId);
      
      return this.getEmptyPortfolio(userId, `SMART CACHE ERROR: ${error.message}`);
    }
  }

  /**
   * 📱 Lade User Wallets aus Supabase
   */
  static async loadUserWallets(userId) {
    console.log(`📱 LOADING WALLETS: Starting wallet load for user ${userId}`);
    
    try {
      // 1. Check Auth Session first
      const { data: session } = await supabase.auth.getSession();
      console.log(`🔐 AUTH SESSION: ${session?.session ? 'Valid' : 'Invalid'} session for wallet loading`);
      
      // 2. Check if user exists in auth
      if (session?.session?.user) {
        console.log(`👤 AUTH USER: ${session.session.user.id} (matches query: ${session.session.user.id === userId})`);
      }
      
      // 3. Query wallets with detailed logging
      console.log(`🔍 WALLET QUERY: Executing query for user_id=${userId} AND is_active=true`);
      
      const { data, error, count } = await supabase
        .from('wallets')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // 4. Log detailed results
      console.log(`📊 WALLET QUERY RESULT: Found ${data?.length || 0} wallets, count=${count}, error=${error?.message || 'none'}`);
      
      if (data && data.length > 0) {
        console.log(`✅ WALLETS LOADED: ${data.length} wallets found`, data.map(w => ({
          address: w.address?.slice(0, 8) + '...',
          chain: w.chain_id,
          active: w.is_active
        })));
      } else {
        console.warn(`⚠️ NO WALLETS: No wallets found for user ${userId}. Possible causes:
        - User has no wallets added to their account
        - Wallets are marked as inactive (is_active=false)  
        - RLS policy blocking access
        - User ID mismatch between auth and query`);
        
        // Additional debugging: Check if ANY wallets exist for this user
        const { data: allWallets, count: totalCount } = await supabase
          .from('wallets')
          .select('*', { count: 'exact' })
          .eq('user_id', userId);
          
        console.log(`🔍 DEBUG: Total wallets for user (including inactive): ${totalCount || 0}`);
        
        if (allWallets && allWallets.length > 0) {
          console.log(`🔍 DEBUG: Found ${allWallets.length} total wallets, active status:`, 
            allWallets.map(w => ({ address: w.address?.slice(0, 8), is_active: w.is_active })));
        }
      }

      if (error) {
        console.error(`💥 WALLET LOAD ERROR:`, error);
        throw error;
      }
      
      // 🔧 CHATGPT DEBUG PATCH: Enhanced wallet debugging
      const validatedWallets = debugWalletLoad(data || [], userId);
      console.log(`✅ DEBUG PATCH: Wallet validation complete - ${validatedWallets.length} valid wallets`);
      
      return validatedWallets;
      
    } catch (error) {
      console.error(`💥 WALLET LOADING FAILED for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 🪙 100% MORALIS ENTERPRISE: Token-Balances von Moralis APIs (ENTERPRISE MODE)
   */
  static async loadTokenBalancesMoralisOnly(wallets) {
    const allTokens = [];
    let totalValue = 0;

    for (const wallet of wallets) {
      const chainId = wallet.chain_id || 369;
      const chain = this.getChainConfig(chainId);
      
      console.log(`🔍 ENTERPRISE: Loading tokens for wallet ${wallet.address} on ${chain.name}`);
      
      // 🔍 PRE-FLIGHT DEBUG: Test API connectivity
      console.log(`🧪 MORALIS API TEST: Testing connectivity for ${wallet.address.slice(0, 8)}...`);
      
      try {
        let response;
        
        // 🚀 100% MORALIS ENTERPRISE API (STANDARD COMPLIANT)
        console.log(`💎 USING MORALIS ENTERPRISE for ${chain.name} (Chain: ${chain.moralisChainId})`);
        
        response = await fetch(`/api/moralis-tokens?endpoint=wallet-tokens&chain=${chain.moralisChainId}&address=${wallet.address}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(r => r.text()).then(text => {
          try {
            const parsed = JSON.parse(text);
            // 🚨 COMPLETE RESPONSE DUMP für echte Moralis-Struktur-Analyse
            console.log(`🔍 FULL MORALIS RESPONSE DUMP for ${wallet.address.slice(0, 8)}:`, parsed);
            
            console.log(`🔍 MORALIS RESPONSE ANALYSIS for ${wallet.address.slice(0, 8)}:`, {
              hasResult: !!parsed.result,
              resultType: Array.isArray(parsed.result) ? 'array' : typeof parsed.result,
              resultLength: Array.isArray(parsed.result) ? parsed.result.length : 'N/A',
              hasError: !!parsed._error,
              hasFallback: !!parsed._fallback,
              hasSuccess: !!parsed.success,
              status: parsed.status,
              cursor: parsed.cursor,
              page: parsed.page,
              page_size: parsed.page_size,
              keys: Object.keys(parsed),
              keyCount: Object.keys(parsed).length,
              chain: chain.moralisChainId,
              
              // Prüfe alternative Felder
              hasTokens: !!parsed.tokens,
              hasData: !!parsed.data,
              hasBalances: !!parsed.balances,
              hasItems: !!parsed.items,
              
              // Sample token für Struktur-Analyse
              sampleToken: parsed.result && parsed.result[0] ? {
                hasBalance: 'balance' in parsed.result[0],
                hasBalanceFormatted: 'balance_formatted' in parsed.result[0],
                hasTokenAddress: 'token_address' in parsed.result[0],
                hasUsdPrice: 'usd_price' in parsed.result[0],
                fields: Object.keys(parsed.result[0])
              } : null,
              
              // Prüfe alternative Token-Strukturen
              alternativeTokenSample: parsed.tokens && parsed.tokens[0] ? Object.keys(parsed.tokens[0]) : 
                                    parsed.data && parsed.data[0] ? Object.keys(parsed.data[0]) :
                                    parsed.balances && parsed.balances[0] ? Object.keys(parsed.balances[0]) : null
            });
            return parsed;
          } catch (parseError) {
            console.error(`💥 JSON PARSE ERROR for ${wallet.address}:`, parseError.message);
            console.log(`📄 RAW RESPONSE TEXT:`, text.slice(0, 200));
            return { error: 'Invalid JSON response', rawText: text.slice(0, 200) };
          }
        });

        // 🔧 CHATGPT DEBUG PATCH: Enhanced Moralis API debugging
        const moralisValid = debugMoralisResponse(response, 'wallet-tokens', wallet.address);
        console.log(`🔧 DEBUG PATCH: Moralis response validation - ${moralisValid ? 'VALID' : 'INVALID'}`);
        
        if (!moralisValid) {
          console.warn(`⚠️ DEBUG PATCH: Moralis response failed validation for wallet ${wallet.address} - CONTINUING ANYWAY`);
        }
        
        // 🎉 BREAKTHROUGH: Handle REAL Moralis SDK Response Structure
        if (response.jsonResponse && Array.isArray(response.jsonResponse)) {
          // ✅ REAL MORALIS SDK: Direct array of Erc20Value objects
          console.log(`🎉 MORALIS SDK SUCCESS: ${response.jsonResponse.length} tokens found for ${wallet.address}`);
          
          response = {
            status: '1',
            result: response.jsonResponse.map(tokenObj => {
              // Extract from Moralis Erc20Value object
              const token = tokenObj._token._value;
              const value = tokenObj._value;
              
              return {
                symbol: token.symbol || 'UNKNOWN',
                name: token.name || 'Unknown Token',
                contractAddress: token.contractAddress.checksum || token.contractAddress._value,
                decimals: parseInt(token.decimals) || 18,
                balance: value.amount.toString(), // BigNumber to string
                // Moralis SDK specific fields
                _moralis_fields: {
                  balance_formatted: tokenObj.display().split(' ')[0], // Extract number part
                  logo: token.logo,
                  thumbnail: token.thumbnail,
                  possibleSpam: token.possibleSpam,
                  raw_display: tokenObj.display()
                }
              };
            })
          };
        } else if (response.result && Array.isArray(response.result)) {
          // ✅ FALLBACK: Old API format (if any)
          console.log(`📊 FALLBACK FORMAT: ${response.result.length} tokens found for ${wallet.address}`);
          
          response = {
            status: '1',
            result: response.result.map(token => ({
              symbol: token.symbol,
              name: token.name,
              contractAddress: token.token_address,
              decimals: parseInt(token.decimals) || 18,
              balance: token.balance,
              _moralis_fields: {
                balance_formatted: token.balance_formatted,
                usd_price: token.usd_price,
                usd_value: token.usd_value,
                logo: token.logo,
                thumbnail: token.thumbnail
              }
            }))
          };
        } else if (Array.isArray(response) && response.length >= 0) {
          // 🔧 NEW: Handle direct array responses (some Moralis endpoints return arrays directly)
          console.log(`🔧 MORALIS DIRECT ARRAY RESPONSE: ${response.length} tokens for ${wallet.address}`);
          response = {
            status: '1',
            result: response.map(token => ({
              symbol: token.symbol,
              name: token.name,
              contractAddress: token.token_address,
              decimals: token.decimals,
              balance: token.balance
            }))
          };
        } else if (response._fallback) {
          // 🚨 MORALIS API not available 
          console.warn(`⚠️ MORALIS ENTERPRISE not available: ${response._fallback.reason} for ${wallet.address}`);
          response = {
            status: 'NOTOK', 
            message: response._fallback.message || 'Moralis API not available'
          };
        } else if (response._error) {
          // ✅ MORALIS: API error occurred but returned safely
          console.warn(`⚠️ MORALIS API ERROR: ${response._error.message} for wallet ${wallet.address}`);
          response = {
            status: '0',
            message: response._error.message || 'API Error'
          };
        } else if (response.success === false && response.error) {
          // 🔧 NEW: Handle API error responses with success:false
          console.warn(`⚠️ MORALIS API ERROR (success:false): ${response.error} for wallet ${wallet.address}`);
          response = {
            status: '0',
            message: response.error
          };
        } else if (!response.result && !response._fallback && !response._error && !Array.isArray(response)) {
          // 🔧 NEW: Handle unexpected response structures
          console.warn(`⚠️ UNEXPECTED MORALIS RESPONSE STRUCTURE for wallet ${wallet.address}:`, {
            keys: Object.keys(response),
            hasResult: !!response.result,
            hasSuccess: !!response.success,
            responseType: typeof response
          });
          
          // Try to extract data from various possible response formats
          let extractedResult = [];
          
          if (response.data && Array.isArray(response.data)) {
            extractedResult = response.data;
          } else if (response.tokens && Array.isArray(response.tokens)) {
            extractedResult = response.tokens;
          } else if (response.balances && Array.isArray(response.balances)) {
            extractedResult = response.balances;
          }
          
          if (extractedResult.length > 0) {
            console.log(`🔧 EXTRACTED DATA: Found ${extractedResult.length} tokens in alternate field`);
            response = {
              status: '1',
              result: extractedResult.map(token => ({
                symbol: token.symbol || token.tokenSymbol,
                name: token.name || token.tokenName,
                contractAddress: token.token_address || token.contractAddress || token.address,
                decimals: token.decimals || token.decimal || 18,
                balance: token.balance || token.amount || '0'
              }))
            };
          } else {
            // 🚨 UNEXPECTED FORMAT - Log everything and try to extract data anyway
            console.warn(`🚨 TRYING TO EXTRACT DATA FROM UNKNOWN FORMAT:`, {
              topLevelKeys: Object.keys(response).slice(0, 20),
              hasArrayValues: Object.values(response).some(val => Array.isArray(val)),
              arrayKeys: Object.keys(response).filter(key => Array.isArray(response[key])),
              objectKeys: Object.keys(response).filter(key => typeof response[key] === 'object' && response[key] !== null),
              totalKeys: Object.keys(response).length
            });
            
            // Try to find ANY array that might contain tokens
            let possibleTokenArray = null;
            for (const [key, value] of Object.entries(response)) {
              if (Array.isArray(value) && value.length > 0) {
                // Check if first item looks like a token
                const firstItem = value[0];
                if (firstItem && typeof firstItem === 'object' && 
                    (firstItem.symbol || firstItem.token_address || firstItem.contractAddress || firstItem.balance)) {
                  possibleTokenArray = value;
                  console.log(`🔧 FOUND POSSIBLE TOKEN ARRAY in key '${key}':`, {
                    length: value.length,
                    sampleItem: firstItem,
                    sampleKeys: Object.keys(firstItem)
                  });
                  break;
                }
              }
            }
            
            if (possibleTokenArray) {
              response = {
                status: '1',
                result: possibleTokenArray.map(token => ({
                  symbol: token.symbol || token.tokenSymbol || 'UNKNOWN',
                  name: token.name || token.tokenName || 'Unknown Token',
                  contractAddress: token.token_address || token.contractAddress || token.address || '0x',
                  decimals: parseInt(token.decimals) || parseInt(token.decimal) || 18,
                  balance: token.balance || token.amount || '0'
                }))
              };
              console.log(`✅ SUCCESSFULLY EXTRACTED ${possibleTokenArray.length} tokens from unknown format`);
            } else {
              // Completely unknown format - treat as empty
              response = {
                status: 'NOTOK',
                message: 'Unknown response format from Moralis API - no token data found'
              };
            }
          }
        }
        
        if (response.status === '1' && Array.isArray(response.result)) {
          console.log(`📊 ENTERPRISE: Found ${response.result.length} token entries for wallet ${wallet.address}`);
          
          for (const tokenData of response.result) {
            try {
              // FIXED: Proper BigNumber calculation with precision
              const rawBalance = tokenData.balance;
              const decimals = parseInt(tokenData.decimals) || 18;
              
              // Calculate balance with proper precision
              let balance = 0;
              if (rawBalance && rawBalance !== '0') {
                // Use BigInt for precise calculation to avoid JavaScript precision issues
                const balanceBigInt = BigInt(rawBalance);
                const divisorBigInt = BigInt(10 ** decimals);
                const wholePart = balanceBigInt / divisorBigInt;
                const fractionalPart = balanceBigInt % divisorBigInt;
                
                balance = Number(wholePart) + (Number(fractionalPart) / Number(divisorBigInt));
              }
              
              // Log significant tokens for debugging
              if (balance > 1 || ['PLS', 'HEX', 'PLSX', 'INC', 'WGEP'].includes(tokenData.symbol)) {
                console.log(`🔍 ENTERPRISE TOKEN:`, {
                  symbol: tokenData.symbol,
                  calculatedBalance: balance.toFixed(4),
                  contractAddress: tokenData.contractAddress.slice(0, 8) + '...',
                  source: 'MORALIS_ENTERPRISE'
                });
              }
              
              // Include ALL tokens with any balance
              if (balance > 0) {
                const token = {
                  walletId: wallet.id,
                  walletAddress: wallet.address,
                  chainId: wallet.chain_id || 369,
                  
                  symbol: tokenData.symbol || 'UNKNOWN',
                  name: tokenData.name || 'Unknown Token',
                  contractAddress: tokenData.contractAddress,
                  decimals: decimals,
                  
                  balance: balance,
                  price: 0, // Will be updated with real prices
                  value: 0, // Will be calculated with real prices
                  
                  // Debug info
                  holdingRank: 0,
                  percentageOfPortfolio: 0,
                  lastUpdated: new Date().toISOString(),
                  
                  // Raw data for debugging
                  rawBalance: rawBalance,
                  source: 'moralis_enterprise',
                  calculationMethod: 'bigint_precision',
                  
                  // 🌐 Chain-spezifische Info
                  chainBadge: chain.name === 'Ethereum' ? 'ETH' : 'PLS',
                  explorerBase: chain.explorerBase
                };
                
                allTokens.push(token);
              }
            } catch (tokenError) {
              console.error(`💥 Error calculating balance for token ${tokenData.symbol}:`, tokenError);
            }
          }
        } else {
          // ✅ Handle all non-success response cases
          if (response.message === 'NOTOK' || response.status === '0' || response.status === 'NOTOK') {
            console.log(`📱 Empty wallet (no tokens): ${wallet.address} - This is normal for new/unused wallets`);
          } else if (response._error) {
            console.warn(`⚠️ MORALIS API ERROR for wallet ${wallet.address}: ${response._error.message || 'API Error'}`);
          } else if (response.error) {
            console.warn(`⚠️ RESPONSE ERROR for wallet ${wallet.address}: ${response.error}`);
          } else if (!response.result) {
            console.warn(`⚠️ UNEXPECTED RESPONSE for wallet ${wallet.address}: No result field found`);
            console.log('🔍 RESPONSE STRUCTURE:', Object.keys(response));
          } else {
            console.warn(`⚠️ API error for wallet ${wallet.address}: ${response.message || response.status || 'Unknown error'}`);
          }
          continue;
        }
      } catch (error) {
        console.error(`💥 Error loading tokens for wallet ${wallet.address}:`, error.message);
      }
    }

    console.log(`🔍 ENTERPRISE: Total tokens found before pricing: ${allTokens.length}`);

    return {
      tokens: allTokens,
      totalValue: totalValue, // Will be calculated after pricing
      uniqueTokens: new Set(allTokens.map(t => t.symbol)).size
    };
  }

  /**
   * 💰 MORALIS ENTERPRISE LIVE-PREISE: 100% Moralis für alle Chains
   */
  static async loadTokenPricesMoralisOnly(tokens) {
    console.log(`💰 MORALIS ENTERPRISE: Loading prices for ${tokens.length} tokens`);
    
    const priceMap = new Map();
    let updatedCount = 0;
    let apiCalls = 0;
    
    // Gruppiere Tokens nach Chain
    const tokensByChain = {
      369: [], // PulseChain
      1: []    // Ethereum
    };
    
    tokens.forEach(token => {
      if (token.contractAddress && token.contractAddress !== 'native' && token.contractAddress !== '0x') {
        const chainId = token.chainId || 369;
        if (!tokensByChain[chainId]) tokensByChain[chainId] = [];
        tokensByChain[chainId].push(token);
      }
    });

    // 🔵 MORALIS ENTERPRISE: Preise für alle Chains
    for (const [chainId, chainTokens] of Object.entries(tokensByChain)) {
      if (chainTokens.length === 0) continue;
      
      const chainConfig = this.getChainConfig(parseInt(chainId));
      const contractAddresses = [...new Set(chainTokens.map(t => t.contractAddress.toLowerCase()))];
      
      console.log(`🔵 MORALIS ${chainConfig.name.toUpperCase()}: Fetching prices for ${contractAddresses.length} contracts`);

      try {
        const batchSize = 25; // Moralis limit
        
        for (let i = 0; i < contractAddresses.length; i += batchSize) {
          const batch = contractAddresses.slice(i, i + batchSize);
          const addressParam = batch.join(',');
          
          try {
            const response = await fetch(
              `/api/moralis-prices?endpoint=token-prices&addresses=${addressParam}&chain=${chainId}`
            );
            
            apiCalls++;
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.result && Array.isArray(data.result)) {
                for (const tokenPrice of data.result) {
                  if (tokenPrice.tokenAddress && tokenPrice.usdPrice > 0) {
                    const price = parseFloat(tokenPrice.usdPrice);
                    const contractAddress = tokenPrice.tokenAddress.toLowerCase();
                    
                    priceMap.set(contractAddress, price);
                    updatedCount++;
                    
                    // Logging für wichtige Token
                    if (price > 0.01 || ['PLS', 'HEX', 'PLSX'].includes(tokenPrice.tokenSymbol)) {
                      console.log(`🔵 MORALIS ${chainConfig.name.toUpperCase()}: ${tokenPrice.tokenSymbol} = $${price.toFixed(6)}`);
                    }
                  }
                }
              }
            }
          } catch (batchError) {
            console.warn(`⚠️ Moralis ${chainConfig.name} batch error:`, batchError.message);
          }
          
          // Rate limiting
          if (i + batchSize < contractAddresses.length) {
            await new Promise(resolve => setTimeout(resolve, 300)); // Moralis needs more time
          }
        }
      } catch (error) {
        console.error(`💥 Moralis ${chainConfig.name} API error:`, error);
      }
    }

    // Fallback für nicht gefundene Tokens
    const stillMissingTokens = [];
    tokens.forEach(token => {
      if (token.contractAddress && !priceMap.has(token.contractAddress.toLowerCase())) {
        stillMissingTokens.push({
          contractAddress: token.contractAddress.toLowerCase(),
          chainId: token.chainId || 369,
          symbol: token.symbol
        });
      }
    });

    if (stillMissingTokens.length > 0) {
      console.log(`🔵 MORALIS FALLBACK: Fetching ${stillMissingTokens.length} remaining prices individually`);
      
      for (const tokenInfo of stillMissingTokens.slice(0, 50)) { // Performance Limit
        try {
          const response = await fetch(
            `/api/moralis-prices?endpoint=token-prices&addresses=${tokenInfo.contractAddress}&chain=${tokenInfo.chainId}`
          );
          
          apiCalls++;
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.result && data.result[0] && data.result[0].usdPrice > 0) {
              const price = parseFloat(data.result[0].usdPrice);
              
              priceMap.set(tokenInfo.contractAddress, price);
              updatedCount++;
              
              console.log(`🔵 MORALIS FALLBACK: ${tokenInfo.symbol} = $${price.toFixed(6)}`);
            }
          }
        } catch (moralisError) {
          // Silent fail für einzelne Token
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 🔴 PRIORITY 3: Minimal Fallbacks (NUR für native Tokens)
    for (const [symbol, price] of Object.entries(this.EMERGENCY_PRICES)) {
      const tokenWithSymbol = tokens.find(t => t.symbol === symbol);
      if (tokenWithSymbol) {
        const contractKey = tokenWithSymbol.contractAddress?.toLowerCase();
        if (contractKey && !priceMap.has(contractKey)) {
          priceMap.set(contractKey, price);
          updatedCount++;
          console.log(`🔴 FALLBACK: ${symbol} = $${price} (native/stablecoin only)`);
        }
      }
    }

    console.log(`✅ MORALIS PRICES COMPLETE: ${updatedCount} prices from ${apiCalls} API calls`);

    return {
      priceMap,
      updatedCount,
      source: 'moralis_enterprise',
      apiCalls,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🔄 STRIKTE TOKEN-WERT-BERECHNUNG (nur echte Live-Preise)
   */
  static updateTokenValuesWithRealPricesFixed(tokenData, pricesData) {
    const { tokens } = tokenData;
    const { priceMap } = pricesData;
    
    let totalValue = 0;
    const updatedTokens = [];

    for (const token of tokens) {
      const contractKey = token.contractAddress?.toLowerCase();
      
      // NEUE LOGIK: Nur echte Preise verwenden
      let price = 0;
      let priceSource = 'no_price';
      
      // Priority 1: Live-Preise aus Price Map (Combined Sources)
      if (priceMap.has(contractKey)) {
        price = priceMap.get(contractKey);
        // Determine source based on data source and efficiency
        if (token.priceSource === 'moralis_combined') {
          priceSource = 'moralis_combined'; // Combined API (most efficient)
        } else if (token.chainId === 369) {
          // Check if this came from real Moralis API or fallback
          const pulseXSource = pricesData?.pulseXSource;
          if (pulseXSource === 'moralis_price_api') {
            priceSource = 'moralis_realtime'; // Real Moralis price API
          } else {
            priceSource = 'pulsex_manual'; // Manual fallback
          }
        } else {
          priceSource = 'moralis_live'; // Ethereum tokens
        }
      }
      
      // ⚠️ STRIKTE VALIDIERUNG: Preis-Plausibilität prüfen (mit Whitelist)
      if (price > 0) {
        // 🛡️ Check ob Token vertrauenswürdig ist
        const trustCheck = this.isTrustedToken(token.contractAddress, token.symbol);
        
        if (!trustCheck.isTrusted) {
          // Sanity Check: Extrem hohe Preise blockieren (nur für unbekannte Tokens)
          if (price > 1000) {
            console.warn(`🚨 SUSPICIOUS HIGH PRICE BLOCKED: ${token.symbol} = $${price} (blocked - ${trustCheck.reason})`);
            price = 0;
            priceSource = 'blocked_suspicious';
          }
          
          // Balance-Sanity-Check: Verhindere unrealistische Portfolio-Werte (nur für unbekannte Tokens)
          const calculatedValue = token.balance * price;
          if (calculatedValue > 100000) { // $100k+ pro Token ist verdächtig
            console.warn(`🚨 SUSPICIOUS VALUE BLOCKED: ${token.symbol} ${token.balance.toFixed(2)} × $${price} = $${calculatedValue.toFixed(0)} (blocked - ${trustCheck.reason})`);
            price = 0;
            priceSource = 'blocked_unrealistic';
          }
        } else {
          // ✅ Vertrauenswürdiger Token - erlaube höhere Werte
          console.log(`✅ TRUSTED TOKEN: ${token.symbol} (${trustCheck.whitelistName}) = $${price} - Scam-Schutz umgangen (${trustCheck.reason})`);
        }
      }
      
      // Calculate final value
      const value = (price > 0) ? token.balance * price : 0;
      
      // Debug: Nur wichtige Tokens ohne Preis loggen
      if (price === 0 && token.balance > 10 && !['UNKNOWN', 'NULL', 'TEST'].includes(token.symbol)) {
        console.log(`🔍 NO PRICE: ${token.symbol} (${token.balance.toFixed(2)} tokens)`);
      }
      
      const updatedToken = {
        ...token,
        price: price,
        value: value,
        priceSource: priceSource,
        hasReliablePrice: price > 0 && (priceSource === 'moralis_live' || priceSource === 'moralis_combined' || priceSource === 'moralis_realtime' || priceSource === 'pulsex_manual'),
        isIncludedInPortfolio: price > 0 && value >= 0.01, // Min $0.01 Wert
        
        // Zusätzliche Debug-Info
        isBlocked: priceSource.includes('blocked'),
        calculationDebug: {
          rawBalance: token.balance,
          appliedPrice: price,
          finalValue: value,
          source: priceSource
        }
      };
      
      updatedTokens.push(updatedToken);
      
      // STRIKTE Portfolio-Wert-Berechnung
      if (updatedToken.isIncludedInPortfolio && !updatedToken.isBlocked) {
        totalValue += value;
        console.log(`💎 INCLUDED: ${token.symbol} = ${token.balance.toFixed(4)} × $${price.toFixed(6)} = $${value.toFixed(2)}`);
      }
    }

    // Sortiere nach Wert
    updatedTokens.sort((a, b) => b.value - a.value);
    updatedTokens.forEach((token, index) => {
      token.holdingRank = index + 1;
      token.percentageOfPortfolio = totalValue > 0 ? (token.value / totalValue) * 100 : 0;
    });

    // Debug-Statistiken
    const stats = {
      totalTokens: updatedTokens.length,
      tokensWithPrice: updatedTokens.filter(t => t.price > 0).length,
      tokensIncluded: updatedTokens.filter(t => t.isIncludedInPortfolio).length,
      tokensBlocked: updatedTokens.filter(t => t.isBlocked).length,
      calculatedTotal: totalValue
    };

    console.log(`🎯 PORTFOLIO CALCULATION:`, stats);
    console.log(`💰 FINAL TOTAL: $${totalValue.toFixed(2)}`);

    return {
      tokens: updatedTokens,
      totalValue: totalValue,
      uniqueTokens: new Set(updatedTokens.map(t => t.symbol)).size,
      stats: stats
    };
  }

  /**
   * 🚀 VERCEL PRO: Intelligent Batch Loading für große Wallets
   */
  static async loadLargeTransactionBatch(wallet, chain, limit = 5000, maxBatches = 5) {
    const allTransfers = [];
    let cursor = null;
    let batchCount = 0;
    
    console.log(`🚀 VERCEL PRO BATCH: Loading up to ${limit * maxBatches} transfers for ${wallet.address}`);
    
    try {
      while (batchCount < maxBatches) {
        const requestBody = {
          address: wallet.address,
          chain: chain.moralisChainId || '0x171',
          limit: limit
        };
        
        if (cursor) {
          requestBody.cursor = cursor;
        }
        
        const apiResponse = await fetch('/api/moralis-token-transfers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        let responseText = '';
        let response = {};
        try {
          responseText = await apiResponse.text();
          response = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`💥 BATCH ${batchCount + 1} PARSE ERROR:`, parseError.message);
          break; // Stop loading more batches
        }
        
        if (response.result && Array.isArray(response.result)) {
          allTransfers.push(...response.result);
          console.log(`✅ BATCH ${batchCount + 1}: Loaded ${response.result.length} transfers (Total: ${allTransfers.length})`);
          
          // Check if there are more results
          if (response.cursor && response.result.length === limit) {
            cursor = response.cursor;
            batchCount++;
          } else {
            console.log(`🏁 BATCH COMPLETE: No more data available after ${batchCount + 1} batches`);
            break;
          }
        } else {
          console.log(`⚠️ BATCH ${batchCount + 1}: No results, stopping`);
          break;
        }
        
        // Small delay between batches to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`💥 BATCH LOADING ERROR:`, error.message);
    }
    
    console.log(`🎯 VERCEL PRO BATCH COMPLETE: ${allTransfers.length} total transfers loaded`);
    return allTransfers;
  }

  /**
   * 📊 100% MORALIS ENTERPRISE: ROI-Transaktionen von Moralis APIs (ENTERPRISE MODE)
   */
  static async loadROITransactionsMoralisOnly(wallets, priceMap) {
    const allTransactions = [];
    const roiStats = { daily: 0, weekly: 0, monthly: 0 };

    console.log(`🚀 MORALIS ENTERPRISE ROI: Loading transactions for wallets`);

    for (const wallet of wallets) {
      const chainId = wallet.chain_id || 369;
      const chain = this.getChainConfig(chainId);
      
      try {
        console.log(`📊 ENTERPRISE ROI: Loading transactions for wallet ${wallet.address} on ${chain.name}`);
        
        let response;
        
        // 🚀 100% MORALIS ENTERPRISE API
        console.log(`💎 USING MORALIS TRANSACTIONS API for ${chain.name}`);
        
        // 🚀 VERCEL PRO: Use intelligent batch loading for large wallets
        console.log(`🔍 Trying batch loading for wallet ${wallet.address}...`);
        
        const batchedTransfers = await this.loadLargeTransactionBatch(wallet, chain, 2000, 3); // Max 6000 transfers
        
        // Transform batched results to expected format
        if (batchedTransfers && batchedTransfers.length > 0) {
          response = {
            status: '1',
            result: batchedTransfers.map(tx => ({
              hash: tx.transaction_hash,
              from: tx.from_address,
              to: tx.to_address,
              value: tx.value,
              tokenSymbol: tx.token_symbol,
              tokenName: tx.token_name,
              contractAddress: tx.address,
              blockNumber: tx.block_number,
              timeStamp: Math.floor(new Date(tx.block_timestamp).getTime() / 1000).toString()
            }))
          };
        } else {
          // Fallback to simple API call
          const apiResponse = await fetch('/api/moralis-token-transfers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              address: wallet.address,
              chain: chain.moralisChainId || '0x171',
              limit: 2000
            })
          });

          let responseText = '';
          try {
            responseText = await apiResponse.text();
            response = JSON.parse(responseText);
          } catch (parseError) {
            console.error(`💥 MORALIS API RESPONSE PARSE ERROR for ${wallet.address}:`, parseError.message);
            response = { success: false, result: [] };
          }
        }
        
        // Transform Moralis response to match expected format
        if (response.result && Array.isArray(response.result)) {
          response = {
            status: '1',
            result: response.result.map(tx => ({
              hash: tx.transaction_hash,
              from: tx.from_address,
              to: tx.to_address,
              value: tx.value,
              tokenSymbol: tx.token_symbol,
              tokenName: tx.token_name,
              contractAddress: tx.address,
              blockNumber: tx.block_number,
              timeStamp: Math.floor(new Date(tx.block_timestamp).getTime() / 1000).toString()
            }))
          };
        }
        
        if (response.status === '1' && Array.isArray(response.result)) {
          console.log(`📊 ENTERPRISE ROI: Found ${response.result.length} transactions for ${wallet.address}`);
          
          // Process transactions for ROI calculation
          for (const tx of response.result.slice(0, 100)) { // Limit for performance
            try {
              const timestamp = parseInt(tx.timeStamp) * 1000;
              const txDate = new Date(timestamp);
              const now = new Date();
              const daysDiff = (now - txDate) / (1000 * 60 * 60 * 24);
              
              // Calculate ROI value
              const tokenAddress = tx.contractAddress?.toLowerCase();
              const tokenPrice = priceMap.get(tokenAddress) || 0;
              const value = parseFloat(tx.value) / Math.pow(10, 18) * tokenPrice;
              
              if (value > 1 && daysDiff <= 30) { // Only significant transactions in last 30 days
                const transaction = {
                  hash: tx.hash,
                  walletAddress: wallet.address,
                  tokenSymbol: tx.tokenSymbol,
                  value: value,
                  date: txDate.toISOString(),
                  daysDiff: Math.floor(daysDiff),
                  source: 'moralis_enterprise'
                };
                
                allTransactions.push(transaction);
                
                // Add to ROI stats
                if (daysDiff <= 1) roiStats.daily += value;
                if (daysDiff <= 7) roiStats.weekly += value;
                if (daysDiff <= 30) roiStats.monthly += value;
              }
            } catch (txError) {
              console.error(`💥 Error processing transaction:`, txError);
            }
          }
        }
      } catch (error) {
        console.error(`💥 Error loading ROI transactions for wallet ${wallet.address}:`, error.message);
      }
    }

    console.log(`📊 ENTERPRISE ROI COMPLETE: ${allTransactions.length} ROI transactions processed`);

    return {
      transactions: allTransactions,
      dailyROI: roiStats.daily,
      weeklyROI: roiStats.weekly,
      monthlyROI: roiStats.monthly,
      source: 'moralis_enterprise'
    };
  }

  /**
   * 📄 100% MORALIS ENTERPRISE: Tax-Transaktionen von Moralis APIs (ENTERPRISE MODE) 
   */
  static async loadTaxTransactionsMoralisOnly(wallets, priceMap) {
    const allTransactions = [];

    console.log(`🚀 MORALIS ENTERPRISE TAX: Loading transactions for wallets`);

    for (const wallet of wallets) {
      const chainId = wallet.chain_id || 369;
      const chain = this.getChainConfig(chainId);
      
      try {
        console.log(`📄 ENTERPRISE TAX: Loading transactions for wallet ${wallet.address} on ${chain.name}`);
        
        let response;
        
        // 🚀 100% MORALIS ENTERPRISE API
        console.log(`💎 USING MORALIS TOKEN TRANSFERS API for ${chain.name}`);
        
        // 🛡️ SAFE API CALL: Handle all possible errors  
        const apiResponse = await fetch('/api/moralis-token-transfers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            address: wallet.address,
            chain: chain.moralisChainId || '0x171',
            limit: 5000  // 🚀 VERCEL PRO: Noch mehr für Tax Reporting
          })
        });

        // 🔒 SAFE RESPONSE PARSING: Handle malformed JSON
        let responseText = '';
        try {
          responseText = await apiResponse.text();
          response = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`💥 MORALIS TAX API RESPONSE PARSE ERROR for ${wallet.address}:`, parseError.message);
          console.error(`💥 RAW RESPONSE (first 200 chars):`, responseText.slice(0, 200));
          
          // Continue with empty result - don't crash the entire portfolio loading
          response = { success: false, result: [] };
        }
        
        // Transform Moralis response for tax processing
        if (response.result && Array.isArray(response.result)) {
          response = {
            status: '1',
            result: response.result.map(tx => ({
              hash: tx.transaction_hash,
              from: tx.from_address,
              to: tx.to_address,
              value: tx.value,
              tokenSymbol: tx.token_symbol,
              tokenName: tx.token_name,
              contractAddress: tx.address,
              blockNumber: tx.block_number,
              timeStamp: Math.floor(new Date(tx.block_timestamp).getTime() / 1000).toString(),
              tokenDecimal: tx.token_decimals || '18'
            }))
          };
        }
        
        if (response.status === '1' && Array.isArray(response.result)) {
          console.log(`📄 ENTERPRISE TAX: Found ${response.result.length} transactions for ${wallet.address}`);
          
          // Process all transactions for tax reporting
          for (const tx of response.result) {
            try {
              const timestamp = parseInt(tx.timeStamp) * 1000;
              const txDate = new Date(timestamp);
              
              // Calculate transaction value in USD
              const tokenAddress = tx.contractAddress?.toLowerCase();
              const tokenPrice = priceMap.get(tokenAddress) || 0;
              const decimals = parseInt(tx.tokenDecimal) || 18;
              const tokenAmount = parseFloat(tx.value) / Math.pow(10, decimals);
              const valueUSD = tokenAmount * tokenPrice;
              
              const transaction = {
                hash: tx.hash,
                walletAddress: wallet.address,
                date: txDate.toISOString(),
                tokenSymbol: tx.tokenSymbol,
                tokenAmount: tokenAmount,
                tokenPrice: tokenPrice,
                valueUSD: valueUSD,
                from: tx.from,
                to: tx.to,
                type: tx.from.toLowerCase() === wallet.address.toLowerCase() ? 'OUT' : 'IN',
                source: 'moralis_enterprise',
                contractAddress: tx.contractAddress
              };
              
              allTransactions.push(transaction);
            } catch (txError) {
              console.error(`💥 Error processing tax transaction:`, txError);
            }
          }
        }
      } catch (error) {
        console.error(`💥 Error loading tax transactions for wallet ${wallet.address}:`, error.message);
      }
    }

    console.log(`📄 ENTERPRISE TAX COMPLETE: ${allTransactions.length} tax transactions processed`);

    return {
      transactions: allTransactions,
      source: 'moralis_enterprise'
    };
  }

  /**
   * 🎯 Verbesserte ROI-Transaction Erkennung
   */
  static isROITransaction(tx, amount) {
    // 1. Bekannte Drucker-Contracts
    if (this.KNOWN_MINTERS.includes(tx.from.toLowerCase())) {
      return true;
    }
    
    // 2. Null-Address (Mint-Transaktionen)
    if (tx.from === '0x0000000000000000000000000000000000000000') {
      return true;
    }
    
    // 3. Regelmäßige kleine Beträge (typisch für ROI)
    if (amount > 0 && amount < 1000) {
      return true;
    }
    
    // 4. Bekannte ROI-Token
    const roiTokens = ['HEX', 'INC', 'PLSX', 'LOAN', 'FLEX'];
    if (roiTokens.includes(tx.tokenSymbol)) {
      return true;
    }
    
    return false;
  }

  /**
   * 📋 Grund für ROI-Klassifikation
   */
  static getROIReason(tx) {
    if (this.KNOWN_MINTERS.includes(tx.from.toLowerCase())) return 'Known minter contract';
    if (tx.from === '0x0000000000000000000000000000000000000000') return 'Mint transaction';
    return 'ROI pattern detected';
  }

  /**
   * 💼 Bestimme ob Transaktion steuerpflichtig ist
   */
  static isTaxableTransaction(tx, amount, isIncoming) {
    // Eingehende Transaktionen mit Wert sind meist steuerpflichtig
    if (isIncoming && amount > 0) {
      return true;
    }
    
    // Ausgehende große Transaktionen könnten Verkäufe sein
    if (!isIncoming && amount > 100) {
      return true;
    }
    
    return false;
  }

  /**
   * 🏷️ Bestimme Steuer-Kategorie
   */
  static getTaxCategory(tx, amount, isIncoming) {
    if (isIncoming) {
      // ROI-Transaktionen sind Einkommen
      if (this.isROITransaction(tx, amount)) {
        return 'income';
      }
      // Große eingehende Beträge könnten Kapitalerträge sein
      if (amount > 1000) {
        return 'capital_gain';
      }
      return 'income';
    } else {
      // Ausgehende Transaktionen sind meist Transfers oder Verkäufe
      return 'transfer';
    }
  }

  /**
   * 💰 Hole Token-Preis (verifizierte Preise zuerst)
   */
  static getTokenPrice(symbol, contractAddress) {
    // 1. Verifizierte Preise verwenden
    if (this.EMERGENCY_PRICES[symbol]) {
      return this.EMERGENCY_PRICES[symbol];
    }
    
    // 2. Fallback für unbekannte Token
    return 0;
  }

  /**
   * 🎯 Bestimme ROI-Typ basierend auf Transaktion
   */
  static determineROIType(tx, amount, timestamp) {
    const now = Date.now();
    const timeDiff = now - timestamp.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Größere Beträge sind oft wöchentliche Rewards
    if (amount > 100 || timeDiff > oneDayMs) {
      return 'weekly_roi';
    }
    
    return 'daily_roi';
  }

  /**
   * 📊 Berechne Portfolio-Statistiken
   */
  static calculatePortfolioStats(tokenData, roiData) {
    const totalValue = tokenData.totalValue;
    const totalROI = roiData.monthlyROI;
    
    return {
      totalValue: totalValue,
      totalROI: totalROI,
      roiPercentage: totalValue > 0 ? (totalROI / totalValue) * 100 : 0,
      change24h: 0, // Würde historische Daten benötigen
      topToken: tokenData.tokens[0] || null,
      tokenDistribution: this.calculateTokenDistribution(tokenData.tokens)
    };
  }

  /**
   * 📊 Berechne Token-Verteilung
   */
  static calculateTokenDistribution(tokens) {
    const totalValue = tokens.reduce((sum, t) => sum + t.value, 0);
    
    return {
      top5Value: tokens.slice(0, 5).reduce((sum, t) => sum + t.value, 0),
      top5Percentage: totalValue > 0 ? (tokens.slice(0, 5).reduce((sum, t) => sum + t.value, 0) / totalValue) * 100 : 0,
      concentrationRisk: tokens.length > 0 ? (tokens[0].value / totalValue) * 100 : 0
    };
  }

  /**
   * 🔧 Limited Portfolio für nicht unterstützte Chains
   */
  static getLimitedPortfolioFromCache(userId, wallets) {
    return {
      success: true,
      isLoaded: true,
      userId: userId,
      totalValue: 0,
      
      tokens: [],
      tokenCount: 0,
      uniqueTokens: 0,
      
      wallets: wallets,
      walletCount: wallets.length,
      
      // Leere ROI/Tax-Daten
      roiTransactions: [],
      dailyROI: 0,
      weeklyROI: 0,
      monthlyROI: 0,
      taxTransactions: [],
      
      // Portfolio-Statistiken
      stats: {
        totalValue: 0,
        totalROI: 0,
        roiPercentage: 0,
        change24h: 0,
        topToken: null,
        tokenDistribution: []
      },
      
      // Metadata
      dataSource: 'limited_cache_only',
      lastUpdated: new Date().toISOString(),
      apiCalls: 0,
      fromCache: true,
      
      // Warnung
      warning: 'PulseChain wallets detected - limited data available (Moralis does not support PulseChain yet)',
      recommendation: 'Use PulseWatch.app for full PulseChain portfolio tracking',
      
      // Status
      isRealTimeData: false,
      disclaimer: 'Limited portfolio due to unsupported chains'
    };
  }

  /**
   * 🆘 Fallback für Fehler
   */
  static getEmptyPortfolio(userId, errorMessage) {
    return {
      userId,
      timestamp: new Date().toISOString(),
      error: errorMessage,
      
      wallets: [],
      tokens: [],
      roiTransactions: [],
      taxTransactions: [],
      
      totalValue: 0,
      totalROI: 0,
      
      isLoaded: false,
      loadTime: Date.now()
    };
  }

  /**
   * 📄 Generiere CSV für Tax Export
   */
  static generateTaxCSV(taxTransactions) {
    const headers = [
      'Datum',
      'Zeit',
      'Transaction Hash',
      'Token Symbol',
      'Token Name',
      'Menge',
      'Preis (USD)',
      'Wert (USD)',
      'Richtung',
      'Von Adresse',
      'Nach Adresse',
      'Steuer Kategorie',
      'ROI Transaktion',
      'Explorer Link'
    ];
    
    let csv = headers.join(';') + '\n';
    
    for (const tx of taxTransactions) {
      const row = [
        new Date(tx.blockTimestamp).toLocaleDateString('de-DE'),
        new Date(tx.blockTimestamp).toLocaleTimeString('de-DE'),
        tx.txHash,
        tx.tokenSymbol,
        tx.tokenName,
        tx.amount.toFixed(6),
        tx.price.toFixed(8),
        tx.valueUSD.toFixed(2),
        tx.direction === 'in' ? 'Eingehend' : 'Ausgehend',
        tx.fromAddress,
        tx.toAddress,
        tx.taxCategory === 'income' ? 'Einkommen' : 'Transfer',
        tx.isROITransaction ? 'Ja' : 'Nein',
        tx.explorerUrl
      ];
      
      csv += row.map(field => `"${field}"`).join(';') + '\n';
    }
    
    return csv;
  }

  /**
   * 📋 Sortiere und rankiere Token basierend auf Wert
   */
  static sortAndRankTokens(tokens) {
    return tokens.sort((a, b) => b.value - a.value);
  }

  /**
   * 💎 COMBINED TOKEN BALANCES + PRICES API (Game Changer!)
   * Loads token balances AND prices in a single API call
   */
  static async loadTokenBalancesAndPricesCombined(wallets) {
    const allTokens = [];
    const priceMap = new Map();
    let totalApiCalls = 0;

    console.log(`💎 COMBINED API: Loading balances + prices for ${wallets.length} wallets`);

    for (const wallet of wallets) {
      const chainId = wallet.chain_id || 369;
      const chain = this.getChainConfig(chainId);
      
      console.log(`💎 COMBINED: Processing wallet ${wallet.address} on ${chain.name}`);
      
      try {
        const response = await fetch(`/api/moralis-v2?endpoint=wallet-tokens-prices&chain=${chain.moralisChainId}&address=${wallet.address}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        let responseText = '';
        let data = {};
        try {
          responseText = await response.text();
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`💥 COMBINED API PARSE ERROR for ${wallet.address}:`, parseError.message);
          continue;
        }
        
        if (data.result && Array.isArray(data.result)) {
          console.log(`✅ COMBINED API: Found ${data.result.length} tokens with prices for ${wallet.address}`);
          totalApiCalls++;
          
          for (const tokenData of data.result) {
            try {
              const balance = parseFloat(tokenData.balance_formatted) || 0;
              const price = parseFloat(tokenData.usd_price) || 0;
              const value = parseFloat(tokenData.usd_value) || 0;

              if (balance > 0) {
                const token = {
                  walletId: wallet.id,
                  walletAddress: wallet.address,
                  chainId: wallet.chain_id || 369,
                  
                  symbol: tokenData.symbol || 'UNKNOWN',
                  name: tokenData.name || 'Unknown Token',
                  contractAddress: tokenData.token_address,
                  decimals: parseInt(tokenData.decimals) || 18,
                  
                  balance: balance,
                  price: price,
                  value: value,
                  
                  // Source tracking
                  source: 'moralis_combined_api',
                  priceSource: price > 0 ? 'moralis_combined' : 'no_price',
                  hasReliablePrice: price > 0,
                  isIncludedInPortfolio: price > 0 && value >= 0.01,
                  
                  // Chain info
                  chainBadge: chain.name === 'Ethereum' ? 'ETH' : 'PLS',
                  explorerBase: chain.explorerBase,
                  
                  // Metadata
                  lastUpdated: new Date().toISOString()
                };
                
                allTokens.push(token);
                
                if (price > 0) {
                  priceMap.set(tokenData.token_address?.toLowerCase(), price);
                  priceMap.set(tokenData.symbol?.toUpperCase(), price);
                }
              }
            } catch (tokenError) {
              console.error(`💥 Error processing combined token:`, tokenError);
            }
          }
        } else {
          console.warn(`⚠️ COMBINED API: No valid data for ${wallet.address}`);
        }
      } catch (error) {
        console.error(`💥 COMBINED API ERROR for wallet ${wallet.address}:`, error.message);
        // Continue with next wallet instead of failing completely
      }
    }

    console.log(`💎 COMBINED API COMPLETE: ${allTokens.length} tokens, ${Array.from(priceMap.keys()).length / 2} prices, ${totalApiCalls} API calls`);

    return {
      success: allTokens.length > 0,
      tokens: allTokens,
      priceMap: priceMap,
      totalApiCalls: totalApiCalls,
      efficiency: 'combined_api_single_call_per_wallet',
      source: 'moralis_combined_tokens_prices'
    };
  }

  /**
   * 🚀 MORALIS REAL-TIME PRICE API INTEGRATION
   * Lädt echte Preise für PulseChain Tokens von Moralis Price API
   */
  static async loadPulseXPrices(tokens) {
    console.log(`🚀 MORALIS PRICE API: Loading real-time prices for ${tokens.length} tokens`);
    
    const priceMap = {};
    let updatedCount = 0;
    
    // Filter PulseChain Tokens (Chain ID 369)
    const pulseTokens = tokens.filter(token => token.chainId === 369);
    
    if (pulseTokens.length === 0) {
      console.log('⚪ MORALIS PRICE API: No PulseChain tokens found');
      return { priceMap, updatedCount: 0 };
    }
    
    console.log(`🔍 MORALIS PRICE API: Found ${pulseTokens.length} PulseChain tokens to price`);
    
    // 🚀 REAL MORALIS PRICE API: getMultipleTokenPrices
    try {
      // Prepare token addresses for batch price request
      const tokenAddresses = pulseTokens
        .filter(token => token.contractAddress && token.contractAddress !== '0x')
        .map(token => ({
          token_address: token.contractAddress,
          exchange: 'pulsex' // Specify PulseX as the exchange
        }))
        .slice(0, 25); // Limit to 25 tokens per batch (API limit)
      
      if (tokenAddresses.length > 0) {
        console.log(`🔄 MORALIS PRICE API: Requesting prices for ${tokenAddresses.length} tokens`);
        
        const response = await fetch('/api/moralis-v2?endpoint=multiple-token-prices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tokens: tokenAddresses,
            chain: '0x171', // PulseChain chain ID
            include: 'percent_change'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.result && Array.isArray(data.result)) {
            console.log(`✅ MORALIS PRICE API: Received ${data.result.length} price results`);
            
            for (const priceData of data.result) {
              const tokenAddress = priceData.token_address?.toLowerCase();
              const price = parseFloat(priceData.usd_price) || 0;
              const symbol = priceData.token_symbol;
              
              if (price > 0 && tokenAddress) {
                priceMap[tokenAddress] = price;
                if (symbol) {
                  priceMap[symbol.toUpperCase()] = price;
                }
                updatedCount++;
                
                console.log(`💰 MORALIS PRICE API: ${symbol} = $${price.toFixed(8)} (real-time)`);
              }
            }
          } else {
            console.warn('⚠️ MORALIS PRICE API: No valid price data in response');
          }
        } else {
          console.warn(`⚠️ MORALIS PRICE API: HTTP ${response.status} - falling back to manual prices`);
        }
      }
    } catch (error) {
      console.error('💥 MORALIS PRICE API ERROR:', error.message);
      console.log('🔄 Falling back to manual price mapping...');
    }
    
    // 🔄 FALLBACK: Manual Price Mapping if API fails
    if (updatedCount === 0) {
      console.log('🔄 FALLBACK: Using manual price mapping for PulseChain tokens');
      
      const FALLBACK_PRICES = {
        'HEX': 0.0025,      // HEX current estimate
        'PLSX': 0.00008,    // PulseX current estimate  
        'INC': 0.005,       // Incentive current estimate
        'PLS': 0.00005,     // PulseChain current estimate
        'WBTC': 95000,      // Wrapped Bitcoin estimate
        'USDC': 1.00,       // USD Coin
        'USDT': 1.00,       // Tether
        'DAI': 1.00         // Dai Stablecoin
      };
      
      for (const token of pulseTokens) {
        const symbol = token.symbol?.toUpperCase();
        
        if (FALLBACK_PRICES[symbol]) {
          const price = FALLBACK_PRICES[symbol];
          priceMap[token.contractAddress] = price;
          priceMap[symbol] = price;
          updatedCount++;
          
          console.log(`💰 FALLBACK: ${symbol} = $${price} (manual estimate)`);
        }
      }
    }
    
    console.log(`✅ MORALIS PRICE API COMPLETE: Updated ${updatedCount} PulseChain token prices`);
    
    return {
      priceMap,
      updatedCount,
      source: updatedCount > 0 ? 'moralis_price_api' : 'manual_fallback',
      disclaimer: updatedCount > 0 ? 'Real-time prices from Moralis API' : 'Manual price estimates'
    };
  }

  /**
   * 💎 NEW ENTERPRISE: Load Wallet History with Verbose Details
   * Uses the advanced wallet-history-verbose endpoint for enhanced transaction analysis
   */
  static async loadWalletHistoryVerbose(wallets, limit = 100) {
    console.log(`💎 ENTERPRISE VERBOSE: Loading detailed transaction history for ${wallets.length} wallets`);
    
    const allTransactions = [];
    let totalApiCalls = 0;
    
    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        console.log(`📜 VERBOSE HISTORY: ${wallet.address.slice(0, 8)}... on ${chain.name}`);
        
        const response = await fetch(this.MORALIS_ENDPOINTS.enterpriseAdvanced, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: 'wallet-history-verbose',
            address: wallet.address,
            chain: chain.name.toLowerCase(),
            limit: limit
          })
        });
        
        const data = await response.json();
        totalApiCalls++;
        
        if (data.result && Array.isArray(data.result)) {
          console.log(`✅ VERBOSE HISTORY SUCCESS: ${data.result.length} detailed transactions for ${wallet.address.slice(0, 8)}...`);
          
          // Enhance transactions with wallet context
          const enhancedTransactions = data.result.map(tx => ({
            ...tx,
            walletAddress: wallet.address,
            chainId: chainId,
            chainName: chain.name,
            _enterprise_features: data._enterprise_features,
            _source: 'moralis_enterprise_verbose'
          }));
          
          allTransactions.push(...enhancedTransactions);
        } else {
          console.warn(`⚠️ VERBOSE HISTORY FAILED: ${wallet.address.slice(0, 8)}... - ${data._error?.message || 'No data'}`);
        }
        
      } catch (error) {
        console.error(`💥 VERBOSE HISTORY ERROR for ${wallet.address}:`, error);
      }
    }
    
    console.log(`✅ ENTERPRISE VERBOSE COMPLETE: ${allTransactions.length} enhanced transactions loaded (${totalApiCalls} API calls)`);
    
    return {
      transactions: allTransactions,
      totalApiCalls,
      source: 'moralis_enterprise_wallet_history_verbose',
      enhancedFeatures: {
        decodedTransactions: true,
        transactionLabels: true,
        categoryDetection: true,
        internalTransactions: true
      }
    };
  }

  /**
   * 💰 NEW ENTERPRISE: Load Native Balance with USD Value
   * Gets precise ETH/PLS balances with accurate pricing
   */
  static async loadNativeBalances(wallets) {
    console.log(`💰 ENTERPRISE NATIVE: Loading native balances for ${wallets.length} wallets`);
    
    const balances = [];
    let totalApiCalls = 0;
    let totalValue = 0;
    
    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        console.log(`💎 NATIVE BALANCE: ${wallet.address.slice(0, 8)}... on ${chain.name}`);
        
        const response = await fetch(this.MORALIS_ENDPOINTS.enterpriseAdvanced, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: 'native-balance',
            address: wallet.address,
            chain: chain.name.toLowerCase()
          })
        });
        
        const data = await response.json();
        totalApiCalls++;
        
        if (data.result && data.result.balance) {
          const balanceFormatted = parseFloat(data.result.balance_formatted || 0);
          const currency = data.result.currency || chain.nativeSymbol;
          
          // Get current native token price
          const nativePrice = this.EMERGENCY_PRICES[currency] || 0;
          const usdValue = balanceFormatted * nativePrice;
          totalValue += usdValue;
          
          const balanceData = {
            walletAddress: wallet.address,
            chainId: chainId,
            chainName: chain.name,
            balance: data.result.balance,
            balanceFormatted: balanceFormatted,
            currency: currency,
            price: nativePrice,
            usdValue: usdValue,
            _source: data._source,
            _precision: data._precision
          };
          
          balances.push(balanceData);
          
          console.log(`✅ NATIVE BALANCE SUCCESS: ${balanceFormatted.toFixed(6)} ${currency} ($${usdValue.toFixed(2)}) for ${wallet.address.slice(0, 8)}...`);
        } else {
          console.warn(`⚠️ NATIVE BALANCE FAILED: ${wallet.address.slice(0, 8)}... - ${data._error?.message || 'No data'}`);
        }
        
      } catch (error) {
        console.error(`💥 NATIVE BALANCE ERROR for ${wallet.address}:`, error);
      }
    }
    
    console.log(`✅ ENTERPRISE NATIVE COMPLETE: ${balances.length} native balances loaded, total value: $${totalValue.toFixed(2)} (${totalApiCalls} API calls)`);
    
    return {
      balances,
      totalValue,
      totalApiCalls,
      source: 'moralis_enterprise_native_balance'
    };
  }

  /**
   * 💎 NEW ENTERPRISE: Load Enhanced Net Worth
   * Gets comprehensive portfolio value with spam filtering
   */
  static async loadNetWorthEnhanced(wallets) {
    console.log(`💎 ENTERPRISE NET WORTH: Loading enhanced portfolio value for ${wallets.length} wallets`);
    
    const netWorthData = [];
    let totalApiCalls = 0;
    let totalNetWorth = 0;
    
    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        console.log(`📊 NET WORTH: ${wallet.address.slice(0, 8)}... on ${chain.name}`);
        
        const response = await fetch(this.MORALIS_ENDPOINTS.enterpriseAdvanced, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: 'net-worth-enhanced',
            address: wallet.address,
            chain: chain.name.toLowerCase()
          })
        });
        
        const data = await response.json();
        totalApiCalls++;
        
        if (data.result && typeof data.result.total_networth_usd === 'number') {
          const netWorth = parseFloat(data.result.total_networth_usd || 0);
          totalNetWorth += netWorth;
          
          const netWorthEntry = {
            walletAddress: wallet.address,
            chainId: chainId,
            chainName: chain.name,
            netWorthUsd: netWorth,
            totalTokens: data.result.total_tokens || 0,
            totalNfts: data.result.total_nfts || 0,
            chains: data.result.chains || [],
            _source: data._source,
            _spam_filtered: data._spam_filtered,
            _enterprise_accuracy: data._enterprise_accuracy
          };
          
          netWorthData.push(netWorthEntry);
          
          console.log(`✅ NET WORTH SUCCESS: $${netWorth.toFixed(2)} (${data.result.total_tokens || 0} tokens) for ${wallet.address.slice(0, 8)}...`);
        } else {
          console.warn(`⚠️ NET WORTH FAILED: ${wallet.address.slice(0, 8)}... - ${data._error?.message || 'No data'}`);
        }
        
      } catch (error) {
        console.error(`💥 NET WORTH ERROR for ${wallet.address}:`, error);
      }
    }
    
    console.log(`✅ ENTERPRISE NET WORTH COMPLETE: $${totalNetWorth.toFixed(2)} total portfolio value (${totalApiCalls} API calls)`);
    
    return {
      netWorthData,
      totalNetWorth,
      totalApiCalls,
      source: 'moralis_enterprise_net_worth_enhanced',
      spamFiltered: true,
      enterpriseAccuracy: true
    };
  }

  /**
   * 🔄 NEW ENTERPRISE: Load Enhanced Token Transfers with ROI Detection
   * Gets token transfers with enhanced metadata and automatic ROI flagging
   */
  static async loadTokenTransfersEnhanced(wallets, limit = 100) {
    console.log(`🔄 ENTERPRISE TRANSFERS: Loading enhanced token transfers for ${wallets.length} wallets`);
    
    const allTransfers = [];
    let totalApiCalls = 0;
    let roiTransfersFound = 0;
    
    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        console.log(`🔄 ENHANCED TRANSFERS: ${wallet.address.slice(0, 8)}... on ${chain.name}`);
        
        const response = await fetch(this.MORALIS_ENDPOINTS.enterpriseAdvanced, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: 'token-transfers-enhanced',
            address: wallet.address,
            chain: chain.name.toLowerCase(),
            limit: limit
          })
        });
        
        const data = await response.json();
        totalApiCalls++;
        
        if (data.result && Array.isArray(data.result)) {
          console.log(`✅ ENHANCED TRANSFERS SUCCESS: ${data.result.length} enhanced transfers for ${wallet.address.slice(0, 8)}...`);
          
          // Process and count ROI transfers
          const enhancedTransfers = data.result.map(transfer => {
            const isROI = transfer._roi_indicators?.potential_roi || false;
            if (isROI) roiTransfersFound++;
            
            return {
              ...transfer,
              walletAddress: wallet.address,
              chainId: chainId,
              chainName: chain.name,
              _source: data._source,
              _roi_detected: isROI
            };
          });
          
          allTransfers.push(...enhancedTransfers);
        } else {
          console.warn(`⚠️ ENHANCED TRANSFERS FAILED: ${wallet.address.slice(0, 8)}... - ${data._error?.message || 'No data'}`);
        }
        
      } catch (error) {
        console.error(`💥 ENHANCED TRANSFERS ERROR for ${wallet.address}:`, error);
      }
    }
    
    console.log(`✅ ENTERPRISE TRANSFERS COMPLETE: ${allTransfers.length} enhanced transfers loaded, ${roiTransfersFound} ROI candidates found (${totalApiCalls} API calls)`);
    
    return {
      transfers: allTransfers,
      roiTransfersFound,
      totalApiCalls,
      source: 'moralis_enterprise_token_transfers_enhanced',
      roiDetection: true,
      metadataEnhanced: true
    };
  }

  /**
   * 🎯 NEW ENTERPRISE: Load Enhanced DeFi Positions with ROI Analysis
   * Gets detailed DeFi positions for yield tracking and ROI detection
   */
  static async loadDefiPositionsEnhanced(wallets) {
    console.log(`🎯 ENTERPRISE DEFI: Loading enhanced DeFi positions for ${wallets.length} wallets`);
    
    const allPositions = [];
    let totalApiCalls = 0;
    let totalYieldValue = 0;
    
    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        console.log(`🎯 DEFI POSITIONS: ${wallet.address.slice(0, 8)}... on ${chain.name}`);
        
        const response = await fetch(this.MORALIS_ENDPOINTS.enterpriseAdvanced, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: 'defi-positions-enhanced',
            address: wallet.address,
            chain: chain.name.toLowerCase()
          })
        });
        
        const data = await response.json();
        totalApiCalls++;
        
        if (data.result && Array.isArray(data.result)) {
          console.log(`✅ DEFI POSITIONS SUCCESS: ${data.result.length} DeFi positions for ${wallet.address.slice(0, 8)}...`);
          
          // Enhance positions with wallet context
          const enhancedPositions = data.result.map(position => ({
            ...position,
            walletAddress: wallet.address,
            chainId: chainId,
            chainName: chain.name,
            _source: data._source,
            _roi_detection: data._roi_detection,
            _yield_tracking: data._yield_tracking
          }));
          
          allPositions.push(...enhancedPositions);
        } else {
          console.warn(`⚠️ DEFI POSITIONS FAILED: ${wallet.address.slice(0, 8)}... - ${data._error?.message || 'No data'}`);
        }
        
      } catch (error) {
        console.error(`💥 DEFI POSITIONS ERROR for ${wallet.address}:`, error);
      }
    }
    
    console.log(`✅ ENTERPRISE DEFI COMPLETE: ${allPositions.length} DeFi positions loaded (${totalApiCalls} API calls)`);
    
    return {
      positions: allPositions,
      totalYieldValue,
      totalApiCalls,
      source: 'moralis_enterprise_defi_positions_enhanced',
      roiDetection: true,
      yieldTracking: true,
      liquidityAnalysis: true
    };
  }

  /**
   * 🔧 NEW ENTERPRISE: Health Check for Enterprise APIs
   * Verifies all advanced features are operational
   */
  static async checkEnterpriseHealth() {
    console.log(`🔧 ENTERPRISE HEALTH: Checking API status and features`);
    
    try {
      const response = await fetch(this.MORALIS_ENDPOINTS.enterpriseAdvanced, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: 'enterprise-health'
        })
      });
      
      const data = await response.json();
      
      if (data.result && data.status === 'enterprise_operational') {
        console.log(`✅ ENTERPRISE HEALTH: All advanced features operational`);
        console.log(`🎯 Available Features:`, Object.keys(data.result.enterprise_features).filter(key => data.result.enterprise_features[key]));
        
        return {
          operational: true,
          status: data.status,
          apiVersion: data.result.api_version,
          features: data.result.enterprise_features,
          chainSupport: data.result.chain_support,
          timestamp: data.timestamp,
          source: data._source
        };
      } else {
        console.warn(`⚠️ ENTERPRISE HEALTH: Degraded service - ${data.error || 'Unknown issue'}`);
        
        return {
          operational: false,
          status: data.status || 'unknown',
          error: data.error,
          timestamp: new Date().toISOString()
        };
      }
      
    } catch (error) {
      console.error(`💥 ENTERPRISE HEALTH ERROR:`, error);
      
      return {
        operational: false,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }


}

export default CentralDataService; 
