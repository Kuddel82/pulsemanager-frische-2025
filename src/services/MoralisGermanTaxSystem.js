// ===================================
// MORALIS FALLBACK FIX
// Nutzt bestehende Transaction-Daten statt Moralis API
// ===================================

/**
 * FALLBACK GERMAN TAX SYSTEM
 * Verwendet die bereits geladenen 10k+ Transaktionen
 */
class FallbackGermanTaxSystem {
  constructor() {
    // Keine Moralis API - nutzt bestehende Daten
  }

  /**
   * HAUPTFUNKTION: Nutzt bestehende Transaction-Daten
   */
  async processExistingTransactions(existingTransactions) {
    try {
      console.log('🇩🇪 Processing existing transactions for German Tax...', { 
        count: existingTransactions.length 
      });
      
      // Process transactions für deutsches Steuerrecht
      const processedData = this.processForGermanTax(existingTransactions);
      
      return {
        success: true,
        totalTransactions: existingTransactions.length,
        processedData,
        summary: this.generateTaxSummary(processedData),
        method: 'FALLBACK_PROCESSING'
      };
      
    } catch (error) {
      console.error('❌ Fallback Tax Processing Error:', error);
      throw error;
    }
  }

  /**
   * DEUTSCHE STEUER-KATEGORISIERUNG
   * Basiert auf bestehenden Transaction-Feldern
   */
  processForGermanTax(transactions) {
    const germanTaxData = {
      gekaufteCoins: [],    
      roiEvents: [],        
      verkaufteCoins: [],   
      transfers: []         
    };

    transactions.forEach((tx, index) => {
      try {
        const taxCategory = this.determineGermanTaxCategory(tx);
        
        switch(taxCategory.type) {
          case 'GEKAUFTER_COIN':
            germanTaxData.gekaufteCoins.push({
              ...tx,
              kaufpreis: taxCategory.kaufpreis || 0,
              kaufdatum: tx.block_timestamp || tx.timestamp,
              haltefristStart: new Date(tx.block_timestamp || tx.timestamp),
              haltefristTage: this.calculateHoldingDays(tx.block_timestamp || tx.timestamp),
              steuerfreiAb: this.calculateTaxFreeDate(tx.block_timestamp || tx.timestamp),
              taxInfo: taxCategory,
              id: `kauf_${index}`
            });
            break;
            
          case 'ROI_EVENT':
            germanTaxData.roiEvents.push({
              ...tx,
              roiWert: this.getSafeValue(tx),
              roiDatum: tx.block_timestamp || tx.timestamp,
              steuerpflichtig: true,
              printerContract: tx.from_address || 'Unknown',
              printerName: taxCategory.printerName || 'Unknown Printer',
              taxInfo: taxCategory,
              id: `roi_${index}`
            });
            break;
            
          case 'VERKAUF':
            germanTaxData.verkaufteCoins.push({
              ...tx,
              verkaufspreis: this.getSafeValue(tx),
              verkaufsdatum: tx.block_timestamp || tx.timestamp,
              taxInfo: taxCategory,
              id: `verkauf_${index}`
            });
            break;
            
          default:
            germanTaxData.transfers.push({
              ...tx,
              id: `transfer_${index}`
            });
        }
      } catch (error) {
        console.warn('Transaction processing error:', error, tx);
        germanTaxData.transfers.push({
          ...tx,
          id: `error_${index}`,
          error: error.message
        });
      }
    });

    console.log('📊 German Tax Processing Results:', {
      gekaufteCoins: germanTaxData.gekaufteCoins.length,
      roiEvents: germanTaxData.roiEvents.length,
      verkaufteCoins: germanTaxData.verkaufteCoins.length,
      transfers: germanTaxData.transfers.length
    });

    return germanTaxData;
  }

  /**
   * VERBESSERTE DEUTSCHE STEUER-KATEGORISIERUNG
   */
  determineGermanTaxCategory(tx) {
    // Sichere Wert-Extraktion
    const value = this.getSafeValue(tx);
    const direction = tx.direction || 'unknown';
    const fromAddress = tx.from_address;
    const tokenSymbol = tx.token_symbol || tx.tokenSymbol || tx.symbol || 'UNKNOWN';
    
    // 1. ROI EVENT DETECTION - Erweiterte Patterns
    if (this.isROIEvent(tx)) {
      return {
        type: 'ROI_EVENT',
        reason: this.getROIReason(tx),
        printerName: this.getPrinterName(tx),
        confidence: 'HIGH'
      };
    }
    
    // 2. KAUF DETECTION
    if (direction === 'in' && value > 0 && !this.isROIEvent(tx)) {
      return {
        type: 'GEKAUFTER_COIN',
        reason: 'Token incoming with value',
        kaufpreis: value,
        confidence: 'HIGH'
      };
    }
    
    // 3. VERKAUF DETECTION  
    if (direction === 'out' && value > 0) {
      return {
        type: 'VERKAUF',
        reason: 'Token outgoing with value',
        confidence: 'HIGH'
      };
    }
    
    // 4. DEFAULT: TRANSFER
    return {
      type: 'TRANSFER',
      reason: 'No clear buy/sell/roi pattern',
      confidence: 'LOW'
    };
  }

