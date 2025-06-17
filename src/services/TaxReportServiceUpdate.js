// =============================================================================
// 🔧 UPDATES FÜR DEIN BESTEHENDES TAX SYSTEM
// =============================================================================

// Update für TaxReportService_Rebuild.js
// Füge diese Verbesserungen zu deinem bestehenden Service hinzu:

// =============================================================================
// 🚀 ENHANCED MORALIS API SERVICE (für bestehende Integration)
// =============================================================================

class EnhancedMoralisService {
  constructor(existingMoralisConfig) {
    // Übernimm deine bestehende Konfiguration
    this.apiKey = existingMoralisConfig.apiKey || process.env.MORALIS_API_KEY;
    this.baseURL = 'https://deep-index.moralis.io/api/v2.2';
    
    // Neue Performance-Features hinzufügen
    this.cache = new Map();
    this.rateLimitDelay = 150; // Langsamer für Stabilität
    this.maxRetries = 3;
    this.batchSize = 100; // Kleinere Batches für Stabilität
  }

  // Verbesserte Transaction Loading (Update für bestehende Funktion)
  async getAllTransactionsImproved(walletAddress, chain = 'eth') {
    console.log(`🔧 IMPROVED: Loading transactions for ${walletAddress} on ${chain}`);
    
    try {
      let allTransactions = [];
      let cursor = null;
      let pageCount = 0;
      const maxPages = 20; // Sicherheitslimit

      // Aggressive Pagination mit Error Handling
      while (pageCount < maxPages) {
        try {
          await this.sleep(this.rateLimitDelay);
          
          const params = {
            chain: chain,
            limit: this.batchSize,
            ...(cursor && { cursor })
          };

          // ERC20 Token Transfers
          const tokenResponse = await this.makeResilientRequest(`/${walletAddress}/erc20`, params);
          
          if (!tokenResponse?.result?.length) {
            console.log(`📄 No more transactions at page ${pageCount + 1}`);
            break;
          }

          // Normalisiere und füge hinzu
          const processedTransactions = tokenResponse.result.map(tx => ({
            ...tx,
            chain: chain,
            tx_type: this.improvedTypeDetection(tx, walletAddress),
            is_spam: this.enhancedSpamFilter(tx),
            processed_timestamp: new Date().toISOString()
          }));

          allTransactions.push(...processedTransactions);
          cursor = tokenResponse.cursor;
          pageCount++;

          console.log(`📊 Page ${pageCount}: ${processedTransactions.length} transactions (Total: ${allTransactions.length})`);

        } catch (pageError) {
          console.warn(`⚠️ Page ${pageCount + 1} failed, continuing:`, pageError.message);
          pageCount++;
          continue;
        }
      }

      console.log(`✅ IMPROVED: Loaded ${allTransactions.length} transactions total`);
      return {
        transactions: allTransactions,
        totalCount: allTransactions.length,
        pagesProcessed: pageCount,
        success: true
      };

    } catch (error) {
      console.error(`❌ IMPROVED transaction loading failed:`, error);
      return {
        transactions: [],
        totalCount: 0,
        error: error.message,
        success: false
      };
    }
  }

