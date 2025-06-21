// ===================================
// COMPLETE MORALIS-BASED TAX SOLUTION
// Deutsches Steuerrecht: Gekaufte Coins vs ROI Events
// Basiert auf Moralis Wallet History API
// ===================================

/**
 * MORALIS WALLET HISTORY API INTEGRATION
 * Nutzt automatische Kategorisierung und Contract Detection
 */
class MoralisGermanTaxSystem {
  constructor() {
    this.MORALIS_API_KEY = process.env.MORALIS_API_KEY;
    this.MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';
    
    // PulseChain bekannte Contract Addresses
    this.KNOWN_CONTRACTS = {
      // PulseX Contracts
      PULSEX_ROUTER: '0x165C3410fC91EF562C50559f7d2267586ca22dc',
      PULSEX_TOKEN: '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab',
      
      // HEX Contract (PulseChain fork)
      HEX_CONTRACT: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
      
      // Common Liquidity/Farming Contracts (werden automatisch erkannt)
      FARMING_PATTERNS: [
        /farm/i, /stake/i, /pool/i, /liquidity/i, /reward/i, /yield/i
      ]
    };
  }

  /**
   * HAUPTFUNKTION: Wallet History mit Moralis laden
   */
  async getWalletTaxHistory(walletAddress) {
    try {
      console.log('🔍 Loading wallet history with Moralis...');
      
      // Moralis Wallet History API Call
      const response = await this.callMoralisWalletHistory(walletAddress);
      
      // Process transactions für deutsches Steuerrecht
      const processedData = this.processForGermanTax(response.result);
      
      return {
        success: true,
        walletAddress,
        totalTransactions: response.result.length,
        processedData,
        moralisCategories: this.extractCategories(response.result),
        summary: this.generateTaxSummary(processedData)
      };
      
    } catch (error) {
      console.error('❌ Moralis API Error:', error);
      throw error;
    }
  }

