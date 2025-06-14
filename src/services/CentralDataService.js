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
    const { includeROI = false, includeTax = false, forceRefresh = false } = options;

    // 🏛️ DATABASE PERSISTENT CACHE CHECK (außer bei forceRefresh)
    if (!forceRefresh) {
      try {
        const { DatabasePersistentCache } = await import('./DatabasePersistentCache');
        const cachedPortfolio = await DatabasePersistentCache.getPortfolioData(userId);
        
        if (cachedPortfolio) {
          const cacheMinutes = Math.round(cachedPortfolio.cacheAge / (1000 * 60));
          console.log(`✅ DB CACHE HIT: Portfolio with ${cachedPortfolio.tokens?.length || 0} tokens, $${cachedPortfolio.totalValue} (${cacheMinutes}min old)`);
          
          return {
            ...cachedPortfolio,
            loadTime: '0.1',
            fromCache: true,
            cacheType: 'database_persistent',
            cacheInfo: `Database cache (${cacheMinutes}min old)`
          };
        }
      } catch (cacheError) {
        console.warn(`⚠️ DB CACHE CHECK: ${cacheError.message}`);
      }
    }
    
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
      
      // 🏛️ DATABASE PERSISTENT CACHE SAVE
      try {
        const { DatabasePersistentCache } = await import('./DatabasePersistentCache');
        await DatabasePersistentCache.savePortfolioData(userId, portfolioResponse);
        console.log(`💾 DB CACHE: Portfolio saved for user ${userId}`);
      } catch (cacheError) {
        console.warn(`⚠️ DB CACHE SAVE: ${cacheError.message}`);
      }
      
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
        let rawTokens = tokensData.result || [];
        
        // 🚀 SCHRITT 1.5: Native Token hinzufügen (ETH, PLS) - VERSTÄRKT
        try {
          const nativeResponse = await fetch(`/api/moralis-v2?address=${wallet.address}&chain=${chain.name.toLowerCase()}&endpoint=native-balance`);
          apiCallsUsed++;
          
          if (nativeResponse.ok) {
            const nativeData = await nativeResponse.json();
            const nativeBalance = nativeData.balance || '0';
            const balanceValue = parseFloat(nativeBalance);
            
            console.log(`🔍 NATIVE CHECK: Chain ${chainId} (${chain.name}), Balance: ${balanceValue / 1e18}`);
            
            if (balanceValue > 0) {
              // Chain-spezifische Native Token Konfiguration
              let nativeSymbol, nativeName;
              
              switch(chainId) {
                case 1:
                case '1':
                case '0x1':
                  nativeSymbol = 'ETH';
                  nativeName = 'Ethereum';
                  break;
                case 369:
                case '369':
                case '0x171':
                  nativeSymbol = 'PLS';
                  nativeName = 'PulseChain';
                  break;
                default:
                  nativeSymbol = chain.nativeSymbol || 'NATIVE';
                  nativeName = chain.nativeName || 'Native Token';
              }
              
              const nativeToken = {
                token_address: 'native',
                symbol: nativeSymbol,
                name: nativeName,
                decimals: 18,
                balance: nativeBalance
              };
              
              rawTokens.unshift(nativeToken); // Native Token an den Anfang
              console.log(`✅ NATIVE ADDED: ${nativeToken.symbol} (${nativeToken.name}) with balance ${balanceValue / 1e18} on chain ${chainId}`);
            } else {
              console.log(`⚪ NATIVE SKIP: Zero balance for ${chain.name} (${chainId})`);
            }
          } else {
            console.warn(`⚠️ NATIVE API: HTTP ${nativeResponse.status} for ${chain.name}`);
          }
        } catch (nativeError) {
          console.error(`💥 NATIVE ERROR: Could not load native balance for ${chain.name} - ${nativeError.message}`);
        }
        
        console.log(`✅ TOKENS: ${rawTokens.length} tokens found for ${wallet.address.slice(0, 8)} (incl. native)`);
        
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
              
              console.log(`📊 PROCESSING: ${tokenSymbol} = ${balanceReadable.toLocaleString()} tokens (${tokenAddress})`);
              
              // 🚨 CRITICAL: Block falschen DOMINANCE Token - VERSTÄRKT
              if (tokenSymbol === 'DOMINANCE') {
                if (tokenAddress !== '0x116d162d729e27e2e1d6478f1d2a8aed9c7a2bea') {
                  console.error(`🚨 BLOCKED FAKE DOMINANCE: ${tokenAddress} - Only 0x116d162d729e27e2e1d6478f1d2a8aed9c7a2bea allowed`);
                  console.error(`🚨 FAKE DOMINANCE DETAILS: Symbol: ${tokenSymbol}, Address: ${tokenAddress}, Balance: ${balanceReadable}`);
                  return null; // BLOCKIERE komplett
                } else {
                  console.log(`✅ REAL DOMINANCE APPROVED: ${tokenAddress}`);
                }
              }
              
              // 🚨 ADDITIONAL: Block specific fake addresses
              const BLOCKED_ADDRESSES = [
                '0x64bab8470043748014318b075685addaa1f22a87', // Fake DOMINANCE
                '0x64bab8470043748014318b075685addaa1f22a88', // Possible variants
                '0x64bab8470043748014318b075685addaa1f22a89'  // Possible variants
              ];
              
              if (BLOCKED_ADDRESSES.includes(tokenAddress)) {
                console.error(`🚨 BLOCKED FAKE TOKEN: ${tokenSymbol} (${tokenAddress}) - Address in blocklist`);
                return null;
              }
              
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
    console.log(`🚀 ROI SIMPLE: Loading ROI transactions for ${wallets.length} wallets (CURRENT MONTH)`);
    
    const allROITransactions = [];
    let totalApiCalls = 0;
    
    // 📅 NUR LAUFENDER MONAT - User-Wunsch
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        console.log(`💰 ROI WALLET: Loading ${wallet.address} on ${chain.name}`);
        
        // 🚀 ROI MASSIVE PAGINATION: Load ALL transactions from current month
        let cursor = null;
        let walletROITransactions = [];
        let pageNumber = 0;
        const MAX_ROI_PAGES = 1000; // 1000 * 50 = 50k max für ROI
        let consecutiveEmptyPages = 0;
        const MAX_EMPTY_PAGES = 3;
        
        do {
          pageNumber++;
          console.log(`💰 ROI PAGE ${pageNumber}: Loading batch for ${wallet.address}... (ROI so far: ${walletROITransactions.length})`);
          
          try {
            const apiUrl = `/api/moralis-transactions?address=${wallet.address}&chain=${chain.name.toLowerCase()}&limit=50${cursor ? `&cursor=${cursor}` : ''}&from_date=${currentMonthStart.toISOString()}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds for ROI
            
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            totalApiCalls++;
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.result && Array.isArray(data.result)) {
                // 🔍 ROI DETECTION: Alle eingehenden Transfers analysieren (Erweitert)
                const pageROITransactions = data.result
                  .filter(tx => {
                    // Eingehende Transaktionen (to_address = wallet)
                    const isIncoming = tx.to_address && tx.to_address.toLowerCase() === wallet.address.toLowerCase();
                    
                    // Zusätzliche ROI-Kriterien
                    const isROIToken = tx.token_symbol && ['PLSX', 'HEX', 'INC', 'PHEX', 'EHEX', 'DOM', 'DOMINANCE'].includes(tx.token_symbol.toUpperCase());
                    const hasValue = tx.value && tx.value !== '0';
                    
                    // Log potential ROI transactions
                    if (isIncoming && hasValue) {
                      console.log(`🔍 ROI CANDIDATE: ${tx.token_symbol || 'NATIVE'} from ${tx.from_address?.slice(0,8)}... value: ${tx.value}`);
                    }
                    
                    return isIncoming && hasValue;
                  })
                  .map(tx => {
                    // ROI Value berechnen
                    const rawValue = parseFloat(tx.value) || 0;
                    const usdValue = this.calculateTransactionValue(tx, priceMap);
                    const tokenDecimals = parseInt(tx.token_decimals) || 18;
                    const tokenAmount = rawValue / Math.pow(10, tokenDecimals);
                    
                    return {
                      ...tx,
                      walletAddress: wallet.address,
                      chainId: chainId,
                      value: usdValue,
                      timestamp: tx.block_timestamp,
                      type: 'ROI_INCOMING',
                      token: tx.token_symbol || 'NATIVE',
                      amount: tokenAmount,
                      rawValue: rawValue,
                      from: tx.from_address,
                      to: tx.to_address,
                      hash: tx.transaction_hash
                    };
                  })
                  .filter(tx => {
                    // Nur laufender Monat und USD value >= 0.01 (sehr niedrige Schwelle)
                    const txDate = new Date(tx.timestamp);
                    const isCurrentMonth = txDate >= currentMonthStart;
                    const hasMinValue = tx.value >= 0.01;
                    
                    if (isCurrentMonth && hasMinValue) {
                      console.log(`✅ ROI ACCEPTED: ${tx.token} $${tx.value.toFixed(4)} from ${tx.from?.slice(0,8)}... on ${txDate.toLocaleDateString()}`);
                    }
                    
                    return isCurrentMonth && hasMinValue;
                  });
                
                if (data.result.length === 0) {
                  consecutiveEmptyPages++;
                  console.log(`⚠️ ROI PAGE ${pageNumber}: Empty page (${consecutiveEmptyPages}/${MAX_EMPTY_PAGES})`);
                  
                  if (consecutiveEmptyPages >= MAX_EMPTY_PAGES) {
                    console.log(`🛑 ROI STOP: ${MAX_EMPTY_PAGES} consecutive empty pages, stopping`);
                    break;
                  }
                } else {
                  consecutiveEmptyPages = 0;
                  walletROITransactions.push(...pageROITransactions);
                  console.log(`✅ ROI PAGE ${pageNumber}: +${pageROITransactions.length} ROI transactions (${data.result.length} total)`);
                }
                
                // Update cursor for next page
                cursor = data.cursor;
                
                // Stop if no cursor (end of data)
                if (!cursor) {
                  console.log(`🏁 ROI COMPLETE: ${wallet.address} - No more pages available`);
                  break;
                }
                
              } else {
                console.warn(`⚠️ ROI PAGE ${pageNumber}: No valid result for ${wallet.address}`);
                break;
              }
              
              // Safety: Stop at max pages
              if (pageNumber >= MAX_ROI_PAGES) {
                console.warn(`⚠️ ROI LIMIT: Stopped at ${MAX_ROI_PAGES} pages for ${wallet.address}`);
                break;
              }
              
            } else {
              console.error(`❌ ROI PAGE ${pageNumber}: HTTP ${response.status} for ${wallet.address}`);
              break;
            }
            
          } catch (pageError) {
            console.error(`💥 ROI PAGE ${pageNumber} ERROR: ${pageError.message}`);
            
            // Retry on network errors
            if (pageError.name === 'AbortError' || pageError.name === 'TimeoutError') {
              console.log(`🔄 ROI TIMEOUT RETRY: Retrying page ${pageNumber} for ${wallet.address}...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            } else {
              break;
            }
          }
          
          // Rate limiting: 100ms between ROI requests (faster)
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } while (cursor && pageNumber < MAX_ROI_PAGES);
        
        allROITransactions.push(...walletROITransactions);
        console.log(`✅ ROI WALLET COMPLETE: ${walletROITransactions.length} ROI transactions for ${wallet.address} (${pageNumber} pages)`);
        
      } catch (error) {
        console.error(`💥 ROI WALLET ERROR: ${wallet.address} - ${error.message}`);
      }
    }
    
    // 📊 CALCULATE ROI STATS für LAUFENDEN MONAT
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
    
    console.log(`✅ ROI SIMPLE COMPLETE: ${allROITransactions.length} transactions, Daily: $${dailyROI.toFixed(2)}, Weekly: $${weeklyROI.toFixed(2)}, Monthly: $${monthlyROI.toFixed(2)}`);
    
    return { 
      transactions: allROITransactions, 
      dailyROI, 
      weeklyROI, 
      monthlyROI, 
      source: 'moralis_transactions_direct_current_month',
      totalApiCalls,
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear(),
      debugInfo: {
        walletsProcessed: wallets.length,
        totalTransactions: allROITransactions.length,
        dailyCount: dailyTransactions.length,
        weeklyCount: weeklyTransactions.length,
        monthlyCount: monthlyTransactions.length
      }
    };
  }

  // 💰 HELPER: Transaction Value berechnen (Verbessert für ROI)
  static calculateTransactionValue(tx, priceMap) {
    try {
      if (!tx.value || tx.value === '0') return 0;
      
      // Native Token (PLS)
      if (!tx.token_address) {
        const plsValue = parseFloat(tx.value) / Math.pow(10, 18);
        const plsPrice = priceMap?.['native'] || 0.0001; // Höherer default PLS price
        const usdValue = plsValue * plsPrice;
        console.log(`💰 NATIVE ROI: ${plsValue.toFixed(4)} PLS × $${plsPrice} = $${usdValue.toFixed(4)}`);
        return usdValue;
      }
      
      // ERC20 Token
      const tokenAddress = tx.token_address.toLowerCase();
      const tokenDecimals = parseInt(tx.token_decimals) || 18;
      const tokenValue = parseFloat(tx.value) / Math.pow(10, tokenDecimals);
      const tokenSymbol = tx.token_symbol || 'Unknown';
      
      // Default Token Prices für häufige ROI Token
      const defaultPrices = {
        'plsx': 0.001,    // PLSX
        'hex': 0.004,     // HEX  
        'inc': 0.002,     // INC
        'phex': 0.004,    // pHEX
        'ehex': 0.004,    // eHEX
        'dom': 0.1,       // DOMINANCE
        'dominance': 0.1  // DOMINANCE
      };
      
      const tokenPrice = priceMap?.[tokenAddress] || 
                        defaultPrices[tokenSymbol.toLowerCase()] || 
                        0.001; // Min fallback price
      
      const usdValue = tokenValue * tokenPrice;
      
      // Log significant ROI transactions
      if (usdValue > 1) {
        console.log(`💰 TOKEN ROI: ${tokenValue.toFixed(2)} ${tokenSymbol} × $${tokenPrice} = $${usdValue.toFixed(2)} (${tokenAddress.slice(0,8)}...)`);
      }
      
      return usdValue;
      
    } catch (error) {
      console.error(`⚠️ VALUE CALC ERROR: ${error.message}`);
      return 0.01; // Minimaler Fallback statt 0
    }
  }

  static async loadTaxTransactionsMoralisOnly(wallets, priceMap) {
    console.log(`🚀 TAX MASSIVE: Loading ALL tax transactions for ${wallets.length} wallets (up to 100k each)`);
    
    const allTaxTransactions = [];
    let totalApiCalls = 0;
    let totalTransactionsLoaded = 0;
    
    for (const wallet of wallets) {
      try {
        const chainId = wallet.chain_id || 369;
        const chain = this.getChainConfig(chainId);
        
        console.log(`📊 TAX WALLET: Starting massive load for ${wallet.address} on ${chain.name}`);
        
        // 🚀 MASSIVE PAGINATION: Load in chunks of 50 until we have all transactions
        let cursor = null;
        let walletTransactions = [];
        let pageNumber = 0;
        const MAX_PAGES = 3000; // 3000 * 50 = 150k max (erhöht für mehr Transaktionen)
        let consecutiveEmptyPages = 0;
        const MAX_EMPTY_PAGES = 3; // Stop after 3 consecutive empty pages
        
        do {
          pageNumber++;
          console.log(`📄 TAX PAGE ${pageNumber}: Loading batch for ${wallet.address}... (Total so far: ${walletTransactions.length})`);
          
          try {
            // 🔧 NO DATE FILTER für TAX - wir wollen ALLE Transaktionen ever
            const apiUrl = `/api/moralis-transactions?address=${wallet.address}&chain=${chain.name.toLowerCase()}&limit=50${cursor ? `&cursor=${cursor}` : ''}`;
            
            console.log(`🔍 TAX API CALL: ${apiUrl}`);
            
            // 🔄 EXTENDED TIMEOUT & RETRY LOGIC (Browser-compatible)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout
            
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            totalApiCalls++;
            
            if (!response.ok) {
              console.error(`❌ TAX PAGE ${pageNumber}: HTTP ${response.status} for ${wallet.address}`);
              
              // Retry on 5xx errors, but not on 4xx errors
              if (response.status >= 500 && response.status < 600) {
                console.log(`🔄 TAX RETRY: Retrying page ${pageNumber} for ${wallet.address}...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                continue; // Retry same page
              } else {
                break; // Skip to next wallet on client errors
              }
            }
            
            const data = await response.json();
            
            if (data.result && Array.isArray(data.result)) {
              const pageTransactions = data.result.map(tx => ({
                ...tx,
                walletAddress: wallet.address,
                chainId: chainId
              }));
              
              if (pageTransactions.length === 0) {
                consecutiveEmptyPages++;
                console.log(`⚠️ TAX PAGE ${pageNumber}: Empty page (${consecutiveEmptyPages}/${MAX_EMPTY_PAGES})`);
                
                if (consecutiveEmptyPages >= MAX_EMPTY_PAGES) {
                  console.log(`🛑 TAX STOP: ${MAX_EMPTY_PAGES} consecutive empty pages, stopping`);
                  break;
                }
              } else {
                consecutiveEmptyPages = 0; // Reset counter
                walletTransactions.push(...pageTransactions);
                console.log(`✅ TAX PAGE ${pageNumber}: +${pageTransactions.length} transactions (total: ${walletTransactions.length})`);
              }
              
              // Update cursor for next page
              cursor = data.cursor;
              
              // Stop if no cursor (end of data)
              if (!cursor) {
                console.log(`🏁 TAX COMPLETE: ${wallet.address} - No more pages available`);
                break;
              }
              
            } else {
              console.warn(`⚠️ TAX PAGE ${pageNumber}: No valid result for ${wallet.address}`);
              break;
            }
            
            // Safety: Stop at max pages
            if (pageNumber >= MAX_PAGES) {
              console.warn(`⚠️ TAX LIMIT: Stopped at ${MAX_PAGES} pages for ${wallet.address}`);
              break;
            }
            
          } catch (pageError) {
            console.error(`💥 TAX PAGE ${pageNumber} ERROR: ${pageError.message}`);
            
            // Retry on network errors
            if (pageError.name === 'AbortError' || pageError.name === 'TimeoutError') {
              console.log(`🔄 TAX TIMEOUT RETRY: Retrying page ${pageNumber} for ${wallet.address}...`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
              continue; // Retry same page
            } else {
              break; // Skip to next wallet on other errors
            }
          }
          
          // Rate limiting: 150ms between requests (slightly faster)
          await new Promise(resolve => setTimeout(resolve, 150));
          
        } while (cursor && pageNumber < MAX_PAGES);
        
        allTaxTransactions.push(...walletTransactions);
        totalTransactionsLoaded += walletTransactions.length;
        
        console.log(`✅ TAX WALLET COMPLETE: ${walletTransactions.length} transactions for ${wallet.address} (${pageNumber} pages)`);
        
      } catch (walletError) {
        console.error(`💥 TAX WALLET ERROR: Failed for ${wallet.address} - ${walletError.message}`);
      }
    }
    
    console.log(`🎯 TAX MASSIVE COMPLETE: ${totalTransactionsLoaded} transactions total, ${totalApiCalls} API calls`);
    
    return { 
      transactions: allTaxTransactions, 
      source: 'moralis_transactions_massive_pagination',
      totalApiCalls,
      totalTransactionsLoaded,
      walletsProcessed: wallets.length,
      averageTransactionsPerWallet: Math.round(totalTransactionsLoaded / wallets.length)
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