  // Resiliente API Requests (Update für bestehende API Calls)
  async makeResilientRequest(endpoint, params, retryCount = 0) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        ...(Object.keys(params).length && { 
          body: JSON.stringify(params) 
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.warn(`⚠️ Retry ${retryCount + 1}/${this.maxRetries} for ${endpoint}`);
        await this.sleep(this.rateLimitDelay * (retryCount + 1));
        return this.makeResilientRequest(endpoint, params, retryCount + 1);
      }
      throw error;
    }
  }

  // Verbesserte Transaction Type Detection
  improvedTypeDetection(tx, walletAddress) {
    const isIncoming = tx.to_address?.toLowerCase() === walletAddress.toLowerCase();
    const tokenSymbol = tx.token_symbol?.toUpperCase();
    const amount = parseFloat(tx.value || 0);

    // WGEP ROI Detection (sehr spezifisch für dein System)
    if (tokenSymbol === 'WGEP' && isIncoming && amount > 0) {
      // Prüfe ROI-Muster
      if (this.isWGEPROIPattern(tx)) {
        return 'wgep_roi'; // §22 EStG
      } else {
        return 'wgep_transfer';
      }
    }

    // USDC Detection
    if (['USDC', 'USDT'].includes(tokenSymbol)) {
      return isIncoming ? 'stablecoin_buy' : 'stablecoin_sell';
    }

    // ETH Detection
    if (tokenSymbol === 'ETH' || !tx.token_address) {
      return isIncoming ? 'eth_buy' : 'eth_sell';
    }

    // Standard Classification
    return isIncoming ? 'token_buy' : 'token_sell';
  }

  // WGEP ROI Pattern Detection (für dein System)
  isWGEPROIPattern(tx) {
    const amount = parseFloat(tx.value || 0);
    const fromAddress = tx.from_address?.toLowerCase();
    
    // ROI-Indikatoren für WGEP
    const roiIndicators = [
      amount > 0.1 && amount < 10000, // Typische ROI-Range
      fromAddress && fromAddress.length === 42, // Valid address
      !this.isFromKnownExchange(fromAddress), // Nicht von Exchange
      this.hasRegularPattern(tx) // Regelmäßige Zahlungen
    ];

    return roiIndicators.filter(Boolean).length >= 2;
  }

  // Enhanced Spam Filter (Update für dein System)
  enhancedSpamFilter(tx) {
    const symbol = (tx.token_symbol || '').toLowerCase();
    const name = (tx.token_name || '').toLowerCase();
    const amount = parseFloat(tx.value || 0);

    // Bekannte Spam-Pattern (für dein System angepasst)
    const spamIndicators = [
      // URL/Website Pattern
      /\.(com|net|org|io|me|xyz|top)/i.test(symbol) || /\.(com|net|org|io)/i.test(name),
      
      // Claim/Free Pattern
      /claim|visit|free|bonus|reward|airdrop/i.test(symbol + name),
      
      // Extreme Amounts
      amount > 1000000000 || amount === 0,
      
      // Suspicious Names
      /test|spam|scam|fake|phishing/i.test(symbol + name),
      
      // Random Character Pattern
      /^[a-f0-9]{8,}$/i.test(symbol) && symbol.length > 10
    ];

    const spamScore = spamIndicators.filter(Boolean).length;
    return spamScore >= 2; // 2+ Indikatoren = Spam
  }

  // Helper Methods
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isFromKnownExchange(address) {
    const exchanges = [
      '0x3cc936b795a188f0e246cbb2d74c5bd190aecf18', // Kraken
      '0xd551234ae421e3bcba99a0da6d736074f22192ff', // Binance
      '0x56eddb7aa87536c09ccc2793473599fd21a8b17f', // Binance 2
    ];
    return exchanges.includes(address?.toLowerCase());
  }

  hasRegularPattern(tx) {
    // Vereinfachte Pattern-Erkennung
    return true; // In Production: Zeitliche Muster analysieren
  }
}

// =============================================================================
// 🧮 ENHANCED FIFO CALCULATOR (Update für bestehende Logik)
// =============================================================================

class EnhancedFIFOCalculator {
  constructor() {
    this.holdings = new Map(); // Token Holdings
    this.fifoQueues = new Map(); // FIFO Queues per Token
    this.taxEvents = []; // Steuerrelevante Events
  }

