// 🔥 PulseChain Wallet API Parser
// Extrahiert Token, Transaktionen und Portfolio-Daten von scan.pulsechain.com
// DOM-sicher mit CORS-Fallback und manueller Eingabe

import { supabase } from '@/lib/supabaseClient';
import { TokenPriceService } from './tokenPriceService';

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

  // 🟢 PulseChain Token Fetching via IMPROVED API v1.0 (Real Contract Addresses)
  static async fetchPulseChainTokens(walletAddress) {
    const timestamp = Date.now();
    
    try {
      console.log(`🚀 FETCHING TOKENS via IMPROVED API v1.0 for: ${walletAddress} [${timestamp}]`);
      
      // ⚡ PULSECHAIN SCAN API CALLS VIA PROXY (CORS-sicher)
      const proxyUrl = '/api/pulsechain';
      
      // 1. Native PLS Balance
      const nativeUrl = `${proxyUrl}?address=${walletAddress}&action=balance&module=account&tag=latest`;
      console.log(`🔗 Native Proxy URL: ${nativeUrl}`);
      
      // 2. ERC20 Token List
      const tokenUrl = `${proxyUrl}?address=${walletAddress}&action=tokenlist&module=account`;
      console.log(`🔗 Token Proxy URL: ${tokenUrl}`);
      
      // 3. Recent Transactions für ROI-Analyse
      const txUrl = `${proxyUrl}?address=${walletAddress}&action=txlist&module=account&startblock=0&endblock=99999999&sort=desc&offset=100`;
      console.log(`🔗 Transaction Proxy URL: ${txUrl}`);
      
      // 4. Token Transfers für ROI-Tracking
      const tokenTxUrl = `${proxyUrl}?address=${walletAddress}&action=tokentx&module=account&startblock=0&endblock=99999999&sort=desc&offset=100`;
      console.log(`🔗 Token Transfer Proxy URL: ${tokenTxUrl}`);
      
      // 🔄 PARALLEL API CALLS VIA PROXY für bessere Performance
      const [nativeResponse, tokenResponse, txResponse, tokenTxResponse] = await Promise.all([
        fetch(nativeUrl).then(r => r.json()).catch(e => ({ status: '0', message: e.message })),
        fetch(tokenUrl).then(r => r.json()).catch(e => ({ status: '0', message: e.message })),
        fetch(txUrl).then(r => r.json()).catch(e => ({ status: '0', message: e.message })),
        fetch(tokenTxUrl).then(r => r.json()).catch(e => ({ status: '0', message: e.message }))
      ]);
      
      console.log(`📊 API RESPONSES:`, {
        native: nativeResponse.status,
        tokens: tokenResponse.status,
        transactions: txResponse.status,
        tokenTransfers: tokenTxResponse.status
      });
      
      const tokens = [];
      
      // ⚡ Native PLS Processing
      if (nativeResponse.status === '1') {
        const plsBalance = parseFloat(nativeResponse.result) / Math.pow(10, 18);
        const plsPrice = TokenPriceService.REAL_PULSECHAIN_PRICES['PLS'] || 3.09e-5;
        
        tokens.push({
          name: 'PulseChain',
          symbol: 'PLS',
          contractAddress: 'native',
          balance: plsBalance,
          decimals: 18,
          type: 'native',
          estimatedPrice: plsPrice,
          valueUSD: plsBalance * plsPrice,
          dexScreenerUrl: 'https://dexscreener.com/pulsechain/0x0'
        });
        
        console.log(`⚡ PLS: ${plsBalance.toFixed(4)} × $${plsPrice} = $${(plsBalance * plsPrice).toFixed(2)}`);
      }
      
      // 🪙 ERC20 Token Processing mit ECHTER PREIS-INTEGRATION
      if (tokenResponse.status === '1' && Array.isArray(tokenResponse.result)) {
        console.log(`🪙 PROCESSING ${tokenResponse.result.length} ERC20 TOKENS`);
        
        for (const token of tokenResponse.result) {
          const decimals = parseInt(token.decimals) || 18;
          const balance = parseFloat(token.balance) / Math.pow(10, decimals);
          
          // Skip invalid tokens (stronger validation)
          if (!token.symbol || !token.name || token.symbol.trim() === '' || 
              token.name.trim() === '' || balance <= 0) {
            continue;
          }
          
          // 💰 ECHTE PREISE aus TokenPriceService
          const realPrice = await TokenPriceService.getTokenPrice(token.symbol, token.contractAddress);
          const tokenValue = balance * realPrice;
          
          // Filtere nur Token mit Mindest-Wert ($0.001 statt $0.01 für mehr Tokens)
          if (tokenValue >= 0.001) {
            tokens.push({
              name: token.name,
              symbol: token.symbol,
              contractAddress: token.contractAddress,
              balance: balance,
              decimals: decimals,
              type: 'ERC20',
              estimatedPrice: realPrice,
              valueUSD: tokenValue,
              dexScreenerUrl: `https://dexscreener.com/pulsechain/${token.contractAddress}`,
              // 📊 Zusätzliche PulseWatch-kompatible Felder
              holdingRank: 0, // Wird später gesetzt
              percentageOfPortfolio: 0, // Wird später berechnet
              priceChange24h: 0, // TODO: Implementieren
              lastUpdated: new Date().toISOString()
            });
            
            console.log(`🪙 TOKEN: ${token.symbol} - ${balance.toFixed(4)} × $${realPrice} = $${tokenValue.toFixed(2)}`);
          }
        }
      }
      
      // 📊 PORTFOLIO ANALYSIS (wie PulseWatch)
      // Sortiere Token nach Wert (höchster zuerst)
      tokens.sort((a, b) => b.valueUSD - a.valueUSD);
      
      // Setze Rankings und Portfolio-Anteile
      const totalValue = tokens.reduce((sum, token) => sum + token.valueUSD, 0);
      tokens.forEach((token, index) => {
        token.holdingRank = index + 1;
        token.percentageOfPortfolio = totalValue > 0 ? (token.valueUSD / totalValue) * 100 : 0;
      });
      
      // 🎯 TOP HOLDINGS LOG (wie PulseWatch Dashboard)
      console.log(`💎 TOP 5 HOLDINGS:`);
      tokens.slice(0, 5).forEach(token => {
        console.log(`${token.holdingRank}. ${token.symbol}: $${token.valueUSD.toFixed(2)} (${token.percentageOfPortfolio.toFixed(1)}%)`);
      });
      
      const totalTokenValue = tokens.reduce((sum, token) => sum + token.valueUSD, 0);
      
      console.log(`💰 TOTAL PORTFOLIO VALUE: $${totalTokenValue.toFixed(2)}`);
      console.log(`🪙 TOTAL TOKENS FOUND: ${tokens.length} (filtered for value >= $0.001)`);
      
      return {
        success: true,
        tokens: tokens,
        totalTokens: tokens.length,
        totalValue: totalTokenValue,
        address: walletAddress,
        chainId: 369,
        // 📊 PulseWatch-style statistics
        statistics: {
          totalValue: totalTokenValue,
          tokenCount: tokens.length,
          topHolding: tokens[0] || null,
          portfolioDistribution: {
            top5Percentage: tokens.slice(0, 5).reduce((sum, t) => sum + t.percentageOfPortfolio, 0),
            top10Percentage: tokens.slice(0, 10).reduce((sum, t) => sum + t.percentageOfPortfolio, 0)
          }
        },
        // 📈 Transaction data für ROI Analysis
        transactions: {
          normal: txResponse?.result || [],
          tokenTransfers: tokenTxResponse?.result || []
        },
        // 🔍 Debug information
        debug: {
          apiCalls: {
            native: nativeResponse.status === '1' ? 'SUCCESS' : `ERROR: ${nativeResponse.message}`,
            tokens: tokenResponse.status === '1' ? 'SUCCESS' : `ERROR: ${tokenResponse.message}`,
            transactions: txResponse.status === '1' ? 'SUCCESS' : `ERROR: ${txResponse.message}`,
            tokenTransfers: tokenTxResponse.status === '1' ? 'SUCCESS' : `ERROR: ${tokenTxResponse.message}`
          },
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('💥 IMPROVED API ERROR:', error.message);
      throw new Error(`PULSECHAIN_API_ERROR: ${error.message}`);
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