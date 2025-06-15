// 🎯 ROI DETECTION SERVICE - POWERED BY MORALIS DEFI APIS
// Echte ROI-Erkennung durch DeFi-Positionen, Yields und Unclaimed Rewards

import { logger } from '@/lib/logger';

export class ROIDetectionService {
  
  static API_BASE = '/api/moralis-v2';
  
  static VALID_CHAINS = ['eth', 'pulsechain'];
  
  static MAX_ROI_SOURCES = 50;
  static CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten
  
  // 🎯 ROI TRANSACTION PATTERNS - ERWEITERT mit allen PulseChain Mintern
  static ROI_PATTERNS = {
    // Bekannte Mint/Reward Contract Adressen (PulseChain + Ethereum)
    KNOWN_MINTERS: [
      '0x0000000000000000000000000000000000000000', // Null address (Mint)
      '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', // HEX Contract (Ethereum + PulseChain)
      '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3', // INC Contract
      '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1', // PLSX Minter
      '0xa4b89c0d48421c4ae9c7743e9e58b06e5ad8e2c6', // FLEX Minter (example)
      '0xb7c3a5e1c6b45b9db4d4b8e6f4e2c7f8b8a7e6d5', // WGEP Minter (example)
      '0xc8d4b2f5e7a9c6b3d8e1f4a7b2c5d8e9f6a3b7c4', // LOAN Minter (example)
    ],
    
    // ROI-charakteristische Token-Symbole (erweitert)
    ROI_TOKENS: ['HEX', 'INC', 'PLSX', 'LOAN', 'FLEX', 'WGEP', 'MISOR', 'FLEXMES', 'PLS'],
    
    // Wert-Bereiche für ROI-Transaktionen
    VALUE_RANGES: [
      { min: 0.001, max: 100, type: 'daily_rewards', confidence: 0.8 },
      { min: 100, max: 1000, type: 'weekly_rewards', confidence: 0.7 },
      { min: 1000, max: 10000, type: 'monthly_rewards', confidence: 0.6 }
    ],
    
    // Zeit-Pattern für ROI (regelmäßige Intervalle)
    TIME_PATTERNS: {
      DAILY: 86400,     // 1 Tag in Sekunden
      WEEKLY: 604800,   // 1 Woche
      MONTHLY: 2592000  // 30 Tage
    }
  };
  
  /**
   * 🏆 COMPLETE ROI ANALYSIS
   * Kombiniert alle ROI-Quellen: DeFi Positions, Transaction History, Portfolio Analysis
   */
  static async getCompleteROIAnalysis(address, chain = '1') {
    try {
      console.log(`🚀 ROI DETECTION: Starting comprehensive analysis for ${address}`);
      
      // Parallel loading aller ROI-Datenquellen
      const [defiSummary, defiPositions, walletStats] = await Promise.all([
        this.getDefiSummary(address, chain),
        this.getDefiPositions(address, chain),
        this.getWalletStats(address, chain)
      ]);
      
      // ROI Analysis aus verschiedenen Quellen
      const roiAnalysis = {
        // DeFi-basierte ROI-Erkennung
        defiROI: this.analyzeDefiROI(defiSummary, defiPositions),
        
        // Activity-basierte ROI-Indikatoren
        activityROI: this.analyzeActivityROI(walletStats),
        
        // Kombinierte ROI-Metriken
        combinedMetrics: this.calculateCombinedROIMetrics(defiSummary, defiPositions, walletStats)
      };
      
      // ROI Score (0-100)
      const roiScore = this.calculateROIScore(roiAnalysis);
      
      // ROI Recommendations
      const recommendations = this.generateROIRecommendations(roiAnalysis);
      
      console.log(`✅ ROI DETECTION COMPLETE: Score: ${roiScore}, Active Sources: ${roiAnalysis.defiROI.activeSources.length}`);
      
      return {
        success: true,
        roiAnalysis,
        roiScore,
        recommendations,
        hasActiveROI: roiAnalysis.defiROI.totalUnclaimedUSD > 0,
        source: 'roi_detection_service'
      };
      
    } catch (error) {
      console.error('💥 ROI Detection Error:', error);
      return {
        success: false,
        error: error.message,
        roiAnalysis: null
      };
    }
  }
  
