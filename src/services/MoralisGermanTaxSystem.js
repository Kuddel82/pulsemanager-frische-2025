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
   * MORALIS WALLET HISTORY API CALL
   */
  async callMoralisWalletHistory(walletAddress) {
    const url = `${this.MORALIS_BASE_URL}/wallets/${walletAddress}/history`;
    
    const params = new URLSearchParams({
      chain: 'pls', // PulseChain
      order: 'DESC',
      limit: '100', // Max pro Call
      // from_date: '2023-01-01', // Optional: Start date
    });
    
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'X-API-Key': this.MORALIS_API_KEY,
        'accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Moralis API Error: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * DEUTSCHE STEUER-KATEGORISIERUNG
   * Basiert auf Moralis automatischen Categories
   */
  processForGermanTax(transactions) {
    const germanTaxData = {
      gekaufteCoins: [],    // Coins mit Kaufpreis + Haltefrist
      roiEvents: [],        // ROI Events - immer steuerpflichtig
      verkaufteCoins: [],   // Verkäufe mit Haltefrist-Berechnung
      transfers: []         // Reine Transfers
    };

    transactions.forEach(tx => {
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
            roiWert: parseFloat(tx.value_formatted || 0),
            roiDatum: tx.block_timestamp,
            steuerpflichtig: true, // ROI immer steuerpflichtig
            printerContract: taxCategory.printerContract,
            taxInfo: taxCategory
          });
          break;
          
        case 'VERKAUF':
          germanTaxData.verkaufteCoins.push({
            ...tx,
            verkaufspreis: parseFloat(tx.value_formatted || 0),
            verkaufsdatum: tx.block_timestamp,
            taxInfo: taxCategory
          });
          break;
          
        default:
          germanTaxData.transfers.push(tx);
      }
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
        kaufpreis: parseFloat(tx.value_formatted || 0),
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
   * ROI EVENT DETECTION
   * Basiert auf Moralis Contract Detection
   */
  isROIEvent(tx) {
    const category = tx.category?.toLowerCase() || '';
    const summary = tx.summary?.toLowerCase() || '';
    const fromAddress = tx.from_address;
    
    // Moralis Categories für ROI
    const roiCategories = [
      'airdrop', 'mint', 'contract interaction', 
      'deposit', 'withdraw'
    ];
    
    if (roiCategories.includes(category)) {
      return true;
    }
    
    // Contract Address Pattern (wenn von Contract kommt)
    if (fromAddress && fromAddress !== tx.to_address) {
      // Check if it's a known contract interaction
      if (this.isKnownFarmingContract(fromAddress) ||
          this.hasContractPattern(summary)) {
        return true;
      }
    }
    
    // Summary Pattern Detection
    const roiPatterns = [
      /farm/i, /stake/i, /reward/i, /yield/i, /liquidity/i,
      /printer/i, /mining/i, /airdrop/i
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