/**
 * 🚀 MORALIS V2 SERVICE - OPTIMIERT FÜR READ-ONLY SYSTEM
 * 
 * ✅ PulseManager READ-ONLY System Optimierungen:
 * - ✅ Portfolio & Transaction APIs sind aktiv
 * - ✅ Steuer-/Tax-Report APIs sind aktiv
 * - ❌ DeFi APIs (Enterprise Features) deaktiviert
 * - ❌ Gas-Price APIs deaktiviert
 * 
 * WICHTIG: Dieses System ist rein LESEND und benötigt keine Gas-Preise oder DeFi-Enterprise-Features!
 * Alle Methoden für Enterprise Features und Gas-Preise geben Mock-Daten zurück, um existierende Codeaufrufe nicht zu brechen.
 */

export class MoralisV2Service {
  
  static API_BASE = '/api/moralis-v2';
  
  /**
   * 🏆 PORTFOLIO NET WORTH - Complete USD Portfolio
   * Ersetzt: Token-Balances + Prices + Manual Calculation
   */
  static async getPortfolioNetWorth(address, chain = '1') {
    try {
      console.log(`🚀 V2: Loading portfolio net worth for ${address}`);
      
      const response = await fetch(`${this.API_BASE}?endpoint=portfolio&address=${address}&chain=${chain}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data._error) {
        console.warn('⚠️ V2 Portfolio API Error:', data._error.message);
        return { 
          success: false, 
          error: data._error.message,
          total_networth_usd: '0',
          chains: []
        };
      }
      
      console.log(`✅ V2: Portfolio loaded - $${data.result.total_networth_usd}`);
      
      return {
        success: true,
        total_networth_usd: data.result.total_networth_usd || '0',
        chains: data.result.chains || [],
        source: 'moralis_v2_portfolio'
      };
      
    } catch (error) {
      console.error('💥 V2 Portfolio Service Error:', error);
      return { 
        success: false, 
        error: error.message,
        total_networth_usd: '0',
        chains: []
      };
    }
  }
  
  /**
   * 📄 WALLET TRANSACTIONS BATCH (für Tax Report Rebuild) - ERWEITERT für WGEP ROI
   * Unterstützt bis zu 300.000 Transaktionen mit Cursor-Pagination
   */
  static async getWalletTransactionsBatch(address, limit = 100, cursor = null, chain = '1') {
    try {
      console.error(`🚨 MORALIS-API-CALL: address=${address.slice(0,8)}..., limit=${limit}, cursor=${cursor ? 'EXISTS' : 'NULL'}, chain=${chain}`);
      console.log(`🚀 V2: Loading transaction batch for ${address} (limit: ${limit}, chain: ${chain})`);
      
      // 🔥 MULTI-ENDPOINT STRATEGY: Versuche verschiedene Endpoints für maximale Abdeckung
      const endpoints = [
        'transactions',      // Primär: Alle Transaktionen (ETH + Token)
        'erc20-transfers'    // Sekundär: Token-Transfers (native-transfers entfernt wegen 400 Error)
      ];
      
      let bestResult = null;
      let totalTransactions = 0;
      
      for (const endpoint of endpoints) {
        try {
          let url = `/api/moralis-proxy?endpoint=${endpoint}&address=${address}&chain=${chain}&limit=${limit}`;
          if (cursor) url += `&cursor=${cursor}`;
          
          console.log(`🔍 V2: Versuche ${endpoint} endpoint...`);
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.result && data.result.length > 0) {
            console.log(`✅ V2: ${endpoint} lieferte ${data.result.length} Transaktionen`);
            
            // Verwende das Ergebnis mit den meisten Transaktionen
            if (data.result.length > totalTransactions) {
              bestResult = data;
              totalTransactions = data.result.length;
            }
          } else {
            console.log(`⚠️ V2: ${endpoint} lieferte keine Transaktionen`);
          }
          
        } catch (endpointError) {
          console.warn(`⚠️ V2: ${endpoint} Fehler:`, endpointError.message);
        }
      }
      
      // Verwende das beste Ergebnis
      const data = bestResult;
      
      if (!data) {
        console.warn('⚠️ V2: Alle Endpoints fehlgeschlagen');
        return { 
          success: false, 
          error: 'Alle Endpoints fehlgeschlagen',
          result: [],
          cursor: null
        };
      }
      
      // 🔍 ENHANCED DEBUG: Detaillierte API-Antwort
      console.log(`🔍 V2 PAGINATION DEBUG: result=${data.result?.length || 0}, cursor=${data.cursor || 'null'}, success=${data.success}`);
      console.log(`🔍 V2 SAMPLE TRANSACTION:`, data.result?.[0] ? {
        hash: data.result[0].transaction_hash?.slice(0, 10) + '...',
        from: data.result[0].from_address?.slice(0, 8) + '...',
        to: data.result[0].to_address?.slice(0, 8) + '...',
        value: data.result[0].value,
        timestamp: data.result[0].block_timestamp
      } : 'Keine Transaktionen');
      
      if (data._error) {
        console.warn('⚠️ V2 Batch API Error:', data._error.message);
        return { 
          success: false, 
          error: data._error.message,
          result: [],
          cursor: null
        };
      }
      
      // 🎯 WGEP ROI ANALYSIS: Analysiere die geladenen Transaktionen
      const roiTransactions = (data.result || []).filter(tx => {
        const isIncoming = tx.to_address?.toLowerCase() === address.toLowerCase();
        const hasValue = parseFloat(tx.value || '0') > 0;
        const fromContract = tx.from_address && tx.from_address.length === 42 && 
                           !tx.from_address.startsWith('0x000000');
        return isIncoming && hasValue && fromContract;
      });
      
      if (roiTransactions.length > 0) {
        console.log(`🎯 V2 ROI FOUND: ${roiTransactions.length} potentielle WGEP ROI-Transaktionen in diesem Batch`);
        roiTransactions.slice(0, 3).forEach(tx => {
          const ethValue = parseFloat(tx.value) / 1e18;
          console.log(`  💰 ${ethValue.toFixed(6)} ETH von ${tx.from_address.slice(0,8)}... am ${new Date(tx.block_timestamp).toLocaleString('de-DE')}`);
        });
      }
      
      // 🚨 44-TRANSAKTIONEN-FINAL-DEBUG: Finale API-Response
      console.error(`🚨 MORALIS-RESPONSE-FINAL: success=true, resultLength=${data.result?.length || 0}, cursor=${!!data.cursor}, requestedLimit=${limit}, actualReceived=${data.result?.length || 0}`);
      
      return {
        success: true,
        result: data.result || [],
        cursor: data.cursor || null,
        hasMore: !!data.cursor, // 🔥 FIX: hasMore wenn cursor existiert (ignoriere limit!)
        count: data.result?.length || 0,
        roiCount: roiTransactions.length,
        source: 'moralis_v2_batch_multi_endpoint'
      };
      
    } catch (error) {
      console.error('💥 V2 Batch Service Error:', error);
      return { 
        success: false, 
        error: error.message,
        result: [],
        cursor: null
      };
    }
  }

  /**
   * 📈 COMPLETE TRANSACTION HISTORY
   * Ersetzt: Separate ERC20 + Native + NFT calls
   */
  static async getCompleteHistory(address, chain = '1', options = {}) {
    try {
      const { cursor, limit = 100, getAllPages = false } = options;
      
      console.log(`🚀 V2: Loading complete history for ${address}`);
      
      let allTransactions = [];
      let currentCursor = cursor;
      let hasMore = true;
      
      while (hasMore) {
        // 🔄 CSP FIX: Verwende Proxy-API
        let url = `/api/moralis-proxy?endpoint=transactions&address=${address}&chain=${chain}&limit=${limit}`;
        if (currentCursor) url += `&cursor=${currentCursor}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data._error) {
          console.warn('⚠️ V2 History API Error:', data._error.message);
          break;
        }
        
        allTransactions.push(...(data.result || []));
        
        // Check if we should continue fetching
        currentCursor = data.cursor;
        hasMore = getAllPages && currentCursor && data.result?.length === limit;
        
        if (!getAllPages) break; // Single page only
      }
      
      console.log(`✅ V2: History loaded - ${allTransactions.length} comprehensive transactions`);
      
      return {
        success: true,
        transactions: allTransactions,
        cursor: currentCursor,
        total: allTransactions.length,
        source: 'moralis_v2_comprehensive'
      };
      
    } catch (error) {
      console.error('💥 V2 History Service Error:', error);
      return { 
        success: false, 
        error: error.message,
        transactions: []
      };
    }
  }
  
  /**
   * 📊 WALLET ANALYTICS
   * Für Dashboard-KPIs und User-Segmentierung
   * 
   * ❌ DEPRECATED - 2025-06-12 - Enterprise Feature, nicht mehr aktiv
   */
  static async getWalletStats(address, chain = '1') {
    console.warn('❌ DEPRECATED: getWalletStats ist ein Enterprise Feature und nicht mehr unterstützt');
    console.warn('Das System ist READ-ONLY und verwendet nur Pro-Features');
    
    // Leere Daten zurückgeben, damit existierende Code nicht kaputt geht
    return {
      success: true,
      stats: {
        nfts: 0,
        collections: 0,
        transactions: { total: 0 },
        nft_transfers: { total: 0 },
        token_transfers: { total: 0 }
      },
      _deprecated: true,
      _note: 'Enterprise Feature deaktiviert im READ-ONLY System'
    };
  }
  
  /**
   * 🎯 SMART PORTFOLIO LOAD
   * Kombiniert Net Worth + Stats für komplettes Dashboard
   */
  static async loadCompletePortfolio(address, chain = '1') {
    try {
      console.log(`🚀 V2: Loading portfolio for ${address}`);
      
      // Nur noch Portfolio laden, keine Stats mehr (Enterprise Feature)
      const portfolioResult = await this.getPortfolioNetWorth(address, chain);
      
      return {
        success: true,
        portfolio: portfolioResult,
        stats: { success: true, stats: {} }, // Leere Stats
        total_value_usd: portfolioResult.total_networth_usd || '0',
        source: 'moralis_v2_portfolio_only'
      };
      
    } catch (error) {
      console.error('💥 V2 Complete Portfolio Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 🏆 ROI TRANSACTION DETECTION
   * Analysiert History für ROI-relevante Transaktionen
   */
  static async getROITransactions(address, chain = '1', options = {}) {
    try {
      console.log(`🚀 V2: Analyzing ROI transactions for ${address}`);
      
      const historyResult = await this.getCompleteHistory(address, chain, {
        ...options,
        getAllPages: true // ROI needs complete history
      });
      
      if (!historyResult.success) {
        return historyResult;
      }
      
      // ROI Detection Logic
      const roiTransactions = historyResult.transactions.filter(tx => {
        // Check for incoming transfers (potential ROI)
        const hasIncomingERC20 = tx.erc20_transfer?.some(transfer => 
          transfer.to_address?.toLowerCase() === address.toLowerCase()
        );
        
        const hasIncomingNative = tx.native_transfers?.some(transfer =>
          transfer.to_address?.toLowerCase() === address.toLowerCase() &&
          transfer.direction === 'incoming'
        );
        
        // ROI indicators (simplified)
        const isLikelyROI = hasIncomingERC20 || hasIncomingNative;
        
        return isLikelyROI;
      });
      
      console.log(`✅ V2: ROI Analysis complete - ${roiTransactions.length} potential ROI transactions`);
      
      return {
        success: true,
        roiTransactions,
        totalROI: roiTransactions.length,
        totalTransactions: historyResult.transactions.length,
        roiRatio: historyResult.transactions.length > 0 ? 
          (roiTransactions.length / historyResult.transactions.length * 100).toFixed(2) : '0',
        source: 'moralis_v2_roi_analysis'
      };
      
    } catch (error) {
      console.error('💥 V2 ROI Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        roiTransactions: []
      };
    }
  }
  
  /**
   * 📋 TAX REPORT DATA
   * Optimiert für Steuerberichte mit vollständiger Historie
   */
  static async getTaxReportData(address, chain = '1', options = {}) {
    try {
      console.log(`🚀 V2: Generating tax report data for ${address}`);
      
      const [historyResult, portfolioResult] = await Promise.all([
        this.getCompleteHistory(address, chain, { 
          getAllPages: true, // Tax needs all transactions
          limit: 100
        }),
        this.getPortfolioNetWorth(address, chain)
      ]);
      
      if (!historyResult.success) {
        return historyResult;
      }
      
      // Tax categorization (simplified)
      const taxableTransactions = historyResult.transactions.filter(tx => {
        // Look for incoming transfers (potential taxable events)
        return tx.erc20_transfer?.some(transfer => 
          transfer.to_address?.toLowerCase() === address.toLowerCase()
        );
      });
      
      console.log(`✅ V2: Tax report complete - ${taxableTransactions.length} taxable transactions`);
      
      return {
        success: true,
        allTransactions: historyResult.transactions,
        taxableTransactions,
        portfolio: portfolioResult,
        summary: {
          totalTransactions: historyResult.transactions.length,
          taxableCount: taxableTransactions.length,
          portfolioValue: portfolioResult.total_networth_usd
        },
        source: 'moralis_v2_tax_report'
      };
      
    } catch (error) {
      console.error('💥 V2 Tax Report Error:', error);
      return {
        success: false,
        error: error.message,
        allTransactions: [],
        taxableTransactions: []
      };
    }
  }
  
  /**
   * 🔄 GET ERC20 TRANSFERS
   * Lädt ERC20 Token Transfers für eine Wallet
   */
  static async getERC20Transfers(address, chain = '1', options = {}) {
    try {
      const { limit = 100, cursor = null } = options;
      console.log(`🚀 V2: Loading ERC20 transfers for ${address}`);
      
      // 🔄 CSP FIX: Verwende Proxy-API
      let url = `/api/moralis-proxy?endpoint=erc20-transfers&address=${address}&chain=${chain}&limit=${limit}`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }
      
      const response = await fetch(url, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (data._error) {
        console.warn('⚠️ V2 ERC20 Transfers API Error:', data._error.message);
        return {
          success: false,
          error: data._error.message,
          transfers: []
        };
      }
      
      console.log(`✅ V2: ERC20 Transfers loaded - ${data.transfers?.length || 0} transfers`);
      
      return {
        success: true,
        transfers: data.transfers || [],
        cursor: data.cursor,
        total: data.transfers?.length || 0,
        source: 'moralis_v2_erc20_transfers'
      };
      
    } catch (error) {
      console.error('💥 V2 ERC20 Transfers Error:', error);
      return { 
        success: false, 
        error: error.message,
        transfers: []
      };
    }
  }

  /**
   * 🔄 GET NATIVE TRANSACTIONS
   * Lädt Native Transaktionen (ETH/PLS) für eine Wallet
   */
  static async getNativeTransactions(address, chain = '1', options = {}) {
    try {
      const { limit = 100, cursor = null } = options;
      console.log(`🚀 V2: Loading native transactions for ${address}`);
      
      // 🔄 CSP FIX: Verwende Proxy-API  
      let url = `/api/moralis-proxy?endpoint=transactions&address=${address}&chain=${chain}&limit=${limit}`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }
      
      const response = await fetch(url, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (data._error) {
        console.warn('⚠️ V2 Native Transactions API Error:', data._error.message);
        return {
          success: false,
          error: data._error.message,
          transactions: []
        };
      }
      
      console.log(`✅ V2: Native Transactions loaded - ${data.transactions?.length || 0} transactions`);
      
      return {
        success: true,
        transactions: data.transactions || [],
        cursor: data.cursor,
        total: data.transactions?.length || 0,
        source: 'moralis_v2_native_transactions'
      };
      
    } catch (error) {
      console.error('💥 V2 Native Transactions Error:', error);
      return { 
        success: false, 
        error: error.message,
        transactions: []
      };
    }
  }
  
  /**
   * 📊 ENHANCED WALLET STATS - Combined Analytics
   * Kombiniert: Basic Stats + DeFi Data + ROI Analysis
   * 
   * ❌ DEPRECATED - 2025-06-12 - Enterprise Feature, nicht mehr aktiv
   */
  static async getEnhancedWalletStats(address, chain = '1') {
    console.warn('❌ DEPRECATED: getEnhancedWalletStats ist ein Enterprise Feature und nicht mehr unterstützt');
    console.warn('Das System ist READ-ONLY und verwendet nur Pro-Features');
    
    // Leere Enhanced Stats zurückgeben
    return {
      success: true,
      enhancedStats: {
        nfts: 0,
        collections: 0,
        totalTransactions: 0,
        nftTransfers: 0,
        tokenTransfers: 0,
        defiProtocols: 0,
        defiPositions: 0,
        defiValueUsd: 0,
        defiUnclaimedUsd: 0,
        activityScore: 0,
        userType: 'basic_user',
        roiProfile: {
          hasDefiPositions: false,
          hasUnclaimedRewards: false,
          roiPotential: 'none',
          riskProfile: 'low'
        }
      },
      _deprecated: true,
      source: 'moralis_v2_enhanced_stats_disabled',
      _note: 'Enterprise Feature deaktiviert im READ-ONLY System'
    };
  }
  
  /**
   * 🔍 COMPLETE ROI ANALYSIS
   * Kombiniert: Transaction History + DeFi Positions + Portfolio Analysis
   * 
   * ❌ DEPRECATED - 2025-06-12 - Enterprise Feature, nicht mehr aktiv
   */
  static async getCompleteROIAnalysis(address, chain = '1', options = {}) {
    console.warn('❌ DEPRECATED: getCompleteROIAnalysis ist ein Enterprise Feature und nicht mehr unterstützt');
    console.warn('Das System ist READ-ONLY und verwendet nur Pro-Features');
    
    // Nur Portfolio-Daten laden, Rest leer
    const portfolioResult = await this.getPortfolioNetWorth(address, chain);
    
    // Leere ROI-Analyse zurückgeben
    return {
      success: true,
      roiAnalysis: {
        transactionROI: {
          dailyROI: 0,
          monthlyROI: 0
        },
        defiROI: {
          totalROIValue: 0,
          dailyROI: 0,
          monthlyROI: 0
        },
        portfolioROI: {
          totalValue: parseFloat(portfolioResult.total_networth_usd || '0'),
          dailyChange: 0,
          monthlyChange: 0
        },
        combinedMetrics: {
          totalValue: parseFloat(portfolioResult.total_networth_usd || '0'),
          totalROI: 0,
          roiScore: 0
        }
      },
      _deprecated: true,
      source: 'moralis_v2_complete_roi_disabled',
      _note: 'Enterprise Feature deaktiviert im READ-ONLY System',
      dataQuality: {
        hasTransactionHistory: false,
        hasDefiPositions: false,
        hasPortfolioData: parseFloat(portfolioResult.total_networth_usd || '0') > 0
      }
    };
  }
  
  // Die folgenden Helper-Methoden werden nicht mehr verwendet, bleiben aber für Dokumentationszwecke
  
  /**
   * ❌ DEPRECATED - Helper-Methode, nicht mehr verwendet
   */
  static calculateActivityScore(stats, defiSummary) {
    return 0; // Deaktiviert
  }
  
  /**
   * ❌ DEPRECATED - Helper-Methode, nicht mehr verwendet
   */
  static determineUserType(stats, defiSummary) {
    return 'basic_user'; // Deaktiviert
  }
  
  /**
   * ❌ DEPRECATED - Helper-Methode, nicht mehr verwendet
   */
  static calculateROIPotential(defiSummary) {
    return 'none'; // Deaktiviert
  }
  
  /**
   * ❌ DEPRECATED - Helper-Methode, nicht mehr verwendet
   */
  static assessRiskProfile(stats, defiSummary) {
    return 'low'; // Deaktiviert
  }
  
  /**
   * ❌ DEPRECATED - Helper-Methode, nicht mehr verwendet
   */
  static analyzeTransactionROI(transactions) {
    return {
      dailyROI: 0,
      monthlyROI: 0
    }; // Deaktiviert
  }
  
  /**
   * ❌ DEPRECATED - Helper-Methode, nicht mehr verwendet
   */
  static analyzePortfolioROI(portfolioResult) {
    return {
      totalValue: parseFloat(portfolioResult?.total_networth_usd || '0'),
      dailyChange: 0,
      monthlyChange: 0
    }; // Deaktiviert
  }
  
  /**
   * ❌ DEPRECATED - Helper-Methode, nicht mehr verwendet
   */
  static calculateCombinedROIMetrics(historyResult, defiResult, portfolioResult) {
    return {
      totalValue: parseFloat(portfolioResult?.total_networth_usd || '0'),
      totalROI: 0,
      roiScore: 0
    }; // Deaktiviert
  }
  
  /**
   * ❌ DEPRECATED - Helper-Methode, nicht mehr verwendet
   */
  static calculateOverallROIScore(defiResult, portfolioResult) {
    return 0; // Deaktiviert
  }
} 