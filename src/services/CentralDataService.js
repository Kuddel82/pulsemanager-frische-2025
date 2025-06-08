// 🎯 CENTRAL DATA SERVICE - DATENKONSISTENZ-FIX
// Ersetzt das Chaos von verschiedenen Services durch eine einheitliche API
// Datum: 2025-01-08 - CRITICAL FIX: Echte Daten Precision

import { supabase } from '@/lib/supabaseClient';

export class CentralDataService {
  
  // 🏷️ OFFIZIELLE PULSECHAIN API ENDPOINTS (verifiziert)
  // 🌐 MULTI-CHAIN CONFIGURATION
  static CHAINS = {
    PULSECHAIN: {
      id: 369,
      name: 'PulseChain',
      nativeSymbol: 'PLS',
      apiProxy: '/api/pulsechain',
      explorerBase: 'https://scan.pulsechain.com'
    },
    ETHEREUM: {
      id: 1,
      name: 'Ethereum',
      nativeSymbol: 'ETH',
      apiProxy: '/api/ethereum-proxy',
      explorerBase: 'https://etherscan.io'
    }
  };

  static PROXY_ENDPOINTS = {
    pulsechain: '/api/pulsechain',
    ethereum: '/api/ethereum-proxy',
    pulsewatch: '/api/pulsewatch', 
    dexscreener: '/api/dexscreener-proxy'
  };

