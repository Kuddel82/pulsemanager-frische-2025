// 🔧 FUNKTIONIERENDER DIRECT MORALIS SERVICE - Portfolio API kompatibel
// Repariert um korrekt mit portfolio-cache.js zu arbeiten

export class DirectMoralisService {
  
  // Reparierte Implementierung mit korrekten API-Aufrufen
  static async getTransferHistory(walletAddress, chain, limit = 200) {
    console.log(`🔧 DirectMoralisService: Loading transfers for ${walletAddress} on chain ${chain}`);
    
    try {
      // Verwende die NEUE funktionierende german-tax-report API
      const response = await fetch('/api/german-tax-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress
        })
      });
      
      if (!response.ok) {
        throw new Error(`German Tax API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`Tax API Error: ${data.error}`);
      }
      
      // Konvertiere Tax Report Daten zu ROI-Format
      const taxReport = data.taxReport;
      const roiTransfers = taxReport.roiTransactions || [];
      
      console.log(`✅ DirectMoralisService: Found ${roiTransfers.length} ROI transfers`);
      
      return {
        success: true,
        roiTransfers: roiTransfers,
        cuUsed: 1,
        source: 'german_tax_api_integration'
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
      // Verwende die neue german-tax-report API
      const response = await fetch('/api/german-tax-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress
        })
      });
      
      if (!response.ok) {
        throw new Error(`Tax API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`Tax API Error: ${data.error}`);
      }
      
      const taxReport = data.taxReport;
      
      return {
        success: true,
        allTransfers: taxReport.transactions || [],
        taxableTransfers: taxReport.roiTransactions || [],
        totalTransfers: taxReport.summary?.totalTransactions || 0,
        source: 'german_tax_api_integration'
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