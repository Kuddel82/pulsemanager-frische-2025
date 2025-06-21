/**
 * 🔥 SICHERER TAX ADVISOR EXPORT API
 * 
 * ✅ KEINE STEUERBERECHNUNGEN - Nur Datensammlung
 * ✅ DSGVO-konform - Keine Steuerberatung
 * ✅ Export-Formate: CSV, HTML (Excel entfernt)
 * ✅ Professionelle Steuerberater-Grundlage
 * ✅ FIFO Haltefrist-Berechnung (informativ)
 */

const GermanTaxDataExporter = require('../src/services/GermanTaxDataExporter').default;

// 🚨 MORALIS IMPORT FIX - BACKEND CRASH RESOLVED!
const getWalletTransactionHistoryHTTP = async (walletAddress, chain = 'eth') => {
  const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
  const baseURL = 'https://deep-index.moralis.io/api/v2.2';
  
  // 🚨 CHAIN MAPPING FIX - RICHTIGE CHAIN IDs
  const chainMap = {
    ethereum: '0x1',
    eth: '0x1',
    '1': '0x1',
    '0x1': '0x1',
    pulsechain: 'eth',
    pls: '0x171',
    '369': '0x171',
    '0x171': '0x171',
    bsc: '0x38',
    polygon: '0x89',
    arbitrum: '0xa4b1'
  };
  const chainId = chainMap[chain.toLowerCase()] || chain;
  
  const results = {
    nativeTransactions: [],
    erc20Transfers: [],
    erc20Balances: [],
    totalProcessed: 0,
    errors: []
  };

  const startTime = Date.now();
  const maxTimeSeconds = 60;

  try {
    // 1. NATIVE TRANSACTIONS via HTTP - MIT PAGINATION
    console.log('🔄 Loading native transactions via HTTP with pagination...');
    let nativeCursor = null;
    let nativePage = 0;
    const maxNativePages = 3000;

    do {
      const nativeParams = new URLSearchParams({
        chain: chainId,
        limit: '300000',
        ...(nativeCursor && { cursor: nativeCursor })
      });
      
      const nativeUrl = `${baseURL}/${walletAddress}?${nativeParams}`;
      const nativeResponse = await fetch(nativeUrl, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'accept': 'application/json'
        }
      });
      
      if (nativeResponse.ok) {
        const nativeData = await nativeResponse.json();
        if (nativeData.result && nativeData.result.length > 0) {
          results.nativeTransactions.push(...nativeData.result);
          console.log(`📦 Native Page ${nativePage + 1}: +${nativeData.result.length} (Total: ${results.nativeTransactions.length})`);
        }
        nativeCursor = nativeData.cursor;
      } else {
        console.error(`❌ Native transactions error: ${nativeResponse.status}`);
        break;
      }

      nativePage++;
      
      if ((Date.now() - startTime) / 1000 > maxTimeSeconds) {
        console.log(`⚠️ 60s timeout reached for native transactions`);
        break;
      }

      if (results.nativeTransactions.length >= 300000) {
        console.log(`✅ Reached 300k native transactions, sufficient`);
        break;
      }

    } while (nativeCursor && nativePage < maxNativePages);

    // 2. ERC20 TRANSFERS via HTTP - MIT PAGINATION
    console.log('🔄 Loading ERC20 transfers via HTTP with pagination...');
    let transferCursor = null;
    let transferPage = 0;
    const maxTransferPages = 3000;

    do {
      const transferParams = new URLSearchParams({
        chain: chainId,
        limit: '300000',
        ...(transferCursor && { cursor: transferCursor })
      });
      
      const transferUrl = `${baseURL}/${walletAddress}/erc20/transfers?${transferParams}`;
      const transferResponse = await fetch(transferUrl, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'accept': 'application/json'
        }
      });
      
      if (transferResponse.ok) {
        const transferData = await transferResponse.json();
        if (transferData.result && transferData.result.length > 0) {
          results.erc20Transfers.push(...transferData.result);
          console.log(`📦 Transfer Page ${transferPage + 1}: +${transferData.result.length} (Total: ${results.erc20Transfers.length})`);
        }
        transferCursor = transferData.cursor;
      } else {
        console.error(`❌ ERC20 transfers error: ${transferResponse.status}`);
        break;
      }

      transferPage++;
      
      if ((Date.now() - startTime) / 1000 > maxTimeSeconds) {
        console.log(`⚠️ 60s timeout reached for ERC20 transfers`);
        break;
      }

      if (results.erc20Transfers.length >= 300000) {
        console.log(`✅ Reached 300k ERC20 transfers, sufficient`);
        break;
      }

    } while (transferCursor && transferPage < maxTransferPages);

    // 3. TOKEN BALANCES via HTTP
    console.log('🔄 Loading token balances via HTTP...');
    const balanceUrl = `${baseURL}/${walletAddress}/erc20?chain=${chainId}&limit=300000`;
    const balanceResponse = await fetch(balanceUrl, {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'accept': 'application/json'
      }
    });
    
    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      results.erc20Balances = balanceData || [];
      console.log(`✅ Token Balances: ${results.erc20Balances.length}`);
    }

    results.totalProcessed = 
      results.nativeTransactions.length + 
      results.erc20Transfers.length + 
      results.erc20Balances.length;

    const loadTime = (Date.now() - startTime) / 1000;
    console.log(`🎯 TOTAL PROCESSED: ${results.totalProcessed} in ${loadTime.toFixed(1)}s`);
    
    return results;

  } catch (error) {
    console.error('🚨 HTTP API Error:', error);
    results.errors.push(error.message);
    return results;
  }
};

