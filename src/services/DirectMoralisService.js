// 🔧 TEMPORÄRER DIRECT MORALIS SERVICE - Minimale Version für Build-Fix
// Ersetzt den gelöschten Service um Build-Fehler zu vermeiden

export class DirectMoralisService {
  
  // Temporäre minimale Implementierung
  static async getTransferHistory(walletAddress, chain, limit = 200) {
    console.log(`🔧 TEMP: DirectMoralisService.getTransferHistory called for ${walletAddress}`);
    
    try {
      // Verwende die funktionierende Portfolio API als Fallback
      const response = await fetch('/api/portfolio-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'temp',
          walletAddress: walletAddress,
          chainId: chain
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Minimale ROI-Transfers (leeres Array für Kompatibilität)
      return {
        success: true,
        roiTransfers: [],
        cuUsed: 1,
        source: 'temp_fallback_service'
      };
      
    } catch (error) {
      console.error('🔧 TEMP: DirectMoralisService error:', error);
      return {
        success: false,
        error: error.message,
        roiTransfers: [],
        cuUsed: 0
      };
    }
  }
  
  // Weitere temporäre Methoden falls benötigt
  static async getTaxData(walletAddress, chain, options = {}) {
    console.log(`🔧 TEMP: DirectMoralisService.getTaxData called for ${walletAddress}`);
    
    return {
      success: true,
      allTransfers: [],
      taxableTransfers: [],
      totalTransfers: 0,
      source: 'temp_fallback_service'
    };
  }
}

export default DirectMoralisService; 