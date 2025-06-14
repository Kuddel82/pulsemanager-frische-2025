// 📄 TAX EXPORT SERVICE - DSGVO-konforme Steuerberichte
// Generiert CSV-Exporte für deutsche Steuererklärung

import { TransactionHistoryService } from './TransactionHistoryService';

export class TaxExportService {
  
  // 🇩🇪 German Tax Categories (Steuerliche Klassifikation)
  static TAX_CATEGORIES = {
    INCOME: 'Einkommen', // Sonstige Einkünfte §22 EStG
    CAPITAL_GAIN: 'Kapitalertrag', // Kapitalerträge §20 EStG
    MINING_REWARD: 'Mining-Vergütung', // Gewerbliche Tätigkeit
    STAKING_REWARD: 'Staking-Vergütung', // Sonstige Einkünfte
    DIVIDEND: 'Dividende', // Kapitalerträge
    AIRDROP: 'Airdrop', // Sonstige Einkünfte
    TRANSFER: 'Transfer', // Nicht steuerrelevant
    FEE: 'Gebühr' // Werbungskosten
  };
  
  // 📋 CSV Column Headers (German)
  static CSV_HEADERS = {
    STANDARD: [
      'Datum',
      'Transaktions-Hash',
      'Token-Symbol',
      'Token-Name',
      'Menge',
      'Preis (USD)',
      'Wert (USD)',
      'Typ',
      'Richtung',
      'Von Adresse',
      'Nach Adresse',
      'Steuer-Kategorie',
      'ROI-Transaktion',
      'Quelle',
      'Explorer-Link',
      'DexScreener-Link',
      'Notizen'
    ],
    
    DETAILED: [
      'Datum',
      'Zeit',
      'Transaktions-Hash',
      'Block-Nummer',
      'Token-Adresse',
      'Token-Symbol',
      'Token-Name',
      'Token-Dezimalstellen',
      'Menge (Raw)',
      'Menge (Formatiert)',
      'Token-Preis (USD)',
      'Gesamt-Wert (USD)',
      'Transaktions-Typ',
      'Richtung',
      'Von Adresse',
      'Nach Adresse',
      'Wallet-Adresse',
      'Gas-Verbrauch',
      'Gas-Preis',
      'Gas-Gebühr (USD)',
      'Steuer-Kategorie',
      'ROI-Transaktion',
      'Quell-Typ',
      'Explorer-Link',
      'DexScreener-Link',
      'Erstellt am',
      'Aktualisiert am'
    ],
    
    SUMMARY: [
      'Zeitraum',
      'Anzahl Transaktionen',
      'Anzahl ROI-Transaktionen',
      'Gesamt-Wert (USD)',
      'ROI-Wert (USD)',
      'Einzigartige Token',
      'Durchschnittlicher Transaktions-Wert'
    ]
  };
  
  /**
   * 🎯 MAIN: Generate comprehensive tax report
   */
  static async generateTaxReport(userId, options = {}) {
    const {
      startDate = null,
      endDate = null,
      walletAddress = null,
      format = 'standard', // 'standard', 'detailed', 'summary'
      currency = 'USD',
      language = 'de',
      includeNonROI = true,
      groupByToken = false
    } = options;
    
    console.log(`📊 Generating tax report for user ${userId}...`);
    
    try {
      // 1. Get transaction data
      const reportData = await TransactionHistoryService.generateTaxReport(userId, {
        startDate,
        endDate,
        walletAddress
      });
      
      // 2. Generate different export formats
      const exports = {
        csv: {
          standard: this.generateStandardCSV(reportData.transactions, options),
          detailed: this.generateDetailedCSV(reportData.transactions, options),
          summary: this.generateSummaryCSV(reportData.byMonth, options)
        },
        
        summary: reportData.summary,
        byToken: reportData.byToken,
        byPeriod: reportData.byMonth,
        
        metadata: {
          generatedAt: new Date().toISOString(),
          userId,
          options,
          totalTransactions: reportData.transactions.length,
          dateRange: {
            from: startDate,
            to: endDate
          }
        }
      };
      
      console.log(`✅ Tax report generated successfully`);
      return exports;
      
    } catch (error) {
      console.error('❌ Tax report generation failed:', error);
      throw error;
    }
  }
  