// ✅ SAFE WRAPPER
const getWalletTransactionHistorySafe = async (walletAddress, chain = 'eth') => {
  try {
    console.log('🔄 Using HTTP API for Tax Advisor Export...');
    return await getWalletTransactionHistoryHTTP(walletAddress, chain);
  } catch (error) {
    console.error('🚨 HTTP method failed, using empty arrays:', error);
    return {
      nativeTransactions: [],
      erc20Transfers: [],
      erc20Balances: [],
      totalProcessed: 0,
      errors: [error.message]
    };
  }
};

// 🔧 ENVIRONMENT CHECK
const checkEnvironment = () => {
  const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
  if (!MORALIS_API_KEY) {
    console.error('🚨 MORALIS_API_KEY not found in environment variables');
    throw new Error('MORALIS_API_KEY environment variable is required');
  }
  console.log('✅ Environment check passed');
};

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
    // Environment Check
    checkEnvironment();

    const { address, chain = 'eth' } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    console.log('🚀 Tax Advisor Export Request:', { address, chain });

    // Get Transaction History
    const transactionHistory = await getWalletTransactionHistorySafe(address, chain);
    
    if (transactionHistory.errors.length > 0) {
      console.warn('⚠️ Transaction history errors:', transactionHistory.errors);
    }

    // Convert to Tax Advisor Format
    const transactions = [
      ...transactionHistory.nativeTransactions.map(tx => ({
        ...tx,
        type: 'native',
        direction: tx.from_address?.toLowerCase() === address.toLowerCase() ? 'out' : 'in',
        token_symbol: 'ETH',
        token_name: 'Ethereum',
        sourceChain: chain === 'pls' ? 'PulseChain' : 'Ethereum'
      })),
      ...transactionHistory.erc20Transfers.map(tx => ({
        ...tx,
        type: 'erc20',
        direction: tx.from_address?.toLowerCase() === address.toLowerCase() ? 'out' : 'in',
        sourceChain: chain === 'pls' ? 'PulseChain' : 'Ethereum'
      }))
    ];

    console.log(`📊 Processed ${transactions.length} transactions for Tax Advisor Export`);

    // Create Tax Advisor Export
    const exporter = new GermanTaxDataExporter();
    const taxAdvisorExport = exporter.createTaxAdvisorDataExport(transactions);

    // Success Response
    return res.status(200).json({
      success: true,
      disclaimer: 'KEINE STEUERBERATUNG - Nur Datensammlung für professionelle Steuerberatung',
      taxAdvisorExport,
      safeTaxSystem: {
        integrated: true,
        transactionCount: transactions.length,
        approach: 'DATA_COLLECTION_ONLY',
        compliance: 'DSGVO-konform - Keine Steuerberatung',
        features: [
          'FIFO Haltefrist-Berechnung (informativ)',
          'Transaktions-Kategorisierung',
          'ROI Event Markierung',
          'Export-Formate: CSV, HTML',
          'Professionelle Steuerberater-Grundlage'
        ],
        limitations: [
          'Nur eine Wallet analysiert',
          'Keine finalen Steuerberechnungen',
          'Andere Trades/Wallets nicht berücksichtigt',
          'Professionelle Steuerberatung empfohlen'
        ]
      }
    });

  } catch (error) {
    console.error('🚨 Tax Advisor Export Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Tax Advisor Export failed',
      details: error.message,
      disclaimer: 'KEINE STEUERBERATUNG - Nur Datensammlung für professionelle Steuerberatung'
    });
  }
}; 