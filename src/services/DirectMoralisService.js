// 🔧 FUNKTIONIERENDER DIRECT MORALIS SERVICE - Portfolio API kompatibel
// Repariert um korrekt mit portfolio-cache.js zu arbeiten

export class DirectMoralisService {
  
  // Reparierte Implementierung mit korrekten API-Aufrufen
  static async getTransferHistory(walletAddress, chain, limit = 200) {
    console.log(`🔧 DirectMoralisService: Loading transfers for ${walletAddress} on chain ${chain}`);
    
    try {
      // 🔥 FIX: Verwende Portfolio-Cache statt TaxReport-API
      // Das verhindert mehrfache API-Calls!
      const response = await fetch('/api/portfolio-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          chain: chain,
          limit: limit
        })
      });
      
      if (!response.ok) {
        throw new Error(`Portfolio Cache Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`Portfolio Error: ${data.error}`);
      }
      
      // Konvertiere Portfolio-Daten zu ROI-Format
      const portfolioData = data.portfolio;
      const roiTransfers = portfolioData.transactions?.filter(tx => 
        tx.category === 'token_transfer' || tx.category === 'native_transfer'
      ) || [];
      
      console.log(`✅ DirectMoralisService: Found ${roiTransfers.length} transfers from portfolio cache`);
      
      return {
        success: true,
        roiTransfers: roiTransfers,
        cuUsed: 1,
        source: 'portfolio_cache_integration'
      };
      
    } catch (error) {
      console.error('❌ DirectMoralisService error:', error);
      return {
        success: false,
        error: error.message,
        roiTransfers: [],
        cuUsed: 0
      };
    }
  }
  
  // Weitere kompatible Methoden
  static async getTaxData(walletAddress, chain, options = {}) {
    console.log(`🔧 DirectMoralisService: Loading tax data for ${walletAddress}`);
    
    try {
      // 🔥 FIX: Verwende Portfolio-Cache statt TaxReport-API
      const response = await fetch('/api/portfolio-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          chain: chain
        })
      });
      
      if (!response.ok) {
        throw new Error(`Portfolio Cache Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`Portfolio Error: ${data.error}`);
      }
      
      const portfolioData = data.portfolio;
      const allTransfers = portfolioData.transactions || [];
      const taxableTransfers = allTransfers.filter(tx => 
        tx.category === 'token_transfer' || tx.category === 'native_transfer'
      );
      
      return {
        success: true,
        allTransfers: allTransfers,
        taxableTransfers: taxableTransfers,
        totalTransfers: allTransfers.length,
        source: 'portfolio_cache_integration'
      };
      
    } catch (error) {
      console.error('❌ DirectMoralisService tax data error:', error);
      return {
        success: false,
        error: error.message,
        allTransfers: [],
        taxableTransfers: [],
        totalTransfers: 0
      };
    }
  }
}

export default DirectMoralisService; 