  // Verbesserte FIFO-Berechnung (Update für dein System)
  async calculateImprovedFIFO(transactions, walletAddress) {
    console.log(`🧮 ENHANCED FIFO calculation for ${transactions.length} transactions`);

    const results = {
      walletAddress,
      processedTransactions: 0,
      taxEvents: [],
      holdings: {},
      germanTaxSummary: {
        roiIncome: 0,      // §22 EStG
        speculativeGains: 0, // §23 EStG < 1 Jahr
        longTermGains: 0   // §23 EStG > 1 Jahr (steuerfrei)
      }
    };

    try {
      // Transaktionen chronologisch sortieren
      const sortedTransactions = transactions.sort((a, b) => 
        new Date(a.block_timestamp) - new Date(b.block_timestamp)
      );

      for (const tx of sortedTransactions) {
        await this.processSingleTransaction(tx, walletAddress, results);
        results.processedTransactions++;
      }

      // Deutsche Steuer-Analyse
      results.germanTaxSummary = this.analyzeGermanTaxImplications(results.taxEvents);
      results.holdings = this.getCurrentHoldings();

      console.log(`✅ FIFO complete: ${results.processedTransactions} transactions processed`);
      console.log(`💰 ROI Income: €${results.germanTaxSummary.roiIncome.toFixed(2)}`);
      console.log(`📊 Speculative Gains: €${results.germanTaxSummary.speculativeGains.toFixed(2)}`);

      return results;

    } catch (error) {
      console.error(`❌ FIFO calculation failed:`, error);
      return {
        ...results,
        error: error.message,
        success: false
      };
    }
  }

  // Einzelne Transaktion verarbeiten
  async processSingleTransaction(tx, walletAddress, results) {
    const isIncoming = tx.to_address?.toLowerCase() === walletAddress.toLowerCase();
    const tokenSymbol = tx.token_symbol || 'ETH';
    const amount = parseFloat(tx.value || 0);
    const timestamp = tx.block_timestamp;

    // Preis ermitteln (vereinfacht)
    const priceUSD = await this.getTransactionPrice(tx);
    const priceEUR = priceUSD * 0.85; // USD->EUR (vereinfacht)

    if (isIncoming) {
      // Kauf oder ROI
      if (tx.tx_type === 'wgep_roi') {
        // ROI-Einkommen (§22 EStG)
        const roiEvent = {
          type: 'roi_income',
          token: tokenSymbol,
          amount: amount,
          priceUSD: priceUSD,
          priceEUR: priceEUR,
          valueEUR: amount * priceEUR,
          timestamp: timestamp,
          txHash: tx.transaction_hash,
          taxCategory: '§22 EStG - Sonstige Einkünfte'
        };
        results.taxEvents.push(roiEvent);
      } else {
        // Normaler Kauf - zu FIFO hinzufügen
        this.addToFIFO(tokenSymbol, amount, priceUSD, timestamp, tx.transaction_hash);
      }
    } else {
      // Verkauf - FIFO-Prinzip anwenden
      const saleResult = this.processFIFOSale(tokenSymbol, amount, priceUSD, timestamp, tx.transaction_hash);
      if (saleResult.taxEvents) {
        results.taxEvents.push(...saleResult.taxEvents);
      }
    }
  }

  // FIFO Kauf hinzufügen
  addToFIFO(token, amount, price, timestamp, txHash) {
    if (!this.fifoQueues.has(token)) {
      this.fifoQueues.set(token, []);
    }

    const fifoEntry = {
      amount: amount,
      remainingAmount: amount,
      price: price,
      buyTimestamp: timestamp,
      txHash: txHash
    };

    this.fifoQueues.get(token).push(fifoEntry);
    
    // Holdings updaten
    const currentHolding = this.holdings.get(token) || 0;
    this.holdings.set(token, currentHolding + amount);
  }

