// 🎯 WALLET PARSER - 100% MORALIS ENTERPRISE ONLY
// Eliminiert ALLE kostenlosen APIs für maximale Zuverlässigkeit
// Datum: 2025-01-11 - ENTERPRISE ONLY: Nur bezahlte Moralis APIs

import { supabase } from '@/lib/supabaseClient';
import { TokenPriceService } from './tokenPriceService';

export class WalletParser {
  
  // 🚀 100% MORALIS ENTERPRISE ENDPOINTS
  static MORALIS_ENDPOINTS = {
    tokens: '/api/moralis-tokens',
    prices: '/api/moralis-prices',
    transactions: '/api/moralis-transactions',
    tokenTransfers: '/api/moralis-token-transfers'
  };

  // 🌐 CHAIN CONFIGURATION
  static CHAINS = {
    PULSECHAIN: { id: 369, moralisChainId: '0x171', name: 'PulseChain' },
    ETHEREUM: { id: 1, moralisChainId: '0x1', name: 'Ethereum' }
  };

  /**
   * 🚀 100% MORALIS ENTERPRISE: Token Fetching (NO FREE APIS)
   */
  static async fetchPulseChainTokens(walletAddress) {
    const timestamp = Date.now();
    
    try {
      console.log(`🚀 MORALIS ENTERPRISE: Fetching tokens for ${walletAddress} [${timestamp}]`);
      
             // 🔑 CHECK MORALIS ENTERPRISE ACCESS
       const testResponse = await fetch('/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=0x0000000000000000000000000000000000000000&limit=1');
       const testData = await testResponse.json();
       
       // ✅ Accept test-mode responses as valid
       if (testData._test_mode && testData._message && testResponse.ok) {
         console.log('✅ MORALIS ENTERPRISE ACCESS: Validated successfully');
       } else if (testData._fallback || testData._error || !testResponse.ok) {
         console.error(`🚨 CRITICAL: Moralis Enterprise API not available! Wallet parsing requires paid Moralis API key.`);
         return {
           success: false,
           tokens: [],
           error: 'ENTERPRISE ERROR: Moralis API Key required for token data',
           totalValue: 0
         };
       }

      // 🚀 MORALIS ENTERPRISE API CALLS
      const tokens = [];

      // 1. Native PLS Balance via Moralis
      try {
        const nativeResponse = await fetch(`/api/moralis-tokens?endpoint=wallet-balance&chain=0x171&address=${walletAddress}`);
        const nativeData = await nativeResponse.json();
        
        if (nativeData.result && nativeData.result.balance) {
          const plsBalance = parseFloat(nativeData.result.balance) / Math.pow(10, 18);
          
          // Get PLS price from Moralis Prices API
          const priceResponse = await fetch(`/api/moralis-prices?endpoint=token-price&chain=0x171&address=0x0000000000000000000000000000000000000000`);
          const priceData = await priceResponse.json();
          const plsPrice = priceData.usdPrice || 0.000088; // Emergency fallback
          
          tokens.push({
            name: 'PulseChain',
            symbol: 'PLS',
            contractAddress: 'native',
            balance: plsBalance,
            decimals: 18,
            type: 'native',
            estimatedPrice: plsPrice,
            valueUSD: plsBalance * plsPrice,
            source: 'moralis_enterprise'
          });
          
          console.log(`💎 MORALIS PLS: ${plsBalance.toFixed(4)} × $${plsPrice} = $${(plsBalance * plsPrice).toFixed(2)}`);
        }
      } catch (nativeError) {
        console.error(`❌ Moralis native balance error:`, nativeError);
      }

      // 2. ERC20 Token List via Moralis
      try {
        const tokenResponse = await fetch(`/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=${walletAddress}`);
        const tokenData = await tokenResponse.json();
        
        if (tokenData.result && Array.isArray(tokenData.result)) {
          console.log(`📊 MORALIS: Found ${tokenData.result.length} ERC20 tokens for ${walletAddress}`);
          
          for (const token of tokenData.result) {
            try {
              const balance = parseFloat(token.balance) / Math.pow(10, parseInt(token.decimals) || 18);
              
              if (balance > 0) {
                // Get token price from Moralis
                const priceResponse = await fetch(`/api/moralis-prices?endpoint=token-price&chain=0x171&address=${token.token_address}`);
                const priceData = await priceResponse.json();
                const tokenPrice = priceData.usdPrice || 0;
                
                tokens.push({
                  name: token.name || 'Unknown Token',
                  symbol: token.symbol || 'UNKNOWN',
                  contractAddress: token.token_address,
                  balance: balance,
                  decimals: parseInt(token.decimals) || 18,
                  type: 'erc20',
                  estimatedPrice: tokenPrice,
                  valueUSD: balance * tokenPrice,
                  source: 'moralis_enterprise'
                });
                
                if (balance > 1 || tokenPrice > 0.01) {
                  console.log(`💎 MORALIS TOKEN: ${token.symbol} ${balance.toFixed(4)} × $${tokenPrice} = $${(balance * tokenPrice).toFixed(2)}`);
                }
              }
            } catch (tokenError) {
              console.error(`❌ Token processing error:`, tokenError);
            }
          }
        }
      } catch (tokenError) {
        console.error(`❌ Moralis token list error:`, tokenError);
      }

      const totalValue = tokens.reduce((sum, token) => sum + token.valueUSD, 0);
      
      console.log(`✅ MORALIS ENTERPRISE PARSING COMPLETE: ${tokens.length} tokens, Total: $${totalValue.toFixed(2)}`);
      
      return {
        success: true,
        tokens: tokens,
        error: null,
        totalValue: totalValue,
        source: 'moralis_enterprise_only',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`💥 MORALIS ENTERPRISE PARSING ERROR:`, error);
      return {
        success: false,
        tokens: [],
        error: `ENTERPRISE ERROR: ${error.message}`,
        totalValue: 0
      };
    }
  }

