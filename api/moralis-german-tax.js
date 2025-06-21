/**
 * 🔥 MORALIS-BASIERTES DEUTSCHES TAX SYSTEM API
 * 
 * ✅ Automatische Kategorisierung via Moralis
 * ✅ Deutsches Steuerrecht: Gekaufte Coins vs ROI Events
 * ✅ Contract Detection für PulseChain
 * ✅ FIFO-Berechnung mit Haltefrist
 */

const { MoralisGermanTaxSystem, implementMoralisGermanTax } = require('../src/services/MoralisGermanTaxSystem');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    console.log('🚀 Moralis German Tax Request:', { walletAddress });

    // Implementiere Moralis-basiertes German Tax System
    const taxData = await implementMoralisGermanTax(walletAddress);
    
    if (!taxData.success) {
      return res.status(500).json({
        success: false,
        error: taxData.error,
        disclaimer: 'Automatische Kategorisierung - Steuerberater empfohlen'
      });
    }

    // Success Response
    return res.status(200).json({
      success: true,
      disclaimer: 'Automatische Kategorisierung - Steuerberater empfohlen',
      taxData,
      moralisSystem: {
        integrated: true,
        approach: 'MORALIS_CONTRACT_DETECTION',
        compliance: 'Deutsches Steuerrecht - §22 & §23 EStG',
        features: [
          'Automatische Kategorisierung via Moralis',
          'Contract Detection für ROI Events',
          'FIFO-Berechnung mit Haltefrist',
          'Deutsche Steuerkonformität',
          'PulseChain Contract Support'
        ],
        categories: {
          gekaufteCoins: 'Mit Kaufpreis und Haltefrist',
          roiEvents: 'Immer steuerpflichtig',
          verkaufteCoins: 'Mit FIFO-Berechnung',
          transfers: 'Reine Transfers'
        }
      }
    });

  } catch (error) {
    console.error('🚨 Moralis German Tax Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Moralis German Tax System failed',
      details: error.message,
      disclaimer: 'Automatische Kategorisierung - Steuerberater empfohlen'
    });
  }
}; 