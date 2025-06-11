/*
📊 TAX SERVICE: Serverseitiges Caching + korrekte Steuerlogik
Ziel: Unbegrenzte Transaktionen + DSGVO-konforme Steuerberichte
FIXED: Nutzt jetzt korrekt vorhandene Moralis APIs
*/

import { supabase } from "@/lib/supabaseClient";

export class TaxService {
  // 🔧 KONFIGURATION
  static CONFIG = {
    MAX_TRANSACTIONS_PER_REQUEST: 500,    // Moralis API Limit pro Request
    CACHE_EXPIRY_HOURS: 24,               // Cache-Gültigkeit
    PAGINATION_SIZE: 100,                 // Batch-Größe für API-Aufrufe
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
        const taxData = this.processTransactionsForTax(cachedData.transactions);
        taxData.fromCache = true; // Markiere als Cache-Hit
        return taxData;
      }
      
      console.log(`🔄 CACHE MISS: Loading fresh transaction data via Moralis...`);
      
      // 2. Lade ALLE Transaktionen von Moralis API (korrekt!)
      const allTransactions = await this.loadAllTransactionsViaMoralis(wallets);
      
      // 3. Preise für Token laden (falls noch nicht vorhanden)
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
      
      // Konvertiere Supabase Format zurück zu Standard Format
      const transactions = (data || []).map(row => ({
        walletId: row.wallet_id,
        walletAddress: row.wallet_address,
        txHash: row.tx_hash,
        blockTimestamp: new Date(row.block_timestamp),
        blockNumber: row.block_number,
        
        tokenSymbol: row.token_symbol,
        tokenName: row.token_name,
        contractAddress: row.contract_address,
        tokenDecimal: row.token_decimal,
        
        from: row.from_address,
        to: row.to_address,
        
        rawValue: row.raw_value,
        amount: parseFloat(row.amount),
        priceUSD: parseFloat(row.price_usd) || 0,
        valueUSD: parseFloat(row.value_usd) || 0,
        
        isIncoming: row.is_incoming,
        isROI: row.is_roi_transaction,
        
        gas: row.gas,
        gasPrice: row.gas_price,
        gasUsed: row.gas_used,
        
        source: row.source,
        processedAt: new Date(row.processed_at)
      }));
      
      const isValid = transactions.length > 0;
      