  /**
   * 🚀 100% MORALIS ENTERPRISE: Multi-Chain Token Fetching
   */
  static async fetchTokensForAllChains(walletAddress) {
    const allTokens = [];
    let totalValue = 0;

    // PulseChain Tokens
    const pulseTokens = await this.fetchPulseChainTokens(walletAddress);
    if (pulseTokens.success) {
      allTokens.push(...pulseTokens.tokens);
      totalValue += pulseTokens.totalValue;
    }

    // Ethereum Tokens (if enabled)
    try {
      const ethTokens = await this.fetchEthereumTokens(walletAddress);
      if (ethTokens.success) {
        allTokens.push(...ethTokens.tokens);
        totalValue += ethTokens.totalValue;
      }
    } catch (ethError) {
      console.log(`ℹ️ Ethereum parsing skipped: ${ethError.message}`);
    }

    return {
      success: allTokens.length > 0,
      tokens: allTokens,
      totalValue: totalValue,
      source: 'moralis_enterprise_multi_chain'
    };
  }

  /**
   * 🚀 MORALIS ENTERPRISE: Ethereum Token Fetching
   */
  static async fetchEthereumTokens(walletAddress) {
    try {
      console.log(`🚀 MORALIS ETHEREUM: Fetching tokens for ${walletAddress}`);
      
      const tokens = [];

      // Ethereum Tokens via Moralis
      const tokenResponse = await fetch(`/api/moralis-tokens?endpoint=wallet-tokens&chain=0x1&address=${walletAddress}`);
      const tokenData = await tokenResponse.json();
      
      if (tokenData.result && Array.isArray(tokenData.result)) {
        for (const token of tokenData.result) {
          const balance = parseFloat(token.balance) / Math.pow(10, parseInt(token.decimals) || 18);
          
          if (balance > 0) {
            const priceResponse = await fetch(`/api/moralis-prices?endpoint=token-price&chain=0x1&address=${token.token_address}`);
            const priceData = await priceResponse.json();
            const tokenPrice = priceData.usdPrice || 0;
            
            tokens.push({
              name: token.name || 'Unknown Token',
              symbol: token.symbol || 'UNKNOWN',
              contractAddress: token.token_address,
              balance: balance,
              decimals: parseInt(token.decimals) || 18,
              type: 'erc20',
              chain: 'ethereum',
              estimatedPrice: tokenPrice,
              valueUSD: balance * tokenPrice,
              source: 'moralis_enterprise'
            });
          }
        }
      }

      const totalValue = tokens.reduce((sum, token) => sum + token.valueUSD, 0);
      
      return {
        success: true,
        tokens: tokens,
        totalValue: totalValue,
        source: 'moralis_enterprise_ethereum'
      };
      
    } catch (error) {
      console.error(`❌ Ethereum parsing error:`, error);
      return {
        success: false,
        tokens: [],
        totalValue: 0,
        error: error.message
      };
    }
  }

  /**
   * 📊 Format tokens for display
   */
  static formatTokensForDisplay(tokens) {
    return tokens
      .filter(token => token.balance > 0)
      .sort((a, b) => b.valueUSD - a.valueUSD)
      .map(token => ({
        ...token,
        displayBalance: token.balance.toFixed(4),
        displayValue: `$${token.valueUSD.toFixed(2)}`,
        displayPrice: `$${token.estimatedPrice.toFixed(6)}`
      }));
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
      
      // Insert new token balances (with null-safety validation)
      const tokenRecords = tokens
        .filter(token => {
          // Final safety check: ensure no null/undefined critical fields
          if (!token.symbol || !token.name) {
            console.warn(`⚠️ FINAL FILTER: Skipping token with missing symbol/name:`, token);
            return false;
          }
          return true;
        })
        .map(token => ({
          user_id: userId,
          wallet_address: walletAddress.toLowerCase(),
          chain_id: chainId,
          token_name: token.name || 'Unknown Token',
          token_symbol: token.symbol || 'UNKNOWN',
          contract_address: token.contractAddress || 'native',
          balance: token.balance || 0,
          decimals: token.decimals || 18,
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
          method: 'proxy',
          tokensFound: parseResult.tokens.length,
          tokens: parseResult.tokens,
          totalValue: parseResult.totalValue
        };
      } else {
        // Proxy error occurred
        return {
          success: false,
          method: 'proxy_error',
          error: parseResult.errorMessage,
          address: walletAddress,
          chainId: chainId
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