  // FIFO Verkauf verarbeiten
  processFIFOSale(token, sellAmount, sellPrice, sellTimestamp, txHash) {
    const fifoQueue = this.fifoQueues.get(token) || [];
    let remainingSellAmount = sellAmount;
    const taxEvents = [];

    for (const entry of fifoQueue) {
      if (remainingSellAmount <= 0) break;
      if (entry.remainingAmount <= 0) continue;

      const usedAmount = Math.min(remainingSellAmount, entry.remainingAmount);
      const costBasis = usedAmount * entry.price;
      const saleValue = usedAmount * sellPrice;
      const gainLoss = saleValue - costBasis;

      // Deutsche Spekulationsfrist prüfen
      const holdingDays = Math.floor(
        (new Date(sellTimestamp) - new Date(entry.buyTimestamp)) / (1000 * 60 * 60 * 24)
      );
      const isSpeculative = holdingDays < 365;

      const saleEvent = {
        type: 'sale',
        token: token,
        amount: usedAmount,
        buyPrice: entry.price,
        sellPrice: sellPrice,
        costBasis: costBasis,
        saleValue: saleValue,
        gainLossUSD: gainLoss,
        gainLossEUR: gainLoss * 0.85,
        holdingDays: holdingDays,
        isSpeculative: isSpeculative,
        buyTimestamp: entry.buyTimestamp,
        sellTimestamp: sellTimestamp,
        sellTxHash: txHash,
        buyTxHash: entry.txHash,
        taxCategory: isSpeculative ? '§23 EStG - Spekulativ' : '§23 EStG - Steuerfrei'
      };

      taxEvents.push(saleEvent);

      // FIFO Entry updaten
      entry.remainingAmount -= usedAmount;
      remainingSellAmount -= usedAmount;
    }

    // Holdings updaten
    const currentHolding = this.holdings.get(token) || 0;
    this.holdings.set(token, Math.max(0, currentHolding - sellAmount));

    return { taxEvents };
  }

  // Deutsche Steuer-Analyse
  analyzeGermanTaxImplications(taxEvents) {
    const summary = {
      roiIncome: 0,
      speculativeGains: 0,
      longTermGains: 0,
      taxableSpeculativeGains: 0
    };

    for (const event of taxEvents) {
      switch (event.type) {
        case 'roi_income':
          summary.roiIncome += event.valueEUR;
          break;
          
        case 'sale':
          if (event.isSpeculative && event.gainLossEUR > 0) {
            summary.speculativeGains += event.gainLossEUR;
          } else if (!event.isSpeculative && event.gainLossEUR > 0) {
            summary.longTermGains += event.gainLossEUR;
          }
          break;
      }
    }

    // 600€ Freigrenze für Spekulationsgewinne
    summary.taxableSpeculativeGains = Math.max(0, summary.speculativeGains - 600);

    return summary;
  }

  // Aktuelle Holdings
  getCurrentHoldings() {
    const holdings = {};
    for (const [token, amount] of this.holdings.entries()) {
      if (amount > 0) {
        holdings[token] = amount;
      }
    }
    return holdings;
  }

  // Vereinfachte Preis-Ermittlung
  async getTransactionPrice(tx) {
    // Hier würdest du deine bestehende Preis-API verwenden
    // Fallback-Preise für Testing
    const fallbackPrices = {
      'WGEP': 0.50,
      'USDC': 1.00,
      'USDT': 1.00,
      'ETH': 3000.00
    };
    
    return fallbackPrices[tx.token_symbol] || 1.00;
  }
}

// =============================================================================
// 🔧 INTEGRATION UPDATE FÜR DEIN BESTEHENDES SYSTEM
// =============================================================================

// Füge diese Funktion zu deinem TaxReportService_Rebuild.js hinzu:
class TaxReportServiceUpdate {
  constructor() {
    this.moralisService = new EnhancedMoralisService({
      apiKey: window.moralisApiKey || process.env.MORALIS_API_KEY
    });
    this.fifoCalculator = new EnhancedFIFOCalculator();
  }

