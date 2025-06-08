// 🎯 CENTRAL DATA SERVICE - Koordiniert ALLE Daten für PulseManager
// Ersetzt das Chaos von verschiedenen Services durch eine einheitliche API
// Datum: 2025-01-08 - KOMPLETTE SYSTEM-REPARATUR

import { supabase } from '@/lib/supabaseClient';

export class CentralDataService {
  
  // 🏷️ OFFIZIELLE PULSECHAIN API ENDPOINTS (verifiziert)
  static PULSECHAIN_API = 'https://api.scan.pulsechain.com/api';
  static PROXY_ENDPOINTS = {
    pulsechain: '/api/pulsechain',
    pulsewatch: '/api/pulsewatch', 
    dexscreener: '/api/dexscreener-proxy'
  };

  // 💰 ECHTE PULSECHAIN TOKEN-PREISE (aktualisiert 2025-01-08)
  static VERIFIED_PRICES = {
    // Native
    'PLS': 0.000088,
    'PLSX': 0.00002622,
    'HEX': 0.005943,
    
    // Major Tokens (User-verified)
    'DOMINANCE': 11.08,
    'REMEMBER': 7.23e-7,
    'FINVESTA': 33.76,
    'FLEXMAS': 0.40,
    'GAS': 2.74e-4,
    'MISSOR': 0.011,
    'SOIL': 0.122,
    'BEAST': 0.64,
    'FINFIRE': 5.09,
    'SAV': 0.334,
    'INC': 1.44,
    
    // Stablecoins & Major
    'DAI': 1.0,
    'USDC': 1.0,
    'USDT': 1.0,
    'WETH': 2500,
    'WBTC': 60000
  };

