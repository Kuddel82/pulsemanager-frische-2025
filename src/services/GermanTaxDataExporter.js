// ===================================
// COMPLETE CURSOR FIX - TAX EXPORT SYSTEM
// Repariert: Downloads, Preisberechnung, Kategorisierung
// NUR CSV + HTML Downloads - Excel entfernt
// ===================================

class GermanTaxDataExporter {
  constructor() {
    this.currentYear = new Date().getFullYear();
    this.walletAddress = null;
  }

  /**
   * MAIN FUNCTION - Fixed Value Calculation
   */
  createTaxAdvisorDataExport(transactions) {
    console.log('🇩🇪 Creating Tax Advisor Data Export...', { count: transactions.length });
    
    this.walletAddress = transactions[0]?.walletAddress || 
                        transactions[0]?.to_address || 
                        transactions[0]?.from_address ||
                        'UNKNOWN';
    
    // 1. Sort and categorize
    const sortedTransactions = this.sortTransactionsByDate(transactions);
    const categorized = this.categorizeForTaxAdvisor(sortedTransactions);
    
    // DEBUG - Check categorization
    console.log('📊 Categorization Results:', {
      purchases: categorized.purchases.length,
      sales: categorized.sales.length,
      transfers: categorized.transfers.length,
      roiEvents: categorized.roiEvents.length,
      unknown: categorized.unknown.length
    });
    
    const withHoldingPeriods = this.addHoldingPeriodInfo(categorized);
    const roiHighlighted = this.highlightROIEvents(withHoldingPeriods);
    
    return this.generateExportData(roiHighlighted, sortedTransactions);
  }

