// 🔥 PulseChain Wallet API Parser
// Extrahiert Token, Transaktionen und Portfolio-Daten von scan.pulsechain.com
// DOM-sicher mit CORS-Fallback und manueller Eingabe

import { supabase } from '@/lib/supabaseClient';

export class WalletParser {
  
  // 🌐 API Endpoints für verschiedene Blockchains
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

  // 💰 Token Balance Parser
  static async parseTokenBalances(walletAddress, chainId = 369) {
    const endpoint = this.API_ENDPOINTS[chainId];
    if (!endpoint) throw new Error(`Chain ${chainId} not supported`);

    console.log(`🔍 PARSING TOKENS for ${walletAddress} on ${endpoint.name}`);

    try {
      // Try API first (can be blocked by CORS)
      const apiTokens = await this.fetchTokensFromAPI(walletAddress, chainId);
      return apiTokens;
    } catch (apiError) {
      console.warn('⚠️ API blocked by CORS, using fallback method:', apiError.message);
      
      // CORS-Fallback: Return structure for manual input
      return {
        success: false,
        corsBlocked: true,
        manualInputRequired: true,
        explorerUrl: chainId === 369 
          ? `https://scan.pulsechain.com/address/${walletAddress}#tokens`
          : `https://etherscan.io/address/${walletAddress}#tokentxns`,
        instructions: `
⚠️ API-Zugriff blockiert (CORS-Policy)

MANUELLE EINGABE erforderlich:
1. Öffnen Sie: ${chainId === 369 ? 'scan.pulsechain.com' : 'etherscan.io'}
2. Geben Sie Ihre Wallet-Adresse ein: ${walletAddress}
3. Klicken Sie auf "Tokens" Tab
4. Notieren Sie: Token-Name, Symbol, Balance
5. Verwenden Sie "Manual Token Input" in der App
        `.trim(),
        address: walletAddress,
        chainId: chainId
      };
    }
  }

  // 🔗 API Token Fetching (with CORS handling)
  static async fetchTokensFromAPI(walletAddress, chainId) {
    const endpoint = this.API_ENDPOINTS[chainId];
    
    if (chainId === 369) {
      // PulseChain specific API calls
      return await this.fetchPulseChainTokens(walletAddress);
    } else if (chainId === 1) {
      // Ethereum specific API calls
      return await this.fetchEthereumTokens(walletAddress);
    }
    
    throw new Error(`API not implemented for chain ${chainId}`);
  }

  // 🟢 PulseChain Token Fetching
  static async fetchPulseChainTokens(walletAddress) {
    const baseUrl = 'https://scan.pulsechain.com/api';
    
    try {
      // Get native PLS balance
      const nativeResponse = await fetch(`${baseUrl}?module=account&action=balance&address=${walletAddress}&tag=latest`);
      const nativeData = await nativeResponse.json();
      
      // Get ERC20 token balances
      const tokenResponse = await fetch(`${baseUrl}?module=account&action=tokenlist&address=${walletAddress}&page=1&offset=100`);
      const tokenData = await tokenResponse.json();
      
      const tokens = [];
      
      // Add native PLS
      if (nativeData.status === '1') {
        const plsBalance = parseFloat(nativeData.result) / Math.pow(10, 18);
        tokens.push({
          name: 'PulseChain',
          symbol: 'PLS',
          contractAddress: 'native',
          balance: plsBalance,
          decimals: 18,
          type: 'native',
          valueUSD: plsBalance * 0.000088 // Current PLS price
        });
      }
      
      // Add ERC20 tokens
      if (tokenData.status === '1' && Array.isArray(tokenData.result)) {
        for (const token of tokenData.result) {
          const balance = parseFloat(token.balance) / Math.pow(10, parseInt(token.decimals) || 18);
          if (balance > 0) {
            tokens.push({
              name: token.name || token.symbol,
              symbol: token.symbol,
              contractAddress: token.contractAddress,
              balance: balance,
              decimals: parseInt(token.decimals) || 18,
              type: 'ERC20',
              valueUSD: 0 // Would need price API integration
            });
          }
        }
      }
      
      console.log(`💎 FOUND ${tokens.length} tokens for PulseChain wallet`);
      return {
        success: true,
        tokens: tokens,
        totalTokens: tokens.length,
        address: walletAddress,
        chainId: 369
      };
      
    } catch (error) {
      // This will trigger CORS fallback
      throw new Error(`CORS_ERROR: ${error.message}`);
    }
  }