  /**
   * 🎯 HAUPTFUNKTION: Lade komplette Portfolio-Daten
   */
  static async loadCompletePortfolio(userId) {
    console.log(`🎯 CENTRAL SERVICE: Loading complete portfolio for user ${userId}`);
    
    try {
      // 1. Lade User Wallets
      const wallets = await this.loadUserWallets(userId);
      console.log(`📱 Loaded ${wallets.length} wallets`);

      // 2. Lade echte Token-Balances von PulseChain API 
      const tokenData = await this.loadRealTokenBalances(wallets);
      console.log(`🪙 Loaded ${tokenData.tokens.length} tokens`);

      // 3. Lade ROI-Transaktionen (echte Daten)
      const roiData = await this.loadRealROITransactions(wallets);
      console.log(`📊 Loaded ${roiData.transactions.length} ROI transactions`);

      // 4. Lade historische Transaktionen für Tax Export
      const taxData = await this.loadTaxTransactions(wallets);
      console.log(`📄 Loaded ${taxData.transactions.length} tax transactions`);

      // 5. Berechne Portfolio-Statistiken
      const portfolioStats = this.calculatePortfolioStats(tokenData, roiData);
      
      // 6. Erstelle einheitliche Datenstruktur
      const completePortfolio = {
        userId,
        timestamp: new Date().toISOString(),
        
        // Wallet Info
        wallets: wallets,
        walletCount: wallets.length,
        
        // Token Holdings
        tokens: tokenData.tokens,
        tokenCount: tokenData.tokens.length,
        totalTokenValue: tokenData.totalValue,
        
        // ROI Data
        roiTransactions: roiData.transactions,
        roiStats: roiData.stats,
        dailyROI: roiData.dailyROI,
        weeklyROI: roiData.weeklyROI,
        monthlyROI: roiData.monthlyROI,
        
        // Tax Data
        taxTransactions: taxData.transactions,
        taxSummary: taxData.summary,
        
        // Portfolio Stats
        totalValue: portfolioStats.totalValue,
        totalROI: portfolioStats.totalROI,
        portfolioChange24h: portfolioStats.change24h,
        
        // Status
        isLoaded: true,
        loadTime: Date.now()
      };

      console.log(`✅ COMPLETE PORTFOLIO LOADED: $${completePortfolio.totalValue.toFixed(2)}`);
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
   * 🪙 Lade echte Token-Balances von PulseChain API
   */
  static async loadRealTokenBalances(wallets) {
    const allTokens = [];
    let totalValue = 0;

    for (const wallet of wallets) {
      console.log(`🔍 Loading tokens for wallet: ${wallet.address}`);
      
      try {
        // Verwende PulseChain Proxy für Token-Liste
        const response = await fetch(
          `${this.PROXY_ENDPOINTS.pulsechain}?address=${wallet.address}&action=tokenlist&module=account`
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.status === '1' && Array.isArray(data.result)) {
          for (const tokenData of data.result) {
            const balance = parseFloat(tokenData.balance) / Math.pow(10, parseInt(tokenData.decimals) || 18);
            const price = this.getTokenPrice(tokenData.symbol, tokenData.contractAddress);
            const value = balance * price;
            
            // Nur Token mit Mindest-Wert
            if (value >= 0.01) {
              const token = {
                walletId: wallet.id,
                walletAddress: wallet.address,
                chainId: wallet.chain_id || 369,
                
                symbol: tokenData.symbol,
                name: tokenData.name,
                contractAddress: tokenData.contractAddress,
                decimals: parseInt(tokenData.decimals) || 18,
                
                balance: balance,
                price: price,
                value: value,
                
                // Zusätzliche Infos
                holdingRank: 0, // Wird später gesetzt
                percentageOfPortfolio: 0, // Wird später berechnet
                lastUpdated: new Date().toISOString()
              };
              
              allTokens.push(token);
              totalValue += value;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error loading tokens for wallet ${wallet.address}:`, error.message);
      }
    }

    // Sortiere nach Wert und setze Rankings
    allTokens.sort((a, b) => b.value - a.value);
    allTokens.forEach((token, index) => {
      token.holdingRank = index + 1;
      token.percentageOfPortfolio = totalValue > 0 ? (token.value / totalValue) * 100 : 0;
    });

    return {
      tokens: allTokens,
      totalValue: totalValue,
      uniqueTokens: new Set(allTokens.map(t => t.symbol)).size
    };
  }

  /**
   * 📊 Lade echte ROI-Transaktionen 
   */
  static async loadRealROITransactions(wallets) {
    const allTransactions = [];
    const roiStats = { daily: 0, weekly: 0, monthly: 0 };

    for (const wallet of wallets) {
      try {
        // Lade Token-Transfers (ROI-relevante Transaktionen)
        const response = await fetch(
          `${this.PROXY_ENDPOINTS.pulsechain}?address=${wallet.address}&action=tokentx&module=account&sort=desc&offset=100`
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.status === '1' && Array.isArray(data.result)) {
          for (const tx of data.result) {
            // Nur eingehende Transaktionen (ROI)
            if (tx.to && tx.to.toLowerCase() === wallet.address.toLowerCase()) {
              const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal) || 18);
              const price = this.getTokenPrice(tx.tokenSymbol, tx.contractAddress);
              const value = amount * price;
              const timestamp = new Date(parseInt(tx.timeStamp) * 1000);
              
              if (amount > 0) {
                const roiTx = {
                  walletId: wallet.id,
                  walletAddress: wallet.address,
                  
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
                  
                  fromAddress: tx.from,
                  toAddress: tx.to,
                  
                  explorerUrl: `https://scan.pulsechain.com/tx/${tx.hash}`,
                  dexScreenerUrl: `https://dexscreener.com/pulsechain/${tx.contractAddress}`
                };
                
                allTransactions.push(roiTx);
                
                // Berechne ROI-Statistiken
                const timeDiff = Date.now() - timestamp.getTime();
                if (timeDiff <= 24 * 60 * 60 * 1000) roiStats.daily += value;
                if (timeDiff <= 7 * 24 * 60 * 60 * 1000) roiStats.weekly += value;
                if (timeDiff <= 30 * 24 * 60 * 60 * 1000) roiStats.monthly += value;
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

    return {
      transactions: allTransactions,
      stats: roiStats,
      dailyROI: roiStats.daily,
      weeklyROI: roiStats.weekly,
      monthlyROI: roiStats.monthly
    };
  }

  /**
   * 📄 Lade Transaktionen für Tax Export
   */
  static async loadTaxTransactions(wallets) {
    const allTransactions = [];
    const taxSummary = {
      totalIncome: 0,
      totalCapitalGains: 0,
      totalFees: 0,
      transactionCount: 0
    };

    for (const wallet of wallets) {
      try {
        // Lade alle Token-Transaktionen für Steuer
        const response = await fetch(
          `${this.PROXY_ENDPOINTS.pulsechain}?address=${wallet.address}&action=tokentx&module=account&sort=desc&offset=1000`
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.status === '1' && Array.isArray(data.result)) {
          for (const tx of data.result) {
            const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal) || 18);
            const price = this.getTokenPrice(tx.tokenSymbol, tx.contractAddress);
            const value = amount * price;
            const timestamp = new Date(parseInt(tx.timeStamp) * 1000);
            const isIncoming = tx.to && tx.to.toLowerCase() === wallet.address.toLowerCase();
            
            const taxTx = {
              walletId: wallet.id,
              walletAddress: wallet.address,
              
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
              
              direction: isIncoming ? 'in' : 'out',
              txType: 'transfer',
              
              fromAddress: tx.from,
              toAddress: tx.to,
              
              gasUsed: parseInt(tx.gasUsed || 0),
              gasPrice: parseInt(tx.gasPrice || 0),
              gasFeeUSD: 0, // Berechne falls nötig
              
              // Steuer-Klassifikation
              isTaxable: isIncoming && amount > 0,
              taxCategory: isIncoming ? 'income' : 'transfer',
              isROITransaction: isIncoming && amount > 0,
              
              explorerUrl: `https://scan.pulsechain.com/tx/${tx.hash}`,
              dexScreenerUrl: `https://dexscreener.com/pulsechain/${tx.contractAddress}`,
              
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

    return {
      transactions: allTransactions,
      summary: taxSummary
    };
  }

  /**
   * 💰 Hole Token-Preis (verifizierte Preise zuerst)
   */
  static getTokenPrice(symbol, contractAddress) {
    // 1. Verifizierte Preise verwenden
    if (this.VERIFIED_PRICES[symbol]) {
      return this.VERIFIED_PRICES[symbol];
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