  /**
   * FIXED VALUE EXTRACTION - Prevents €546k Bug
   */
  getSafeValue(tx) {
    // Try multiple value fields
    const valueFields = [
      tx.valueEUR,
      tx.displayValueEUR,
      tx.value_eur,
      tx.eur_value
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

  /**
   * FIXED CATEGORIZATION
   */
  categorizeForTaxAdvisor(transactions) {
    const categories = {
      purchases: [],
      sales: [],
      transfers: [],
      roiEvents: [],
      unknown: []
    };

    transactions.forEach(tx => {
      const enrichedTx = this.enrichTransactionData(tx);
      const category = this.determineTaxCategory(enrichedTx);
      categories[category].push(enrichedTx);
    });

    return categories;
  }

  /**
   * FIXED TRANSACTION CATEGORIZATION
   */
  determineTaxCategory(tx) {
    // ROI Detection - Multiple patterns
    if (tx.isPrinter || 
        tx.printerProject || 
        tx.taxCategory === 'ROI' ||
        (tx.direction === 'in' && tx.isTaxable)) {
      return 'roiEvents';
    }
    
    // Value-based categorization with SAFE value extraction
    const value = this.getSafeValue(tx);
    
    if (value > 0) {
      if (tx.direction === 'in') {
        return 'purchases';
      } else if (tx.direction === 'out') {
        return 'sales';
      }
    }
    
    // Transfers without value
    if (tx.direction === 'in' || tx.direction === 'out') {
      return 'transfers';
    }
    
    return 'unknown';
  }

  /**
   * ENRICHED TRANSACTION DATA
   */
  enrichTransactionData(tx) {
    const safeValue = this.getSafeValue(tx);
    
    return {
      ...tx,
      // Tax categorization
      taxCategory: this.determineTaxCategory(tx),
      
      // SAFE VALUES - Prevents €546k bug
      valueEUR: safeValue,
      valueUSD: parseFloat(tx.valueUSD || tx.displayValueUSD || 0) || 0,
      amount: parseFloat(tx.amount || tx.value_decimal || 0) || 0,
      
      // Date formatting
      germanDate: this.formatGermanDate(this.parseTransactionDate(tx)),
      year: this.parseTransactionDate(tx).getFullYear(),
      
      // Token info
      token: tx.token_symbol || tx.tokenSymbol || 'UNKNOWN',
      tokenName: tx.token_name || tx.tokenName || 'Unknown Token',
      
      // Chain info - FIXED
      blockchain: this.getBlockchain(tx),
      
      // Transaction info
      hash: tx.transaction_hash || tx.transactionHash || tx.hash || 'N/A',
      direction: tx.direction || 'unknown',
      
      // ROI info
      isROIEvent: tx.isPrinter || !!tx.printerProject || (tx.direction === 'in' && tx.isTaxable),
      roiProject: tx.printerProject || null
    };
  }

  /**
   * FIXED BLOCKCHAIN DETECTION
   */
  getBlockchain(tx) {
    if (tx.sourceChain) return tx.sourceChain;
    if (tx.chainSymbol === 'PLS' || tx.chain === 'pls') return 'PulseChain';
    if (tx.chainSymbol === 'ETH' || tx.chain === 'eth') return 'Ethereum';
    return 'Unknown';
  }

  /**
   * ROBUST DATE PARSING
   */
  parseTransactionDate(tx) {
    const dateFields = [
      tx.block_timestamp,
      tx.timestamp,
      tx.block_time,
      tx.date
    ];
    
    for (const field of dateFields) {
      if (field) {
        const date = new Date(field);
        if (!isNaN(date)) return date;
      }
    }
    
    return new Date(); // Fallback
  }

  /**
   * DATE SORTING
   */
  sortTransactionsByDate(transactions) {
    return transactions
      .filter(tx => tx.block_timestamp || tx.timestamp)
      .sort((a, b) => {
        const dateA = this.parseTransactionDate(a);
        const dateB = this.parseTransactionDate(b);
        return dateA - dateB;
      });
  }

  /**
   * HOLDING PERIOD INFO
   */
  addHoldingPeriodInfo(categorized) {
    const tokenPurchases = {};
    
    // Collect purchases
    categorized.purchases.forEach(purchase => {
      const token = purchase.token;
      if (!tokenPurchases[token]) {
        tokenPurchases[token] = [];
      }
      tokenPurchases[token].push(purchase);
    });
    
    // Add holding periods to sales
    categorized.sales = categorized.sales.map(sale => {
      const token = sale.token;
      const purchases = tokenPurchases[token] || [];
      
      const oldestPurchase = purchases
        .filter(p => this.parseTransactionDate(p) <= this.parseTransactionDate(sale))
        .sort((a, b) => this.parseTransactionDate(a) - this.parseTransactionDate(b))[0];
      
      if (oldestPurchase) {
        const holdingDays = Math.floor(
          (this.parseTransactionDate(sale) - this.parseTransactionDate(oldestPurchase)) / (1000 * 60 * 60 * 24)
        );
        
        return {
          ...sale,
          holdingPeriod: {
            days: holdingDays,
            years: (holdingDays / 365).toFixed(2),
            oldestPurchaseDate: this.formatGermanDate(this.parseTransactionDate(oldestPurchase)),
            note: holdingDays >= 365 ? 'Potentiell steuerfrei (>1 Jahr)' : 'Spekulationsgeschäft (<1 Jahr)'
          }
        };
      }
      
      return { ...sale, holdingPeriod: { days: null, note: 'Kein Kauf gefunden' } };
    });
    
    return categorized;
  }

  /**
   * ROI HIGHLIGHTING
   */
  highlightROIEvents(categorized) {
    const roiByProject = {};
    
    categorized.roiEvents.forEach(roi => {
      const project = roi.roiProject || 'Unknown Project';
      if (!roiByProject[project]) {
        roiByProject[project] = [];
      }
      roiByProject[project].push(roi);
    });
    
    const roiSummary = Object.entries(roiByProject).map(([project, events]) => ({
      project,
      eventCount: events.length,
      totalValueEUR: events.reduce((sum, e) => sum + (e.valueEUR || 0), 0),
      firstEvent: events.sort((a, b) => this.parseTransactionDate(a) - this.parseTransactionDate(b))[0]?.germanDate,
      lastEvent: events.sort((a, b) => this.parseTransactionDate(b) - this.parseTransactionDate(a))[0]?.germanDate
    }));
    
    return { ...categorized, roiSummary };
  }

  /**
   * EXPORT DATA GENERATION - FIXED VALUE CALCULATION
   */
  generateExportData(categorized, allTransactions) {
    // SAFE VALUE SUMMATION - Prevents €546k bug
    const totalValues = {
      purchaseValueEUR: categorized.purchases.reduce((sum, p) => sum + (p.valueEUR || 0), 0),
      salesValueEUR: categorized.sales.reduce((sum, s) => sum + (s.valueEUR || 0), 0),
      roiValueEUR: categorized.roiEvents.reduce((sum, r) => sum + (r.valueEUR || 0), 0)
    };

    console.log('💰 Value Calculation Debug:', {
      purchases: categorized.purchases.length,
      purchaseValue: totalValues.purchaseValueEUR,
      sales: categorized.sales.length,
      salesValue: totalValues.salesValueEUR,
      roiEvents: categorized.roiEvents.length,
      roiValue: totalValues.roiValueEUR
    });

    const summary = {
      totalTransactions: allTransactions.length,
      categories: {
        purchases: categorized.purchases.length,
        sales: categorized.sales.length,
        transfers: categorized.transfers.length,
        roiEvents: categorized.roiEvents.length,
        unknown: categorized.unknown.length
      },
      totalValues,
      dateRange: {
        firstTransaction: allTransactions[0]?.germanDate,
        lastTransaction: allTransactions[allTransactions.length - 1]?.germanDate
      },
      uniqueTokens: [...new Set(allTransactions.map(tx => tx.token || 'UNKNOWN'))].length,
      uniqueChains: [...new Set(allTransactions.map(tx => tx.blockchain || 'UNKNOWN'))].length
    };

    return {
      exportType: 'GERMAN_TAX_ADVISOR_DATA',
      disclaimer: 'KEINE STEUERBERATUNG - Nur Datensammlung für professionelle Steuerberatung',
      generatedAt: new Date().toISOString(),
      summary,
      data: categorized,
      exports: {
        csv: this.generateCSVData(categorized),
        html: this.generateHTMLReport(categorized, summary)
      }
    };
  }

  /**
   * WORKING CSV GENERATION
   */
  generateCSVData(categorized) {
    const allTransactions = [
      ...(categorized.purchases || []).map(tx => ({ ...tx, category: 'Kauf' })),
      ...(categorized.sales || []).map(tx => ({ ...tx, category: 'Verkauf' })),
      ...(categorized.roiEvents || []).map(tx => ({ ...tx, category: 'ROI Event' })),
      ...(categorized.transfers || []).map(tx => ({ ...tx, category: 'Transfer' }))
    ];
    
    if (allTransactions.length === 0) {
      return 'Kategorie,Datum,Token,Menge,Wert (EUR),Blockchain,Hash\n"Keine Daten","N/A","N/A","0","0","N/A","N/A"';
    }
    
    const csvRows = [
      'Kategorie,Datum,Token,Menge,Wert (EUR),Blockchain,Direction,Hash,Haltefrist (Tage),ROI Projekt'
    ];
    
    allTransactions.forEach(tx => {
      const row = [
        `"${tx.category || 'Unknown'}"`,
        `"${tx.germanDate || 'N/A'}"`,
        `"${tx.token || 'UNKNOWN'}"`,
        `"${tx.amount || 0}"`,
        `"${tx.valueEUR || 0}"`,
        `"${tx.blockchain || 'Unknown'}"`,
        `"${tx.direction || 'unknown'}"`,
        `"${(tx.hash || 'N/A').substring(0, 20)}..."`,
        `"${tx.holdingPeriod?.days || ''}"`,
        `"${tx.roiProject || ''}"`
      ].join(',');
      csvRows.push(row);
    });
    
    return csvRows.join('\n');
  }

  /**
   * WORKING HTML GENERATION
   */
  generateHTMLReport(categorized, summary) {
    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Steuerberater Export - Crypto Transactions</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .summary-card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
        .disclaimer { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .purchase { background-color: #d4edda; }
        .sale { background-color: #f8d7da; }
        .roi { background-color: #d1ecf1; }
        .transfer { background-color: #e2e3e5; }
        h1, h2, h3 { color: #333; }
        .value { font-weight: bold; color: #007bff; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🇩🇪 Crypto Steuerberater Export</h1>
        <p><strong>Generiert am:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
        <p><strong>Wallet:</strong> ${this.walletAddress}</p>
    </div>
    
    <div class="disclaimer">
        <h3>⚠️ Wichtiger Hinweis</h3>
        <p><strong>Dies ist KEINE Steuerberatung!</strong> Diese Datensammlung dient nur als Grundlage für Ihren Steuerberater. 
        Für finale Steuerberechnungen wenden Sie sich an einen qualifizierten Steuerberater.</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3>📊 Übersicht</h3>
            <p><strong>${summary.totalTransactions}</strong> Transaktionen</p>
            <p><strong>${summary.uniqueTokens}</strong> Token</p>
            <p><strong>${summary.uniqueChains}</strong> Chains</p>
        </div>
        
        <div class="summary-card">
            <h3>💰 Käufe</h3>
            <p><strong>${summary.categories.purchases}</strong> Käufe</p>
            <p class="value">€${summary.totalValues.purchaseValueEUR.toFixed(2)}</p>
        </div>
        
        <div class="summary-card">
            <h3>💸 Verkäufe</h3>
            <p><strong>${summary.categories.sales}</strong> Verkäufe</p>
            <p class="value">€${summary.totalValues.salesValueEUR.toFixed(2)}</p>
        </div>
        
        <div class="summary-card">
            <h3>🎯 ROI Events</h3>
            <p><strong>${summary.categories.roiEvents}</strong> Events</p>
            <p class="value">€${summary.totalValues.roiValueEUR.toFixed(2)}</p>
        </div>
    </div>
    
    ${this.generateHTMLTable(categorized.purchases, 'Käufe', 'purchase')}
    ${this.generateHTMLTable(categorized.sales, 'Verkäufe', 'sale')}
    ${this.generateHTMLTable(categorized.roiEvents, 'ROI Events', 'roi')}
    
    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h3>📋 Hinweise für Steuerberater</h3>
        <ul>
            <li>FIFO-Methode für Haltefrist-Berechnung</li>
            <li>Deutsche Haltefrist: 1 Jahr für Steuerfreiheit</li>
            <li>ROI Events als potentielle Einkünfte markiert</li>
            <li>Nur eine Wallet analysiert - andere nicht berücksichtigt</li>
        </ul>
    </div>
</body>
</html>`;
  }

  /**
   * HTML TABLE HELPER
   */
  generateHTMLTable(transactions, title, cssClass) {
    if (!transactions || transactions.length === 0) return '';
    
    const maxShow = 50; // Limit für Performance
    const showTransactions = transactions.slice(0, maxShow);
    
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
                <th>Direction</th>
                ${title === 'Verkäufe' ? '<th>Haltefrist</th>' : ''}
                ${title === 'ROI Events' ? '<th>Projekt</th>' : ''}
            </tr>
        </thead>
        <tbody>
            ${showTransactions.map(tx => `
                <tr class="${cssClass}">
                    <td>${tx.germanDate || 'N/A'}</td>
                    <td>${tx.token || 'UNKNOWN'}</td>
                    <td>${(tx.amount || 0).toFixed(6)}</td>
                    <td>€${(tx.valueEUR || 0).toFixed(2)}</td>
                    <td>${tx.blockchain || 'Unknown'}</td>
                    <td>${tx.direction || 'unknown'}</td>
                    ${title === 'Verkäufe' ? `<td>${tx.holdingPeriod?.days || 'N/A'} Tage</td>` : ''}
                    ${title === 'ROI Events' ? `<td>${tx.roiProject || 'Unknown'}</td>` : ''}
                </tr>
            `).join('')}
        </tbody>
    </table>
    ${transactions.length > maxShow ? `<p><em>Erste ${maxShow} von ${transactions.length} Transaktionen gezeigt</em></p>` : ''}
    `;
  }

  /**
   * UTILITY FUNCTIONS
   */
  formatGermanDate(date) {
    if (!date || isNaN(date)) return 'Invalid Date';
    return new Date(date).toLocaleDateString('de-DE');
  }
}

export default GermanTaxDataExporter; 