/**
 * 🔗 PulseScan Transaction Service
 * 
 * Ersetzt Moralis Transaction API durch verlässliche On-Chain-Daten
 * von https://api.scan.pulsechain.com
 * 
 * Stand: 14.06.2025 - Laut Arbeitsanweisung @dkudl
 */

export class ScanTransactionService {
  
  static BASE_URL = 'https://api.scan.pulsechain.com/api';
  static DEFAULT_LIMIT = 100;
  static MAX_RETRIES = 3;
  static RATE_LIMIT_DELAY = 200; // 200ms zwischen Calls

  /**
   * 🔗 Alle ERC20 Token Transfers für eine Wallet
   * @param {String} walletAddress - Wallet Address
   * @param {Object} options - Optionen {startBlock, endBlock, page, offset}
   * @returns {Array} - Array von Token Transfer Transaktionen
   */
  static async getERC20Transfers(walletAddress, options = {}) {
    console.log(`🔍 SCAN ERC20: Loading transfers for ${walletAddress}`);
    
    const params = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address: walletAddress,
      startblock: options.startBlock || '0',
      endblock: options.endBlock || '999999999',
      page: options.page || '1',
      offset: options.offset || this.DEFAULT_LIMIT,
      sort: 'desc'
    });

    const url = `${this.BASE_URL}?${params}`;
    
    try {
      const response = await this.fetchWithRetry(url);
      const data = await response.json();
      
      if (data.status === '1' && Array.isArray(data.result)) {
        console.log(`✅ SCAN ERC20: Loaded ${data.result.length} ERC20 transfers`);
        
        return data.result.map(tx => this.formatERC20Transaction(tx, walletAddress));
      } else {
        console.warn(`⚠️ SCAN ERC20: No results or error - ${data.message || 'Unknown error'}`);
        return [];
      }
      
    } catch (error) {
      console.error(`❌ SCAN ERC20: Error loading transfers - ${error.message}`);
      return [];
    }
  }

  /**
   * 🔗 Alle Native PLS Transfers für eine Wallet
   * @param {String} walletAddress - Wallet Address  
   * @param {Object} options - Optionen {startBlock, endBlock, page, offset}
   * @returns {Array} - Array von Native Transfer Transaktionen
   */
  static async getNativeTransfers(walletAddress, options = {}) {
    console.log(`🔍 SCAN NATIVE: Loading PLS transfers for ${walletAddress}`);
    
    const params = new URLSearchParams({
      module: 'account',
      action: 'txlist',
      address: walletAddress,
      startblock: options.startBlock || '0',
      endblock: options.endBlock || '999999999',
      page: options.page || '1',
      offset: options.offset || this.DEFAULT_LIMIT,
      sort: 'desc'
    });

    const url = `${this.BASE_URL}?${params}`;
    
    try {
      const response = await this.fetchWithRetry(url);
      const data = await response.json();
      
      if (data.status === '1' && Array.isArray(data.result)) {
        // Nur Transaktionen mit PLS-Wert filtern
        const nativeTransfers = data.result.filter(tx => 
          tx.value && tx.value !== '0'
        );
        
        console.log(`✅ SCAN NATIVE: Loaded ${nativeTransfers.length} native transfers`);
        
        return nativeTransfers.map(tx => this.formatNativeTransaction(tx, walletAddress));
      } else {
        console.warn(`⚠️ SCAN NATIVE: No results or error - ${data.message || 'Unknown error'}`);
        return [];
      }
      
    } catch (error) {
      console.error(`❌ SCAN NATIVE: Error loading transfers - ${error.message}`);
      return [];
    }
  }

  /**
   * 🔗 Komplette Transaction History (ERC20 + Native)
   * @param {String} walletAddress - Wallet Address
   * @param {Object} options - Optionen für beide APIs
   * @returns {Object} - {erc20Transfers, nativeTransfers, allTransactions}
   */
  static async getFullTransactionHistory(walletAddress, options = {}) {
    console.log(`🚀 SCAN FULL: Loading complete history for ${walletAddress}`);
    
    // Parallel laden für bessere Performance
    const [erc20Transfers, nativeTransfers] = await Promise.all([
      this.getERC20Transfers(walletAddress, options),
      this.getNativeTransfers(walletAddress, options)
    ]);
    
    // Alle Transaktionen kombinieren und nach Timestamp sortieren
    const allTransactions = [...erc20Transfers, ...nativeTransfers]
      .sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp));
    
    console.log(`✅ SCAN FULL: Loaded ${allTransactions.length} total transactions (${erc20Transfers.length} ERC20 + ${nativeTransfers.length} Native)`);
    
    return {
      erc20Transfers,
      nativeTransfers,
      allTransactions,
      totalCount: allTransactions.length,
      source: 'pulsechain_scan_api',
      walletAddress,
      loadedAt: new Date().toISOString()
    };
  }

  /**
   * 🔗 Massive History Loading mit Pagination
   * @param {String} walletAddress - Wallet Address
   * @param {Number} maxPages - Maximum Seiten zu laden (default: 50)
   * @returns {Object} - Vollständige History
   */
  static async getMassiveTransactionHistory(walletAddress, maxPages = 50) {
    console.log(`🚀 SCAN MASSIVE: Loading up to ${maxPages} pages for ${walletAddress}`);
    
    const allERC20 = [];
    const allNative = [];
    
    // ERC20 Transfers - mehrere Seiten
    for (let page = 1; page <= maxPages; page++) {
      console.log(`📄 SCAN ERC20: Loading page ${page}/${maxPages}...`);
      
      const erc20Page = await this.getERC20Transfers(walletAddress, { 
        page, 
        offset: 100 
      });
      
      if (erc20Page.length === 0) {
        console.log(`🏁 SCAN ERC20: No more data after page ${page}`);
        break;
      }
      
      allERC20.push(...erc20Page);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
    }
    
    // Native Transfers - mehrere Seiten  
    for (let page = 1; page <= maxPages; page++) {
      console.log(`📄 SCAN NATIVE: Loading page ${page}/${maxPages}...`);
      
      const nativePage = await this.getNativeTransfers(walletAddress, { 
        page, 
        offset: 100 
      });
      
      if (nativePage.length === 0) {
        console.log(`🏁 SCAN NATIVE: No more data after page ${page}`);
        break;
      }
      
      allNative.push(...nativePage);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
    }
    
    const allTransactions = [...allERC20, ...allNative]
      .sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp));
    
    console.log(`✅ SCAN MASSIVE: Loaded ${allTransactions.length} total transactions (${allERC20.length} ERC20 + ${allNative.length} Native)`);
    
    return {
      erc20Transfers: allERC20,
      nativeTransfers: allNative,
      allTransactions,
      totalCount: allTransactions.length,
      source: 'pulsechain_scan_massive',
      pagesLoaded: { erc20: maxPages, native: maxPages },
      walletAddress,
      loadedAt: new Date().toISOString()
    };
  }

  /**
   * 🔄 HTTP Request mit Retry Logic
   * @param {String} url - URL für Request
   * @returns {Response} - Fetch Response
   */
  static async fetchWithRetry(url) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔗 SCAN API: Attempt ${attempt}/${this.MAX_RETRIES} - ${url}`);
        
        const response = await fetch(url);
        
        if (response.ok) {
          return response;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ SCAN API: Attempt ${attempt} failed - ${error.message}`);
        
        if (attempt < this.MAX_RETRIES) {
          const delay = attempt * 1000; // 1s, 2s, 3s
          console.log(`🔄 SCAN API: Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 📝 ERC20 Transaction formatieren
   * @param {Object} tx - Raw Transaction von PulseScan
   * @param {String} walletAddress - Wallet Address für Direction
   * @returns {Object} - Formatierte Transaction
   */
  static formatERC20Transaction(tx, walletAddress) {
    const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
    
    return {
      hash: tx.hash,
      blockNumber: parseInt(tx.blockNumber),
      timeStamp: parseInt(tx.timeStamp),
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      from: tx.from,
      to: tx.to,
      value: tx.value,
      tokenName: tx.tokenName,
      tokenSymbol: tx.tokenSymbol,
      tokenDecimal: parseInt(tx.tokenDecimal),
      contractAddress: tx.contractAddress,
      gasUsed: parseInt(tx.gasUsed),
      gasPrice: tx.gasPrice,
      direction: isIncoming ? 'IN' : 'OUT',
      type: 'ERC20_TRANSFER',
      source: 'pulsechain_scan',
      walletAddress: walletAddress
    };
  }

  /**
   * 📝 Native Transaction formatieren
   * @param {Object} tx - Raw Transaction von PulseScan  
   * @param {String} walletAddress - Wallet Address für Direction
   * @returns {Object} - Formatierte Transaction
   */
  static formatNativeTransaction(tx, walletAddress) {
    const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
    
    return {
      hash: tx.hash,
      blockNumber: parseInt(tx.blockNumber),
      timeStamp: parseInt(tx.timeStamp),
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      from: tx.from,
      to: tx.to,
      value: tx.value,
      tokenName: 'PulseChain',
      tokenSymbol: 'PLS',
      tokenDecimal: 18,
      contractAddress: 'native',
      gasUsed: parseInt(tx.gasUsed),
      gasPrice: tx.gasPrice,
      direction: isIncoming ? 'IN' : 'OUT',
      type: 'NATIVE_TRANSFER',
      source: 'pulsechain_scan',
      walletAddress: walletAddress
    };
  }

  /**
   * 🔍 Transactions nach Zeitraum filtern
   * @param {Array} transactions - Transaction Array
   * @param {Number} days - Anzahl Tage zurück (z.B. 30 für letzten Monat)
   * @returns {Array} - Gefilterte Transactions
   */
  static filterTransactionsByDays(transactions, days) {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    return transactions.filter(tx => {
      const txTime = parseInt(tx.timeStamp) * 1000;
      return txTime >= cutoffTime;
    });
  }

  /**
   * 📊 Transaction Statistics berechnen
   * @param {Array} transactions - Transaction Array
   * @returns {Object} - Statistics
   */
  static calculateTransactionStats(transactions) {
    const incoming = transactions.filter(tx => tx.direction === 'IN');
    const outgoing = transactions.filter(tx => tx.direction === 'OUT');
    const erc20 = transactions.filter(tx => tx.type === 'ERC20_TRANSFER');
    const native = transactions.filter(tx => tx.type === 'NATIVE_TRANSFER');
    
    return {
      total: transactions.length,
      incoming: incoming.length,
      outgoing: outgoing.length,
      erc20: erc20.length,
      native: native.length,
      oldestTransaction: transactions.length > 0 ? 
        new Date(Math.min(...transactions.map(tx => parseInt(tx.timeStamp) * 1000))).toISOString() : null,
      newestTransaction: transactions.length > 0 ? 
        new Date(Math.max(...transactions.map(tx => parseInt(tx.timeStamp) * 1000))).toISOString() : null
    };
  }
}

export default ScanTransactionService; 