  /**
   * 📄 Generate Standard CSV (for most users)
   */
  static generateStandardCSV(transactions, options = {}) {
    const { includeNonROI = true } = options;
    
    // Filter transactions if needed
    const filteredTx = includeNonROI ? transactions : transactions.filter(tx => tx.is_roi_transaction);
    
    // Generate CSV content
    let csvContent = this.CSV_HEADERS.STANDARD.join(';') + '\n';
    
    filteredTx.forEach(tx => {
      const row = [
        this.formatDate(tx.block_timestamp),
        tx.tx_hash || '',
        tx.token_symbol || '',
        tx.token_name || '',
        this.formatNumber(tx.amount),
        this.formatNumber(tx.token_price_usd),
        this.formatNumber(tx.value_usd),
        this.translateTransactionType(tx.transaction_type),
        this.translateDirection(tx.direction),
        tx.from_address || '',
        tx.to_address || '',
        this.classifyForTax(tx),
        tx.is_roi_transaction ? 'Ja' : 'Nein',
        this.translateSourceType(tx.source_type),
        tx.explorer_url || '',
        tx.dex_screener_url || '',
        this.generateNotes(tx)
      ];
      
      csvContent += row.map(field => `"${field}"`).join(';') + '\n';
    });
    
    return {
      content: csvContent,
      filename: `PulseManager_Steuer_${this.formatFilename(new Date())}.csv`,
      records: filteredTx.length
    };
  }
  
  /**
   * 📋 Generate Detailed CSV (for tax advisors)
   */
  static generateDetailedCSV(transactions, options = {}) {
    let csvContent = this.CSV_HEADERS.DETAILED.join(';') + '\n';
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.block_timestamp);
      const row = [
        this.formatDate(tx.block_timestamp, 'date'),
        this.formatDate(tx.block_timestamp, 'time'),
        tx.tx_hash || '',
        tx.block_number || '',
                  tx.contract_address || '',
        tx.token_symbol || '',
        tx.token_name || '',
        tx.decimals || '',
        tx.amount_raw || '',
        this.formatNumber(tx.amount),
        this.formatNumber(tx.token_price_usd),
        this.formatNumber(tx.value_usd),
        this.translateTransactionType(tx.transaction_type),
        this.translateDirection(tx.direction),
        tx.from_address || '',
        tx.to_address || '',
        tx.wallet_address || '',
        tx.gas_used || '',
        tx.gas_price || '',
        this.formatNumber(tx.gas_fee_usd),
        this.classifyForTax(tx),
        tx.is_roi_transaction ? 'Ja' : 'Nein',
        this.translateSourceType(tx.source_type),
        tx.explorer_url || '',
        tx.dex_screener_url || '',
        this.formatDate(tx.created_at),
        this.formatDate(tx.updated_at)
      ];
      