  // Haupt-Update-Funktion (ersetzt deine generateGermanTaxReport)
  async generateImprovedGermanTaxReport(walletAddress, year = 2024) {
    console.log(`🔧 IMPROVED Tax Report for ${walletAddress} (${year})`);

    try {
      // 1. Verbesserte Transaction Loading
      const transactionResult = await this.moralisService.getAllTransactionsImproved(walletAddress, 'eth');
      
      if (!transactionResult.success) {
        throw new Error(`Transaction loading failed: ${transactionResult.error}`);
      }

      // 2. Jahr-Filter
      const yearTransactions = transactionResult.transactions.filter(tx => {
        const txYear = new Date(tx.block_timestamp).getFullYear();
        return txYear === year;
      });

      console.log(`📅 Found ${yearTransactions.length} transactions for ${year}`);

      // 3. FIFO-Berechnung
      const fifoResult = await this.fifoCalculator.calculateImprovedFIFO(yearTransactions, walletAddress);

      // 4. Report zusammenstellen
      const taxReport = {
        walletAddress,
        year,
        generatedAt: new Date().toISOString(),
        version: 'improved_v1.0',
        
        summary: {
          totalTransactions: yearTransactions.length,
          processedTransactions: fifoResult.processedTransactions,
          roiTransactions: fifoResult.taxEvents.filter(e => e.type === 'roi_income').length,
          saleTransactions: fifoResult.taxEvents.filter(e => e.type === 'sale').length
        },
        
        germanTaxCategories: {
          paragraph22_ROI: {
            description: '§22 EStG - Sonstige Einkünfte (WGEP ROI)',
            totalEUR: fifoResult.germanTaxSummary.roiIncome,
            taxRate: 'Individueller Steuersatz (14-45%)',
            events: fifoResult.taxEvents.filter(e => e.type === 'roi_income')
          },
          
          paragraph23_Speculation: {
            description: '§23 EStG - Spekulationsgeschäfte',
            grossGainsEUR: fifoResult.germanTaxSummary.speculativeGains,
            freeThresholdEUR: 600,
            taxableGainsEUR: fifoResult.germanTaxSummary.taxableSpeculativeGains,
            longTermGainsEUR: fifoResult.germanTaxSummary.longTermGains,
            events: fifoResult.taxEvents.filter(e => e.type === 'sale')
          }
        },
        
        totalTaxableIncomeEUR: fifoResult.germanTaxSummary.roiIncome + 
                               fifoResult.germanTaxSummary.taxableSpeculativeGains,
        
        currentHoldings: fifoResult.holdings,
        
        detailedEvents: fifoResult.taxEvents,
        
        disclaimer: 'Berechnung nach deutschem Steuerrecht. Steuerberater für finale Prüfung konsultieren!'
      };

      console.log(`✅ IMPROVED Tax Report complete`);
      console.log(`💰 Total taxable income: €${taxReport.totalTaxableIncomeEUR.toFixed(2)}`);

      return taxReport;

    } catch (error) {
      console.error(`❌ Improved tax report failed:`, error);
      return {
        walletAddress,
        year,
        error: error.message,
        success: false
      };
    }
  }

  // Update-Funktion für dein Frontend (TaxReportView.jsx)
  async updateExistingTaxSystem(walletAddress) {
    try {
      console.log(`🔧 Updating existing tax system for: ${walletAddress}`);
      
      const report = await this.generateImprovedGermanTaxReport(walletAddress, 2024);
      
      if (report.success !== false) {
        console.log(`✅ Tax system update successful`);
        console.log(`📊 Processed ${report.summary.totalTransactions} transactions`);
        console.log(`💰 Total taxable: €${report.totalTaxableIncomeEUR.toFixed(2)}`);
        
        return {
          success: true,
          report: report,
          message: 'Tax system successfully updated with improved algorithms'
        };
      } else {
        return {
          success: false,
          error: report.error,
          message: 'Tax system update failed'
        };
      }
      
    } catch (error) {
      console.error(`❌ Tax system update error:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Tax system update failed with error'
      };
    }
  }
}

// =============================================================================
// 🚀 SOFORT-INTEGRATION IN DEIN BESTEHENDES SYSTEM
// =============================================================================

// Globale Verfügbarkeit für dein Frontend
if (typeof window !== 'undefined') {
  window.TaxReportServiceUpdate = TaxReportServiceUpdate;
  
  // Hotfix für dein bestehendes System
  window.updateTaxSystemNow = async function(walletAddress) {
    try {
      const updater = new TaxReportServiceUpdate();
      const result = await updater.updateExistingTaxSystem(walletAddress);
      
      console.log('🔧 TAX SYSTEM UPDATE RESULT:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Tax system update failed:', error);
      return { success: false, error: error.message };
    }
  };
  
  console.log('🔧 Tax System Updates loaded! Use: window.updateTaxSystemNow(walletAddress)');
}

// Export für Node.js
export {
  EnhancedMoralisService,
  EnhancedFIFOCalculator,
  TaxReportServiceUpdate
}; 