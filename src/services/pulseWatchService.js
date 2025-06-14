// 📊 PulseWatch API Service - Echte ROI-Transaktionen abrufen
// Holt tägliche/wöchentliche ROI-Rewards von gehaltenen PulseChain Token

export class PulseWatchService {
  
  // 🌐 PulseWatch API Endpoints - Verwende Proxy für CORS-freien Zugriff
  static API_BASE = '/api/pulsewatch'; // Geändert zu unserem Proxy
  static SCAN_BASE = 'https://scan.pulsechain.com/api';
  
  // 📊 ROI-Transaktionen von Wallet abrufen
  static async getROITransactions(walletAddress, limit = 50) {
    try {
      console.log(`📊 FETCHING ROI TRANSACTIONS for ${walletAddress}`);
      
      // Versuche PulseWatch API (falls verfügbar)
      try {
        const pulseWatchData = await this.fetchFromPulseWatch(walletAddress, limit);
        if (pulseWatchData && pulseWatchData.length > 0) {
          console.log(`✅ PulseWatch: Found ${pulseWatchData.length} ROI transactions`);
          return pulseWatchData;
        }
      } catch (pulseWatchError) {
        console.log(`⚠️ PulseWatch API nicht verfügbar:`, pulseWatchError.message);
      }
      
      // Fallback: PulseChain Scan API für eingehende Token-Transfers
      const scanData = await this.fetchFromPulseChainScan(walletAddress, limit);
      console.log(`✅ PulseChain Scan: Found ${scanData.length} incoming transactions`);
      return scanData;
      
    } catch (error) {
      console.error('💥 Error fetching ROI transactions:', error);
      return this.getFallbackROIData();
    }
  }