      csvContent += row.map(field => `"${field}"`).join(';') + '\n';
    });
    
    return {
      content: csvContent,
      filename: `PulseManager_Detailliert_${this.formatFilename(new Date())}.csv`,
      records: transactions.length
    };
  }
  
  /**
   * 📈 Generate Summary CSV (monthly/yearly overview)
   */
  static generateSummaryCSV(periodData, options = {}) {
    let csvContent = this.CSV_HEADERS.SUMMARY.join(';') + '\n';
    
    periodData.forEach(period => {
      const row = [
        period.period,
        period.totalTransactions,
        period.totalROITransactions,
        this.formatNumber(period.totalValueUSD),
        this.formatNumber(period.totalROIValueUSD),
        period.uniqueTokenCount,
        this.formatNumber(period.totalValueUSD / period.totalTransactions)
      ];
      
      csvContent += row.map(field => `"${field}"`).join(';') + '\n';
    });
    
    return {
      content: csvContent,
      filename: `PulseManager_Zusammenfassung_${this.formatFilename(new Date())}.csv`,
      records: periodData.length
    };
  }
  
  /**
   * 🏷️ Classify transaction for German tax purposes
   */
  static classifyForTax(transaction) {
    // ROI transactions are typically taxable income
    if (transaction.is_roi_transaction) {
      if (transaction.source_type === 'mint') {
        return this.TAX_CATEGORIES.MINING_REWARD;
      }
      if (transaction.token_symbol === 'HEX' || transaction.token_symbol === 'INC') {
        return this.TAX_CATEGORIES.STAKING_REWARD;
      }
      return this.TAX_CATEGORIES.INCOME;
    }
    
    // Regular transfers are usually not taxable
    return this.TAX_CATEGORIES.TRANSFER;
  }
  
  /**
   * 🌐 Translation helpers
   */
  static translateTransactionType(type) {
    const translations = {
      'transfer': 'Transfer',
      'mint': 'Mint',
      'burn': 'Burn',
      'stake': 'Staking',
      'unstake': 'Unstaking',
      'reward': 'Belohnung',
      'dividend': 'Dividende'
    };
    return translations[type] || type;
  }
  
  static translateDirection(direction) {
    const translations = {
      'in': 'Eingehend',
      'out': 'Ausgehend'
    };
    return translations[direction] || direction;
  }
  
  static translateSourceType(sourceType) {
    const translations = {
      'mint': 'Mint/Drucker',
      'transfer': 'Transfer',
      'unknown': 'Unbekannt',
      'staking': 'Staking',
      'dividend': 'Dividende'
    };
    return translations[sourceType] || sourceType;
  }
  
  /**
   * 📝 Generate notes for transaction
   */
  static generateNotes(tx) {
    const notes = [];
    
    if (tx.is_roi_transaction) {
      notes.push('ROI-Transaktion');
    }
    
    if (tx.source_type === 'mint') {
      notes.push('Mint-Transaktion (Drucker)');
    }
    
    if (tx.value_usd && tx.value_usd > 1000) {
      notes.push('Hoher Wert (>$1000)');
    }
    
    return notes.join(', ');
  }
  
  /**
   * 🔢 Formatting helpers
   */
  static formatNumber(value, decimals = 8) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    
    // German number format (comma as decimal separator)
    return parseFloat(value).toLocaleString('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  }
  
  static formatDate(dateString, format = 'datetime') {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    switch (format) {
      case 'date':
        return date.toLocaleDateString('de-DE');
      case 'time':
        return new Date(date).toLocaleString('de-DE');
      case 'datetime':
      default:
        return date.toLocaleString('de-DE');
    }
  }
  
  static formatFilename(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }
  
  /**
   * 💾 Download CSV file
   */
  static downloadCSV(csvData, filename) {
    try {
      // Create blob with UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvData], { 
        type: 'text/csv;charset=utf-8' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ CSV downloaded: ${filename}`);
      return true;
      
    } catch (error) {
      console.error('❌ CSV download failed:', error);
      return false;
    }
  }
  
  /**
   * 🔗 Generate links for external verification
   */
  static generateVerificationLinks(transactions) {
    const links = {
      pulseScan: [],
      dexScreener: [],
      summary: {
        totalTransactions: transactions.length,
                  uniqueTokens: [...new Set(transactions.map(tx => tx.contract_address))].length,
        dateRange: {
                  from: transactions[transactions.length - 1]?.block_timestamp,
        to: transactions[0]?.block_timestamp
        }
      }
    };
    
    transactions.forEach(tx => {
      if (tx.explorer_url) {
        links.pulseScan.push({
          hash: tx.tx_hash,
          url: tx.explorer_url,
          date: tx.block_timestamp
        });
      }
      
      if (tx.dex_screener_url) {
        links.dexScreener.push({
          token: tx.token_symbol,
          url: tx.dex_screener_url,
          address: tx.contract_address
        });
      }
    });
    
    // Remove duplicates
    links.dexScreener = links.dexScreener.filter((item, index, self) => 
      index === self.findIndex(i => i.address === item.address)
    );
    
    return links;
  }
  
  /**
   * 📊 Generate tax year summary
   */
  static generateTaxYearSummary(transactions, year) {
    const yearTransactions = transactions.filter(tx => {
      const txYear = new Date(tx.block_timestamp).getFullYear();
      return txYear === year;
    });
    
    const roiTransactions = yearTransactions.filter(tx => tx.is_roi_transaction);
    
    return {
      year,
      totalTransactions: yearTransactions.length,
      roiTransactions: roiTransactions.length,
      totalValue: yearTransactions.reduce((sum, tx) => sum + (tx.value_usd || 0), 0),
      roiValue: roiTransactions.reduce((sum, tx) => sum + (tx.value_usd || 0), 0),
      
      byMonth: this.groupByMonth(yearTransactions),
      byToken: this.groupByToken(roiTransactions),
      
      taxableIncome: roiTransactions.reduce((sum, tx) => sum + (tx.value_usd || 0), 0),
      
      // German tax specific
      paragraph22Income: roiTransactions
        .filter(tx => ['STAKING_REWARD', 'INCOME'].includes(this.classifyForTax(tx)))
        .reduce((sum, tx) => sum + (tx.value_usd || 0), 0),
        
      paragraph20Income: roiTransactions
        .filter(tx => ['CAPITAL_GAIN', 'DIVIDEND'].includes(this.classifyForTax(tx)))
        .reduce((sum, tx) => sum + (tx.value_usd || 0), 0)
    };
  }
  
  static groupByMonth(transactions) {
    const monthMap = {};
    
    transactions.forEach(tx => {
      const month = new Date(tx.block_timestamp).toISOString().slice(0, 7); // YYYY-MM
      if (!monthMap[month]) {
        monthMap[month] = { count: 0, value: 0, roi: 0 };
      }
      monthMap[month].count++;
      monthMap[month].value += tx.value_usd || 0;
      if (tx.is_roi_transaction) {
        monthMap[month].roi += tx.value_usd || 0;
      }
    });
    
    return Object.entries(monthMap)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
  
  static groupByToken(transactions) {
    const tokenMap = {};
    
    transactions.forEach(tx => {
      const key = tx.token_symbol || tx.contract_address;
      if (!tokenMap[key]) {
        tokenMap[key] = {
          symbol: tx.token_symbol,
          address: tx.contract_address,
          count: 0,
          totalValue: 0
        };
      }
      tokenMap[key].count++;
      tokenMap[key].totalValue += tx.value_usd || 0;
    });
    
    return Object.values(tokenMap).sort((a, b) => b.totalValue - a.totalValue);
  }
} 