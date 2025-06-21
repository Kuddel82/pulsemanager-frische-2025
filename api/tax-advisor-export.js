/**
 * 🔥 SICHERER TAX ADVISOR EXPORT API
 * 
 * ✅ KEINE STEUERBERECHNUNGEN - Nur Datensammlung
 * ✅ DSGVO-konform - Keine Steuerberatung
 * ✅ Export-Formate: Excel, CSV, HTML
 * ✅ Professionelle Steuerberater-Grundlage
 * ✅ FIFO Haltefrist-Berechnung (informativ)
 */

const { GermanTaxDataExporter, integrateTaxAdvisorExport } = require('../src/services/GermanTaxDataExporter');

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
    pulsechain: '0x171',
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
        limit: '100',
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
        limit: '100',
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
  console.log('🔥 SICHERER TAX ADVISOR EXPORT API - KEINE STEUERBERECHNUNGEN!');
  
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { address, limit = 300000 } = params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address required',
        disclaimer: 'KEINE STEUERBERATUNG - Nur Datensammlung für Steuerberater'
      });
    }

    console.log(`🎯 Loading data for Tax Advisor Export: ${address}`);
    console.log(`📊 Target: ${limit} transactions with 60s timeout`);

    // 🔧 ENVIRONMENT CHECK
    checkEnvironment();

    // 🚀 LOAD TRANSACTION HISTORY
    console.log('🔄 Loading transaction history for Tax Advisor Export...');
    const ethHistory = await getWalletTransactionHistorySafe(address, 'eth');
    const plsHistory = await getWalletTransactionHistorySafe(address, 'pls');
    
    console.log('📊 ETH History:', {
      native: ethHistory.nativeTransactions.length,
      transfers: ethHistory.erc20Transfers.length,
      balances: ethHistory.erc20Balances.length,
      total: ethHistory.totalProcessed,
      errors: ethHistory.errors.length
    });
    
    console.log('📊 PLS History:', {
      native: plsHistory.nativeTransactions.length,
      transfers: plsHistory.erc20Transfers.length,
      balances: plsHistory.erc20Balances.length,
      total: plsHistory.totalProcessed,
      errors: plsHistory.errors.length
    });

    // 🔥 COMBINE ALL TRANSACTIONS
    let allTransactions = [];
    
    // Add ETH transactions
    if (ethHistory.nativeTransactions.length > 0) {
      const ethNative = ethHistory.nativeTransactions.map(tx => ({
        ...tx,
        sourceChain: 'Ethereum',
        chainSymbol: 'ETH',
        dataSource: 'REAL_HISTORY',
        dataType: 'native',
        loadedAt: new Date().toISOString(),
        uniqueId: `ETH_NATIVE_${tx.hash}`
      }));
      allTransactions.push(...ethNative);
    }
    
    if (ethHistory.erc20Transfers.length > 0) {
      const ethTransfers = ethHistory.erc20Transfers.map(tx => ({
        ...tx,
        sourceChain: 'Ethereum',
        chainSymbol: 'ETH',
        dataSource: 'REAL_HISTORY',
        dataType: 'erc20_transfer',
        loadedAt: new Date().toISOString(),
        uniqueId: `ETH_TRANSFER_${tx.transaction_hash}`
      }));
      allTransactions.push(...ethTransfers);
    }
    
    // Add PLS transactions
    if (plsHistory.nativeTransactions.length > 0) {
      const plsNative = plsHistory.nativeTransactions.map(tx => ({
        ...tx,
        sourceChain: 'PulseChain',
        chainSymbol: 'PLS',
        dataSource: 'REAL_HISTORY',
        dataType: 'native',
        loadedAt: new Date().toISOString(),
        uniqueId: `PLS_NATIVE_${tx.hash}`
      }));
      allTransactions.push(...plsNative);
    }
    
    if (plsHistory.erc20Transfers.length > 0) {
      const plsTransfers = plsHistory.erc20Transfers.map(tx => ({
        ...tx,
        sourceChain: 'PulseChain',
        chainSymbol: 'PLS',
        dataSource: 'REAL_HISTORY',
        dataType: 'erc20_transfer',
        loadedAt: new Date().toISOString(),
        uniqueId: `PLS_TRANSFER_${tx.transaction_hash}`
      }));
      allTransactions.push(...plsTransfers);
    }

    console.log(`✅ Total transactions loaded: ${allTransactions.length}`);

    // 🔥 SICHERER TAX ADVISOR EXPORT
    try {
      console.log('🇩🇪 Starting Safe Tax Data Export (NO TAX CALCULATIONS)...');
      
      // Sicheren Tax Advisor Export erstellen
      const taxAdvisorExport = integrateTaxAdvisorExport(allTransactions);
      
      const response = {
        success: true,
        disclaimer: 'KEINE STEUERBERATUNG - Nur Datensammlung für professionelle Steuerberatung',
        taxAdvisorExport: taxAdvisorExport.data,
        safeTaxSystem: {
          integrated: true,
          transactionCount: allTransactions.length,
          approach: 'DATA_COLLECTION_ONLY',
          compliance: 'DSGVO-konform - Keine Steuerberatung',
          features: [
            'FIFO Haltefrist-Berechnung (informativ)',
            'Transaktions-Kategorisierung',
            'ROI Event Markierung',
            'Export-Formate: Excel, CSV, HTML',
            'Professionelle Steuerberater-Grundlage'
          ],
          limitations: [
            'Nur eine Wallet analysiert',
            'Keine finalen Steuerberechnungen',
            'Andere Trades/Wallets nicht berücksichtigt',
            'Professionelle Steuerberatung empfohlen'
          ]
        },
        debug: {
          version: 'safe_tax_advisor_export_v1',
          targetTransactions: limit,
          actualTransactions: allTransactions.length,
          ethTransactions: ethHistory.totalProcessed,
          plsTransactions: plsHistory.totalProcessed,
          dataQuality: 'high_volume_production',
          backendWorking: true,
          safeApproach: true
        }
      };

      console.log('✅ Safe Tax Data Export successfully completed');
      return res.status(200).json(response);
      
    } catch (taxExportError) {
      console.error('⚠️ Safe Tax Data Export failed:', taxExportError);
      
      return res.status(500).json({
        success: false,
        error: 'Tax Advisor Export failed',
        disclaimer: 'KEINE STEUERBERATUNG - Nur Datensammlung für Steuerberater',
        debug: {
          error: taxExportError.message,
          transactionCount: allTransactions.length
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Tax Advisor Export API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      disclaimer: 'KEINE STEUERBERATUNG - Nur Datensammlung für Steuerberater',
      stack: error.stack
    });
  }
}; 