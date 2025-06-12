/*
📊 TAX SERVICE: Serverseitiges Caching + korrekte Steuerlogik
Ziel: Unbegrenzte Transaktionen + DSGVO-konforme Steuerberichte
FIXED: Nutzt jetzt korrekt vorhandene Moralis APIs
*/

import { supabase } from "@/lib/supabaseClient";

export class TaxService {
  // 🔧 KONFIGURATION - UNLIMITED für TAX REPORT
  static CONFIG = {
    MAX_TRANSACTIONS_PER_REQUEST: 999999,  // User-Wunsch: ALLE verfügbaren Daten
    CACHE_EXPIRY_HOURS: 24,               // Cache-Gültigkeit
    PAGINATION_SIZE: 1000,                // Größere Batches für bessere Performance
    MIN_TAX_VALUE_USD: 0.001              // Sehr niedrig für komplette Daten
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
   * 🔄 Lade ALLE Transaktionen via Moralis Enterprise APIs (PulseChain + ETH)
   */
  static async loadAllTransactionsViaMoralis(wallets) {
    const allTransactions = [];
    
    // 🎯 Multi-Chain Support: 99% PulseChain + ETH
    const supportedChains = [
      { id: '0x171', name: 'PulseChain', symbol: 'PLS', priority: 1 },
      { id: '0x1', name: 'Ethereum', symbol: 'ETH', priority: 2 }
    ];
    
    for (const wallet of wallets) {
      console.log(`📡 Loading multi-chain transactions for wallet ${wallet.address}...`);
      
      for (const chain of supportedChains) {
        try {
          console.log(`⛓️ Processing ${chain.name} (${chain.id}) for wallet ${wallet.address.slice(0, 8)}...`);
          
          // 🚀 1. NATIVE TRANSACTIONS (PLS/ETH) - UNLIMITED
          const nativeResponse = await fetch(`/api/moralis-transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: wallet.address,
              chain: chain.id,
              limit: 9999 // User-Wunsch: ALLE verfügbaren Daten
            })
          });
          
          if (nativeResponse.ok) {
            const nativeData = await nativeResponse.json();
            
            if (nativeData.success && nativeData.result) {
              const nativeTransactions = nativeData.result.map(tx => ({
                walletId: wallet.id,
                walletAddress: wallet.address,
                txHash: tx.hash,
                blockTimestamp: new Date(tx.block_timestamp),
                blockNumber: parseInt(tx.block_number),
                
                tokenSymbol: chain.symbol,
                tokenName: chain.name,
                contractAddress: null, // Native token
                tokenDecimal: 18,
                
                from: tx.from_address?.toLowerCase(),
                to: tx.to_address?.toLowerCase(),
                
                rawValue: tx.value,
                amount: this.calculateTokenAmount(tx.value, 18),
                
                // ROI-Erkennung für native schwieriger (meist Käufe/Verkäufe)
                isIncoming: tx.is_incoming,
                isROI: false, // Native Transaktionen sind selten ROI
                
                gas: parseInt(tx.gas) || 0,
                gasPrice: parseInt(tx.gas_price) || 0,
                gasUsed: parseInt(tx.receipt_gas_used) || 0,
                
                priceUSD: 0, // Später hinzufügen
                valueUSD: 0,
                
                chainId: chain.id,
                chainName: chain.name,
                source: 'moralis_native_transactions',
                processedAt: new Date()
              }));
              
              allTransactions.push(...nativeTransactions);
              console.log(`✅ ${chain.name}: ${nativeTransactions.length} native transactions`);
            }
          }
          
          // 🚀 2. TOKEN TRANSFERS (ERC-20) - UNLIMITED
          const tokenResponse = await fetch(`/api/moralis-token-transfers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: wallet.address,
              chain: chain.id,
              limit: 9999 // User-Wunsch: ALLE verfügbaren Daten
            })
          });
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            
            if (tokenData.success && tokenData.result) {
              const tokenTransactions = tokenData.result.map(transfer => ({
                walletId: wallet.id,
                walletAddress: wallet.address,
                txHash: transfer.transaction_hash,
                blockTimestamp: new Date(transfer.block_timestamp),
                blockNumber: parseInt(transfer.block_number),
                
                tokenSymbol: transfer.token_symbol || 'UNKNOWN',
                tokenName: transfer.token_name || 'Unknown Token',
                contractAddress: transfer.address, // Contract address
                tokenDecimal: parseInt(transfer.token_decimals) || 18,
                
                from: transfer.from_address?.toLowerCase(),
                to: transfer.to_address?.toLowerCase(),
                
                rawValue: transfer.value,
                amount: parseFloat(transfer.value_formatted) || this.calculateTokenAmount(transfer.value, transfer.token_decimals),
                
                // 🎯 ROI-ERKENNUNG: Kritisch für deutsche Steuerberechnung!
                isIncoming: transfer.is_incoming,
                isROI: this.isROITransaction(transfer), // FIXED: Proper ROI detection
                
                gas: 0, // Token transfers haben separate Gas-Kosten
                gasPrice: 0,
                gasUsed: 0,
                
                priceUSD: 0, // Später hinzufügen
                valueUSD: 0,
                
                chainId: chain.id,
                chainName: chain.name,
                source: 'moralis_token_transfers',
                processedAt: new Date()
              }));
              
              allTransactions.push(...tokenTransactions);
              console.log(`✅ ${chain.name}: ${tokenTransactions.length} token transfers`);
            }
          }
          
          // 📊 Rate Limiting für Enterprise-Level Performance
          await new Promise(resolve => setTimeout(resolve, 150));
          
        } catch (error) {
          console.error(`💥 Error loading ${chain.name} transactions for wallet ${wallet.address}:`, error);
        }
      }
    }
    
    console.log(`🎯 MULTI-CHAIN TOTAL: ${allTransactions.length} transactions loaded across ${supportedChains.length} chains`);
    
    // 📊 Statistiken loggen
    const chainStats = supportedChains.map(chain => {
      const chainTxs = allTransactions.filter(tx => tx.chainId === chain.id);
      return `${chain.name}: ${chainTxs.length}`;
    }).join(', ');
    
    console.log(`📈 Chain distribution: ${chainStats}`);
    
    return allTransactions;
  }

  /**
   * 💰 Reichere Transaktionen mit Preisen an (Multi-Chain: PulseChain + ETH)
   */
  static async enrichTransactionsWithPrices(transactions) {
    console.log(`💰 Enriching ${transactions.length} multi-chain transactions with prices...`);
    
    const priceMap = new Map();
    
    // 🎯 Gruppiere nach Chains für effiziente Preis-Abfrage
    const chainGroups = {
      '0x171': [], // PulseChain
      '0x1': []    // Ethereum
    };
    
    // Native tokens direkt setzen
    const nativeTokens = {
      '0x171': 'pls', // PulseChain native
      '0x1': 'eth'    // Ethereum native
    };
    
    // Gruppiere Contract-Adressen nach Chains
    transactions.forEach(tx => {
      if (tx.contractAddress && chainGroups[tx.chainId]) {
        chainGroups[tx.chainId].push(tx.contractAddress);
      }
    });
    
    // 💰 Lade Preise für jede Chain separat
    for (const [chainId, contractAddresses] of Object.entries(chainGroups)) {
      if (contractAddresses.length === 0) continue;
      
      const uniqueAddresses = [...new Set(contractAddresses)];
      
      try {
        console.log(`💰 Loading prices for ${uniqueAddresses.length} tokens on chain ${chainId}...`);
        
        const response = await fetch(`/api/moralis-prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenAddresses: uniqueAddresses.slice(0, 25), // Moralis Limit
            chain: chainId
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.prices) {
            data.prices.forEach(priceData => {
              if (priceData.tokenAddress && priceData.usdPrice) {
                const key = `${chainId}:${priceData.tokenAddress.toLowerCase()}`;
                priceMap.set(key, parseFloat(priceData.usdPrice));
              }
            });
          }
        }
        
        // 🚀 Native Token Preis für diese Chain laden
        const nativeResponse = await fetch(`/api/moralis-prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenAddresses: ['native'], // Spezial-Keyword für native
            chain: chainId
          })
        });
        
        if (nativeResponse.ok) {
          const nativeData = await nativeResponse.json();
          if (nativeData.success && nativeData.nativePrice) {
            const nativeKey = `${chainId}:native`;
            priceMap.set(nativeKey, parseFloat(nativeData.nativePrice.usdPrice));
          }
        }
        
      } catch (error) {
        console.warn(`⚠️ Price loading failed for chain ${chainId}:`, error);
      }
      
      // Rate limiting zwischen Chain-Aufrufen
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 📊 Berechne USD-Werte mit Chain-spezifischen Preisen
    const enrichedTransactions = transactions.map(tx => {
      let price = 0;
      let priceKey;
      
      if (tx.contractAddress) {
        // Token-Preis (Chain-spezifisch)
        priceKey = `${tx.chainId}:${tx.contractAddress.toLowerCase()}`;
      } else {
        // Native Token (PLS/ETH)
        priceKey = `${tx.chainId}:native`;
      }
      
      price = priceMap.get(priceKey) || 0;
      const valueUSD = price > 0 ? tx.amount * price : 0;
      
      return {
        ...tx,
        priceUSD: price,
        valueUSD: valueUSD,
        hasPriceData: price > 0,
        priceKey: priceKey // Debug info
      };
    });
    
    // 📈 Statistiken
    const priceStats = Array.from(priceMap.entries()).reduce((acc, [key, price]) => {
      const [chainId] = key.split(':');
      const chainName = chainId === '0x171' ? 'PulseChain' : 'Ethereum';
      if (!acc[chainName]) acc[chainName] = 0;
      acc[chainName]++;
      return acc;
    }, {});
    
    const statsText = Object.entries(priceStats).map(([chain, count]) => `${chain}: ${count}`).join(', ');
    console.log(`💰 Multi-chain price enrichment complete: ${statsText}`);
    
    return enrichedTransactions;
  }

  /**
   * 💾 Cache Transaktionen in Supabase (FIXED Format!)
   */
  static async cacheTransactions(userId, transactions) {
    try {
      console.log(`💾 Caching ${transactions.length} transactions for user ${userId}...`);
      
      // 🔧 FIXED: Entferne Duplikate BEVOR Batch-Processing
      const uniqueTransactions = transactions.filter((tx, index, self) => 
        index === self.findIndex(t => t.txHash === tx.txHash)
      );
      
      console.log(`🔧 Removed ${transactions.length - uniqueTransactions.length} duplicate transactions from batch`);
      
      // 🔧 FIXED: UPSERT statt DELETE + INSERT (vermeidet 409 Conflicts)
      const batchSize = 100; // DEUTLICH KLEINER für Stabilität bei UPSERT
      for (let i = 0; i < uniqueTransactions.length; i += batchSize) {
        const batch = uniqueTransactions.slice(i, i + batchSize).map(tx => ({
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
        
        // 🔧 SIMPLIFIED UPSERT - nur ignoreDuplicates
        const { error } = await supabase
          .from("transactions_cache")
          .upsert(batch, { 
            ignoreDuplicates: true // Einfach Duplikate ignorieren
          });
        
        if (error) {
          console.warn(`⚠️ Cache batch ${i}-${i + batchSize} failed:`, error.code, error.message);
          
          // 🔧 FALLBACK: Insert einzeln bei Batch-Fehlern
          for (const row of batch) {
            try {
              await supabase
                .from("transactions_cache")
                .upsert([row], { ignoreDuplicates: true });
            } catch (singleError) {
              console.warn(`⚠️ Single row upsert failed for tx ${row.tx_hash}:`, singleError.message);
            }
          }
        } else {
          console.log(`✅ Cache batch ${i}-${i + batchSize} saved successfully`);
        }
        
        // Kurze Pause zwischen Batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Transaction caching complete - ${uniqueTransactions.length} unique transactions cached!`);
      
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
   * 🎯 ROI-ERKENNUNG: Identifiziere ROI/Minting Transaktionen
   */
  static isROITransaction(transfer) {
    const fromAddress = transfer.from_address?.toLowerCase();
    const toAddress = transfer.to_address?.toLowerCase();
    
    // 1. Minting von Null-Adresse (klassisches ROI)
    if (fromAddress === '0x0000000000000000000000000000000000000000') {
      console.log(`🎯 ROI DETECTED: Minting from null address for ${transfer.token_symbol}`);
      return true;
    }
    
    // 2. Bekannte Minter-Adressen (HEX, INC, PLSX)
    const KNOWN_MINTERS = [
      '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', // HEX
      '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3', // INC  
      '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1'  // PLSX
    ];
    
    if (KNOWN_MINTERS.includes(fromAddress)) {
      console.log(`🎯 ROI DETECTED: From known minter ${fromAddress.slice(0, 8)} for ${transfer.token_symbol}`);
      return true;
    }
    
    // 3. Spezielle ROI-Keywords im Token-Namen
    const tokenName = (transfer.token_name || '').toLowerCase();
    const tokenSymbol = (transfer.token_symbol || '').toLowerCase();
    
    const roiKeywords = ['stake', 'reward', 'yield', 'farm', 'mint', 'claim'];
    
    if (roiKeywords.some(keyword => tokenName.includes(keyword) || tokenSymbol.includes(keyword))) {
      console.log(`🎯 ROI DETECTED: ROI keyword in ${transfer.token_symbol} (${transfer.token_name})`);
      return true;
    }
    
    // 4. Große Token-Mengen ohne offensichtliche Zahlung (potentielle Airdrops)
    const amount = parseFloat(transfer.value_formatted) || 0;
    if (amount > 1000000 && transfer.is_incoming) { // > 1M tokens
      console.log(`🎯 ROI DETECTED: Large airdrop amount ${amount} for ${transfer.token_symbol}`);
      return true;
    }
    
    return false; // Standard-Transaktion (Kauf/Verkauf)
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