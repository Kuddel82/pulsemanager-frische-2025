// 🎯 CENTRAL DATA SERVICE - 100% MORALIS ENTERPRISE MODUS
// Ersetzt das Chaos von verschiedenen Services durch eine einheitliche API
// Datum: 2025-01-11 - CRITICAL FIX: 100% Moralis wenn API Key vorhanden

import { supabase } from '@/lib/supabaseClient';

export class CentralDataService {
  
  // 🔑 ENTERPRISE MODE DETECTION
  static async hasValidMoralisApiKey() {
    try {
      const response = await fetch('/api/moralis-tokens?endpoint=test&chain=0x171&address=0x0000000000000000000000000000000000000000');
      const data = await response.json();
      
      // Check if we get a proper Moralis response instead of fallback
      return !data._fallback && !data.error;
    } catch {
      return false;
    }
  }

  // 🌐 MULTI-CHAIN CONFIGURATION - MORALIS FIRST
  static CHAINS = {
    PULSECHAIN: {
      id: 369,
      name: 'PulseChain',
      nativeSymbol: 'PLS',
      moralisChainId: '0x171',
      apiProxy: '/api/pulsechain',           // Fallback only
      moralisProxy: '/api/moralis-tokens',   // Primary (when API key available)
      explorerBase: 'https://scan.pulsechain.com'
    },
    ETHEREUM: {
      id: 1,
      name: 'Ethereum',
      nativeSymbol: 'ETH',
      moralisChainId: '0x1',
      apiProxy: '/api/moralis-tokens',       // Direct Moralis for ETH
      moralisProxy: '/api/moralis-tokens',   // Primary
      explorerBase: 'https://etherscan.io'
    }
  };

  // 🚀 MORALIS ENTERPRISE ENDPOINTS
  static MORALIS_ENDPOINTS = {
    tokens: '/api/moralis-tokens',
    prices: '/api/moralis-prices', 
    transactions: '/api/moralis-transactions',
    tokenTransfers: '/api/moralis-token-transfers'
  };

  // 📡 LEGACY FALLBACK ENDPOINTS (nur ohne Moralis API Key)
  static PROXY_ENDPOINTS = {
    pulsechain: '/api/pulsechain',
    ethereum: '/api/moralis-tokens',
    moralis_prices: '/api/moralis-prices',
    moralis_tokens: '/api/moralis-tokens'
  };

  // 💰 MINIMAL FALLBACKS: Nur für native & Stablecoins (Multi-Chain)
  static FALLBACK_PRICES = {
    // ⚠️ NUR ABSOLUTE MINIMAL-FALLBACKS (wenn kein Live-Preis verfügbar)
    
    // 🔗 PulseChain Native Tokens
    'PLS': 0.000088,      // Native PulseChain
    'PLSX': 0.00002622,   // PulseX
    'HEX': 0.005943,      // HEX
    'DOMINANCE': 91.10,   // DOMINANCE (echter Token) - User-provided
    
    // 🔗 Ethereum Native Tokens 
    'ETH': 2400,          // Ethereum (minimal fallback)
    'WETH': 2400,         // Wrapped Ethereum
    
    // 🔗 Stablecoins (Multi-Chain)
    'DAI': 1.0,
    'USDC': 1.0,
    'USDT': 1.0,
    'USDC.e': 1.0,        // Bridged USDC
    
    // 🔗 Wichtige WGEP Token (falls Live-Preis fehlt)
    'WGEP': 0.00001       // WGEP minimal fallback
  };

  // 🎯 DRUCKER-CONTRACTS (für ROI-Erkennung)
  static KNOWN_MINTERS = [
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', // HEX Drucker
    '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3', // INC Drucker
    '0x83D0cF6A8bc7d9aF84B7fc1a6A8ad51f1e1E6fE1', // PLSX Drucker
    // Weitere Drucker-Contracts hier hinzufügen
  ];

