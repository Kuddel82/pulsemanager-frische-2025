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
      // Fetch via Proxy (CORS-FREE)
      const apiTokens = await this.fetchTokensFromAPI(walletAddress, chainId);
      return apiTokens;
    } catch (apiError) {
      console.error('💥 PROXY API ERROR:', apiError.message);
      
      // Return error for handling in UI
      return {
        success: false,
        error: true,
        errorMessage: apiError.message,
        address: walletAddress,
        chainId: chainId,
        timestamp: new Date().toISOString()
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

  // 🟢 PulseChain Token Fetching via PROXY v0.0.5 (CORS-FREE)
  static async fetchPulseChainTokens(walletAddress) {
    const proxyBaseUrl = '/api/pulsechain';
    const timestamp = Date.now();
    
    try {
      console.log(`🚀 FETCHING TOKENS via PROXY v0.0.9 for: ${walletAddress} [${timestamp}]`);
      
      // Get native PLS balance via proxy
      const nativeUrl = `${proxyBaseUrl}?address=${walletAddress}&action=balance`;
      console.log(`🔗 Native Proxy URL: ${nativeUrl}`);
      const nativeResponse = await fetch(nativeUrl);
      const nativeData = await nativeResponse.json();
      console.log(`🔗 Native Proxy Response:`, nativeData);
      
      // Get ERC20 token balances via proxy
      const tokenUrl = `${proxyBaseUrl}?address=${walletAddress}&action=tokenlist`;
      console.log(`🔗 Token Proxy URL: ${tokenUrl}`);
      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();
      console.log(`🔗 Token Proxy Response:`, tokenData);
      
      // Get Transaction History via proxy
      const txUrl = `${proxyBaseUrl}?address=${walletAddress}&action=txlist&offset=50`;
      console.log(`🔗 Transaction Proxy URL: ${txUrl}`);
      const txResponse = await fetch(txUrl);
      const txData = await txResponse.json();
      console.log(`🔗 Transaction Proxy Response:`, txData);
      
      // Get ERC20 Token Transfers via proxy
      const tokenTxUrl = `${proxyBaseUrl}?address=${walletAddress}&action=tokentx&offset=50`;
      console.log(`🔗 Token TX Proxy URL: ${tokenTxUrl}`);
      const tokenTxResponse = await fetch(tokenTxUrl);
      const tokenTxData = await tokenTxResponse.json();
      console.log(`🔗 Token TX Proxy Response:`, tokenTxData);
      
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
      
      // Add ERC20 tokens - VERBESSERTE LOGIK
      if (tokenData.status === '1' && Array.isArray(tokenData.result)) {
        console.log(`🪙 PROCESSING ${tokenData.result.length} TOKENS`);
        for (const token of tokenData.result) {
          const decimals = parseInt(token.decimals) || 18;
          const balance = parseFloat(token.balance) / Math.pow(10, decimals);
          
          // Skip tokens with null/invalid symbols or names (DB constraint protection)
          if (!token.symbol || token.symbol.trim() === '' || token.symbol === 'null' || 
              !token.name || token.name.trim() === '' || token.name === 'null') {
            console.log(`⚠️ NULL-FILTER: SKIPPING TOKEN "${token.name || 'null'}" (${token.symbol || 'null'}) - Invalid symbol/name`);
            continue;
          }
          
          if (balance > 0) {
            // Verbesserte Preis-Schätzung basierend auf bekannten Tokens
            let estimatedPrice = 0;
            const symbol = token.symbol?.toUpperCase();
            
            // Bekannte PulseChain Token-Preise (grobe Schätzungen)
            const knownPrices = {
              'PLSX': 0.000015,
              'INC': 0.000004,
              'HEX': 0.003,
              'USDL': 1.0,
              'LOAN': 0.000001,
              'MAXI': 0.000002,
              'LUCKY': 0.000001,
              'PRAT': 0.000001,
              'TEXAN': 0.000001,
              'SPARK': 0.000001,
              'REX': 0.000001,
              'BTC': 50000, // Wrapped BTC
              'ETH': 3200, // Wrapped ETH
              'USDC': 1.0,
              'USDT': 1.0
            };
            
            estimatedPrice = knownPrices[symbol] || 0;
            
            const tokenObj = {
              name: token.name || token.symbol || 'Unknown Token',
              symbol: token.symbol || 'UNKNOWN',
              contractAddress: token.contractAddress || 'unknown',
              balance: balance,
              decimals: decimals,
              type: 'ERC20',
              valueUSD: balance * estimatedPrice,
              estimatedPrice: estimatedPrice,
              dexScreenerUrl: `https://dexscreener.com/pulsechain/${token.contractAddress}`
            };
            
            tokens.push(tokenObj);
            console.log(`🪙 TOKEN: ${token.symbol} - ${balance.toFixed(4)} - $${tokenObj.valueUSD.toFixed(2)}`);
          }
        }
      }
      
      // Calculate total portfolio value
      const totalTokenValue = tokens.reduce((sum, token) => sum + token.valueUSD, 0);
      const totalPLSValue = tokens.find(t => t.symbol === 'PLS')?.valueUSD || 0;
      
      console.log(`💎 FOUND ${tokens.length} tokens for PulseChain wallet`);
      console.log(`💰 TOTAL TOKEN VALUE: $${totalTokenValue.toFixed(2)}`);
      console.log(`💰 PLS VALUE: $${totalPLSValue.toFixed(2)}`);
      
      return {
        success: true,
        tokens: tokens,
        totalTokens: tokens.length,
        totalValue: totalTokenValue,
        address: walletAddress,
        chainId: 369,
        transactions: {
          normal: txData?.result || [],
          tokenTransfers: tokenTxData?.result || []
        },
        debug: {
          nativeResponse: nativeData,
          tokenResponse: tokenData,
          txResponse: txData,
          tokenTxResponse: tokenTxData
        }
      };
      
    } catch (error) {
      // Proxy error handling
      console.error('💥 PROXY ERROR:', error.message);
      throw new Error(`PROXY_ERROR: ${error.message}`);
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