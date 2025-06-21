/**
 * 🔥 MORALIS-BASIERTES DEUTSCHES TAX SYSTEM API
 * 
 * ✅ Automatische Kategorisierung via Moralis
 * ✅ Deutsches Steuerrecht: Gekaufte Coins vs ROI Events
 * ✅ Contract Detection für PulseChain
 * ✅ FIFO-Berechnung mit Haltefrist
 */

import { implementFallbackGermanTax } from '../src/services/MoralisGermanTaxSystem.js';

/**
 * UPDATE für /api/moralis-german-tax.js
 */
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, existingTransactions } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    console.log('🇩🇪 German Tax API called with fallback processing');
    
    // Use fallback processing with existing transactions
    const result = await implementFallbackGermanTax(walletAddress, existingTransactions);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
} 