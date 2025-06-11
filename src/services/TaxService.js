/*
📊 TAX SERVICE: Serverseitiges Caching + korrekte Steuerlogik
Ziel: Unbegrenzte Transaktionen + DSGVO-konforme Steuerberichte
*/

import { supabase } from "@/lib/supabaseClient";

export class TaxService {
  // 🔧 KONFIGURATION
  static CONFIG = {
    MAX_TRANSACTIONS_PER_REQUEST: 10000,  // PulseChain API Limit
    CACHE_EXPIRY_HOURS: 24,               // Cache-Gültigkeit
    PAGINATION_SIZE: 1000,                // Batch-Größe für API-Aufrufe
    MIN_TAX_VALUE_USD: 0.01               // Mindest-Wert für Steuerrelevanz
  };

  /**
   * 🚀 HAUPTFUNKTION: Lade vollständige Transaktionshistorie mit Caching
   */
  static async fetchFullTransactionHistory(userId, wallets) {
    console.log(`📊 TAX SERVICE: Loading transaction history for user ${userId}`);
    
    try {
      // 1. Prüfe Cache in Supabase
      const cachedData = await this.getCachedTransactions(userId);
      
      if (cachedData.isValid && cachedData.transactions.length > 0) {
        console.log(`✅ CACHE HIT: Found ${cachedData.transactions.length} cached transactions`);
        return this.processTransactionsForTax(cachedData.transactions);
      }
      
      console.log(`🔄 CACHE MISS: Loading fresh transaction data...`);
      
      // 2. Lade ALLE Transaktionen von PulseChain API (paginiert)
      const allTransactions = await this.loadAllTransactionsPaginated(wallets);
      
      // 3. Preise für Transaktionen laden
      const transactionsWithPrices = await this.enrichTransactionsWithPrices(allTransactions);
      
      // 4. In Supabase cachen
      await this.cacheTransactions(userId, transactionsWithPrices);
      
      // 5. Für Steuerreport verarbeiten
      const taxData = this.processTransactionsForTax(transactionsWithPrices);
      
      console.log(`✅ TAX SERVICE: Loaded ${allTransactions.length} transactions, ${taxData.taxableTransactions.length} taxable`);
      return taxData;
      
    } catch (error) {
      console.error('💥 TAX SERVICE: Error loading transaction history:', error);
      throw error;
    }
  }

