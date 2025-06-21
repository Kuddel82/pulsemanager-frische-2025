// ===================================
// GERMAN TAX DATA EXPORT - STEUERBERATER READY
// Saubere Datenaufbereitung OHNE Steuerberechnung
// Perfekte Grundlage für professionelle Steuerberatung
// ===================================

class GermanTaxDataExporter {
  constructor() {
    this.currentYear = new Date().getFullYear();
    // KEINE Steuerberechnungen - nur Datenstrukturierung!
  }

  /**
   * Hauptfunktion für Steuerberater-Export
   * @param {Array} transactions - Alle Wallet Transaktionen (10k+)
   * @returns {Object} Strukturierte Daten für Steuerberater
   */
  createTaxAdvisorDataExport(transactions) {
    console.log('🇩🇪 Creating Tax Advisor Data Export...', { count: transactions.length });
    
    // 1. Transaktionen nach Datum sortieren
    const sortedTransactions = this.sortTransactionsByDate(transactions);
    
    // 2. Transaktionen kategorisieren (OHNE Steuerberechnung)
    const categorized = this.categorizeForTaxAdvisor(sortedTransactions);
    
    // 3. Haltefrist-Informationen hinzufügen (OHNE Interpretation)
    const withHoldingPeriods = this.addHoldingPeriodInfo(categorized);
    
    // 4. ROI Events highlighten
    const roiHighlighted = this.highlightROIEvents(withHoldingPeriods);
    
    // 5. Export-Ready Data strukturieren
    return this.generateExportData(roiHighlighted, sortedTransactions);
  }

  /**
   * Transaktionen nach Datum sortieren
   */
  sortTransactionsByDate(transactions) {
    return transactions
      .filter(tx => tx.block_timestamp || tx.timestamp)
      .map(tx => ({
        ...tx,
        parsedDate: this.parseTransactionDate(tx),
        yearOfTransaction: this.getTransactionYear(tx)
      }))
      .sort((a, b) => a.parsedDate - b.parsedDate);
  }

  /**
   * Robustes Date Parsing
   */
  parseTransactionDate(tx) {
    const dateStr = tx.block_timestamp || tx.timestamp || tx.block_time;
    let parsedDate = new Date(dateStr);
    
    // Fallback für Invalid Dates
    if (isNaN(parsedDate)) {
      console.warn('Invalid date found:', dateStr, 'Using current date as fallback');
      parsedDate = new Date();
    }
    
    return parsedDate;
  }

  /**
   * Jahr der Transaktion bestimmen
   */
  getTransactionYear(tx) {
    const date = this.parseTransactionDate(tx);
    return date.getFullYear();
  }

  /**
   * Transaktionen für Steuerberater kategorisieren
   */
  categorizeForTaxAdvisor(transactions) {
    const categories = {
      purchases: [],      // Käufe/Eingänge
      sales: [],         // Verkäufe/Ausgänge  
      transfers: [],     // Reine Transfers
      roiEvents: [],     // ROI/Printer Events
      unknown: []        // Unklar kategorisierte
    };

    transactions.forEach(tx => {
      const category = this.determineTaxCategory(tx);
      const enrichedTx = this.enrichTransactionData(tx);
      
      categories[category].push(enrichedTx);
    });

    return categories;
  }

  /**
   * Steuer-Kategorie bestimmen (OHNE Steuerberechnung)
   */
  determineTaxCategory(tx) {
    // ROI/Printer Events identifizieren
    if (tx.isPrinter || tx.printerProject) {
      return 'roiEvents';
    }
    
    // Value-basierte Kategorisierung
    const valueEUR = parseFloat(tx.valueEUR || tx.displayValueEUR || 0);
    
    if (valueEUR > 0) {
      if (tx.direction === 'in') {
        return 'purchases';
      } else if (tx.direction === 'out') {
        return 'sales';
      }
    }
    
    // Transfers ohne Wert
    if (tx.direction === 'in' || tx.direction === 'out') {
      return 'transfers';
    }
    
    return 'unknown';
  }

