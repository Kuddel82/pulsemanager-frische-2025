/**
 * 🚀 DIRECT MORALIS PRO SERVICE
 * 
 * DNS-freie direkte API-Calls:
 * - /wallets/{address}/erc20
 * - /erc20/{token}/price  
 * - /wallets/{address}/erc20/transfers
 * 
 * CU-Limit: 50 pro Load optimiert
 */

const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';
const API_KEY = import.meta.env.VITE_MORALIS_API_KEY;

export class DirectMoralisService {
  
  /**
   * 🎯 PORTFOLIO: Live-Preise + Token anzeigen (CU-Limit: 50 pro Load)
   */
  static async getPortfolioTokens(address, chain = '0x171') {
    try {
      console.log(`🚀 DIRECT: Loading portfolio tokens for ${address}`);
      
      // 1. Get ERC20 tokens
      const tokensResponse = await fetch(`${MORALIS_BASE_URL}/${address}/erc20?chain=${chain}&limit=50`, {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!tokensResponse.ok) {
        throw new Error(`Tokens API failed: ${tokensResponse.status}`);
      }
      
      const tokensData = await tokensResponse.json();
      const tokens = tokensData.result || tokensData || [];
      
      console.log(`✅ DIRECT: ${tokens.length} tokens loaded`);
      
      // 2. Get prices for first 10 tokens (CU limit)
      const tokensWithPrices = await Promise.allSettled(
        tokens.slice(0, 10).map(async (token) => {
          try {
            const priceResponse = await fetch(`${MORALIS_BASE_URL}/erc20/${token.token_address}/price?chain=${chain}`, {
              headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
              }
            });
            
            let price = 0;
            if (priceResponse.ok) {
              const priceData = await priceResponse.json();
              price = priceData.usdPrice || 0;
            }
            
            return {
              ...token,
              usdPrice: price,
              usdValue: (parseFloat(token.balance || 0) / Math.pow(10, token.decimals || 18)) * price
            };
          } catch (error) {
            console.warn(`Price failed for ${token.symbol}:`, error.message);
            return {
              ...token,
              usdPrice: 0,
              usdValue: 0
            };
          }
        })
      );
      
      const processedTokens = tokensWithPrices
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      const totalValue = processedTokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
      
      console.log(`✅ DIRECT: Portfolio loaded - $${totalValue.toFixed(2)}`);
      
      return {
        success: true,
        tokens: processedTokens,
        totalValue: totalValue,
        totalTokens: tokens.length,
        pricesLoaded: processedTokens.length,
        cuUsed: Math.min(tokens.length + processedTokens.length, 60), // Estimate
        source: 'direct_moralis_pro'
      };
      
    } catch (error) {
      console.error('💥 DIRECT Portfolio Error:', error);
      return { 
        success: false, 
        error: error.message,
        tokens: [],
        totalValue: 0
      };
    }
  }
  
  /**
   * 📊 ROI-TRACKER: Nur transaktionsbasiert, ohne DeFi-Summary
   */
  static async getTransferHistory(address, chain = '0x171', limit = 100) {
    try {
      console.log(`🚀 DIRECT: Loading transfer history for ${address}`);
      
      const response = await fetch(`${MORALIS_BASE_URL}/${address}/erc20/transfers?chain=${chain}&limit=${limit}`, {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Transfers API failed: ${response.status}`);
      }
      
      const data = await response.json();
      const transfers = data.result || [];
      
      // ROI Detection: Incoming transfers that could be rewards/minting
      const roiTransfers = transfers.filter(transfer => {
        const isIncoming = transfer.to_address?.toLowerCase() === address.toLowerCase();
        const hasValue = transfer.value && parseFloat(transfer.value) > 0;
        const fromZeroAddress = transfer.from_address === '0x0000000000000000000000000000000000000000';
        
        return isIncoming && hasValue && (fromZeroAddress || transfer.from_address !== address.toLowerCase());
      });
      
      console.log(`✅ DIRECT: ${transfers.length} transfers, ${roiTransfers.length} potential ROI`);
      
      return {
        success: true,
        transfers: transfers,
        roiTransfers: roiTransfers,
        totalTransfers: transfers.length,
        roiCount: roiTransfers.length,
        cuUsed: Math.min(limit / 10, 10), // Estimate
        source: 'direct_moralis_pro_transfers'
      };
      
    } catch (error) {
      console.error('💥 DIRECT Transfers Error:', error);
      return { 
        success: false, 
        error: error.message,
        transfers: [],
        roiTransfers: []
      };
    }
  }
  
  /**
   * 📄 TAX-REPORT: Alle Transfers tracken, kein WalletStats nötig
   */
  static async getTaxData(address, chain = '0x171', options = {}) {
    try {
      const { limit = 200, getAllPages = false } = options;
      
      console.log(`🚀 DIRECT: Loading tax data for ${address}`);
      
      let allTransfers = [];
      let cursor = null;
      let hasMore = true;
      
      while (hasMore && allTransfers.length < 1000) { // Max 1000 for performance
        const url = new URL(`${MORALIS_BASE_URL}/${address}/erc20/transfers`);
        url.searchParams.set('chain', chain);
        url.searchParams.set('limit', Math.min(limit, 100).toString());
        if (cursor) url.searchParams.set('cursor', cursor);
        
        const response = await fetch(url.toString(), {
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) break;
        
        const data = await response.json();
        const transfers = data.result || [];
        allTransfers.push(...transfers);
        
        cursor = data.cursor;
        hasMore = getAllPages && cursor && transfers.length === Math.min(limit, 100);
        
        if (!getAllPages) break;
      }
      
      // Tax Classification
      const taxableTransfers = allTransfers.filter(transfer => {
        const isIncoming = transfer.to_address?.toLowerCase() === address.toLowerCase();
        const fromZeroAddress = transfer.from_address === '0x0000000000000000000000000000000000000000';
        
        // ROI/Minting = taxable income
        return isIncoming && fromZeroAddress;
      });
      
      const purchases = allTransfers.filter(transfer => {
        const isOutgoing = transfer.from_address?.toLowerCase() === address.toLowerCase();
        return isOutgoing;
      });
      
      console.log(`✅ DIRECT: ${allTransfers.length} transfers, ${taxableTransfers.length} taxable`);
      
      return {
        success: true,
        allTransfers: allTransfers,
        taxableTransfers: taxableTransfers,
        purchases: purchases,
        totalTransfers: allTransfers.length,
        taxableCount: taxableTransfers.length,
        purchaseCount: purchases.length,
        cuUsed: Math.ceil(allTransfers.length / 100) * 10, // Estimate
        source: 'direct_moralis_pro_tax'
      };
      
    } catch (error) {
      console.error('💥 DIRECT Tax Error:', error);
      return { 
        success: false, 
        error: error.message,
        allTransfers: [],
        taxableTransfers: [],
        purchases: []
      };
    }
  }
  
  /**
   * 💰 SINGLE TOKEN PRICE
   */
  static async getTokenPrice(tokenAddress, chain = '0x171') {
    try {
      const response = await fetch(`${MORALIS_BASE_URL}/erc20/${tokenAddress}/price?chain=${chain}`, {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return { success: false, price: 0, error: `Price API failed: ${response.status}` };
      }
      
      const data = await response.json();
      return {
        success: true,
        price: data.usdPrice || 0,
        tokenAddress: tokenAddress,
        source: 'direct_moralis_pro_price'
      };
      
    } catch (error) {
      console.error('💥 DIRECT Price Error:', error);
      return { 
        success: false, 
        price: 0, 
        error: error.message 
      };
    }
  }
} 