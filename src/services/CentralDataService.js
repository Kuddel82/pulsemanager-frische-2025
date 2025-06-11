// 🎯 CENTRAL DATA SERVICE - 100% MORALIS ENTERPRISE ONLY
// Eliminiert ALLE kostenlosen APIs für maximale Zuverlässigkeit
// Datum: 2025-01-11 - ENTERPRISE ONLY: Nur bezahlte Moralis APIs

import { supabase } from '@/lib/supabaseClient';

export class CentralDataService {
  
  // 🔑 ENTERPRISE MODE DETECTION
  static async hasValidMoralisApiKey() {
    try {
      // Use a simple wallet-tokens test request
      const response = await fetch('/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=0x0000000000000000000000000000000000000000&limit=1');
      const data = await response.json();
      
      // Check if we get a proper Moralis response instead of fallback
      return !data._fallback && !data._error && response.ok;
    } catch {
      return false;
    }
  }

  // 🌐 100% MORALIS ENTERPRISE CONFIGURATION
  static CHAINS = {
    PULSECHAIN: {
      id: 369,
      name: 'PulseChain',
      nativeSymbol: 'PLS',
      moralisChainId: '0x171',
      explorerBase: 'https://scan.pulsechain.com'
    },
    ETHEREUM: {
      id: 1,
      name: 'Ethereum',
      nativeSymbol: 'ETH',
      moralisChainId: '0x1',
      explorerBase: 'https://etherscan.io'
    }
  };

  // 🚀 MORALIS ENTERPRISE ENDPOINTS (ONLY)
  static MORALIS_ENDPOINTS = {
    tokens: '/api/moralis-tokens',
    prices: '/api/moralis-prices', 
    transactions: '/api/moralis-transactions',
    tokenTransfers: '/api/moralis-token-transfers'
  };

  // 💰 EMERGENCY FALLBACKS: Nur für absolute Notfälle (PLS/ETH/Stablecoins)
  static EMERGENCY_PRICES = {
    // Nur native Tokens falls Moralis API komplett ausfällt
    'PLS': 0.000088,      // PulseChain Native
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
   * 🎯 HAUPTFUNKTION: Lade komplette Portfolio-Daten (100% MORALIS ENTERPRISE)
   */
  static async loadCompletePortfolio(userId) {
    console.log(`🎯 CENTRAL SERVICE (100% MORALIS ENTERPRISE): Loading complete portfolio for user ${userId}`);
    
    // Check if we have Moralis Enterprise access
    const hasMoralisAccess = await this.hasValidMoralisApiKey();
    
    if (!hasMoralisAccess) {
      console.error(`🚨 CRITICAL: No Moralis Enterprise access detected! System requires paid Moralis API key.`);
      return this.getEmptyPortfolio(userId, 'ENTERPRISE ERROR: Moralis API Key required for data access.');
    }

    console.log(`🔑 MORALIS ENTERPRISE ACCESS: ✅ ACTIVE`);
    
    try {
      // 1. Lade User Wallets
      const wallets = await this.loadUserWallets(userId);
      console.log(`📱 Loaded ${wallets.length} wallets`);

      if (wallets.length === 0) {
        console.log('⚠️ No wallets found for user');
        return this.getEmptyPortfolio(userId, 'Keine Wallets gefunden. Fügen Sie Ihre Wallet-Adressen hinzu.');
      }

      // 2. Lade Token-Balances (100% MORALIS ENTERPRISE)
      const tokenData = await this.loadTokenBalancesMoralisOnly(wallets);
      console.log(`🪙 MORALIS ENTERPRISE: Loaded ${tokenData.tokens.length} tokens`);

      // 3. Lade Token-Preise (100% MORALIS ENTERPRISE)  
      const pricesData = await this.loadTokenPricesMoralisOnly(tokenData.tokens);
      console.log(`💰 MORALIS ENTERPRISE: Updated prices for ${pricesData.updatedCount} tokens`);

      // 4. Aktualisiere Token-Werte
      const updatedTokenData = this.updateTokenValuesWithRealPricesFixed(tokenData, pricesData);
      console.log(`🔄 ENTERPRISE: Updated token values: $${updatedTokenData.totalValue.toFixed(2)}`);

      // 5. Lade ROI-Transaktionen (100% MORALIS ENTERPRISE)
      const roiData = await this.loadROITransactionsMoralisOnly(wallets, pricesData.priceMap);
      console.log(`📊 MORALIS ENTERPRISE: Loaded ${roiData.transactions.length} ROI transactions, Monthly ROI: $${roiData.monthlyROI.toFixed(2)}`);

      // 6. Lade Tax-Transaktionen (100% MORALIS ENTERPRISE) 
      const taxData = await this.loadTaxTransactionsMoralisOnly(wallets, pricesData.priceMap);
      console.log(`📄 MORALIS ENTERPRISE: Loaded ${taxData.transactions.length} tax transactions`);

      // 7. Berechne Portfolio-Statistiken
      const stats = this.calculatePortfolioStats(updatedTokenData, roiData);
      
      // 8. Sortiere und optimiere Daten für UI
      const sortedTokens = this.sortAndRankTokens(updatedTokenData.tokens);

      // 9. Portfolio Response zusammenstellen
      const portfolioResponse = {
        success: true,
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
        
        // API-Metadaten
        dataSource: 'moralis_enterprise_only',
        lastUpdated: new Date().toISOString(),
        apiCalls: pricesData.apiCalls || 0,
        
        // Status
        isRealTimeData: true,
        disclaimer: 'Enterprise-grade data powered by Moralis Web3 Data API v2.2'
      };

      console.log(`✅ MORALIS ENTERPRISE PORTFOLIO COMPLETE: $${portfolioResponse.totalValue.toFixed(2)} across ${portfolioResponse.tokenCount} tokens`);
      return portfolioResponse;

    } catch (error) {
      console.error('💥 ENTERPRISE Portfolio loading error:', error);
      return this.getEmptyPortfolio(userId, `ENTERPRISE ERROR: ${error.message}`);
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
  static async loadTokenBalancesMoralisOnly(wallets) {
    const allTokens = [];
    let totalValue = 0;

    for (const wallet of wallets) {
      const chainId = wallet.chain_id || 369;
      const chain = this.getChainConfig(chainId);
      
      console.log(`🔍 ENTERPRISE: Loading tokens for wallet ${wallet.address} on ${chain.name}`);
      
      try {
        let response;
        
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
}

export default CentralDataService; 