  /**
   * Transaction Data anreichern
   */
  enrichTransactionData(tx) {
    return {
      // Original Data
      ...tx,
      
      // Enriched Data für Steuerberater
      taxCategory: this.determineTaxCategory(tx),
      
      // Formatierte Werte
      valueEUR: parseFloat(tx.valueEUR || tx.displayValueEUR || 0),
      valueUSD: parseFloat(tx.valueUSD || tx.displayValueUSD || 0),
      amount: parseFloat(tx.value_decimal || tx.amount || 0),
      
      // Date Formatting
      germanDate: this.formatGermanDate(tx.parsedDate),
      year: tx.yearOfTransaction,
      
      // Token Info
      token: tx.token_symbol || tx.tokenSymbol || 'UNKNOWN',
      tokenName: tx.token_name || tx.tokenName || 'Unknown Token',
      
      // Chain Info
      blockchain: tx.sourceChain || tx.chainSymbol || 'UNKNOWN',
      
      // Transaction Info
      hash: tx.transaction_hash || tx.transactionHash || tx.hash || 'N/A',
      direction: tx.direction || 'unknown',
      
      // ROI Info
      isROIEvent: tx.isPrinter || !!tx.printerProject,
      roiProject: tx.printerProject || null
    };
  }

  /**
   * Haltefrist-Informationen hinzufügen (OHNE Interpretation)
   */
  addHoldingPeriodInfo(categorized) {
    // Für jeden Token Kauf-Historie tracken
    const tokenPurchases = {};
    
    // Käufe sammeln
    categorized.purchases.forEach(purchase => {
      const token = purchase.token;
      if (!tokenPurchases[token]) {
        tokenPurchases[token] = [];
      }
      tokenPurchases[token].push(purchase);
    });
    
    // Verkäufe mit Haltefrist-Info anreichern
    categorized.sales = categorized.sales.map(sale => {
      const token = sale.token;
      const purchases = tokenPurchases[token] || [];
      
      // Ältesten Kauf finden (FIFO)
      const oldestPurchase = purchases
        .filter(p => p.parsedDate <= sale.parsedDate)
        .sort((a, b) => a.parsedDate - b.parsedDate)[0];
      
      if (oldestPurchase) {
        const holdingDays = Math.floor((sale.parsedDate - oldestPurchase.parsedDate) / (1000 * 60 * 60 * 24));
        const holdingYears = (holdingDays / 365).toFixed(2);
        
        return {
          ...sale,
          holdingPeriod: {
            days: holdingDays,
            years: holdingYears,
            oldestPurchaseDate: this.formatGermanDate(oldestPurchase.parsedDate),
            note: holdingDays >= 365 ? 'Potentiell steuerfrei (>1 Jahr)' : 'Spekulationsgeschäft (<1 Jahr)'
          }
        };
      }
      
      return {
        ...sale,
        holdingPeriod: {
          days: null,
          years: null,
          note: 'Kein entsprechender Kauf gefunden'
        }
      };
    });
    
    return categorized;
  }

  /**
   * ROI Events hervorheben
   */
  highlightROIEvents(categorized) {
    // ROI Events nach Projekt gruppieren
    const roiByProject = {};
    
    categorized.roiEvents.forEach(roi => {
      const project = roi.roiProject || 'Unknown Project';
      if (!roiByProject[project]) {
        roiByProject[project] = [];
      }
      roiByProject[project].push(roi);
    });
    
    // ROI Summary erstellen
    const roiSummary = Object.entries(roiByProject).map(([project, events]) => ({
      project,
      eventCount: events.length,
      totalValueEUR: events.reduce((sum, e) => sum + e.valueEUR, 0),
      firstEvent: events.sort((a, b) => a.parsedDate - b.parsedDate)[0]?.germanDate,
      lastEvent: events.sort((a, b) => b.parsedDate - a.parsedDate)[0]?.germanDate
    }));
    
    return {
      ...categorized,
      roiSummary
    };
  }

  /**
   * Export-Ready Data generieren
   */
  generateExportData(categorized, allTransactions) {
    const summary = this.createSummary(categorized, allTransactions);
    
    return {
      exportType: 'GERMAN_TAX_ADVISOR_DATA',
      disclaimer: 'KEINE STEUERBERATUNG - Nur Datensammlung für professionelle Steuerberatung',
      generatedAt: new Date().toISOString(),
      
      summary,
      
      // Kategorisierte Daten
      data: {
        purchases: categorized.purchases,
        sales: categorized.sales,
        transfers: categorized.transfers,
        roiEvents: categorized.roiEvents,
        roiSummary: categorized.roiSummary,
        unknown: categorized.unknown
      },
      
      // Export Optionen
      exports: {
        excel: this.generateExcelData(categorized),
        csv: this.generateCSVData(categorized),
        html: this.generateHTMLReport(categorized, summary)
      },
      
      // Steuerberater Notes
      taxAdvisorNotes: {
        methodology: 'FIFO-Prinzip für Haltefrist-Berechnung',
        holdingPeriod: 'Deutsche Haltefrist: 1 Jahr für Steuerfreiheit',
        roiTreatment: 'ROI/Printer Events als potentielle Einkünfte markiert',
        recommendation: 'Professionelle Steuerberatung für finale Berechnung empfohlen',
        limitations: [
          'Nur eine Wallet analysiert',
          'Andere Trades/Wallets nicht berücksichtigt',
          'Keine finalen Steuerberechnungen',
          'Haltefrist nur informativ berechnet'
        ]
      }
    };
  }

