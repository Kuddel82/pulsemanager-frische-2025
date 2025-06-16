// 🔗 Transaction Parser für Tax Reporting
// Lädt Transaktionen von scan.pulsechain.com und anderen APIs
// Speichert in Supabase transactions Tabelle für Steuerberichte

import { supabase } from '@/lib/supabaseClient';

export class TransactionParser {
  
  // 🌐 API Endpoints
  static API_ENDPOINTS = {
    369: {
      name: 'PulseChain',
      baseUrl: 'https://scan.pulsechain.com/api',
      nativeSymbol: 'PLS',
      nativeDecimals: 18
    },
    1: {
      name: 'Ethereum', 
      baseUrl: 'https://api.etherscan.io/api',
      nativeSymbol: 'ETH',
      nativeDecimals: 18
    }
  };

  // 📊 Parse Transactions from API
  static async parseWalletTransactions(walletAddress, chainId = 369, limit = 100) {
    const endpoint = this.API_ENDPOINTS[chainId];
    if (!endpoint) throw new Error(`Chain ${chainId} not supported`);

    console.log(`🔗 PARSING TRANSACTIONS for ${walletAddress} on ${endpoint.name}`);

    try {
      // Try API first (kann durch CORS blockiert werden)
      const apiTxs = await this.fetchTransactionsFromAPI(walletAddress, chainId, limit);
      return apiTxs;
    } catch (apiError) {
      console.warn('⚠️ Transaction API blocked by CORS:', apiError.message);
      
      // CORS-Fallback: Return instructions
      return {
        success: false,
        corsBlocked: true,
        manualInputRequired: true,
        explorerUrl: chainId === 369 
          ? `https://scan.pulsechain.com/address/${walletAddress}#transactions`
          : `https://etherscan.io/address/${walletAddress}#transactions`,
        instructions: `
⚠️ Transaction API-Zugriff blockiert (CORS-Policy)

MANUELLE EINGABE oder Explorer-Export erforderlich:
1. Öffnen Sie: ${chainId === 369 ? 'scan.pulsechain.com' : 'etherscan.io'}
2. Geben Sie Ihre Wallet-Adresse ein: ${walletAddress}
3. Klicken Sie auf "Transactions" Tab
4. Verwenden Sie "Export" oder "Manual Transaction Input"
        `.trim(),
        address: walletAddress,
        chainId: chainId
      };
    }
  }

  // 🔗 Fetch Transactions from API
  static async fetchTransactionsFromAPI(walletAddress, chainId, limit = 100) {
    const endpoint = this.API_ENDPOINTS[chainId];
    
    if (chainId === 369) {
      return await this.fetchPulseChainTransactions(walletAddress, limit);
    } else if (chainId === 1) {
      return await this.fetchEthereumTransactions(walletAddress, limit);
    }
    
    throw new Error(`Transaction API not implemented for chain ${chainId}`);
  }

  // 🟢 PulseChain Transaction Fetching
  static async fetchPulseChainTransactions(walletAddress, limit = 100) {
    const baseUrl = 'https://scan.pulsechain.com/api';
    
    try {
      // Get normal transactions
      const normalTxResponse = await fetch(
        `${baseUrl}?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=latest&page=1&offset=${limit}&sort=desc`
      );
      const normalTxData = await normalTxResponse.json();
      
      // Get internal transactions
      const internalTxResponse = await fetch(
        `${baseUrl}?module=account&action=txlistinternal&address=${walletAddress}&startblock=0&endblock=latest&page=1&offset=${limit}&sort=desc`
      );
      const internalTxData = await internalTxResponse.json();
      
      // Get ERC20 token transfers
      const tokenTxResponse = await fetch(
        `${baseUrl}?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=latest&page=1&offset=${limit}&sort=desc`
      );
      const tokenTxData = await tokenTxResponse.json();
      
      const transactions = [];
      
      // Process normal transactions
      if (normalTxData.status === '1' && Array.isArray(normalTxData.result)) {
        for (const tx of normalTxData.result) {
          transactions.push(this.parseNormalTransaction(tx, walletAddress, 369));
        }
      }
      
      // Process internal transactions
      if (internalTxData.status === '1' && Array.isArray(internalTxData.result)) {
        for (const tx of internalTxData.result) {
          transactions.push(this.parseInternalTransaction(tx, walletAddress, 369));
        }
      }
      
      // Process token transactions
      if (tokenTxData.status === '1' && Array.isArray(tokenTxData.result)) {
        for (const tx of tokenTxData.result) {
          transactions.push(this.parseTokenTransaction(tx, walletAddress, 369));
        }
      }
      
      console.log(`💎 FOUND ${transactions.length} transactions for PulseChain wallet`);
      return {
        success: true,
        transactions: transactions,
        totalTransactions: transactions.length,
        address: walletAddress,
        chainId: 369
      };
      
    } catch (error) {
      throw new Error(`CORS_ERROR: ${error.message}`);
    }
  }

