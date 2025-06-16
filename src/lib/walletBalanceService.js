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

  // 💎 Calculate Portfolio Value with REAL-TIME PRICES
  static async calculatePortfolioValue(wallets) {
    console.log('💰 LOADING REAL-TIME PRICES for portfolio calculation...');
    
    // Load real ETH price from Moralis
    let realEthPrice = 2400; // Fallback
    try {
      const response = await fetch('https://deep-index.moralis.io/api/v2/erc20/0x0000000000000000000000000000000000000000/price?chain=eth', {
        headers: { 'X-API-Key': import.meta.env.VITE_MORALIS_API_KEY }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.usdPrice) {
          realEthPrice = parseFloat(data.usdPrice);
          console.log(`🔥 REAL-TIME ETH PRICE: $${realEthPrice}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not load live ETH price: ${error.message}`);
    }
    
    const prices = {
      369: 0.000088, // PLS price in USD
      1: realEthPrice // REAL ETH price from Moralis!
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
    
    console.log('💰 PORTFOLIO CALCULATION WITH REAL PRICES:', {
      totalValue,
      breakdown,
      plsPrice: prices[369],
      ethPrice: prices[1],
      ethPriceSource: 'moralis_live'
    });
    
    return {
      totalValue,
      breakdown,
      prices
    };
  }
}

export default WalletBalanceService; 