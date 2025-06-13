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

// Debug API Key
if (!API_KEY) {
  console.error('🚨 CRITICAL: VITE_MORALIS_API_KEY not found in environment!');
  console.error('📋 Required: Add VITE_MORALIS_API_KEY to .env file');
} else {
  console.log('✅ MORALIS API KEY loaded:', API_KEY.substring(0, 10) + '...');
}

export class DirectMoralisService {
  
  /**
   * 🎯 PORTFOLIO: Live-Preise + Token anzeigen (CU-Limit: 50 pro Load)
   */
  static async getPortfolioTokens(address, chain = '0x171') {
    try {
      console.log(`🚀 DIRECT: Loading portfolio tokens for ${address}`);
      
      // 1. Get ERC20 tokens via Proxy API
      const tokensResponse = await fetch(`/api/moralis-proxy?endpoint=balances&address=${address}&chain=${chain}&limit=50`);
      
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
            // 🔄 CSP FIX: Price-API temporär deaktiviert - verhindert 401 Fehler
            // TODO: Price-Endpoint zur Proxy-API hinzufügen
            let price = 0;
            
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
      
      // 🔄 CSP FIX: Verwende Proxy-API statt direkter Moralis-Aufrufe
      const response = await fetch(`/api/moralis-proxy?endpoint=erc20-transfers&address=${address}&chain=${chain}&limit=${limit}`);
      
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
   * 📄 TAX-REPORT: Alle Transfers tracken, unlimited mit Pagination
   */
  static async getTaxData(address, chain = '0x171', options = {}) {
    try {
      // Check API key first
      if (!API_KEY) {
        throw new Error('VITE_MORALIS_API_KEY not configured. Please add to .env file.');
      }
      
      const { limit = 100, getAllPages = true, maxTransactions = 5000 } = options;
      
      console.log(`🚀 DIRECT: Loading tax data for ${address} on chain ${chain} (unlimited: ${getAllPages})`);
      
      let allTransfers = [];
      let cursor = null;
      let hasMore = true;
      let pageCount = 0;
      
      // 🔄 UNLIMITED PAGINATION für Tax Reports
      while (hasMore && allTransfers.length < maxTransactions) {
        pageCount++;
        console.log(`📄 TAX: Loading page ${pageCount}, current total: ${allTransfers.length}`);
        
        // 🔄 CSP FIX: Verwende Proxy-API
        let url = `/api/moralis-proxy?endpoint=erc20-transfers&address=${address}&chain=${chain}&limit=${Math.min(limit, 100)}`;
        if (cursor) url += `&cursor=${cursor}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.warn(`⚠️ TAX: Page ${pageCount} failed with ${response.status}`);
          break;
        }
        
        const data = await response.json();
        const transfers = data.result || [];
        
        if (transfers.length === 0) {
          console.log(`📄 TAX: No more transfers on page ${pageCount}`);
          break;
        }
        
        allTransfers.push(...transfers);
        
        cursor = data.cursor;
        hasMore = getAllPages && cursor && transfers.length === Math.min(limit, 100);
        
        console.log(`✅ TAX: Page ${pageCount} loaded ${transfers.length} transfers, cursor: ${cursor ? 'yes' : 'no'}`);
        
        if (!getAllPages) break;
        
        // Rate limiting zwischen Seiten
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`📊 TAX: Total loaded ${allTransfers.length} transfers across ${pageCount} pages`);
      
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
        cuUsed: Math.min(pageCount * 10, 100), // Estimate based on pages
        pagesLoaded: pageCount,
        source: 'direct_moralis_unlimited_tax'
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
    // 🔄 CSP FIX: Price-API temporär deaktiviert - verhindert 401 Fehler
    // TODO: Price-Endpoint zur Proxy-API hinzufügen
    console.warn('⚠️ DIRECT: Token prices temporär deaktiviert wegen CSP-Fix');
    return {
      success: false,
      price: 0,
      tokenAddress: tokenAddress,
      source: 'direct_moralis_pro_price_disabled',
      error: 'Temporarily disabled due to CSP fixes'
    };
  }
} 