  // 🔷 Ethereum Transaction Fetching (Placeholder)
  static async fetchEthereumTransactions(walletAddress, limit = 100) {
    // Ethereum API würde API-Key benötigen und ist oft CORS-blockiert
    throw new Error('CORS_ERROR: Ethereum API requires API key and is CORS-blocked in browsers');
  }

  // 🔄 Parse Normal Transaction
  static parseNormalTransaction(tx, walletAddress, chainId) {
    const isIncoming = tx.to?.toLowerCase() === walletAddress.toLowerCase();
    const amount = parseFloat(tx.value) / Math.pow(10, 18); // ETH/PLS has 18 decimals
    
    return {
      wallet_address: walletAddress.toLowerCase(),
      chain_id: chainId,
      tx_hash: tx.hash,
      block_number: parseInt(tx.blockNumber),
      block_timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      token_symbol: chainId === 369 ? 'PLS' : 'ETH',
      token_name: chainId === 369 ? 'PulseChain' : 'Ethereum',
      contract_address: 'native',
      amount: amount,
      amount_raw: tx.value,
      decimals: 18,
      value_usd: amount * await this.getRealTimeNativePrice(chainId), // Real-time prices from Moralis
      gas_used: parseInt(tx.gasUsed || 0),
      gas_price: parseInt(tx.gasPrice || 0),
      gas_fee_eth: (parseInt(tx.gasUsed || 0) * parseInt(tx.gasPrice || 0)) / Math.pow(10, 18),
      gas_fee_usd: ((parseInt(tx.gasUsed || 0) * parseInt(tx.gasPrice || 0)) / Math.pow(10, 18)) * (chainId === 369 ? 0.000088 : 3200),
      from_address: tx.from?.toLowerCase(),
      to_address: tx.to?.toLowerCase(),
      tx_type: 'transfer',
      direction: isIncoming ? 'in' : 'out',
      is_taxable: true,
      tax_category: isIncoming ? 'income' : null,
      manual_entry: false
    };
  }

  // 🔄 Parse Internal Transaction
  static parseInternalTransaction(tx, walletAddress, chainId) {
    const isIncoming = tx.to?.toLowerCase() === walletAddress.toLowerCase();
    const amount = parseFloat(tx.value) / Math.pow(10, 18);
    
    return {
      wallet_address: walletAddress.toLowerCase(),
      chain_id: chainId,
      tx_hash: tx.hash,
      block_number: parseInt(tx.blockNumber),
      block_timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      token_symbol: chainId === 369 ? 'PLS' : 'ETH',
      token_name: chainId === 369 ? 'PulseChain' : 'Ethereum', 
      contract_address: 'internal',
      amount: amount,
      amount_raw: tx.value,
      decimals: 18,
      value_usd: amount * (chainId === 369 ? 0.000088 : 3200),
      gas_used: parseInt(tx.gas || 0),
      gas_price: 0,
      gas_fee_eth: 0,
      gas_fee_usd: 0,
      from_address: tx.from?.toLowerCase(),
      to_address: tx.to?.toLowerCase(),
      tx_type: tx.type || 'internal',
      direction: isIncoming ? 'in' : 'out',
      is_taxable: true,
      tax_category: isIncoming ? 'income' : null,
      manual_entry: false
    };
  }