  /**
   * Summary erstellen
   */
  createSummary(categorized, allTransactions) {
    return {
      totalTransactions: allTransactions.length,
      
      categories: {
        purchases: categorized.purchases.length,
        sales: categorized.sales.length,
        transfers: categorized.transfers.length,
        roiEvents: categorized.roiEvents.length,
        unknown: categorized.unknown.length
      },
      
      totalValues: {
        purchaseValueEUR: categorized.purchases.reduce((sum, p) => sum + p.valueEUR, 0),
        salesValueEUR: categorized.sales.reduce((sum, s) => sum + s.valueEUR, 0),
        roiValueEUR: categorized.roiEvents.reduce((sum, r) => sum + r.valueEUR, 0)
      },
      
      dateRange: {
        firstTransaction: allTransactions[0]?.germanDate,
        lastTransaction: allTransactions[allTransactions.length - 1]?.germanDate
      },
      
      uniqueTokens: [...new Set(allTransactions.map(tx => tx.token || 'UNKNOWN'))].length,
      uniqueChains: [...new Set(allTransactions.map(tx => tx.blockchain || 'UNKNOWN'))].length
    };
  }

  /**
   * Excel Export Data
   */
  generateExcelData(categorized) {
    return {
      purchases: this.formatForExcel(categorized.purchases, 'Käufe'),
      sales: this.formatForExcel(categorized.sales, 'Verkäufe'),
      roiEvents: this.formatForExcel(categorized.roiEvents, 'ROI Events'),
      transfers: this.formatForExcel(categorized.transfers, 'Transfers')
    };
  }

  /**
   * CSV Export Data
   */
  generateCSVData(categorized) {
    const allForCSV = [
      ...categorized.purchases.map(tx => ({ ...tx, category: 'Kauf' })),
      ...categorized.sales.map(tx => ({ ...tx, category: 'Verkauf' })),
      ...categorized.roiEvents.map(tx => ({ ...tx, category: 'ROI Event' })),
      ...categorized.transfers.map(tx => ({ ...tx, category: 'Transfer' }))
    ];
    
    return this.convertToCSV(allForCSV);
  }

