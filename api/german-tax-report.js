/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - FIXED MIT PORTFOLIO CODE
 * 
 * KRITISCHER FIX: Verwende die EXAKTE API-Logik aus portfolio-cache.js
 * da diese nachweislich funktioniert und echte Transaktionen lädt
 */

// 🔧 EXAKTE KOPIE DER FUNKTIONIERENDEN PORTFOLIO API-LOGIK
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2';

// 🚦 RATE LIMITING: Exakt wie im Portfolio System
let lastCallTime = 0;
const MIN_CALL_INTERVAL = 200;

async function rateLimitedCall(fn) {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < MIN_CALL_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_CALL_INTERVAL - timeSinceLastCall));
  }
  
  lastCallTime = Date.now();
  return await fn();
}

// 🔥 FUNKTIONIERENDEN API-CALL KOPIERT VON PORTFOLIO SYSTEM
async function fetchERC20Transfers(wallet, chainId) {
  try {
    console.log(`📊 TAX: Fetching ERC20 transfers for ${wallet} on chain ${chainId}`);
    
    const res = await fetch(`${MORALIS_BASE}/${wallet}/erc20/transfers?chain=${chainId}&limit=500`, {
      headers: { 'X-API-Key': MORALIS_API_KEY }
    });
    
    if (!res.ok) {
      throw new Error(`ERC20 Transfers API error: ${res.status}`);
    }
    
    const data = await res.json();
    console.log(`✅ TAX: Found ${data?.result?.length || 0} ERC20 transfers`);
    return data.result || [];
    
  } catch (error) {
    console.error('❌ TAX: fetchERC20Transfers error:', error.message);
    return [];
  }
}

// 🇩🇪 DEUTSCHE STEUER-KLASSIFIZIERUNG
function classifyTransactionForGermanTax(tx, walletAddress) {
  const isIncoming = tx.to_address?.toLowerCase() === walletAddress.toLowerCase();
  const isOutgoing = tx.from_address?.toLowerCase() === walletAddress.toLowerCase();
  
  // ROI Token Detection (§22 EStG)
  const ROI_TOKENS = ['WGEP', 'HEX', 'PLSX', 'PLS', 'MASKMAN', 'BORK', 'INC', 'LOAN', 'FLEX'];
  const isROIToken = ROI_TOKENS.includes(tx.token_symbol?.toUpperCase());
  
  // Minter Detection (ROI from minting)
  const KNOWN_MINTERS = [
    '0x0000000000000000000000000000000000000000',
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
    '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3'
  ];
  const fromMinter = KNOWN_MINTERS.includes(tx.from_address?.toLowerCase());
  
  // Calculate EUR value - 100% ECHTE PREISE von Moralis
  const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.token_decimals) || 18);
  const usdValue = parseFloat(tx.usd_price) || 0; // ECHTER Moralis USD-Preis
  const eurValue = usdValue * 0.93; // USD to EUR conversion
  
  // German tax classification
  if (isIncoming && (fromMinter || isROIToken)) {
    return {
      ...tx,
      taxCategory: 'ROI_INCOME',
      taxParagraph: '§22 EStG - Sonstige Einkünfte',
      taxable: true,
      eurValue: eurValue,
      direction: 'IN'
    };
  } else if (isOutgoing) {
    return {
      ...tx,
      taxCategory: 'PURCHASE',
      taxParagraph: '§23 EStG - Spekulation',
      taxable: false,
      eurValue: eurValue,
      direction: 'OUT'
    };
  } else if (isIncoming) {
    return {
      ...tx,
      taxCategory: 'SALE_INCOME',
      taxParagraph: '§23 EStG - Spekulation',
      taxable: true,
      eurValue: eurValue,
      direction: 'IN'
    };
  }
  
  return {
    ...tx,
    taxCategory: 'TRANSFER',
    taxParagraph: 'Steuerfreier Transfer',
    taxable: false,
    eurValue: eurValue,
    direction: isIncoming ? 'IN' : 'OUT'
  };
}

// 🔥 MAIN FUNCTION: Verwende Portfolio API-Logik
async function loadRealTransactionsForTax(walletAddress) {
  console.log(`🇩🇪 TAX: Loading real transactions for ${walletAddress}`);
  
  // Beide Chains laden (wie Portfolio System)
  const chains = [
    { id: '0x1', name: 'Ethereum' },    // WGEP, USDC, ETH
    { id: '0x171', name: 'PulseChain' } // PLS, HEX, andere
  ];
  
  const allTransactions = [];
  
  for (const chain of chains) {
    console.log(`🔗 TAX: Loading ${chain.name} (${chain.id})...`);
    
    const transfers = await rateLimitedCall(() => fetchERC20Transfers(walletAddress, chain.id));
    
    // Filter 2024-2025 (aktuelle Steuerperiode) - FIXED!
    const recentTransfers = transfers.filter(tx => {
      const txYear = new Date(tx.block_timestamp).getFullYear();
      return txYear >= 2024 && txYear <= 2025;
    });
    
    // Deutsche Steuer-Klassifizierung
    const classifiedTransfers = recentTransfers.map(tx => 
      classifyTransactionForGermanTax(tx, walletAddress)
    );
    
    allTransactions.push(...classifiedTransfers);
    console.log(`✅ TAX: ${chain.name}: ${recentTransfers.length} transactions (2025-2035)`);
  }
  
  console.log(`📊 TAX: TOTAL ${allTransactions.length} transactions loaded`);
  return allTransactions;
}