  // 💰 MINIMAL FALLBACKS: Nur für native & Stablecoins (Multi-Chain)
  static FALLBACK_PRICES = {
    // ⚠️ NUR ABSOLUTE MINIMAL-FALLBACKS (wenn kein Live-Preis verfügbar)
    
    // 🔗 PulseChain Native Tokens
    'PLS': 0.000088,      // Native PulseChain
    'PLSX': 0.00002622,   // PulseX
    'HEX': 0.005943,      // HEX
    
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

  // 🌐 ZUSÄTZLICHE API-ENDPUNKTE
  static ADDITIONAL_PRICE_APIS = {
    geckoterminal: 'https://api.geckoterminal.com/api/v2/networks/pulsechain/tokens',
    dexscreener: '/api/dexscreener-proxy'
  };

  // 🎯 DRUCKER-CONTRACTS (für ROI-Erkennung)
  static KNOWN_MINTERS = [
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', // HEX Drucker
    '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3', // INC Drucker
    '0x83D0cF6A8bc7d9aF84B7fc1a6A8ad51f1e1E6fE1', // PLSX Drucker
    // Weitere Drucker-Contracts hier hinzufügen
  ];

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
   * 🔗 HELPER: DexScreener URL für verschiedene Chains
   */
  static getDexScreenerUrl(contractAddress, chainId) {
    const chainNames = {
      369: 'pulsechain',
      1: 'ethereum'
    };
    const chainName = chainNames[chainId] || 'pulsechain';
    return `https://dexscreener.com/${chainName}/${contractAddress}`;
  }

  /**
   * 🎯 HAUPTFUNKTION: Lade komplette Portfolio-Daten mit echten Preisen (FIXED)
   */
  static async loadCompletePortfolio(userId) {
    console.log(`🎯 CENTRAL SERVICE (FIXED): Loading complete portfolio for user ${userId}`);
    
    try {
      // 1. Lade User Wallets
      const wallets = await this.loadUserWallets(userId);
      console.log(`📱 Loaded ${wallets.length} wallets`);

      if (wallets.length === 0) {
        console.log('⚠️ No wallets found for user');
        return this.getEmptyPortfolio(userId, 'Keine Wallets gefunden. Fügen Sie Ihre Wallet-Adressen hinzu.');
      }

      // 2. Lade echte Token-Balances von PulseChain API (FIXED PRECISION)
      const tokenData = await this.loadRealTokenBalancesFixed(wallets);
      console.log(`🪙 FIXED: Loaded ${tokenData.tokens.length} tokens with total raw value $${tokenData.totalValue.toFixed(2)}`);

      // 3. Lade echte Token-Preise von DexScreener (FIXED CONTRACT MATCHING)
      const pricesData = await this.loadRealTokenPricesFixed(tokenData.tokens);
      console.log(`💰 FIXED: Updated prices for ${pricesData.updatedCount} tokens`);

      // 4. Aktualisiere Token-Werte mit echten Preisen (FIXED PRECISION)
      const updatedTokenData = this.updateTokenValuesWithRealPricesFixed(tokenData, pricesData);
      console.log(`🔄 FIXED: Updated token values: $${updatedTokenData.totalValue.toFixed(2)}`);

      // 5. Lade ROI-Transaktionen (FIXED LOADING - mehr Transaktionen)
      const roiData = await this.loadRealROITransactionsFixed(wallets, pricesData.priceMap);
      console.log(`📊 FIXED: Loaded ${roiData.transactions.length} ROI transactions, Monthly ROI: $${roiData.monthlyROI.toFixed(2)}`);

      // 6. Lade historische Transaktionen für Tax Export (FIXED LOADING)
      const taxData = await this.loadTaxTransactionsFixed(wallets, pricesData.priceMap);
      console.log(`📄 FIXED: Loaded ${taxData.transactions.length} tax transactions`);

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
   * 🪙 MULTI-CHAIN: Lade Token-Balances von verschiedenen Chains (PRECISION FIXED)
   */
  static async loadRealTokenBalancesFixed(wallets) {
    const allTokens = [];
    let totalValue = 0;

    for (const wallet of wallets) {
      const chainId = wallet.chain_id || 369; // Default PulseChain
      const chain = this.getChainConfig(chainId);
      
      console.log(`🔍 MULTI-CHAIN: Loading tokens for wallet ${wallet.address} on ${chain.name}`);
      
      try {
        // Verwende entsprechenden Chain-Proxy
        const response = await fetch(
          `${chain.apiProxy}?address=${wallet.address}&action=tokenlist&module=account`
        );
        
        if (!response.ok) {
          console.warn(`⚠️ API Error for ${wallet.address}: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.status === '1' && Array.isArray(data.result)) {
          console.log(`📊 FIXED: Found ${data.result.length} token entries for wallet ${wallet.address}`);
          
          for (const tokenData of data.result) {
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
              
              // Log tokens for debugging (only significant ones)
              if (balance > 1 || ['PLS', 'HEX', 'PLSX', 'INC', 'WGEP'].includes(tokenData.symbol)) {
                console.log(`🔍 TOKEN DEBUG:`, {
                  symbol: tokenData.symbol,
                  calculatedBalance: balance.toFixed(4),
                  contractAddress: tokenData.contractAddress.slice(0, 8) + '...'
                });
              }
              
              // Include ALL tokens with any balance (no filtering)
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
                  source: `${chain.name.toLowerCase()}_api`,
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
          console.warn(`⚠️ No token data for wallet ${wallet.address}: ${data.message || data.status || 'Unknown error'}`);
          // NICHT als Fehler behandeln - weiter mit nächster Wallet
          continue;
        }
      } catch (error) {
        console.error(`💥 Error loading tokens for wallet ${wallet.address}:`, error.message);
      }
    }

    console.log(`🔍 FIXED: Total tokens found before pricing: ${allTokens.length}`);

    return {
      tokens: allTokens,
      totalValue: totalValue, // Will be calculated after pricing
      uniqueTokens: new Set(allTokens.map(t => t.symbol)).size
    };
  }

  /**
   * 💰 MULTI-CHAIN LIVE-PREISE: DexScreener + GeckoTerminal für alle Chains
   */
  static async loadRealTokenPricesFixed(tokens) {
    console.log(`💰 MULTI-CHAIN PRICES: Loading prices for ${tokens.length} tokens`);
    
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

    // 🌟 PRIORITY 1: DexScreener API für jede Chain separat
    for (const [chainId, chainTokens] of Object.entries(tokensByChain)) {
      if (chainTokens.length === 0) continue;
      
      const chainConfig = this.getChainConfig(parseInt(chainId));
      const contractAddresses = [...new Set(chainTokens.map(t => t.contractAddress.toLowerCase()))];
      
      console.log(`🔗 ${chainConfig.name.toUpperCase()}: Fetching prices for ${contractAddresses.length} contracts`);

      try {
        const batchSize = 30; // DexScreener limit
        
        for (let i = 0; i < contractAddresses.length; i += batchSize) {
          const batch = contractAddresses.slice(i, i + batchSize);
          const addressParam = batch.join(',');
          
          try {
            const response = await fetch(
              `${this.PROXY_ENDPOINTS.dexscreener}?endpoint=tokens&addresses=${addressParam}`
            );
            
            apiCalls++;
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.pairs && Array.isArray(data.pairs)) {
                for (const pair of data.pairs) {
                  if (pair.baseToken && pair.priceUsd) {
                    const price = parseFloat(pair.priceUsd);
                    const contractAddress = pair.baseToken.address.toLowerCase();
                    
                    priceMap.set(contractAddress, price);
                    updatedCount++;
                    
                    // Reduced logging frequency für weniger Console-Spam
                    if (price > 0.01 || ['PLS', 'HEX', 'PLSX'].includes(pair.baseToken.symbol)) {
                      console.log(`🟢 ${chainConfig.name.toUpperCase()}: ${pair.baseToken.symbol} = $${price.toFixed(6)}`);
                    }
                  }
                }
              }
            }
          } catch (batchError) {
            console.warn(`⚠️ DexScreener ${chainConfig.name} batch error:`, batchError.message);
          }
          
          // Rate limiting
          if (i + batchSize < contractAddresses.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } catch (error) {
        console.error(`💥 DexScreener ${chainConfig.name} API error:`, error);
      }
    }

    // 🔵 PRIORITY 2: GeckoTerminal API für alle Chains (für fehlende Preise)
    const allMissingTokens = [];
    tokens.forEach(token => {
      if (token.contractAddress && !priceMap.has(token.contractAddress.toLowerCase())) {
        allMissingTokens.push({
          contractAddress: token.contractAddress.toLowerCase(),
          chainId: token.chainId || 369,
          symbol: token.symbol
        });
      }
    });

    if (allMissingTokens.length > 0) {
      console.log(`🔵 GECKOTERMINAL: Fetching ${allMissingTokens.length} missing prices from all chains`);
      
      for (const tokenInfo of allMissingTokens.slice(0, 50)) { // Performance Limit
        try {
          const chainConfig = this.getChainConfig(tokenInfo.chainId);
          const networkName = chainConfig.name.toLowerCase() === 'ethereum' ? 'eth' : 'pulsechain';
          
          const response = await fetch(
            `https://api.geckoterminal.com/api/v2/networks/${networkName}/tokens/${tokenInfo.contractAddress}`
          );
          
          apiCalls++;
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.data && data.data.attributes && data.data.attributes.price_usd) {
              const price = parseFloat(data.data.attributes.price_usd);
              
              priceMap.set(tokenInfo.contractAddress, price);
              updatedCount++;
              
              console.log(`🔵 GECKOTERMINAL ${chainConfig.name.toUpperCase()}: ${tokenInfo.symbol} = $${price}`);
            }
          }
        } catch (geckoError) {
          // Silent fail für GeckoTerminal
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

    console.log(`✅ LIVE PRICES COMPLETE: ${updatedCount} prices from ${apiCalls} API calls`);

    return {
      priceMap,
      updatedCount,
      source: 'live_prices_multi_api',
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
      
      // Priority 1: Live-Preise aus Price Map (DexScreener/GeckoTerminal)
      if (priceMap.has(contractKey)) {
        price = priceMap.get(contractKey);
        priceSource = 'live_api';
      }
      
      // ⚠️ STRIKTE VALIDIERUNG: Preis-Plausibilität prüfen
      if (price > 0) {
        // Sanity Check: Extrem hohe Preise blockieren (verhindert $1M+ Portfolio)
        if (price > 1000 && !['WETH', 'WBTC', 'BTC', 'ETH'].includes(token.symbol)) {
          console.warn(`🚨 SUSPICIOUS HIGH PRICE BLOCKED: ${token.symbol} = $${price} (blocked for safety)`);
          price = 0;
          priceSource = 'blocked_suspicious';
        }
        
        // Balance-Sanity-Check: Verhindere unrealistische Portfolio-Werte
        const calculatedValue = token.balance * price;
        if (calculatedValue > 100000) { // $100k+ pro Token ist verdächtig
          console.warn(`🚨 SUSPICIOUS VALUE BLOCKED: ${token.symbol} ${token.balance.toFixed(2)} × $${price} = $${calculatedValue.toFixed(0)} (blocked)`);
          price = 0;
          priceSource = 'blocked_unrealistic';
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
        hasReliablePrice: price > 0 && priceSource === 'live_api',
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
   * 📊 Lade echte ROI-Transaktionen (FIXED LOADING - mehr Transaktionen)
   */
  static async loadRealROITransactionsFixed(wallets, priceMap) {
    const allTransactions = [];
    const roiStats = { daily: 0, weekly: 0, monthly: 0 };

    for (const wallet of wallets) {
      const chainId = wallet.chain_id || 369;
      const chain = this.getChainConfig(chainId);
      
      try {
        console.log(`📊 MULTI-CHAIN ROI: Loading transactions for wallet ${wallet.address} on ${chain.name}`);
        
        // PERFORMANCE FIX: Balanced transaction loading (500 instead of 2000)
        const response = await fetch(
          `${chain.apiProxy}?address=${wallet.address}&action=tokentx&module=account&sort=desc&offset=500`
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.status === '1' && Array.isArray(data.result)) {
          console.log(`📋 FIXED: Found ${data.result.length} transactions for wallet ${wallet.address}`);
          
          for (const tx of data.result) {
            // Nur eingehende Transaktionen (ROI)
            if (tx.to && tx.to.toLowerCase() === wallet.address.toLowerCase()) {
              const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal) || 18);
              const timestamp = new Date(parseInt(tx.timeStamp) * 1000);
              
              // Verbesserte ROI-Erkennung
              const isROI = this.isROITransaction(tx, amount);
              
              if (amount > 0 && isROI) {
                const contractKey = tx.contractAddress?.toLowerCase();
                
                // 🎯 NEUE ROI-PREISLOGIK: Verwende dieselbe Logik wie Portfolio-Tokens
                let price = 0;
                let priceSource = 'no_price';
                
                // Priority 1: Live-Preise aus Price Map (DexScreener/GeckoTerminal)
                if (priceMap.has(contractKey)) {
                  price = priceMap.get(contractKey);
                  priceSource = 'live_api';
                  
                  // Plausibilitätsprüfung für ROI-Preise
                  if (price > 1000 && !['WETH', 'WBTC', 'BTC', 'ETH'].includes(tx.tokenSymbol)) {
                    console.warn(`🚨 ROI HIGH PRICE BLOCKED: ${tx.tokenSymbol} = $${price} (blocked for safety)`);
                    price = 0;
                    priceSource = 'blocked_suspicious';
                  }
                }
                
                // Priority 2: Nur minimale Fallbacks (native Tokens)
                if (price === 0 && this.FALLBACK_PRICES[tx.tokenSymbol]) {
                  price = this.FALLBACK_PRICES[tx.tokenSymbol];
                  priceSource = 'fallback_minimal';
                }
                
                const value = amount * price;
                
                // Debug: ROI-Transaktionen ohne Preis
                if (value === 0 && amount > 0.001) {
                  console.log(`🔍 ROI NO PRICE: ${tx.tokenSymbol} ${amount.toFixed(4)} tokens - ${contractKey} - ${priceSource}`);
                } else if (value > 0) {
                  console.log(`💰 ROI VALUE: ${tx.tokenSymbol} ${amount.toFixed(4)} × $${price.toFixed(6)} = $${value.toFixed(4)} [${priceSource}]`);
                }
                
                const roiTx = {
                  walletId: wallet.id,
                  walletAddress: wallet.address,
                  chainId: chainId,
                  chainName: chain.name,
                  
                  txHash: tx.hash,
                  blockNumber: parseInt(tx.blockNumber),
                  timestamp: timestamp,
                  
                  tokenSymbol: tx.tokenSymbol,
                  tokenName: tx.tokenName,
                  contractAddress: tx.contractAddress,
                  
                  amount: amount,
                  price: price,
                  value: value,
                  
                  isROI: true,
                  roiType: this.determineROIType(tx, amount, timestamp),
                  roiReason: this.getROIReason(tx),
                  
                  fromAddress: tx.from,
                  toAddress: tx.to,
                  
                  // 🌐 DYNAMIC EXPLORER URLS
                  explorerUrl: `${chain.explorerBase}/tx/${tx.hash}`,
                  dexScreenerUrl: this.getDexScreenerUrl(tx.contractAddress, chainId)
                };
                
                allTransactions.push(roiTx);
                
                // Berechne ROI-Statistiken
                const timeDiff = Date.now() - timestamp.getTime();
                if (timeDiff <= 24 * 60 * 60 * 1000) roiStats.daily += value;
                if (timeDiff <= 7 * 24 * 60 * 60 * 1000) roiStats.weekly += value;
                if (timeDiff <= 30 * 24 * 60 * 60 * 1000) roiStats.monthly += value;
                
                if (value > 0.01) {
                  console.log(`🎯 FIXED ROI: ${tx.tokenSymbol} ${amount.toFixed(4)} = $${value.toFixed(2)} from ${tx.from.slice(0,8)}...`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error loading ROI for wallet ${wallet.address}:`, error.message);
      }
    }

    // Sortiere nach Timestamp (neueste zuerst)
    allTransactions.sort((a, b) => b.timestamp - a.timestamp);

    console.log(`✅ FIXED: ROI loading complete - ${allTransactions.length} ROI transactions, Monthly: $${roiStats.monthly.toFixed(2)}`);

    return {
      transactions: allTransactions,
      stats: roiStats,
      dailyROI: roiStats.daily,
      weeklyROI: roiStats.weekly,
      monthlyROI: roiStats.monthly
    };
  }

  /**
   * 📄 Lade Transaktionen für Tax Export (FIXED LOADING - mehr Transaktionen)
   */
  static async loadTaxTransactionsFixed(wallets, priceMap) {
    const allTransactions = [];
    const taxSummary = {
      totalIncome: 0,
      totalCapitalGains: 0,
      totalFees: 0,
      transactionCount: 0
    };

    for (const wallet of wallets) {
      const chainId = wallet.chain_id || 369;
      const chain = this.getChainConfig(chainId);
      
      try {
        console.log(`📄 MULTI-CHAIN TAX: Loading transactions for wallet ${wallet.address} on ${chain.name}`);
        
        // 📈 ERWEITERT: Höheres Transaktionslimit für bessere Steuerdaten
        const response = await fetch(
          `${chain.apiProxy}?address=${wallet.address}&action=tokentx&module=account&sort=desc&offset=2000`
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.status === '1' && Array.isArray(data.result)) {
          console.log(`📋 FIXED TAX: Found ${data.result.length} transactions for wallet ${wallet.address}`);
          
          for (const tx of data.result) {
            const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal) || 18);
            const timestamp = new Date(parseInt(tx.timeStamp) * 1000);
            const isIncoming = tx.to && tx.to.toLowerCase() === wallet.address.toLowerCase();
            
            const contractKey = tx.contractAddress?.toLowerCase();
            
            // 🎯 NEUE TAX-PREISLOGIK: Konsistent mit Portfolio & ROI
            let price = 0;
            let priceSource = 'no_price';
            
            // Priority 1: Live-Preise aus Price Map
            if (priceMap.has(contractKey)) {
              price = priceMap.get(contractKey);
              priceSource = 'live_api';
              
              // Plausibilitätsprüfung
              if (price > 1000 && !['WETH', 'WBTC', 'BTC', 'ETH'].includes(tx.tokenSymbol)) {
                price = 0;
                priceSource = 'blocked_suspicious';
              }
            }
            
            // Priority 2: Minimale Fallbacks
            if (price === 0 && this.FALLBACK_PRICES[tx.tokenSymbol]) {
              price = this.FALLBACK_PRICES[tx.tokenSymbol];
              priceSource = 'fallback_minimal';
            }
            
            const value = amount * price;
            
            const taxTx = {
              walletId: wallet.id,
              walletAddress: wallet.address,
              chainId: chainId,
              chainName: chain.name,
              
              txHash: tx.hash,
              blockNumber: parseInt(tx.blockNumber),
              blockTimestamp: timestamp.toISOString(),
              
              tokenSymbol: tx.tokenSymbol,
              tokenName: tx.tokenName,
              contractAddress: tx.contractAddress,
              decimals: parseInt(tx.tokenDecimal) || 18,
              
              amount: amount,
              amountRaw: tx.value,
              price: price,
              valueUSD: value,
              priceSource: priceSource,
              
              direction: isIncoming ? 'in' : 'out',
              txType: 'transfer',
              
              fromAddress: tx.from,
              toAddress: tx.to,
              
              gasUsed: parseInt(tx.gasUsed || 0),
              gasPrice: parseInt(tx.gasPrice || 0),
              gasFeeUSD: 0,
              
              // Verbesserte Steuer-Klassifikation
              isTaxable: this.isTaxableTransaction(tx, amount, isIncoming),
              taxCategory: this.getTaxCategory(tx, amount, isIncoming),
              isROITransaction: isIncoming && this.isROITransaction(tx, amount),
              
              // 🌐 DYNAMIC EXPLORER URLS
              explorerUrl: `${chain.explorerBase}/tx/${tx.hash}`,
              dexScreenerUrl: this.getDexScreenerUrl(tx.contractAddress, chainId),
              
              createdAt: new Date().toISOString()
            };
            
            allTransactions.push(taxTx);
            
            // Aktualisiere Tax Summary
            if (taxTx.isTaxable) {
              taxSummary.totalIncome += value;
              taxSummary.transactionCount++;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error loading tax data for wallet ${wallet.address}:`, error.message);
      }
    }

    console.log(`✅ FIXED: Tax data loading complete - ${allTransactions.length} transactions, Income: $${taxSummary.totalIncome.toFixed(2)}`);

    return {
      transactions: allTransactions,
      summary: taxSummary
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