  /**
   * 💾 Prüfe gecachte Transaktionen in Supabase
   */
  static async getCachedTransactions(userId) {
    try {
      const cacheExpiry = new Date();
      cacheExpiry.setHours(cacheExpiry.getHours() - this.CONFIG.CACHE_EXPIRY_HOURS);
      
      const { data, error } = await supabase
        .from("transactions_cache")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", cacheExpiry.toISOString())
        .order("block_timestamp", { ascending: false });
      
      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ TAX CACHE: Could not load cache:', error.code);
        return { isValid: false, transactions: [] };
      }
      
      const transactions = data || [];
      const isValid = transactions.length > 0;
      
      return {
        isValid,
        transactions,
        cacheAge: isValid ? new Date() - new Date(transactions[0].created_at) : 0
      };
      
    } catch (error) {
      console.warn('⚠️ TAX CACHE: Cache check failed:', error);
      return { isValid: false, transactions: [] };
    }
  }

  /**
   * 🔄 Lade ALLE Transaktionen paginiert (kein Limit!)
   */
  static async loadAllTransactionsPaginated(wallets) {
    const allTransactions = [];
    
    for (const wallet of wallets) {
      console.log(`📡 Loading ALL transactions for wallet ${wallet.address}...`);
      
      let page = 1;
      let hasMore = true;
      let totalLoaded = 0;
      
      while (hasMore) {
        try {
          // PulseChain API mit Pagination
          const response = await fetch(
            `/api/pulsechain-proxy?address=${wallet.address}&action=tokentx&module=account&page=${page}&offset=${this.CONFIG.PAGINATION_SIZE}&sort=desc`
          );
          
          if (!response.ok) {
            console.warn(`⚠️ API Error for wallet ${wallet.address} page ${page}: ${response.status}`);
            break;
          }
          
          const data = await response.json();
          
          if (data.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
            // Verarbeite Transaktionen
            const processedTx = data.result.map(tx => ({
              walletId: wallet.id,
              walletAddress: wallet.address,
              txHash: tx.hash,
              blockTimestamp: new Date(parseInt(tx.timeStamp) * 1000),
              blockNumber: parseInt(tx.blockNumber),
              
              tokenSymbol: tx.tokenSymbol || 'UNKNOWN',
              tokenName: tx.tokenName || 'Unknown Token',
              contractAddress: tx.contractAddress,
              tokenDecimal: parseInt(tx.tokenDecimal) || 18,
              
              from: tx.from?.toLowerCase(),
              to: tx.to?.toLowerCase(),
              
              // Korrekte Amount-Berechnung
              rawValue: tx.value,
              amount: this.calculateTokenAmount(tx.value, tx.tokenDecimal),
              
              // ROI-Erkennung (Nulladresse = Minting)
              isIncoming: tx.to?.toLowerCase() === wallet.address.toLowerCase(),
              isROI: tx.from === '0x0000000000000000000000000000000000000000',
              
              // Basis-Daten
              gas: parseInt(tx.gas),
              gasPrice: parseInt(tx.gasPrice),
              gasUsed: parseInt(tx.gasUsed),
              confirmations: parseInt(tx.confirmations),
              
              // Verarbeitungsinfo
              source: 'pulsechain_api',
              processedAt: new Date()
            }));
            
            allTransactions.push(...processedTx);
            totalLoaded += processedTx.length;
            
            console.log(`📊 Wallet ${wallet.address}: Page ${page} - ${processedTx.length} transactions (Total: ${totalLoaded})`);
            
            // Nächste Seite
            page++;
            
            // Rate Limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } else {
            // Keine weiteren Transaktionen
            hasMore = false;
            console.log(`✅ Wallet ${wallet.address}: Completed - ${totalLoaded} total transactions`);
          }
          
        } catch (error) {
          console.error(`💥 Error loading transactions for wallet ${wallet.address} page ${page}:`, error);
          hasMore = false;
        }
      }
    }
    
    console.log(`🎯 TOTAL TRANSACTIONS LOADED: ${allTransactions.length}`);
    return allTransactions;
  }

  /**
   * 💰 Reichere Transaktionen mit Preisen an
   */
  static async enrichTransactionsWithPrices(transactions) {
    console.log(`💰 Enriching ${transactions.length} transactions with prices...`);
    
    // Gruppiere nach Contract-Adressen für effiziente Preis-Abfrage
    const contractAddresses = [...new Set(transactions.map(tx => tx.contractAddress))];
    const priceMap = new Map();
    
    // Lade Preise für alle Contracts (vereinfacht)
    for (const contractAddress of contractAddresses.slice(0, 100)) { // Limit für Performance
      try {
        const response = await fetch(
                      `/api/moralis-prices?endpoint=token-prices&addresses=${contractAddress}&chain=369`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.pairs && data.pairs[0]?.priceUsd) {
            priceMap.set(contractAddress.toLowerCase(), parseFloat(data.pairs[0].priceUsd));
          }
        }
      } catch (error) {
        // Silent fail für Preise
      }
    }
    
    // Berechne USD-Werte
    const enrichedTransactions = transactions.map(tx => {
      const price = priceMap.get(tx.contractAddress?.toLowerCase()) || 0;
      const valueUSD = price > 0 ? tx.amount * price : 0;
      
      return {
        ...tx,
        priceUSD: price,
        valueUSD: valueUSD,
        hasPriceData: price > 0
      };
    });
    
    console.log(`💰 Price enrichment complete: ${priceMap.size} tokens with prices`);
    return enrichedTransactions;
  }

  /**
   * 💾 Cache Transaktionen in Supabase
   */
  static async cacheTransactions(userId, transactions) {
    try {
      console.log(`💾 Caching ${transactions.length} transactions for user ${userId}...`);
      
      // Lösche alte Cache-Einträge
      await supabase
        .from("transactions_cache")
        .delete()
        .eq("user_id", userId);
      
      // Batch-Insert neue Transaktionen
      const batchSize = 1000;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize).map(tx => ({
          user_id: userId,
          wallet_id: tx.walletId,
          tx_hash: tx.txHash,
          block_timestamp: tx.blockTimestamp.toISOString(),
          block_number: tx.blockNumber,
          
          token_symbol: tx.tokenSymbol,
          token_name: tx.tokenName,
          contract_address: tx.contractAddress,
          token_decimal: tx.tokenDecimal,
          
          from_address: tx.from,
          to_address: tx.to,
          
          raw_value: tx.rawValue,
          amount: tx.amount,
          price_usd: tx.priceUSD || 0,
          value_usd: tx.valueUSD || 0,
          
          is_incoming: tx.isIncoming,
          is_roi_transaction: tx.isROI,
          
          gas: tx.gas,
          gas_price: tx.gasPrice,
          gas_used: tx.gasUsed,
          
          source: tx.source,
          processed_at: tx.processedAt.toISOString()
        }));
        
        const { error } = await supabase
          .from("transactions_cache")
          .insert(batch);
        
        if (error) {
          console.warn(`⚠️ Cache batch ${i}-${i + batchSize} failed:`, error.code);
        }
      }
      
      console.log(`✅ Transaction caching complete`);
      
    } catch (error) {
      console.warn('⚠️ Transaction caching failed:', error);
      // Nicht kritisch - System funktioniert ohne Cache
    }
  }

  /**
   * 📊 Verarbeite Transaktionen für Steuerreport (KORREKTE STEUERLOGIK)
   */
  static processTransactionsForTax(transactions) {
    console.log(`📊 Processing ${transactions.length} transactions for tax report...`);
    
    // 🛡️ KORREKTE STEUERLOGIK: Nur ROI ist steuerpflichtig
    const taxableTransactions = transactions.filter(tx => {
      // 1. Muss eingehend sein (an User-Wallet)
      if (!tx.isIncoming && !tx.is_incoming) return false;
      
      // 2. Muss ROI/Minting/Airdrop sein (keine Käufe!)
      if (!tx.isROI && !tx.is_roi_transaction) return false;
      
      // 3. Muss Mindest-Wert haben
      const value = tx.valueUSD || tx.value_usd || 0;
      if (value < this.CONFIG.MIN_TAX_VALUE_USD) return false;
      
      return true;
    });
    
    // 🛒 Käufe (NICHT steuerpflichtig, nur für Übersicht)
    const purchases = transactions.filter(tx => {
      return tx.isIncoming && !tx.isROI && !tx.is_roi_transaction;
    });
    
    // 💸 Verkäufe (ausgehende Transaktionen)
    const sales = transactions.filter(tx => {
      return !tx.isIncoming && !tx.is_incoming;
    });
    
    // 📊 Steuer-Zusammenfassung berechnen
    const taxSummary = this.calculateTaxSummary(taxableTransactions, purchases, sales);
    
    console.log(`📊 TAX PROCESSING COMPLETE:`, {
      total: transactions.length,
      taxable: taxableTransactions.length,
      purchases: purchases.length,
      sales: sales.length,
      taxableIncomeUSD: taxSummary.taxableIncomeUSD
    });
    
    return {
      allTransactions: transactions,
      taxableTransactions,
      purchases,
      sales,
      taxSummary,
      
      // Für CSV/PDF Export
      exportData: {
        taxableTransactions: taxableTransactions.map(this.formatTransactionForExport),
        summary: taxSummary
      }
    };
  }

  /**
   * 📊 Berechne Steuer-Zusammenfassung (KORREKTE DEUTSCHE STEUERLOGIK)
   */
  static calculateTaxSummary(taxableTransactions, purchases, sales) {
    // 💰 Nur ROI/Minting als steuerpflichtiges Einkommen (§ 22 EStG)
    const taxableIncome = taxableTransactions.reduce((sum, tx) => {
      return sum + (tx.valueUSD || tx.value_usd || 0);
    }, 0);
    
    // 🛒 Käufe (nicht steuerpflichtig)
    const totalPurchases = purchases.reduce((sum, tx) => {
      return sum + (tx.valueUSD || tx.value_usd || 0);
    }, 0);
    
    // 💸 Verkäufe (separate Besteuerung)
    const totalSales = sales.reduce((sum, tx) => {
      return sum + (tx.valueUSD || tx.value_usd || 0);
    }, 0);
    
    return {
      totalTransactions: taxableTransactions.length + purchases.length + sales.length,
      
      // 🎯 STEUERPFLICHTIG (nur ROI/Minting)
      taxableTransactionsCount: taxableTransactions.length,
      taxableIncomeUSD: taxableIncome.toFixed(2),
      
      // 📊 ÜBERSICHT (nicht steuerpflichtig)
      purchasesCount: purchases.length,
      purchasesUSD: totalPurchases.toFixed(2),
      
      salesCount: sales.length,
      salesUSD: totalSales.toFixed(2),
      
      // 🇩🇪 Deutsche Steuerhinweise
      taxNote: "Nur ROI/Minting als sonstige Einkünfte nach § 22 EStG steuerpflichtig",
      disclaimerNote: "Keine Steuerberatung - konsultieren Sie einen Steuerberater"
    };
  }

  /**
   * 📄 Formatiere Transaktion für Export
   */
  static formatTransactionForExport(tx) {
    return {
      Datum: tx.blockTimestamp?.toLocaleDateString('de-DE') || tx.block_timestamp,
      Zeit: tx.blockTimestamp?.toLocaleTimeString('de-DE') || '',
      Token: tx.tokenSymbol || tx.token_symbol,
      Menge: tx.amount?.toFixed(6) || '0',
      'Preis (USD)': (tx.priceUSD || tx.price_usd || 0).toFixed(6),
      'Wert (USD)': (tx.valueUSD || tx.value_usd || 0).toFixed(2),
      Kategorie: tx.isROI || tx.is_roi_transaction ? 'ROI/Minting' : 'Transfer',
      'TX Hash': tx.txHash || tx.tx_hash,
      'Contract Address': tx.contractAddress || tx.contract_address
    };
  }

  /**
   * 🔧 Helper: Token-Amount berechnen
   */
  static calculateTokenAmount(rawValue, decimals) {
    try {
      const decimalCount = decimals || 18;
      const divisor = Math.pow(10, decimalCount);
      return parseFloat(rawValue) / divisor;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 📄 Generiere CSV für Steuerberater
   */
  static generateTaxCSV(taxData) {
    const { taxableTransactions } = taxData;
    
    const headers = [
      'Datum', 'Zeit', 'Token', 'Menge', 'Preis (USD)', 'Wert (USD)', 
      'Kategorie', 'TX Hash', 'Contract Address'
    ];
    
    const rows = taxableTransactions.map(tx => {
      const formatted = this.formatTransactionForExport(tx);
      return Object.values(formatted);
    });
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csv;
  }
} 