  /**
   * MORALIS WALLET HISTORY API CALL MIT FALLBACKS
   */
  async callMoralisWalletHistory(walletAddress) {
    const endpoints = [
      `/wallets/${walletAddress}/history`,
      `/${walletAddress}`,
      `/wallets/${walletAddress}/transactions`
    ];
    
    const chains = ['eth', '0x171', 'polygon'];
    
    for (const chain of chains) {
      for (const endpoint of endpoints) {
        try {
          const url = `${this.MORALIS_BASE_URL}${endpoint}`;
          const params = new URLSearchParams({
            chain: chain,
            order: 'DESC',
            limit: '300000'  // FIX: 300k LIMIT
          });
          
          console.log(`🔍 Trying: ${endpoint} with chain ${chain}`);
          
          const response = await fetch(`${url}?${params}`, {
            headers: {
              'X-API-Key': this.MORALIS_API_KEY,
              'accept': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log(`✅ SUCCESS: ${endpoint} with chain ${chain}`);
            const data = await response.json();
            console.log(`📊 Got ${data.result?.length || 0} transactions`);
            return data;
          } else {
            console.log(`❌ FAILED: ${endpoint} with chain ${chain} - ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ ERROR: ${endpoint} with chain ${chain} - ${error.message}`);
          continue;
        }
      }
    }
    
    throw new Error('All Moralis endpoints failed');
  }

  /**
   * DEUTSCHE STEUER-KATEGORISIERUNG
   * Basiert auf Moralis automatischen Categories
   */
  processForGermanTax(transactions) {
    console.log(`🇩🇪 Processing ${transactions.length} transactions for German Tax...`);
    
    const germanTaxData = {
      gekaufteCoins: [],    // Coins mit Kaufpreis + Haltefrist
      roiEvents: [],        // ROI Events - immer steuerpflichtig
      verkaufteCoins: [],   // Verkäufe mit Haltefrist-Berechnung
      transfers: []         // Reine Transfers
    };

    transactions.forEach((tx, index) => {
      const taxCategory = this.determineGermanTaxCategory(tx);
      
      switch(taxCategory.type) {
        case 'GEKAUFTER_COIN':
          germanTaxData.gekaufteCoins.push({
            ...tx,
            kaufpreis: taxCategory.kaufpreis,
            kaufdatum: tx.block_timestamp,
            haltefristStart: new Date(tx.block_timestamp),
            haltefristTage: this.calculateHoldingDays(tx.block_timestamp),
            steuerfreiAb: this.calculateTaxFreeDate(tx.block_timestamp),
            taxInfo: taxCategory
          });
          break;
          
        case 'ROI_EVENT':
          germanTaxData.roiEvents.push({
            ...tx,
            roiWert: this.getSafeValue(tx),
            roiDatum: tx.block_timestamp,
            steuerpflichtig: true, // ROI immer steuerpflichtig
            printerContract: taxCategory.printerContract,
            taxInfo: taxCategory
          });
          break;
          
        case 'VERKAUF':
          germanTaxData.verkaufteCoins.push({
            ...tx,
            verkaufspreis: this.getSafeValue(tx),
            verkaufsdatum: tx.block_timestamp,
            taxInfo: taxCategory
          });
          break;
          
        default:
          germanTaxData.transfers.push(tx);
      }
    });

    // ERWEITERTE DEBUG LOGS
    console.log('📊 Transaction Processing Results:', {
      total: transactions.length,
      gekaufteCoins: germanTaxData.gekaufteCoins.length,
      roiEvents: germanTaxData.roiEvents.length,
      verkaufteCoins: germanTaxData.verkaufteCoins.length,
      transfers: germanTaxData.transfers.length,
      sampleValues: transactions.slice(0, 3).map(tx => ({
        token: tx.token_symbol,
        value: this.getSafeValue(tx),
        direction: tx.direction,
        category: tx.category
      }))
    });

    return germanTaxData;
  }

  /**
   * DEUTSCHE STEUER-KATEGORISIERUNG
   * Nutzt Moralis Categories + Contract Detection
   */
  determineGermanTaxCategory(tx) {
    const moralisCategory = tx.category;
    const summary = tx.summary || '';
    const fromAddress = tx.from_address;
    const toAddress = tx.to_address;
    
    // 1. ROI EVENT DETECTION
    if (this.isROIEvent(tx)) {
      return {
        type: 'ROI_EVENT',
        reason: 'Contract reward/farming',
        printerContract: fromAddress,
        moralisCategory,
        confidence: 'HIGH'
      };
    }
    
    // 2. KAUF DETECTION
    if (this.isPurchase(tx)) {
      return {
        type: 'GEKAUFTER_COIN',
        reason: 'Token purchase/swap',
        kaufpreis: this.getSafeValue(tx),
        moralisCategory,
        confidence: 'HIGH'
      };
    }
    
    // 3. VERKAUF DETECTION  
    if (this.isSale(tx)) {
      return {
        type: 'VERKAUF',
        reason: 'Token sale/swap out',
        moralisCategory,
        confidence: 'HIGH'
      };
    }
    
    // 4. DEFAULT: TRANSFER
    return {
      type: 'TRANSFER',
      reason: 'Simple transfer',
      moralisCategory,
      confidence: 'MEDIUM'
    };
  }

  /**
   * ROI EVENT DETECTION - ERWEITERT
   * Basiert auf Moralis Contract Detection + PulseChain Patterns
   */
  isROIEvent(tx) {
    const category = tx.category?.toLowerCase() || '';
    const summary = tx.summary?.toLowerCase() || '';
    const fromAddress = tx.from_address;
    
    // 1. Direkte ROI Flags (vom bestehenden System)
    if (tx.isPrinter || tx.printerProject || tx.isTaxable || 
        (tx.direction === 'in' && tx.isTaxable)) {
      return true;
    }
    
    // 2. Moralis Categories für ROI
    const roiCategories = [
      'airdrop', 'mint', 'contract interaction', 
      'deposit', 'withdraw', 'reward', 'yield'
    ];
    
    if (roiCategories.includes(category)) {
      return true;
    }
    
    // 3. Contract Address Pattern (wenn von Contract kommt)
    if (fromAddress && fromAddress !== tx.to_address) {
      // Check if it's a known contract interaction
      if (this.isKnownFarmingContract(fromAddress) ||
          this.hasContractPattern(summary)) {
        return true;
      }
      
      // NEUE ERWEITERTE CHECKS:
      const addr = fromAddress.toLowerCase();
      const roiPatterns = [
        '0x5f', '0xe9',  // Bekannte Printer aus PulseWatch
        'farm', 'stake', 'pool', 'liquidity', 'reward', 'yield'
      ];
      if (roiPatterns.some(p => addr.includes(p))) return true;
    }
    
    // 4. Token-basierte ROI Detection  
    const token = (tx.token_symbol || tx.tokenSymbol || '').toUpperCase();
    const roiTokens = ['WPLS', 'DAI', 'FINVESTA', 'TREASURY', 'PLSX', 'HEX'];
    if (tx.direction === 'in' && roiTokens.includes(token)) {
      // Zusätzliche Checks um Käufe auszuschließen
      if (!tx.from_address || tx.from_address.length < 20) return true;
    }
    
    // 5. Summary/Description Patterns
    const roiPatterns = [
      /farm/i, /stake/i, /reward/i, /yield/i, /liquidity/i,
      /printer/i, /mining/i, /airdrop/i, /claim/i, /harvest/i
    ];
    
    return roiPatterns.some(pattern => 
      pattern.test(summary) || pattern.test(category)
    );
  }

  /**
   * PURCHASE DETECTION
   */
  isPurchase(tx) {
    const category = tx.category?.toLowerCase() || '';
    const summary = tx.summary?.toLowerCase() || '';
    
    // Moralis Categories für Käufe
    const purchaseCategories = [
      'token swap', 'receive', 'token receive'
    ];
    
    if (purchaseCategories.includes(category)) {
      return true;
    }
    
    // DEX Swap Detection
    if (summary.includes('swap') || summary.includes('exchange')) {
      return true;
    }
    
    return false;
  }

  /**
   * SALE DETECTION
   */
  isSale(tx) {
    const category = tx.category?.toLowerCase() || '';
    const summary = tx.summary?.toLowerCase() || '';
    
    // Moralis Categories für Verkäufe
    const saleCategories = [
      'send', 'token send', 'token swap'
    ];
    
    if (saleCategories.includes(category)) {
      return true;
    }
    
    return false;
  }

  /**
   * FARMING CONTRACT DETECTION
   */
  isKnownFarmingContract(contractAddress) {
    // Check gegen bekannte Contract Addresses
    const known = Object.values(this.KNOWN_CONTRACTS);
    return known.includes(contractAddress);
  }

  /**
   * CONTRACT PATTERN DETECTION
   */
  hasContractPattern(summary) {
    return this.KNOWN_CONTRACTS.FARMING_PATTERNS
      .some(pattern => pattern.test(summary));
  }

  /**
   * HALTEFRIST BERECHNUNG
   */
  calculateHoldingDays(purchaseDate) {
    const now = new Date();
    const purchase = new Date(purchaseDate);
    const diffTime = Math.abs(now - purchase);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * STEUERFREIES DATUM BERECHNUNG (1 Jahr)
   */
  calculateTaxFreeDate(purchaseDate) {
    const purchase = new Date(purchaseDate);
    const taxFreeDate = new Date(purchase);
    taxFreeDate.setFullYear(taxFreeDate.getFullYear() + 1);
    return taxFreeDate;
  }

  /**
   * CATEGORIES EXTRAHIEREN
   */
  extractCategories(transactions) {
    const categories = {};
    transactions.forEach(tx => {
      const cat = tx.category || 'unknown';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return categories;
  }

  /**
   * TAX SUMMARY GENERIEREN
   */
  generateTaxSummary(processedData) {
    const now = new Date();
    
    return {
      gekaufteCoins: {
        anzahl: processedData.gekaufteCoins.length,
        gesamtwert: processedData.gekaufteCoins
          .reduce((sum, coin) => sum + (coin.kaufpreis || 0), 0),
        steuerfreiAnzahl: processedData.gekaufteCoins
          .filter(coin => coin.haltefristTage >= 365).length
      },
      
      roiEvents: {
        anzahl: processedData.roiEvents.length,
        gesamtwert: processedData.roiEvents
          .reduce((sum, roi) => sum + (roi.roiWert || 0), 0),
        steuerpflichtigerWert: processedData.roiEvents
          .reduce((sum, roi) => sum + (roi.roiWert || 0), 0) // Alles steuerpflichtig
      },
      
      verkaufteCoins: {
        anzahl: processedData.verkaufteCoins.length,
        gesamtwert: processedData.verkaufteCoins
          .reduce((sum, sale) => sum + (sale.verkaufspreis || 0), 0)
      },
      
      steuerJahr: now.getFullYear(),
      analyseDatum: now.toISOString()
    };
  }

  /**
   * FIFO CALCULATION FÜR VERKÄUFE
   */
  calculateFIFOGains(verkaufteCoins, gekaufteCoins) {
    const fifoResults = [];
    
    // Sortiere Käufe nach Datum (FIFO)
    const sortedPurchases = gekaufteCoins
      .sort((a, b) => new Date(a.kaufdatum) - new Date(b.kaufdatum));
    
    verkaufteCoins.forEach(sale => {
      const token = sale.token_symbol;
      
      // Finde ältesten Kauf für diesen Token
      const matchingPurchase = sortedPurchases
        .find(p => p.token_symbol === token && p.remaining > 0);
      
      if (matchingPurchase) {
        const holdingDays = this.calculateHoldingDays(matchingPurchase.kaufdatum);
        const gainLoss = sale.verkaufspreis - matchingPurchase.kaufpreis;
        
        fifoResults.push({
          sale,
          purchase: matchingPurchase,
          holdingDays,
          isSteuerfrei: holdingDays >= 365,
          gainLoss,
          steuerpflichtigerGewinn: holdingDays >= 365 ? 0 : Math.max(0, gainLoss)
        });
      }
    });
    
    return fifoResults;
  }

  /**
   * SICHERE WERT-EXTRAKTION - ERWEITERT
   */
  getSafeValue(tx) {
    const valueFields = [
      tx.valueEUR,
      tx.displayValueEUR,
      tx.totalValueEUR,
      tx.value_formatted,
      tx.value,
      tx.amount,
      tx.usd_value,
      tx.value_usd,
      tx.price_usd,
      tx.price_eur
    ];
    
    for (const field of valueFields) {
      if (field !== null && field !== undefined && field !== '') {
        const parsed = parseFloat(field);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
    
    return 0;
  }
}

// ===================================
// CURSOR INTEGRATION
// ===================================

/**
 * BACKEND INTEGRATION FÜR CURSOR
 */
async function implementMoralisGermanTax(walletAddress) {
  const taxSystem = new MoralisGermanTaxSystem();
  
  try {
    // Lade Wallet History mit Moralis
    const taxData = await taxSystem.getWalletTaxHistory(walletAddress);
    
    // FIFO Calculation
    const fifoResults = taxSystem.calculateFIFOGains(
      taxData.processedData.verkaufteCoins,
      taxData.processedData.gekaufteCoins
    );
    
    return {
      success: true,
      deutschesSteuerrecht: {
        gekaufteCoins: taxData.processedData.gekaufteCoins,
        roiEvents: taxData.processedData.roiEvents,
        verkaufteCoins: taxData.processedData.verkaufteCoins,
        fifoResults,
        summary: taxData.summary
      },
      moralisData: {
        totalTransactions: taxData.totalTransactions,
        categories: taxData.moralisCategories
      },
      disclaimer: 'Automatische Kategorisierung - Steuerberater empfohlen'
    };
    
  } catch (error) {
    console.error('Moralis German Tax Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ===================================
// EXPORT FÜR CURSOR
// ===================================
export {
  MoralisGermanTaxSystem,
  implementMoralisGermanTax
}; 