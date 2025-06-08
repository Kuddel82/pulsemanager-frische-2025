// 💰 Intelligent Wallet Balance Service
// Handles CORS issues and provides multiple balance-loading strategies

import { supabase } from './supabaseClient';

export class WalletBalanceService {
  
  // 🎯 Primary Method: Manual Balance Input
  static async updateBalanceManually(walletId, userId, balance, symbol) {
    try {
      const { error } = await supabase
        .from('wallets')
        .update({
          balance_eth: parseFloat(balance),
          last_sync: new Date().toISOString(),
          notes: `Manual update: ${balance} ${symbol} at ${new Date().toLocaleString()}`
        })
        .eq('id', walletId)
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log(`💰 MANUAL BALANCE UPDATE: ${balance} ${symbol} for wallet ${walletId}`);
      return { success: true, balance: parseFloat(balance) };
    } catch (error) {
      console.error('Error updating balance manually:', error);
      throw error;
    }
  }

  // 🔍 Fallback: Parse from BlockScout URL
  static async suggestBalanceFromExplorer(address, chainId) {
    const explorerUrls = {
      369: `https://scan.pulsechain.com/address/${address}`,
      1: `https://etherscan.io/address/${address}`
    };
    
    const url = explorerUrls[chainId];
    if (!url) return null;
    
    return {
      explorerUrl: url,
      instructions: `
1. Öffnen Sie: ${url}
2. Kopieren Sie die Balance (z.B. "1234.5678 PLS")
3. Klicken Sie auf "Manual Update" unten
4. Geben Sie nur die Zahl ein (z.B. "1234.5678")
      `.trim()
    };
  }

  // 📊 Batch Update All Wallets
  static async batchUpdateWallets(userId) {
    try {
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      console.log('🔄 BATCH UPDATE: Found wallets for update:', wallets);
      
      const results = [];
      for (const wallet of wallets) {
        const explorerInfo = await this.suggestBalanceFromExplorer(wallet.address, wallet.chain_id);
        results.push({
          wallet,
          explorerInfo,
          needsManualUpdate: true
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }

  // 💎 Calculate Portfolio Value
  static calculatePortfolioValue(wallets) {
    const prices = {
      369: 0.000088, // PLS price in USD
      1: 3200        // ETH price in USD
    };
    
    let totalValue = 0;
    let breakdown = {
      pls: { total: 0, value: 0, wallets: [] },
      eth: { total: 0, value: 0, wallets: [] }
    };
    
    wallets.forEach(wallet => {
      const balance = wallet.balance_eth || 0;
      const price = prices[wallet.chain_id] || 0;
      const value = balance * price;
      
      if (wallet.chain_id === 369) { // PulseChain
        breakdown.pls.total += balance;
        breakdown.pls.value += value;
        breakdown.pls.wallets.push({
          name: wallet.nickname,
          balance,
          value
        });
      } else if (wallet.chain_id === 1) { // Ethereum
        breakdown.eth.total += balance;
        breakdown.eth.value += value;
        breakdown.eth.wallets.push({
          name: wallet.nickname,
          balance,
          value
        });
      }
      
      totalValue += value;
    });
    
    console.log('💰 PORTFOLIO CALCULATION:', {
      totalValue,
      breakdown,
      plsPrice: prices[369],
      ethPrice: prices[1]
    });
    
    return {
      totalValue,
      breakdown,
      prices
    };
  }
}

export default WalletBalanceService; 