  // 🔄 Parse Token Transaction
  static parseTokenTransaction(tx, walletAddress, chainId) {
    const isIncoming = tx.to?.toLowerCase() === walletAddress.toLowerCase();
    const decimals = parseInt(tx.tokenDecimal) || 18;
    const amount = parseFloat(tx.value) / Math.pow(10, decimals);
    
    return {
      wallet_address: walletAddress.toLowerCase(),
      chain_id: chainId,
      tx_hash: tx.hash,
      block_number: parseInt(tx.blockNumber),
      block_timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      token_symbol: tx.tokenSymbol,
      token_name: tx.tokenName,
      contract_address: tx.contractAddress?.toLowerCase(),
      amount: amount,
      amount_raw: tx.value,
      decimals: decimals,
      value_usd: 0, // Would need price API integration
      gas_used: parseInt(tx.gasUsed || 0),
      gas_price: parseInt(tx.gasPrice || 0),
      gas_fee_eth: (parseInt(tx.gasUsed || 0) * parseInt(tx.gasPrice || 0)) / Math.pow(10, 18),
      gas_fee_usd: ((parseInt(tx.gasUsed || 0) * parseInt(tx.gasPrice || 0)) / Math.pow(10, 18)) * (chainId === 369 ? 0.000088 : 3200),
      from_address: tx.from?.toLowerCase(),
      to_address: tx.to?.toLowerCase(),
      tx_type: 'transfer',
      direction: isIncoming ? 'in' : 'out',
      is_taxable: true,
      tax_category: isIncoming ? 'income' : null,
      manual_entry: false
    };
  }