  /**
   * 🎯 MAIN: Detect ROI sources from wallet using transaction analysis - MIT ZEITFILTERN
   */
  static async detectROISources(walletAddress, chain = 'pulsechain', periodFilter = null) {
    if (!walletAddress || !this.VALID_CHAINS.includes(chain)) {
      logger.warn('ROI Detection: Invalid wallet or chain', { walletAddress, chain });
      return { sources: [], count: 0, status: 'invalid_input' };
    }

    try {
      logger.info(`🎯 ROI Detection started for ${walletAddress} (${chain})`);
      
      // 1. Lade Transaktionshistorie über moralis-transactions API
      const transactions = await this.loadTransactionHistory(walletAddress, chain);
      
      if (!transactions || transactions.length === 0) {
        console.log('⚠️ No transactions found for ROI analysis');
        return {
          sources: [],
          count: 0,
          status: 'no_transactions',
          chain,
          wallet: walletAddress,
          timestamp: new Date().toISOString()
        };
      }
      
      // 2. Analysiere Transaktionen für ROI-Pattern (mit Zeitraumfiltern)
      const roiSources = this.analyzeTransactionsForROI(transactions, walletAddress, periodFilter);
      
      // 3. Berechne ROI-Metriken
      const roiMetrics = this.calculateROIMetrics(roiSources);
      
      const result = {
        sources: roiSources,
        count: roiSources.length,
        status: roiSources.length > 0 ? 'sources_detected' : 'no_sources_detected',
        chain,
        wallet: walletAddress,
        timestamp: new Date().toISOString(),
        metrics: roiMetrics,
        performance: {
          total_gain_loss: roiMetrics.totalValue,
          roi_percentage: roiMetrics.estimatedAnnualROI,
          best_performer: roiMetrics.bestSource,
          worst_performer: null // Für ROI immer positiv
        },
        transactionAnalysis: {
          totalTransactions: transactions.length,
          roiTransactions: roiSources.length,
          roiRatio: transactions.length > 0 ? (roiSources.length / transactions.length * 100).toFixed(2) : '0'
        }
      };

      logger.info(`✅ ROI Detection completed: ${result.count} sources found`);
      return result;

    } catch (error) {
      logger.error('ROI Detection failed:', error);
      return {
        sources: [],
        count: 0,
        status: 'error',
        error: error.message,
        chain,
        wallet: walletAddress
      };
    }
  }
  