  /**
   * ERWEITERTE ROI EVENT DETECTION
   */
  isROIEvent(tx) {
    // 1. Direkte ROI Flags (vom bestehenden System)
    if (tx.isPrinter || tx.printerProject || 
        (tx.direction === 'in' && tx.isTaxable)) {
      return true;
    }
    
    // 2. From-Address Patterns (Contract Interactions)
    if (tx.from_address && tx.direction === 'in') {
      const fromAddr = tx.from_address.toLowerCase();
      
      // Bekannte Printer/Farming Contract Patterns
      const contractPatterns = [
        // PulseChain bekannte Contracts
        '0x5f', '0xe9', // Aus deinen PulseWatch Daten
        
        // General Contract Patterns
        'farm', 'stake', 'pool', 'liquidity', 'reward'
      ];
      
      if (contractPatterns.some(pattern => fromAddr.includes(pattern))) {
        return true;
      }
    }
    
    // 3. Token Patterns (ROI Token Types)
    const token = (tx.token_symbol || tx.tokenSymbol || '').toUpperCase();
    const roiTokens = [
      'WPLS', 'PLSX', 'DAI', 'FINVESTA', 'TREASURY'
    ];
    
    if (tx.direction === 'in' && roiTokens.includes(token)) {
      // Zusätzliche Checks um echte Käufe auszuschließen
      if (!tx.from_address || tx.from_address.length < 10) {
        return true; // Wahrscheinlich ROI
      }
    }
    
    // 4. Summary/Description Patterns
    const summary = (tx.summary || tx.description || '').toLowerCase();
    const roiKeywords = ['reward', 'farm', 'stake', 'print', 'yield', 'airdrop'];
    
    if (roiKeywords.some(keyword => summary.includes(keyword))) {
      return true;
    }
    
    return false;
  }

  /**
   * ROI REASON BESTIMMUNG
   */
  getROIReason(tx) {
    if (tx.isPrinter) return 'Printer Event';
    if (tx.printerProject) return `Printer: ${tx.printerProject}`;
    if (tx.from_address) return 'Contract Interaction';
    return 'ROI Pattern Detected';
  }

  /**
   * PRINTER NAME EXTRAKTION
   */
  getPrinterName(tx) {
    if (tx.printerProject) return tx.printerProject;
    
    const token = tx.token_symbol || tx.tokenSymbol || '';
    const fromAddr = tx.from_address || '';
    
    // Pattern-basierte Namen
    if (token === 'DAI' && fromAddr.includes('5f')) return 'PDAI Printer';
    if (token === 'WPLS' && fromAddr.includes('e9')) return 'WPLS Printer';
    if (token === 'PLSX') return 'PLSX Printer';
    
    return `${token} Printer`;
  }

  /**
   * SICHERE WERT-EXTRAKTION
   */
  getSafeValue(tx) {
    const valueFields = [
      tx.valueEUR,
      tx.displayValueEUR,
      tx.value_eur,
      tx.totalValueEUR
    ];
    
    for (const field of valueFields) {
      if (field !== null && field !== undefined && field !== '') {
        const parsed = parseFloat(field);
        if (!isNaN(parsed) && parsed >= 0) {
          return parsed;
        }
      }
    }
    
    return 0;
  }

  /**
   * HALTEFRIST BERECHNUNG
   */
  calculateHoldingDays(date) {
    if (!date) return 0;
    const now = new Date();
    const transactionDate = new Date(date);
    const diffTime = Math.abs(now - transactionDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * STEUERFREIES DATUM BERECHNUNG
   */
  calculateTaxFreeDate(date) {
    if (!date) return new Date();
    const transactionDate = new Date(date);
    const taxFreeDate = new Date(transactionDate);
    taxFreeDate.setFullYear(taxFreeDate.getFullYear() + 1);
    return taxFreeDate;
  }

  /**
   * TAX SUMMARY GENERIEREN
   */
  generateTaxSummary(processedData) {
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
          .reduce((sum, roi) => sum + (roi.roiWert || 0), 0)
      },
      
      verkaufteCoins: {
        anzahl: processedData.verkaufteCoins.length,
        gesamtwert: processedData.verkaufteCoins
          .reduce((sum, sale) => sum + (sale.verkaufspreis || 0), 0)
      },
      
      steuerJahr: new Date().getFullYear(),
      analyseDatum: new Date().toISOString(),
      verarbeitungsMethode: 'FALLBACK_PROCESSING'
    };
  }
}

// ===================================
// BACKEND INTEGRATION UPDATE
// ===================================

/**
 * UPDATED BACKEND FUNCTION
 * Verwendet Fallback statt Moralis API
 */
async function implementFallbackGermanTax(walletAddress, existingTransactions) {
  const taxSystem = new FallbackGermanTaxSystem();
  
  try {
    console.log('🇩🇪 Starting Fallback German Tax Processing...');
    
    // Use existing transactions instead of Moralis API
    const taxData = await taxSystem.processExistingTransactions(existingTransactions);
    
    return {
      success: true,
      deutschesSteuerrecht: {
        gekaufteCoins: taxData.processedData.gekaufteCoins,
        roiEvents: taxData.processedData.roiEvents,
        verkaufteCoins: taxData.processedData.verkaufteCoins,
        summary: taxData.summary
      },
      processingInfo: {
        totalTransactions: taxData.totalTransactions,
        method: 'FALLBACK_PROCESSING',
        note: 'Using existing transaction data instead of Moralis API'
      },
      disclaimer: 'Fallback processing - Steuerberater empfohlen'
    };
    
  } catch (error) {
    console.error('Fallback German Tax Error:', error);
    return {
      success: false,
      error: error.message,
      fallback: true
    };
  }
}

// ===================================
// EXPORT
// ===================================
export {
  FallbackGermanTaxSystem,
  implementFallbackGermanTax
}; 