      return {
        isValid,
        transactions,
        cacheAge: isValid ? new Date() - new Date(data[0].created_at) : 0
      };
      
    } catch (error) {
      console.warn('⚠️ TAX CACHE: Cache check failed:', error);
      return { isValid: false, transactions: [] };
    }
  }

  /**
   * 🔄 Lade ALLE Transaktionen via Moralis APIs (FIXED!)
   */
  static async loadAllTransactionsViaMoralis(wallets) {
    const allTransactions = [];
    
    for (const wallet of wallets) {
      console.log(`📡 Loading transactions via Moralis for wallet ${wallet.address}...`);
      
      try {
        // 🚀 Nutze MORALIS-TRANSACTIONS API (existiert!)
        const response = await fetch(`/api/moralis-transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: wallet.address,
            chain: '0x171' // PulseChain hex
          })
        });
        
        if (!response.ok) {
          console.warn(`⚠️ Moralis API Error for wallet ${wallet.address}: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.result && Array.isArray(data.result)) {
          // Verarbeite Moralis Transaktionen zu Standard-Format
          const processedTx = data.result.map(tx => ({
            walletId: wallet.id,
            walletAddress: wallet.address,
            txHash: tx.hash,
            blockTimestamp: new Date(tx.block_timestamp),
            blockNumber: parseInt(tx.block_number),
            
            tokenSymbol: 'PLS', // Moralis-Transactions sind meist native
            tokenName: 'PulseChain',
            contractAddress: null, // Native token
            tokenDecimal: 18,
            
            from: tx.from_address?.toLowerCase(),
            to: tx.to_address?.toLowerCase(),
            
            // Native PLS Amount-Berechnung
            rawValue: tx.value,
            amount: this.calculateTokenAmount(tx.value, 18),
            
            // ROI-Erkennung für native PLS schwieriger
            isIncoming: tx.to_address?.toLowerCase() === wallet.address.toLowerCase(),
            isROI: false, // Für PLS schwer automatisch erkennbar
            
            gas: parseInt(tx.gas),
            gasPrice: parseInt(tx.gas_price),
            gasUsed: parseInt(tx.receipt_gas_used) || 0,
            
            // Preis-Daten später hinzufügen
            priceUSD: 0,
            valueUSD: 0,
            
            source: 'moralis_transactions',
            processedAt: new Date()
          }));
          
          allTransactions.push(...processedTx);
          console.log(`📊 Wallet ${wallet.address}: Loaded ${processedTx.length} native transactions`);
        }
        
        // 🚀 Zusätzlich: TOKEN TRANSFERS laden
        const tokenResponse = await fetch(`/api/moralis-token-transfers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: wallet.address,
            chain: '0x171'
          })
        });
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          
          if (tokenData.result && Array.isArray(tokenData.result)) {
            const tokenTransactions = tokenData.result.map(tx => ({
              walletId: wallet.id,
              walletAddress: wallet.address,
              txHash: tx.transaction_hash,
              blockTimestamp: new Date(tx.block_timestamp),
              blockNumber: parseInt(tx.block_number),
              
              tokenSymbol: tx.token_symbol || 'UNKNOWN',
              tokenName: tx.token_name || 'Unknown Token',
              contractAddress: tx.address,
              tokenDecimal: parseInt(tx.token_decimals) || 18,
              
              from: tx.from_address?.toLowerCase(),
              to: tx.to_address?.toLowerCase(),
              
              rawValue: tx.value,
              amount: this.calculateTokenAmount(tx.value, tx.token_decimals),
              
              // ROI-Erkennung: Null-Adresse = Minting
              isIncoming: tx.to_address?.toLowerCase() === wallet.address.toLowerCase(),
              isROI: tx.from_address === '0x0000000000000000000000000000000000000000',
              
              gas: 0, // Token transfers haben eigene Gas-Kosten
              gasPrice: 0,
              gasUsed: 0,
              
              priceUSD: 0,
              valueUSD: 0,
              
              source: 'moralis_token_transfers',
              processedAt: new Date()
            }));
            
            allTransactions.push(...tokenTransactions);
            console.log(`📊 Wallet ${wallet.address}: Loaded ${tokenTransactions.length} token transfers`);
          }
        }
        
        // Rate Limiting für Moralis
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`💥 Error loading transactions for wallet ${wallet.address}:`, error);
      }
    }
    
    console.log(`🎯 TOTAL TRANSACTIONS LOADED: ${allTransactions.length}`);
    return allTransactions;
  }

  /**
   * 💰 Reichere Transaktionen mit Preisen an (FIXED!)
   */
  static async enrichTransactionsWithPrices(transactions) {
    console.log(`💰 Enriching ${transactions.length} transactions with prices...`);
    
    // Gruppiere nach Contract-Adressen für effiziente Preis-Abfrage
    const contractAddresses = [...new Set(
      transactions
        .filter(tx => tx.contractAddress) // nur Token, nicht native PLS
        .map(tx => tx.contractAddress)
    )];
    
    const priceMap = new Map();
    
    // 💰 Lade Preise via MORALIS-PRICES API (korrekte Parameter!)
    if (contractAddresses.length > 0) {
      try {
        const response = await fetch(`/api/moralis-prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenAddresses: contractAddresses.slice(0, 25), // Batch-Limit
            chain: '0x171'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.prices) {
            data.prices.forEach(priceData => {
              if (priceData.tokenAddress && priceData.usdPrice) {
                priceMap.set(priceData.tokenAddress.toLowerCase(), parseFloat(priceData.usdPrice));
              }
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ Price loading failed:', error);
      }
    }
    
    // Native PLS Preis separat laden
    try {
      const plsResponse = await fetch(`/api/moralis-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddresses: ['0x0000000000000000000000000000000000000000'], // Native
          chain: '0x171'
        })
      });
      
      if (plsResponse.ok) {
        const plsData = await plsResponse.json();
        if (plsData.success && plsData.nativePrice) {
          priceMap.set('native', parseFloat(plsData.nativePrice.usdPrice));
        }
      }
    } catch (error) {
      console.warn('⚠️ PLS price loading failed:', error);
    }
    
    // Berechne USD-Werte
    const enrichedTransactions = transactions.map(tx => {
      let price = 0;
      
      if (tx.contractAddress) {
        // Token-Preis
        price = priceMap.get(tx.contractAddress?.toLowerCase()) || 0;
      } else {
        // Native PLS
        price = priceMap.get('native') || 0;
      }
      
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
   * 💾 Cache Transaktionen in Supabase (FIXED Format!)
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
      const batchSize = 500; // Kleiner für Stabilität
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize).map(tx => ({
          user_id: userId,
          wallet_id: tx.walletId,
          wallet_address: tx.walletAddress,
          tx_hash: tx.txHash,
          block_timestamp: tx.blockTimestamp.toISOString(),
          block_number: tx.blockNumber,
          
          token_symbol: tx.tokenSymbol,
          token_name: tx.tokenName,
          contract_address: tx.contractAddress,
          token_decimal: tx.tokenDecimal,
          
          from_address: tx.from,
          to_address: tx.to,
          
          raw_value: tx.rawValue?.toString(),
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
        
        if (error && error.code !== '23505') { // Ignoriere Duplikate
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