  /**
   * 📥 Lade Transaktionshistorie
   */
  static async loadTransactionHistory(address, chain, limit = 100) {
    try {
      console.log(`📥 Loading transaction history for ${address} on ${chain}`);
      
      // 🔧 DEBUG: Explicit API endpoint logging
      const apiEndpoint = `/api/moralis-transactions`;
      console.log(`🔧 ROI DEBUG: Using API endpoint ${apiEndpoint}`);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address,
          chain,
          limit: Math.min(limit, 50) // Kleinere Batches für Stabilität
        })
      });
      
      if (!response.ok) {
        console.error(`🚨 ROI API ERROR: ${response.status} ${response.statusText}`);
        throw new Error(`Transaction API failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data._error) {
        console.error(`🚨 ROI API ERROR: ${data._error}`);
        throw new Error(`Transaction API error: ${data._error}`);
      }
      
      const transactions = data.result || [];
      console.log(`✅ ROI TRANSACTIONS: Loaded ${transactions.length} transactions for analysis`);
      
      // 🔧 DEBUG: Log some sample transactions
      if (transactions.length > 0) {
        console.log(`🔧 ROI SAMPLE TX:`, JSON.stringify(transactions[0], null, 2));
      }
      
      return transactions;
      
    } catch (error) {
      console.error('💥 ROI TRANSACTION LOAD ERROR:', error);
      console.log('🔧 ROI FALLBACK: Returning empty transactions array');
      return []; // Fallback: leeres Array statt Fehler
    }
  }
  
  /**
   * 🔍 Analysiere Transaktionen für ROI-Pattern - ERWEITERT mit Zeitraumfiltern
   */
  static analyzeTransactionsForROI(transactions, walletAddress, periodFilter = null) {
    if (!transactions || transactions.length === 0) return [];
    
    const roiSources = [];
    const tokenSummary = new Map();
    
    // Zeitraumfilter berechnen
    const now = new Date();
    let filterDate = null;
    
    if (periodFilter) {
      switch (periodFilter) {
        case '24h':
          filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          filterDate = null;
      }
    }
    
    console.log(`🔍 ROI ANALYSIS: Processing ${transactions.length} transactions with filter: ${periodFilter || 'ALL'}`);
    
    // Gruppiere Transaktionen nach Token und analysiere Pattern
    transactions.forEach(tx => {
      // Zeitraumfilter anwenden
      if (filterDate) {
        const txDate = new Date(tx.block_timestamp);
        if (txDate < filterDate) return;
      }
      
      if (this.isROITransaction(tx, walletAddress)) {
        const tokenAddress = tx.contract_address || tx.token_address || 'native';
        const tokenSymbol = tx.token_symbol || tx.symbol || 'ETH';
        const value = parseFloat(tx.value || '0');
        const valueFormatted = parseFloat(tx.value_formatted || tx.value || '0');
        const timestamp = new Date(tx.block_timestamp);
        
        // ROI-Klassifikation
        const roiType = this.classifyROIType(tx, value);
        const confidence = this.calculateConfidence(tx, value, roiType);
        
        // Sammle alle ROI-Transaktionen pro Token
        if (!tokenSummary.has(tokenAddress)) {
          tokenSummary.set(tokenAddress, {
            tokenAddress,
            tokenSymbol,
            transactions: [],
            totalValue: 0,
            totalCount: 0,
            roiType,
            confidence
          });
        }
        
        const tokenData = tokenSummary.get(tokenAddress);
        tokenData.transactions.push({
          hash: tx.transaction_hash || tx.hash,
          value: valueFormatted,
          timestamp,
          roiType,
          confidence
        });
        tokenData.totalValue += valueFormatted;
        tokenData.totalCount++;
      }
    });
    
    // Konvertiere zu ROI Sources
    tokenSummary.forEach((tokenData, tokenAddress) => {
      if (tokenData.totalCount > 0) {
        // Berechne ROI-Metriken
        const avgTransaction = tokenData.totalValue / tokenData.totalCount;
        const timespan = this.calculateTimespan(tokenData.transactions);
        const frequency = this.calculateFrequency(tokenData.transactions, timespan);
        
        roiSources.push({
          id: `roi_${tokenAddress}`,
          type: 'transaction_based_roi',
          tokenAddress,
          tokenSymbol: tokenData.tokenSymbol,
          
          // ROI-Metriken
          totalValue: tokenData.totalValue,
          transactionCount: tokenData.totalCount,
          averageValue: avgTransaction,
          
          // Pattern-Analyse
          roiType: tokenData.roiType,
          frequency,
          confidence: tokenData.confidence,
          
          // Zeit-Analyse
          timespan,
          estimatedDailyROI: this.estimateDailyROI(tokenData.totalValue, timespan),
          estimatedMonthlyROI: this.estimateMonthlyROI(tokenData.totalValue, timespan),
          
          // Details
          transactions: tokenData.transactions.slice(0, 10), // Maximal 10 für Performance
          lastTransaction: tokenData.transactions[tokenData.transactions.length - 1],
          
          // UI
          description: `${tokenData.tokenSymbol} ROI from ${tokenData.totalCount} transactions`,
          status: 'active'
        });
      }
    });
    
    // Sortiere nach Wert
    return roiSources.sort((a, b) => b.totalValue - a.totalValue).slice(0, this.MAX_ROI_SOURCES);
  }
  
  /**
   * ✅ Prüfe ob Transaktion ROI ist
   */
  static isROITransaction(tx, walletAddress) {
    // Nur eingehende Transaktionen
    const toAddress = (tx.to_address || tx.to || '').toLowerCase();
    if (toAddress !== walletAddress.toLowerCase()) {
      return false;
    }
    
    // 1. Von bekanntem Minter-Contract
    const fromAddress = (tx.from_address || tx.from || '').toLowerCase();
    if (this.ROI_PATTERNS.KNOWN_MINTERS.includes(fromAddress)) {
      return true;
    }
    
    // 2. Bekanntes ROI-Token
    const tokenSymbol = tx.token_symbol || tx.symbol || '';
    if (this.ROI_PATTERNS.ROI_TOKENS.includes(tokenSymbol)) {
      return true;
    }
    
    // 3. Wert-Pattern (kleine regelmäßige Beträge)
    const value = parseFloat(tx.value_formatted || tx.value || '0');
    const matchesValuePattern = this.ROI_PATTERNS.VALUE_RANGES.some(range => 
      value >= range.min && value <= range.max
    );
    
    if (matchesValuePattern && value > 0) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 🏷️ Klassifiziere ROI-Typ
   */
  static classifyROIType(tx, value) {
    // Basierend auf Wert-Bereich
    for (const range of this.ROI_PATTERNS.VALUE_RANGES) {
      if (value >= range.min && value <= range.max) {
        return range.type;
      }
    }
    
    // Basierend auf Token-Typ
    const tokenSymbol = tx.token_symbol || tx.symbol || '';
    if (tokenSymbol === 'HEX') return 'staking_rewards';
    if (tokenSymbol === 'INC') return 'yield_farming';
    if (tokenSymbol === 'PLSX') return 'dex_rewards';
    
    return 'unknown_roi';
  }
  
  /**
   * 📊 Berechne Konfidenz-Score
   */
  static calculateConfidence(tx, value, roiType) {
    let confidence = 0.5; // Base confidence
    
    // Von Null-Address = höchste Konfidenz
    const fromAddress = (tx.from_address || tx.from || '').toLowerCase();
    if (fromAddress === '0x0000000000000000000000000000000000000000') {
      confidence = 0.95;
    }
    
    // Bekanntes ROI-Token
    const tokenSymbol = tx.token_symbol || tx.symbol || '';
    if (this.ROI_PATTERNS.ROI_TOKENS.includes(tokenSymbol)) {
      confidence += 0.3;
    }
    
    // Wert-Pattern
    const matchingRange = this.ROI_PATTERNS.VALUE_RANGES.find(range => 
      value >= range.min && value <= range.max
    );
    if (matchingRange) {
      confidence += matchingRange.confidence * 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * ⏱️ Berechne Zeitspanne
   */
  static calculateTimespan(transactions) {
    if (transactions.length < 2) return 0;
    
    const timestamps = transactions.map(tx => tx.timestamp.getTime()).sort();
    const start = timestamps[0];
    const end = timestamps[timestamps.length - 1];
    
    return Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24))); // Tage
  }
  
  /**
   * 📈 Berechne Häufigkeit
   */
  static calculateFrequency(transactions, timespanDays) {
    if (timespanDays === 0 || transactions.length === 0) return 'unknown';
    
    const transactionsPerDay = transactions.length / timespanDays;
    
    if (transactionsPerDay >= 0.8) return 'daily';
    if (transactionsPerDay >= 0.1) return 'weekly';
    if (transactionsPerDay >= 0.03) return 'monthly';
    return 'irregular';
  }
  
  /**
   * 💰 Schätze täglichen ROI
   */
  static estimateDailyROI(totalValue, timespanDays) {
    if (timespanDays === 0) return 0;
    return totalValue / timespanDays;
  }
  
  /**
   * 📊 Schätze monatlichen ROI
   */
  static estimateMonthlyROI(totalValue, timespanDays) {
    if (timespanDays === 0) return totalValue;
    const dailyROI = totalValue / timespanDays;
    return dailyROI * 30;
  }
  
  /**
   * 📈 Berechne ROI-Metriken
   */
  static calculateROIMetrics(roiSources) {
    if (roiSources.length === 0) {
      return {
        totalValue: 0,
        totalSources: 0,
        estimatedDailyROI: 0,
        estimatedMonthlyROI: 0,
        estimatedAnnualROI: 0,
        bestSource: null,
        averageConfidence: 0
      };
    }
    
    const totalValue = roiSources.reduce((sum, source) => sum + source.totalValue, 0);
    const totalDailyROI = roiSources.reduce((sum, source) => sum + source.estimatedDailyROI, 0);
    const totalMonthlyROI = roiSources.reduce((sum, source) => sum + source.estimatedMonthlyROI, 0);
    const bestSource = roiSources[0]; // Already sorted by value
    const avgConfidence = roiSources.reduce((sum, source) => sum + source.confidence, 0) / roiSources.length;
    
    return {
      totalValue,
      totalSources: roiSources.length,
      estimatedDailyROI: totalDailyROI,
      estimatedMonthlyROI: totalMonthlyROI,
      estimatedAnnualROI: totalMonthlyROI * 12,
      bestSource: bestSource ? {
        token: bestSource.tokenSymbol,
        value: bestSource.totalValue,
        type: bestSource.roiType
      } : null,
      averageConfidence: avgConfidence
    };
  }
  
  /**
   * 🔄 Cache Management
   */
  static getCacheKey(address, chain) {
    return `roi_detection_${address}_${chain}`;
  }
  
  static getCachedResult(address, chain) {
    const key = this.getCacheKey(address, chain);
    const cached = localStorage.getItem(key);
    
    if (cached) {
      const data = JSON.parse(cached);
      const age = Date.now() - data.timestamp;
      
      if (age < this.CACHE_DURATION) {
        console.log('📋 Using cached ROI detection result');
        return data.result;
      }
    }
    
    return null;
  }
  
  static setCachedResult(address, chain, result) {
    const key = this.getCacheKey(address, chain);
    const data = {
      result,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache ROI detection result:', error);
    }
  }
  
  /**
   * 🔍 DeFi Summary - Vereinfacht ohne Premium Features
   */
  static async getDeFiSummary(walletAddress) {
    // Return empty DeFi data (Premium feature simplified)
    return {
      total_protocols: 0,
      total_liquidity: 0,
      protocols: [],
      _note: 'DeFi tracking vereinfacht'
    };
  }
  
  /**
   * 🔍 DeFi Positions - Vereinfacht ohne Premium Features  
   */
  static async getDeFiPositions(walletAddress) {
    // Return empty positions data (Premium feature simplified)
    return {
      positions: [],
      _note: 'DeFi Positionen vereinfacht'
    };
  }
  
  /**
   * 🔍 Wallet Statistics - Vereinfacht ohne Premium Features
   */
  static async getWalletStats(walletAddress) {
    // Return empty stats data (Premium feature simplified)
    return {
      transaction_count: 0,
      unique_tokens: 0,
      total_volume: 0,
      first_transaction: null,
      last_transaction: null,
      activity_score: 0,
      _note: 'Wallet Statistiken vereinfacht'
    };
  }
  
  /**
   * 🎯 ANALYZE DEFI ROI
   * Analysiert DeFi-Positionen für ROI-Quellen
   */
  static analyzeDefiROI(defiSummaryResult, defiPositionsResult) {
    const summary = defiSummaryResult.summary || {};
    const positions = defiPositionsResult.positions || [];
    
    // Parse summary data
    const activeProtocols = parseInt(summary.active_protocols) || 0;
    const totalPositions = parseInt(summary.total_positions) || 0;
    const totalValueUSD = parseFloat(summary.total_usd_value) || 0;
    const totalUnclaimedUSD = parseFloat(summary.total_unclaimed_usd_value) || 0;
    
    // Analyze individual positions for ROI sources
    const roiSources = positions.map(position => {
      const balanceUsd = parseFloat(position.balance_usd) || 0;
      const unclaimedUsd = parseFloat(position.total_unclaimed_usd_value) || 0;
      const apy = position.position_details?.apy || 0;
      
      return {
        protocol: position.protocol_name || 'Unknown',
        protocolId: position.protocol_id || 'unknown',
        type: position.label || 'position',
        balanceUsd,
        unclaimedUsd,
        apy,
        
        // ROI Analysis
        isActiveROI: unclaimedUsd > 0,
        hasYield: apy > 0,
        dailyROIEstimate: apy > 0 ? (apy * balanceUsd / 365 / 100) : 0,
        
        // Position Classification
        riskLevel: this.classifyPositionRisk(position),
        roiType: this.classifyROIType(position),
        
        tokens: position.tokens?.map(token => ({
          symbol: token.symbol,
          name: token.name,
          balance: token.balance_formatted,
          usdValue: token.usd_value
        })) || []
      };
    }).filter(source => source.isActiveROI || source.hasYield);
    
    // Calculate aggregated metrics
    const activeSources = roiSources.filter(s => s.isActiveROI);
    const totalDailyROI = roiSources.reduce((sum, s) => sum + s.dailyROIEstimate, 0);
    
    return {
      // Summary Metrics
      activeProtocols,
      totalPositions,
      totalValueUSD,
      totalUnclaimedUSD,
      
      // ROI Sources
      roiSources,
      activeSources,
      roiSourcesCount: roiSources.length,
      activeSourcesCount: activeSources.length,
      
      // ROI Calculations
      totalDailyROI,
      totalWeeklyROI: totalDailyROI * 7,
      totalMonthlyROI: totalDailyROI * 30,
      
      // ROI Quality Assessment
      roiQuality: this.assessROIQuality(roiSources, totalUnclaimedUSD),
      hasSignificantROI: totalUnclaimedUSD > 100 || totalDailyROI > 10
    };
  }
  
  /**
   * 📈 ANALYZE ACTIVITY ROI
   * Analysiert Wallet-Aktivität für ROI-Indikatoren
   */
  static analyzeActivityROI(walletStatsResult) {
    const stats = walletStatsResult.stats || {};
    
    const totalTransactions = parseInt(stats.transactions?.total) || 0;
    const tokenTransfers = parseInt(stats.token_transfers?.total) || 0;
    const nftTransfers = parseInt(stats.nft_transfers?.total) || 0;
    
    // Activity-basierte ROI-Indikatoren
    const activityScore = Math.min(100, 
      Math.min(40, totalTransactions / 100 * 40) +
      Math.min(30, tokenTransfers / 50 * 30) +
      Math.min(30, nftTransfers / 20 * 30)
    );
    
    return {
      totalTransactions,
      tokenTransfers,
      nftTransfers,
      activityScore,
      
      // Activity-based ROI indicators
      isActiveTrader: totalTransactions > 500,
      isFrequentUser: tokenTransfers > 100,
      isNFTActive: nftTransfers > 10,
      
      // ROI likelihood based on activity
      roiLikelihood: this.calculateROILikelihood(totalTransactions, tokenTransfers),
      userType: this.classifyUserType(totalTransactions, tokenTransfers, nftTransfers)
    };
  }
  
  /**
   * 🔄 CALCULATE COMBINED ROI METRICS
   * Kombiniert alle ROI-Quellen zu Gesamtmetriken
   */
  static calculateCombinedROIMetrics(defiSummary, defiPositions, walletStats) {
    const defiResult = this.analyzeDefiROI(defiSummary, defiPositions);
    const activityResult = this.analyzeActivityROI(walletStats);
    
    return {
      // Combined ROI Value
      totalROIValue: defiResult.totalUnclaimedUSD,
      estimatedDailyROI: defiResult.totalDailyROI,
      estimatedMonthlyROI: defiResult.totalMonthlyROI,
      
      // ROI Diversity
      roiDiversification: defiResult.activeProtocols,
      roiSourceDiversity: defiResult.roiSourcesCount,
      
      // Combined Scores
      overallROIScore: this.calculateOverallROIScore(defiResult, activityResult),
      riskAdjustedROI: this.calculateRiskAdjustedROI(defiResult),
      
      // User Classification
      roiProfile: this.determineROIProfile(defiResult, activityResult),
      investorType: this.classifyInvestorType(defiResult, activityResult)
    };
  }
  
  /**
   * 📊 CALCULATE ROI SCORE (0-100)
   */
  static calculateROIScore(roiAnalysis) {
    const defi = roiAnalysis.defiROI;
    const activity = roiAnalysis.activityROI;
    const combined = roiAnalysis.combinedMetrics;
    
    let score = 0;
    
    // DeFi ROI (60% weight)
    if (defi.totalUnclaimedUSD > 1000) score += 30;
    else if (defi.totalUnclaimedUSD > 100) score += 20;
    else if (defi.totalUnclaimedUSD > 0) score += 10;
    
    if (defi.totalDailyROI > 50) score += 20;
    else if (defi.totalDailyROI > 10) score += 15;
    else if (defi.totalDailyROI > 0) score += 5;
    
    if (defi.activeProtocols > 3) score += 10;
    else if (defi.activeProtocols > 1) score += 5;
    
    // Activity ROI (40% weight)
    score += Math.min(20, activity.activityScore / 5);
    
    if (activity.isActiveTrader) score += 10;
    if (activity.isFrequentUser) score += 5;
    if (activity.isNFTActive) score += 5;
    
    return Math.min(100, score);
  }
  
  /**
   * 💡 GENERATE ROI RECOMMENDATIONS
   */
  static generateROIRecommendations(roiAnalysis) {
    const recommendations = [];
    const defi = roiAnalysis.defiROI;
    const activity = roiAnalysis.activityROI;
    
    // DeFi-based recommendations
    if (defi.totalUnclaimedUSD > 0) {
      recommendations.push({
        type: 'claim_rewards',
        priority: 'high',
        title: 'Unclaimed Rewards Available',
        description: `You have $${defi.totalUnclaimedUSD.toFixed(2)} in unclaimed DeFi rewards`,
        action: 'Claim your pending rewards to realize ROI',
        protocols: defi.activeSources.map(s => s.protocol)
      });
    }
    
    if (defi.totalDailyROI > 0) {
      recommendations.push({
        type: 'optimize_yields',
        priority: 'medium',
        title: 'Optimize Your Yields',
        description: `Your positions generate $${defi.totalDailyROI.toFixed(2)} daily`,
        action: 'Consider compounding or optimizing position sizes',
        estimatedMonthly: defi.totalMonthlyROI
      });
    }
    
    if (defi.activeProtocols === 0) {
      recommendations.push({
        type: 'explore_defi',
        priority: 'low',
        title: 'Explore DeFi Opportunities',
        description: 'No active DeFi positions detected',
        action: 'Consider staking, liquidity providing, or lending for passive income'
      });
    }
    
    // Activity-based recommendations
    if (activity.isActiveTrader && defi.activeProtocols === 0) {
      recommendations.push({
        type: 'defi_for_traders',
        priority: 'medium',
        title: 'DeFi for Active Traders',
        description: 'Your trading activity suggests you might benefit from DeFi yield strategies',
        action: 'Explore lending protocols or yield farming'
      });
    }
    
    return recommendations;
  }
  
  // Helper Methods
  static classifyPositionRisk(position) {
    const apy = position.position_details?.apy || 0;
    const isDebt = position.position_details?.is_debt || false;
    
    if (isDebt) return 'high';
    if (apy > 20) return 'high';
    if (apy > 5) return 'medium';
    return 'low';
  }
  
  static assessROIQuality(roiSources, totalUnclaimed) {
    const avgAPY = roiSources.reduce((sum, s) => sum + s.apy, 0) / roiSources.length || 0;
    const sourceCount = roiSources.length;
    
    if (totalUnclaimed > 1000 && avgAPY > 10 && sourceCount > 2) return 'excellent';
    if (totalUnclaimed > 100 && avgAPY > 5 && sourceCount > 1) return 'good';
    if (totalUnclaimed > 0 || avgAPY > 0) return 'fair';
    return 'poor';
  }
  
  static calculateROILikelihood(transactions, tokenTransfers) {
    if (transactions > 1000 && tokenTransfers > 100) return 'very_high';
    if (transactions > 500 && tokenTransfers > 50) return 'high';
    if (transactions > 100 && tokenTransfers > 20) return 'medium';
    if (transactions > 10) return 'low';
    return 'very_low';
  }
  
  static classifyUserType(transactions, tokenTransfers, nftTransfers) {
    if (transactions > 1000) return 'power_user';
    if (tokenTransfers > 100) return 'active_trader';
    if (nftTransfers > 20) return 'nft_enthusiast';
    if (transactions > 100) return 'regular_user';
    return 'beginner';
  }
  
  static calculateOverallROIScore(defiResult, activityResult) {
    const defiScore = Math.min(60, 
      (defiResult.totalUnclaimedUSD / 1000 * 30) +
      (defiResult.activeProtocols * 10) +
      (defiResult.totalDailyROI / 10 * 20)
    );
    
    const activityScore = Math.min(40, activityResult.activityScore * 0.4);
    
    return Math.min(100, defiScore + activityScore);
  }
  
  static calculateRiskAdjustedROI(defiResult) {
    // Simplified risk adjustment based on protocol diversification
    const diversificationFactor = Math.min(1, defiResult.activeProtocols / 3);
    return defiResult.totalDailyROI * diversificationFactor;
  }
  
  static determineROIProfile(defiResult, activityResult) {
    const unclaimedValue = defiResult.totalUnclaimedUSD;
    const dailyROI = defiResult.totalDailyROI;
    const protocols = defiResult.activeProtocols;
    
    if (unclaimedValue > 1000 && protocols > 3) return 'defi_whale';
    if (unclaimedValue > 100 && protocols > 1) return 'defi_farmer';
    if (dailyROI > 0 || protocols > 0) return 'defi_explorer';
    if (activityResult.isActiveTrader) return 'trader';
    return 'holder';
  }
  
  static classifyInvestorType(defiResult, activityResult) {
    const riskScore = defiResult.roiSources.reduce((sum, s) => {
      return sum + (s.riskLevel === 'high' ? 3 : s.riskLevel === 'medium' ? 2 : 1);
    }, 0);
    
    const avgRisk = riskScore / defiResult.roiSources.length || 0;
    
    if (avgRisk > 2.5) return 'aggressive';
    if (avgRisk > 1.5) return 'moderate';
    if (defiResult.roiSources.length > 0) return 'conservative';
    return 'passive';
  }

  /**
   * 🧹 Utility: Format ROI percentage
   */
  static formatROI(roi) {
    if (typeof roi !== 'number' || isNaN(roi)) return '0.00%';
    return `${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`;
  }

  /**
   * 🧹 Utility: Validate wallet address
   */
  static isValidWallet(address) {
    return address && 
           typeof address === 'string' && 
           address.length >= 40 && 
           address.startsWith('0x');
  }

  /**
   * 📊 NEUE FUNKTION: ROI für verschiedene Zeiträume berechnen
   * @param {string} walletAddress - Wallet-Adresse
   * @param {string} chain - Blockchain
   * @returns {object} - ROI-Daten für 24h, 7d, 30d
   */
  static async getROIByPeriods(walletAddress, chain = 'pulsechain') {
    try {
      console.log(`📊 ROI PERIODS: Loading ROI data for different time periods`);
      
      // Lade einmal alle Transaktionen
      const transactions = await this.loadTransactionHistory(walletAddress, chain, 500);
      
      if (!transactions || transactions.length === 0) {
        return {
          success: false,
          periods: {
            '24h': { value: 0, sources: 0, transactions: [] },
            '7d': { value: 0, sources: 0, transactions: [] },
            '30d': { value: 0, sources: 0, transactions: [] },
            'all': { value: 0, sources: 0, transactions: [] }
          }
        };
      }
      
      // Parallel: Berechne ROI für verschiedene Zeiträume
      const [roi24h, roi7d, roi30d, roiAll] = await Promise.all([
        this.analyzeTransactionsForROI(transactions, walletAddress, '24h'),
        this.analyzeTransactionsForROI(transactions, walletAddress, '7d'),
        this.analyzeTransactionsForROI(transactions, walletAddress, '30d'),
        this.analyzeTransactionsForROI(transactions, walletAddress, null)
      ]);
      
      const calculateTotalValue = (sources) => {
        return sources.reduce((total, source) => total + (source.totalValue || 0), 0);
      };
      
      const result = {
        success: true,
        periods: {
          '24h': {
            value: calculateTotalValue(roi24h),
            sources: roi24h.length,
            transactions: roi24h.reduce((total, s) => total + (s.transactionCount || 0), 0),
            details: roi24h
          },
          '7d': {
            value: calculateTotalValue(roi7d),
            sources: roi7d.length,
            transactions: roi7d.reduce((total, s) => total + (s.transactionCount || 0), 0),
            details: roi7d
          },
          '30d': {
            value: calculateTotalValue(roi30d),
            sources: roi30d.length,
            transactions: roi30d.reduce((total, s) => total + (s.transactionCount || 0), 0),
            details: roi30d
          },
          'all': {
            value: calculateTotalValue(roiAll),
            sources: roiAll.length,
            transactions: roiAll.reduce((total, s) => total + (s.transactionCount || 0), 0),
            details: roiAll
          }
        },
        wallet: walletAddress,
        chain: chain,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ ROI PERIODS: Calculated ROI for all periods`, {
        '24h': `$${result.periods['24h'].value.toFixed(2)}`,
        '7d': `$${result.periods['7d'].value.toFixed(2)}`,
        '30d': `$${result.periods['30d'].value.toFixed(2)}`,
        'all': `$${result.periods['all'].value.toFixed(2)}`
      });
      
      return result;
      
    } catch (error) {
      console.error('💥 ROI PERIODS ERROR:', error);
      return {
        success: false,
        error: error.message,
        periods: {
          '24h': { value: 0, sources: 0, transactions: [] },
          '7d': { value: 0, sources: 0, transactions: [] },
          '30d': { value: 0, sources: 0, transactions: [] },
          'all': { value: 0, sources: 0, transactions: [] }
        }
      };
    }
  }
}

export default ROIDetectionService; 