  // 🔷 Ethereum Token Fetching  
  static async fetchEthereumTokens(walletAddress) {
    // Ethereum API would require API key and is often CORS-blocked
    // For now, return fallback structure
    throw new Error('CORS_ERROR: Ethereum API requires API key and is CORS-blocked in browsers');
  }

  // 💾 Store Tokens in Supabase
  static async storeTokenBalances(userId, walletAddress, chainId, tokens) {
    try {
      console.log(`💾 STORING ${tokens.length} tokens for user ${userId}`);
      
      // Clear existing balances for this wallet
      await supabase
        .from('token_balances')
        .delete()
        .eq('user_id', userId)
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('chain_id', chainId);
      
      // Insert new token balances
      const tokenRecords = tokens.map(token => ({
        user_id: userId,
        wallet_address: walletAddress.toLowerCase(),
        chain_id: chainId,
        token_name: token.name,
        token_symbol: token.symbol,
        contract_address: token.contractAddress || 'native',
        balance: token.balance,
        decimals: token.decimals,
        value_usd: token.valueUSD || 0,
        token_type: token.type || 'ERC20',
        last_updated: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('token_balances')
        .insert(tokenRecords);
      
      if (error) throw error;
      
      console.log(`✅ STORED ${tokenRecords.length} token balances successfully`);
      return { success: true, stored: tokenRecords.length };
      
    } catch (error) {
      console.error('💥 Error storing token balances:', error);
      throw error;
    }
  }

  // 📊 Get Stored Token Balances
  static async getStoredTokenBalances(userId, walletAddress = null, chainId = null) {
    try {
      let query = supabase
        .from('token_balances')
        .select('*')
        .eq('user_id', userId)
        .order('value_usd', { ascending: false });
      
      if (walletAddress) {
        query = query.eq('wallet_address', walletAddress.toLowerCase());
      }
      
      if (chainId) {
        query = query.eq('chain_id', chainId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      console.log(`📊 RETRIEVED ${data?.length || 0} stored token balances`);
      return data || [];
      
    } catch (error) {
      console.error('💥 Error getting stored token balances:', error);
      return [];
    }
  }

  // 🔄 Full Wallet Refresh
  static async refreshWalletData(userId, walletAddress, chainId) {
    try {
      console.log(`🔄 REFRESHING wallet data: ${walletAddress} on chain ${chainId}`);
      
      // Parse tokens from API
      const parseResult = await this.parseTokenBalances(walletAddress, chainId);
      
      if (parseResult.success) {
        // Store in database
        await this.storeTokenBalances(userId, walletAddress, chainId, parseResult.tokens);
        
        return {
          success: true,
          method: 'api',
          tokensFound: parseResult.tokens.length,
          tokens: parseResult.tokens
        };
      } else {
        // API blocked, return manual input instructions
        return {
          success: false,
          method: 'manual_required',
          corsBlocked: true,
          instructions: parseResult.instructions,
          explorerUrl: parseResult.explorerUrl
        };
      }
      
    } catch (error) {
      console.error('💥 Error refreshing wallet data:', error);
      return {
        success: false,
        method: 'error',
        error: error.message
      };
    }
  }

  // 🏷️ Manual Token Input (CORS Fallback)
  static async addTokenManually(userId, walletAddress, chainId, tokenData) {
    try {
      const tokenRecord = {
        user_id: userId,
        wallet_address: walletAddress.toLowerCase(),
        chain_id: chainId,
        token_name: tokenData.name,
        token_symbol: tokenData.symbol,
        contract_address: tokenData.contractAddress || 'manual',
        balance: parseFloat(tokenData.balance),
        decimals: parseInt(tokenData.decimals) || 18,
        value_usd: parseFloat(tokenData.valueUSD) || 0,
        token_type: tokenData.type || 'manual',
        last_updated: new Date().toISOString(),
        manual_entry: true
      };
      
      const { error } = await supabase
        .from('token_balances')
        .upsert(tokenRecord, {
          onConflict: 'user_id,wallet_address,chain_id,token_symbol'
        });
      
      if (error) throw error;
      
      console.log(`✅ MANUALLY ADDED token: ${tokenData.symbol} (${tokenData.balance})`);
      return { success: true, token: tokenRecord };
      
    } catch (error) {
      console.error('💥 Error adding token manually:', error);
      throw error;
    }
  }
}

export default WalletParser; 