  // 💾 Store Transactions in Supabase
  static async storeTransactions(userId, walletAddress, chainId, transactions) {
    try {
      console.log(`💾 STORING ${transactions.length} transactions for user ${userId}`);
      
      // Prepare transaction records
      const transactionRecords = transactions.map(tx => ({
        user_id: userId,
        ...tx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      // Use upsert to avoid duplicates
      const { data, error } = await supabase
        .from('transactions')
        .upsert(transactionRecords, {
          onConflict: 'user_id,tx_hash,token_symbol,wallet_address',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
      
      console.log(`✅ STORED ${transactionRecords.length} transactions successfully`);
      return { success: true, stored: transactionRecords.length, data };
      
    } catch (error) {
      console.error('💥 Error storing transactions:', error);
      throw error;
    }
  }

  // 📊 Get Stored Transactions
  static async getStoredTransactions(userId, walletAddress = null, chainId = null, limit = 1000) {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('block_timestamp', { ascending: false })
        .limit(limit);
      
      if (walletAddress) {
        query = query.eq('wallet_address', walletAddress.toLowerCase());
      }
      
      if (chainId) {
        query = query.eq('chain_id', chainId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      console.log(`📊 RETRIEVED ${data?.length || 0} stored transactions`);
      return data || [];
      
    } catch (error) {
      console.error('💥 Error getting stored transactions:', error);
      return [];
    }
  }

  // 🔄 Full Transaction Refresh
  static async refreshTransactionHistory(userId, walletAddress, chainId, limit = 100) {
    try {
      console.log(`🔄 REFRESHING transaction history: ${walletAddress} on chain ${chainId}`);
      
      // Parse transactions from API
      const parseResult = await this.parseWalletTransactions(walletAddress, chainId, limit);
      
      if (parseResult.success) {
        // Store in database
        await this.storeTransactions(userId, walletAddress, chainId, parseResult.transactions);
        
        return {
          success: true,
          method: 'api',
          transactionsFound: parseResult.transactions.length,
          transactions: parseResult.transactions
        };
      } else {
        // API blockiert, return manual input instructions
        return {
          success: false,
          method: 'manual_required',
          corsBlocked: true,
          instructions: parseResult.instructions,
          explorerUrl: parseResult.explorerUrl
        };
      }
      
    } catch (error) {
      console.error('💥 Error refreshing transaction history:', error);
      return {
        success: false,
        method: 'error',
        error: error.message
      };
    }
  }

  // 🏷️ Manual Transaction Input (CORS Fallback)
  static async addTransactionManually(userId, transactionData) {
    try {
      const transactionRecord = {
        user_id: userId,
        wallet_address: transactionData.walletAddress?.toLowerCase(),
        chain_id: transactionData.chainId || 369,
        tx_hash: transactionData.txHash,
        block_number: transactionData.blockNumber || null,
        block_timestamp: transactionData.timestamp ? new Date(transactionData.timestamp).toISOString() : new Date().toISOString(),
        token_symbol: transactionData.tokenSymbol,
        token_name: transactionData.tokenName || transactionData.tokenSymbol,
        contract_address: transactionData.contractAddress || 'manual',
        amount: parseFloat(transactionData.amount),
        decimals: parseInt(transactionData.decimals) || 18,
        value_usd: parseFloat(transactionData.valueUSD) || 0,
        gas_fee_usd: parseFloat(transactionData.gasFeeUSD) || 0,
        from_address: transactionData.fromAddress?.toLowerCase(),
        to_address: transactionData.toAddress?.toLowerCase(),
        tx_type: transactionData.txType || 'transfer',
        direction: transactionData.direction || 'unknown',
        is_taxable: transactionData.isTaxable !== false,
        tax_category: transactionData.taxCategory || null,
        manual_entry: true,
        notes: transactionData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('transactions')
        .upsert(transactionRecord, {
          onConflict: 'user_id,tx_hash,token_symbol,wallet_address'
        });
      
      if (error) throw error;
      
      console.log(`✅ MANUALLY ADDED transaction: ${transactionData.txHash}`);
      return { success: true, transaction: transactionRecord };
      
    } catch (error) {
      console.error('💥 Error adding transaction manually:', error);
      throw error;
    }
  }

  // 🔍 Transaction Classification
  static classifyTransaction(tx) {
    // Auto-classify transaction type and tax category based on patterns
    let txType = 'transfer';
    let taxCategory = null;
    
    // Check for common patterns
    if (tx.to_address === '0x0000000000000000000000000000000000000000') {
      txType = 'burn';
      taxCategory = 'capital_loss';
    } else if (tx.value_usd === 0 && tx.gas_fee_usd > 0) {
      txType = 'contract_interaction';
      taxCategory = 'fee';
    } else if (tx.direction === 'in' && tx.value_usd > 0) {
      taxCategory = 'income';
    }
    
    return { txType, taxCategory };
  }

  // 📈 Calculate Tax Summary
  static calculateTaxSummary(transactions) {
    const summary = {
      totalIncomeUsd: 0,
      totalCapitalGainsUsd: 0,
      totalCapitalLossesUsd: 0,
      totalFeesUsd: 0,
      totalTransactions: transactions.length
    };
    
    for (const tx of transactions) {
      if (!tx.is_taxable) continue;
      
      switch (tx.tax_category) {
        case 'income':
          summary.totalIncomeUsd += parseFloat(tx.value_usd || 0);
          break;
        case 'capital_gain':
          summary.totalCapitalGainsUsd += parseFloat(tx.value_usd || 0);
          break;
        case 'capital_loss':
          summary.totalCapitalLossesUsd += Math.abs(parseFloat(tx.value_usd || 0));
          break;
        case 'fee':
          summary.totalFeesUsd += parseFloat(tx.gas_fee_usd || 0);
          break;
      }
      
      // Add gas fees to total fees
      summary.totalFeesUsd += parseFloat(tx.gas_fee_usd || 0);
    }
    
    return summary;
  }
}

export default TransactionParser; 