  /**
   * HTML Report generieren
   */
  generateHTMLReport(categorized, summary) {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Steuerberater Export - Crypto Transactions</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .summary-card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .disclaimer { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .purchase { background-color: #d4edda; }
        .sale { background-color: #f8d7da; }
        .roi { background-color: #d1ecf1; }
        .transfer { background-color: #e2e3e5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🇩🇪 Crypto Steuerberater Export</h1>
        <p><strong>Generiert am:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
        <p><strong>Wallet:</strong> ${categorized.purchases[0]?.from_address || 'N/A'}</p>
    </div>
    
    <div class="disclaimer">
        <h3>⚠️ Wichtiger Hinweis</h3>
        <p><strong>Dies ist KEINE Steuerberatung!</strong> Diese Datensammlung dient nur als Grundlage für Ihren Steuerberater. 
        Für finale Steuerberechnungen wenden Sie sich an einen qualifizierten Steuerberater.</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3>📊 Gesamt-Übersicht</h3>
            <p><strong>${summary.totalTransactions}</strong> Transaktionen</p>
            <p><strong>${summary.uniqueTokens}</strong> verschiedene Token</p>
            <p><strong>${summary.uniqueChains}</strong> Blockchains</p>
        </div>
        
        <div class="summary-card">
            <h3>💰 Käufe</h3>
            <p><strong>${summary.categories.purchases}</strong> Käufe</p>
            <p><strong>€${summary.totalValues.purchaseValueEUR.toFixed(2)}</strong> Gesamtwert</p>
        </div>
        
        <div class="summary-card">
            <h3>💸 Verkäufe</h3>
            <p><strong>${summary.categories.sales}</strong> Verkäufe</p>
            <p><strong>€${summary.totalValues.salesValueEUR.toFixed(2)}</strong> Gesamtwert</p>
        </div>
        
        <div class="summary-card">
            <h3>🎯 ROI Events</h3>
            <p><strong>${summary.categories.roiEvents}</strong> ROI Events</p>
            <p><strong>€${summary.totalValues.roiValueEUR.toFixed(2)}</strong> Gesamtwert</p>
        </div>
    </div>
    
    ${this.generateHTMLTable(categorized.purchases, 'Käufe', 'purchase')}
    ${this.generateHTMLTable(categorized.sales, 'Verkäufe', 'sale')}
    ${this.generateHTMLTable(categorized.roiEvents, 'ROI Events', 'roi')}
    
    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h3>📋 Empfehlungen für Steuerberater</h3>
        <ul>
            <li>FIFO-Prinzip für Haltefrist-Berechnung verwendet</li>
            <li>Deutsche Haltefrist: 1 Jahr für potentielle Steuerfreiheit</li>
            <li>ROI/Printer Events als potentielle Einkünfte markiert</li>
            <li>Nur eine Wallet analysiert - andere Trades/Wallets nicht berücksichtigt</li>
            <li>Professionelle Steuerberatung für finale Berechnung empfohlen</li>
        </ul>
    </div>
</body>
</html>`;
  }

  /**
   * HTML Table Helper
   */
  generateHTMLTable(transactions, title, cssClass) {
    if (transactions.length === 0) return '';
    
    return `
    <h2>${title} (${transactions.length})</h2>
    <table>
        <thead>
            <tr>
                <th>Datum</th>
                <th>Token</th>
                <th>Menge</th>
                <th>Wert (EUR)</th>
                <th>Blockchain</th>
                <th>Hash</th>
                ${title === 'Verkäufe' ? '<th>Haltefrist</th>' : ''}
                ${title === 'ROI Events' ? '<th>Projekt</th>' : ''}
            </tr>
        </thead>
        <tbody>
            ${transactions.slice(0, 100).map(tx => `
                <tr class="${cssClass}">
                    <td>${tx.germanDate}</td>
                    <td>${tx.token}</td>
                    <td>${tx.amount.toFixed(6)}</td>
                    <td>€${tx.valueEUR.toFixed(2)}</td>
                    <td>${tx.blockchain}</td>
                    <td style="font-size: 11px;">${tx.hash.substring(0, 20)}...</td>
                    ${title === 'Verkäufe' ? `<td>${tx.holdingPeriod?.days || 'N/A'} Tage</td>` : ''}
                    ${title === 'ROI Events' ? `<td>${tx.roiProject || 'Unknown'}</td>` : ''}
                </tr>
            `).join('')}
        </tbody>
    </table>
    ${transactions.length > 100 ? `<p><em>Erste 100 von ${transactions.length} Transaktionen gezeigt</em></p>` : ''}
    `;
  }

  /**
   * Utility Functions
   */
  formatGermanDate(date) {
    return new Date(date).toLocaleDateString('de-DE');
  }

  formatForExcel(transactions, category) {
    return transactions.map(tx => ({
      'Kategorie': category,
      'Datum': tx.germanDate,
      'Token': tx.token,
      'Menge': tx.amount,
      'Wert (EUR)': tx.valueEUR,
      'Blockchain': tx.blockchain,
      'Transaction Hash': tx.hash,
      'Haltefrist (Tage)': tx.holdingPeriod?.days || '',
      'ROI Projekt': tx.roiProject || ''
    }));
  }

  convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ];
    
    return csvRows.join('\n');
  }
}

// ===================================
// INTEGRATION FUNCTION
// ===================================

/**
 * Integration in bestehende API
 */
function integrateTaxAdvisorExport(transactions) {
  const exporter = new GermanTaxDataExporter();
  
  // Tax Advisor Export erstellen
  const exportData = exporter.createTaxAdvisorDataExport(transactions);
  
  return {
    success: true,
    data: exportData,
    disclaimer: 'KEINE STEUERBERATUNG - Nur Datensammlung für Steuerberater',
    implementationNotes: {
      transactionCount: transactions.length,
      safeApproach: 'Keine Steuerberechnungen - nur Datenstrukturierung',
      exports: ['Excel', 'CSV', 'HTML'],
      nextSteps: [
        'Frontend Integration für Export Downloads',
        'Disclaimer prominent anzeigen',
        'Optional: PDF Export hinzufügen'
      ]
    }
  };
}

// Export für Cursor
module.exports = {
  GermanTaxDataExporter,
  integrateTaxAdvisorExport
}; 