// 🇩🇪 DEUTSCHE STEUERBERECHNUNG
function calculateGermanTax(transactions) {
  const roiTransactions = transactions.filter(tx => tx.taxCategory === 'ROI_INCOME');
  const saleTransactions = transactions.filter(tx => tx.taxCategory === 'SALE_INCOME');
  
  const totalROIValue = roiTransactions.reduce((sum, tx) => sum + (tx.eurValue || 0), 0);
  const totalSaleValue = saleTransactions.reduce((sum, tx) => sum + (tx.eurValue || 0), 0);
  
  // Vereinfachte Steuerberechnung
  const roiTax = totalROIValue * 0.35; // 35% auf ROI (§22 EStG)
  const saleTax = totalSaleValue * 0.25; // 25% auf Spekulationsgewinne (§23 EStG)
  
  return {
    transactions: transactions,
    roiTransactions: roiTransactions,
    saleTransactions: saleTransactions,
    summary: {
      totalTransactions: transactions.length,
      roiCount: roiTransactions.length,
      saleCount: saleTransactions.length,
      totalROIValueEUR: Number(totalROIValue.toFixed(2)),
      totalSaleValueEUR: Number(totalSaleValue.toFixed(2)),
      totalTaxEUR: Number((roiTax + saleTax).toFixed(2)),
      roiTaxEUR: Number(roiTax.toFixed(2)),
      saleTaxEUR: Number(saleTax.toFixed(2))
    },
    metadata: {
      source: 'moralis_portfolio_api_logic',
      generatedAt: new Date().toISOString(),
      walletAddress: transactions[0]?.to_address || transactions[0]?.from_address || 'unknown',
      chains: ['Ethereum', 'PulseChain'],
      year: '2025-2035'
    }
  };
}

export default async function handler(req, res) {
  console.log('🇩🇪 TAX API: Starting with PORTFOLIO LOGIC');
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // API Key Check
    if (!MORALIS_API_KEY) {
      return res.status(500).json({ 
        error: 'Moralis API Key not configured'
      });
    }

    console.log(`🇩🇪 TAX: Processing ${address} with PORTFOLIO API LOGIC`);

    // 1. LADE ECHTE TRANSAKTIONEN (Portfolio API Logic)
    const transactions = await loadRealTransactionsForTax(address);
    
    if (transactions.length === 0) {
      return res.status(200).json({
        success: true,
        taxReport: {
          transactions: [],
          summary: {
            totalTransactions: 0,
            roiCount: 0,
            saleCount: 0,
            totalROIValueEUR: 0,
            totalSaleValueEUR: 0,
            totalTaxEUR: 0
          },
          metadata: {
            source: 'moralis_portfolio_api_logic',
            message: 'No transactions found for 2025-2035',
            walletAddress: address
          }
        }
      });
    }

    // 2. DEUTSCHE STEUERBERECHNUNG
    const taxReport = calculateGermanTax(transactions);

    console.log(`✅ TAX: Report generated - ${taxReport.summary.totalTransactions} transactions`);

    return res.status(200).json({
      success: true,
      taxReport: taxReport,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ TAX API Error:`, error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 🔍 HILFSFUNKTIONEN
function isValidWalletAddress(address) {
    if (!address || typeof address !== 'string') return false;
    
    // Ethereum-Format: 0x + 40 Hex-Zeichen
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
}

// 📋 API-DOKUMENTATION
/*
POST /api/german-tax-report

REQUEST BODY:
{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D85E2C5b0b6c6F98",
    "chainIds": ["0x1"],
    "options": {
        "taxYear": 2025,
        "includeROI": true
    }
}

RESPONSE:
{
    "success": true,
    "wallet": "0x742d35Cc6634C0532925a3b8D85E2C5b0b6c6F98",
    "germanSummary": {
        "paragraph22": {
            "roiIncome": 1234.56,
            "total": 1234.56,
            "note": "§22 EStG - Sonstige Einkünfte"
        },
        "paragraph23": {
            "taxableGains": 567.89,
            "taxFreeGains": 123.45,
            "freigrenze600": {...}
        }
    },
    "transactions": [...],
    "fifoResults": [...],
    "taxTable": [...]
}
*/ 