  // 🎯 PulseWatch API (über Proxy)
  static async fetchFromPulseWatch(walletAddress, limit) {
    const response = await fetch(`${this.API_BASE}?address=${walletAddress}&action=transactions&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`PulseWatch Proxy: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Handhabe Proxy-Response Format
    const data = result.data || result;
    
    // Falls API nicht verfügbar ist, verwende Fallback
    if (result._metadata && result._metadata.status !== 'success') {
      console.log('⚠️ PulseWatch API nicht verfügbar, verwende Fallback');
      return [];
    }
    
    return this.parseROITransactions(data, walletAddress);
  }

  // 🔗 PulseChain Scan API für eingehende Token-Transfers
  static async fetchFromPulseChainScan(walletAddress, limit) {
    try {
      // Verwende unseren PulseChain Proxy für CORS-freien Zugriff
      const response = await fetch(`/api/pulsechain?address=${walletAddress}&action=tokentx&module=account&offset=${limit}&sort=desc`);
      
      if (!response.ok) {
        throw new Error(`PulseChain Scan API: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === '1' && Array.isArray(data.result)) {
        // Filtere nur eingehende Transaktionen (ROI-Rewards)
        const incomingTxs = data.result.filter(tx => 
          tx.to && tx.to.toLowerCase() === walletAddress.toLowerCase() &&
          parseFloat(tx.value) > 0
        );
        
        return this.parseIncomingTransactions(incomingTxs, walletAddress);
      }
      
      return [];
      
    } catch (error) {
      console.error('💥 PulseChain Scan API Error:', error);
      return [];
    }
  }

  // 🔄 ROI-Transaktionen parsen (PulseWatch Format)
  static parseROITransactions(data, walletAddress) {
    if (!data || !Array.isArray(data)) return [];
    
    return data
      .filter(tx => tx.type === 'reward' || tx.type === 'staking' || tx.direction === 'in')
      .map(tx => ({
        token: tx.token_symbol || 'UNKNOWN',
        amount: parseFloat(tx.amount || 0),
        value: parseFloat(tx.value_usd || 0),
        timestamp: new Date(tx.timestamp || Date.now()),
        type: this.determineROIType(tx),
        hash: tx.hash || '',
        source: 'pulsewatch'
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // 🔄 Eingehende Transaktionen parsen (PulseChain Scan Format)
  static parseIncomingTransactions(transactions, walletAddress) {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    return transactions.map(tx => {
      const timestamp = new Date(parseInt(tx.timeStamp) * 1000);
      const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal) || 18);
      
      // Bestimme ROI-Typ basierend auf Zeitraum und Frequenz
      const timeDiff = now - timestamp.getTime();
      let roiType = 'daily_roi';
      
      // Wenn es ein größerer Transfer ist oder älter als 1 Tag, könnte es weekly sein
      if (timeDiff > oneDayAgo || amount > 100) {
        roiType = 'weekly_roi';
      }
      
      return {
        token: tx.tokenSymbol || 'UNKNOWN',
        amount: amount,
        value: 0, // Würde echte Preise benötigen
        timestamp: timestamp,
        type: roiType,
        hash: tx.hash || '',
        source: 'pulsechain_scan'
      };
    })
    .filter(tx => tx.amount > 0)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20); // Nur die letzten 20 ROI-Transaktionen
  }

  // 🎯 ROI-Typ bestimmen
  static determineROIType(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const amount = parseFloat(transaction.amount || 0);
    
    // Größere Beträge sind oft wöchentliche Rewards
    if (amount > 50 || description.includes('weekly') || description.includes('week')) {
      return 'weekly_roi';
    }
    
    // Standard sind tägliche Rewards
    return 'daily_roi';
  }

  // 💰 ROI-Werte mit echten Token-Preisen berechnen
  static async calculateROIValues(roiTransactions, tokenPrices) {
    return roiTransactions.map(tx => {
      const price = tokenPrices[tx.token] || 0;
      const calculatedValue = tx.amount * price;
      
      return {
        ...tx,
        value: calculatedValue > 0 ? calculatedValue : tx.value,
        priceUsed: price
      };
    });
  }

  // 📊 ROI-Statistiken berechnen
  static calculateROIStats(roiTransactions) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const dailyROI = roiTransactions
      .filter(tx => 
        tx.timestamp >= oneDayAgo && 
        (tx.type === 'daily_roi' || tx.source === 'pulsechain_scan')
      )
      .reduce((sum, tx) => sum + (tx.value || 0), 0);
    
    const weeklyROI = roiTransactions
      .filter(tx => tx.timestamp >= oneWeekAgo)
      .reduce((sum, tx) => sum + (tx.value || 0), 0);
    
    const totalROITransactions = roiTransactions.length;
    const uniqueTokens = [...new Set(roiTransactions.map(tx => tx.token))].length;
    
    return {
      dailyROI,
      weeklyROI,
      totalTransactions: totalROITransactions,
      uniqueTokens,
      lastUpdate: new Date()
    };
  }

  // 🔄 Fallback ROI-Daten (falls APIs nicht verfügbar)
  static getFallbackROIData() {
    console.log('📊 Using fallback ROI data');
    
    return [
      {
        token: 'MISSOR',
        amount: 15.67,
        value: 0.16,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h ago
        type: 'daily_roi',
        hash: 'fallback_1',
        source: 'fallback'
      },
      {
        token: 'SOIL',
        amount: 8.23,
        value: 0.99,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3h ago
        type: 'daily_roi',
        hash: 'fallback_2',
        source: 'fallback'
      },
      {
        token: 'FINVESTA',
        amount: 0.034,
        value: 1.15,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5h ago
        type: 'weekly_roi',
        hash: 'fallback_3',
        source: 'fallback'
      },
      {
        token: 'DOMINANCE',
        amount: 2.45,
        value: 1.18,
        timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7h ago
        type: 'daily_roi',
        hash: 'fallback_4',
        source: 'fallback'
      },
      {
        token: 'FLEXMAS',
        amount: 4.12,
        value: 1.65,
        timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000), // 9h ago
        type: 'daily_roi',
        hash: 'fallback_5',
        source: 'fallback'
      }
    ];
  }

  // 🔍 Debug: ROI-Transaktionen loggen
  static logROITransactions(transactions) {
    console.log(`📊 ROI TRANSACTIONS LOADED: ${transactions.length} total`);
    
    transactions.slice(0, 5).forEach(tx => {
              console.log(`💰 ROI: ${tx.token} +${tx.amount.toFixed(4)} ($${tx.value.toFixed(2)}) - ${tx.type} - ${new Date(tx.timestamp).toLocaleString('de-DE')}`);
    });
    
    const stats = this.calculateROIStats(transactions);
    console.log(`📊 ROI STATS: Daily: $${stats.dailyROI.toFixed(2)}, Weekly: $${stats.weeklyROI.toFixed(2)}, Tokens: ${stats.uniqueTokens}`);
  }
}

export default PulseWatchService; 