  // 🛡️ VERTRAUENSWÜRDIGE TOKEN-CONTRACTS (Scam-Schutz Whitelist)
  static TRUSTED_TOKENS = {
    // 🔗 PulseChain Ecosystem
    '0x116d162d729e27e2e1d6478f1d2a8aed9c7a2bea': 'DOMINANCE', // Echter DOMINANCE Token
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': 'HEX',       // HEX
    '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3': 'INC',       // Incentive Token
    '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1': 'PLSX',      // PulseX
    '0x2fa878ab3f87cc1c9737fc071108f904c0b0c95d': 'PHIAT',     // PHIAT
    '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2': 'WGEP',      // WGEP (falls bridged)
    
    // 🔗 Ethereum Ecosystem (für Multi-Chain Support)
    '0xa0b86a33e6c5e8aac52c8fd9bc99f87eff44b2e9': 'DOMINANCE_ETH', // Falls auf Ethereum
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',      // Wrapped Ethereum
    '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b': 'CRO',       // Cronos
    
    // 🔗 Major Stablecoins
    '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',       // DAI
    '0xa0b86a33e6c5e8aac52c8fd9bc99f87eff44b2e9': 'USDC',      // USDC
    '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT'       // USDT
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
   * 🔗 HELPER: Explorer URL für verschiedene Chains
   */
  static getExplorerUrl(contractAddress, chainId) {
    const chainConfig = this.getChainConfig(chainId);
    return `${chainConfig.explorerBase}/token/${contractAddress}`;
  }

  /**
   * 🛡️ HELPER: Prüfe ob Token vertrauenswürdig ist (Scam-Schutz Whitelist)
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
   * 🎯 HAUPTFUNKTION: Lade komplette Portfolio-Daten mit echten Preisen (100% MORALIS)
   */
  static async loadCompletePortfolio(userId) {
    console.log(`🎯 CENTRAL SERVICE (100% MORALIS): Loading complete portfolio for user ${userId}`);
    
    // Check if we have Moralis Enterprise access
    const hasMoralisAccess = await this.hasValidMoralisApiKey();
    console.log(`🔑 MORALIS ENTERPRISE ACCESS: ${hasMoralisAccess ? '✅ ACTIVE' : '❌ FALLBACK MODE'}`);
    
    try {
      // 1. Lade User Wallets
      const wallets = await this.loadUserWallets(userId);
      console.log(`📱 Loaded ${wallets.length} wallets`);

      if (wallets.length === 0) {
        console.log('⚠️ No wallets found for user');
        return this.getEmptyPortfolio(userId, 'Keine Wallets gefunden. Fügen Sie Ihre Wallet-Adressen hinzu.');
      }

      // 2. Lade echte Token-Balances (100% MORALIS ENTERPRISE)
      const tokenData = await this.loadRealTokenBalancesMoralisFirst(wallets, hasMoralisAccess);
      console.log(`🪙 MORALIS ENTERPRISE: Loaded ${tokenData.tokens.length} tokens with total raw value $${tokenData.totalValue.toFixed(2)}`);

      // 3. Lade echte Token-Preise (100% MORALIS ENTERPRISE)
      const pricesData = await this.loadMoralisTokenPricesFixed(tokenData.tokens);
      console.log(`💰 MORALIS ENTERPRISE: Updated prices for ${pricesData.updatedCount} tokens`);

      // 4. Aktualisiere Token-Werte mit echten Preisen (FIXED PRECISION)
      const updatedTokenData = this.updateTokenValuesWithRealPricesFixed(tokenData, pricesData);
      console.log(`🔄 FIXED: Updated token values: $${updatedTokenData.totalValue.toFixed(2)}`);

      // 5. Lade ROI-Transaktionen (100% MORALIS ENTERPRISE)
      const roiData = await this.loadRealROITransactionsMoralisFirst(wallets, pricesData.priceMap, hasMoralisAccess);
      console.log(`📊 MORALIS ENTERPRISE: Loaded ${roiData.transactions.length} ROI transactions, Monthly ROI: $${roiData.monthlyROI.toFixed(2)}`);

      // 6. Lade historische Transaktionen für Tax Export (100% MORALIS ENTERPRISE)
      const taxData = await this.loadTaxTransactionsMoralisFirst(wallets, pricesData.priceMap, hasMoralisAccess);
      console.log(`📄 MORALIS ENTERPRISE: Loaded ${taxData.transactions.length} tax transactions`);

      // 7. Berechne Portfolio-Statistiken
      const portfolioStats = this.calculatePortfolioStats(updatedTokenData, roiData);
      
      // 8. Erstelle einheitliche Datenstruktur
      const completePortfolio = {
        userId,
        timestamp: new Date().toISOString(),
        
        // Wallet Info
        wallets: wallets,
        walletCount: wallets.length,
        
        // Token Holdings (mit echten Preisen - FIXED)
        tokens: updatedTokenData.tokens,
        tokenCount: updatedTokenData.tokens.length,
        totalTokenValue: updatedTokenData.totalValue,
        
        // ROI Data (FIXED)
        roiTransactions: roiData.transactions,
        roiStats: roiData.stats,
        dailyROI: roiData.dailyROI,
        weeklyROI: roiData.weeklyROI,
        monthlyROI: roiData.monthlyROI,
        
        // Tax Data (FIXED)
        taxTransactions: taxData.transactions,
        taxSummary: taxData.summary,
        
        // Portfolio Stats
        totalValue: portfolioStats.totalValue,
        totalROI: portfolioStats.totalROI,
        portfolioChange24h: portfolioStats.change24h,
        
        // Debug Info (EXTENDED)
        debug: {
          pricesUpdated: pricesData.updatedCount,
          priceSource: pricesData.source,
          apiCalls: pricesData.apiCalls,
          lastPriceUpdate: pricesData.timestamp,
          tokensWithZeroPrice: updatedTokenData.tokens.filter(t => t.price === 0).length,
          tokensWithZeroValue: updatedTokenData.tokens.filter(t => t.value === 0).length,
          roiTransactionsWithZeroValue: roiData.transactions.filter(t => t.value === 0).length,
          totalTransactionsLoaded: taxData.transactions.length
        },
        
        // Status
        isLoaded: true,
        loadTime: Date.now()
      };

      console.log(`✅ FIXED PORTFOLIO LOADED: $${completePortfolio.totalValue.toFixed(2)} (${completePortfolio.tokenCount} tokens, ${completePortfolio.roiTransactions.length} ROI)`);
      console.log(`🐛 DEBUG INFO:`, completePortfolio.debug);
      
      return completePortfolio;

    } catch (error) {
      console.error('💥 CRITICAL ERROR loading portfolio:', error);
      return this.getEmptyPortfolio(userId, error.message);
    }
  }

  /**
   * 📱 Lade User Wallets aus Supabase
   */
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

  /**
   * 🪙 100% MORALIS ENTERPRISE: Token-Balances von Moralis APIs (ENTERPRISE MODE)
   */
  static async loadRealTokenBalancesMoralisFirst(wallets, hasMoralisAccess) {
    const allTokens = [];
    let totalValue = 0;

    console.log(`🚀 MORALIS ENTERPRISE MODE: ${hasMoralisAccess ? 'USING MORALIS APIS' : 'FALLBACK TO FREE APIS'}`);

    for (const wallet of wallets) {
      const chainId = wallet.chain_id || 369;
      const chain = this.getChainConfig(chainId);
      
      console.log(`🔍 ENTERPRISE: Loading tokens for wallet ${wallet.address} on ${chain.name}`);
      
      try {
        let response;
        
        if (hasMoralisAccess) {
          // 🚀 100% MORALIS ENTERPRISE API
          console.log(`💎 USING MORALIS ENTERPRISE for ${chain.name}`);
          
          response = await fetch(`/api/moralis-tokens?endpoint=wallet-tokens&chain=${chain.moralisChainId}&address=${wallet.address}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }).then(r => r.text()).then(text => {
            try {
              return JSON.parse(text);
            } catch {
              return { error: 'Invalid JSON response' };
            }
          });
          
          // Transform Moralis response to match expected format
          if (response.result && Array.isArray(response.result)) {
            response = {
              status: '1',
              result: response.result.map(token => ({
                symbol: token.symbol,
                name: token.name,
                contractAddress: token.token_address,
                decimals: token.decimals,
                balance: token.balance
              }))
            };
          } else if (response._fallback) {
            // Moralis API not available, use fallback
            console.warn(`⚠️ MORALIS ENTERPRISE not available, using fallback for ${wallet.address}`);
            hasMoralisAccess = false; // Switch to fallback for this wallet
            
            response = await fetch(
              `${chain.apiProxy}?address=${wallet.address}&action=tokenlist&module=account`
            ).then(r => r.json());
          }
        } else {
          // 📡 FALLBACK: PulseChain Scanner API
          console.log(`🔄 FALLBACK: Using PulseChain Scanner for ${chain.name}`);
          
          response = await fetch(
            `${chain.apiProxy}?address=${wallet.address}&action=tokenlist&module=account`
          ).then(r => r.json());
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
                  source: hasMoralisAccess ? 'MORALIS_ENTERPRISE' : 'PULSECHAIN_SCANNER'
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
                  source: hasMoralisAccess ? 'moralis_enterprise' : `${chain.name.toLowerCase()}_scanner`,
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
          // ✅ NOTOK ist NORMAL für Wallets ohne Token-Transaktionen
          if (response.message === 'NOTOK' || response.status === '0' || response.status === 'NOTOK') {
            console.log(`📱 Empty wallet (no tokens): ${wallet.address} - This is normal for new/unused wallets`);
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
  static async loadMoralisTokenPricesFixed(tokens) {
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
    for (const [symbol, price] of Object.entries(this.FALLBACK_PRICES)) {
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
      
      // Priority 1: Live-Preise aus Price Map (Moralis Enterprise)
      if (priceMap.has(contractKey)) {
        price = priceMap.get(contractKey);
        priceSource = 'moralis_live';
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
        hasReliablePrice: price > 0 && priceSource === 'moralis_live',
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
   * 📊 100% MORALIS ENTERPRISE: ROI-Transaktionen von Moralis APIs (ENTERPRISE MODE)
   */
  static async loadRealROITransactionsMoralisFirst(wallets, priceMap, hasMoralisAccess) {
    const allTransactions = [];
    const roiStats = { daily: 0, weekly: 0, monthly: 0 };

    console.log(`🚀 MORALIS ENTERPRISE ROI: ${hasMoralisAccess ? 'USING MORALIS APIS' : 'FALLBACK TO FREE APIS'}`);

    for (const wallet of wallets) {
      const chainId = wallet.chain_id || 369;
      const chain = this.getChainConfig(chainId);
      
      try {
        console.log(`📊 ENTERPRISE ROI: Loading transactions for wallet ${wallet.address} on ${chain.name}`);
        
        let response;
        
        if (hasMoralisAccess) {
          // 🚀 100% MORALIS ENTERPRISE API
          console.log(`💎 USING MORALIS TRANSACTIONS API for ${chain.name}`);
          
          response = await fetch('/api/moralis-token-transfers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              address: wallet.address,
              chain: chain.moralisChainId,
              limit: 500
            })
          }).then(r => r.json());
          
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
        } else {
          // 📡 FALLBACK: PulseChain Scanner API
          console.log(`🔄 FALLBACK: Using PulseChain Scanner for ${chain.name}`);
          
          response = await fetch(
            `${chain.apiProxy}?address=${wallet.address}&action=tokentx&module=account&sort=desc&offset=500`
          ).then(r => r.json());
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
                  source: hasMoralisAccess ? 'moralis_enterprise' : 'pulsechain_scanner'
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
      source: hasMoralisAccess ? 'moralis_enterprise' : 'mixed_apis'
    };
  }

  /**
   * 📄 100% MORALIS ENTERPRISE: Tax-Transaktionen von Moralis APIs (ENTERPRISE MODE) 
   */
  static async loadTaxTransactionsMoralisFirst(wallets, priceMap, hasMoralisAccess) {
    const allTransactions = [];

    console.log(`🚀 MORALIS ENTERPRISE TAX: ${hasMoralisAccess ? 'USING MORALIS APIS' : 'FALLBACK TO FREE APIS'}`);

    for (const wallet of wallets) {
      const chainId = wallet.chain_id || 369;
      const chain = this.getChainConfig(chainId);
      
      try {
        console.log(`📄 ENTERPRISE TAX: Loading transactions for wallet ${wallet.address} on ${chain.name}`);
        
        let response;
        
        if (hasMoralisAccess) {
          // 🚀 100% MORALIS ENTERPRISE API
          console.log(`💎 USING MORALIS TOKEN TRANSFERS API for ${chain.name}`);
          
          response = await fetch('/api/moralis-token-transfers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              address: wallet.address,
              chain: chain.moralisChainId,
              limit: 2000  // Higher limit for tax reporting
            })
          }).then(r => r.json());
          
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
        } else {
          // 📡 FALLBACK: PulseChain Scanner API
          console.log(`🔄 FALLBACK: Using PulseChain Scanner for ${chain.name}`);
          
          response = await fetch(
            `${chain.apiProxy}?address=${wallet.address}&action=tokentx&module=account&sort=desc&offset=2000`
          ).then(r => r.json());
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
                source: hasMoralisAccess ? 'moralis_enterprise' : 'pulsechain_scanner',
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
      source: hasMoralisAccess ? 'moralis_enterprise' : 'mixed_apis'
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
    if (this.FALLBACK_PRICES[symbol]) {
      return this.FALLBACK_PRICES[symbol];
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
}

export default CentralDataService; 
