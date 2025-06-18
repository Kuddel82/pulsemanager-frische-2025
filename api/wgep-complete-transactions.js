// 🔥 WGEP COMPLETE TRANSACTIONS API
// Speziell für die WGEP-Wallet 0x308e77281612bdc267d5feaf4599f2759cb3ed85
// Löst das 44-Transaktionen-Problem durch aggressive Pagination

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

/**
 * 🔥 MORALIS FETCH HELPER
 */
async function moralisFetch(endpoint, params = {}) {
  try {
    const url = `${MORALIS_BASE_URL}/${endpoint}`;
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const fullUrl = `${url}?${queryParams.toString()}`;
    
    console.log(`🔍 MORALIS REQUEST: ${endpoint} with ${Object.keys(params).length} params`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      console.error(`❌ MORALIS API ERROR: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error(`💥 MORALIS FETCH EXCEPTION: ${error.message}`);
    return null;
  }
}

/**
 * 🔥 AGGRESSIVE PAGINATION: Load ALL transactions for WGEP wallet
 */
async function loadAllWGEPTransactions(address, chainId, maxPages = 100) {
  console.log(`🔥 WGEP AGGRESSIVE PAGINATION: Loading ALL transactions for ${address} (max ${maxPages} pages)`);
  
  const allTransactions = [];
  let cursor = null;
  let pageCount = 0;
  
  try {
    do {
      console.log(`📄 WGEP Loading page ${pageCount + 1}/${maxPages}...`);
      
      const moralisParams = { 
        chain: chainId,
        limit: 2000 // Maximum pro Request
      };
      
      if (cursor) moralisParams.cursor = cursor;
      
      const result = await moralisFetch(`${address}/erc20/transfers`, moralisParams);
      
      if (!result || !result.result || result.result.length === 0) {
        console.log(`📄 WGEP No more data at page ${pageCount + 1}`);
        break;
      }
      
      allTransactions.push(...result.result);
      cursor = result.cursor;
      pageCount++;
      
      console.log(`✅ WGEP Page ${pageCount}: ${result.result.length} transactions, Total: ${allTransactions.length}`);
      
      // Rate limiting zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } while (cursor && pageCount < maxPages);
    
    console.log(`🔥 WGEP AGGRESSIVE PAGINATION COMPLETE: ${allTransactions.length} transactions across ${pageCount} pages`);
    
    return {
      success: true,
      result: allTransactions,
      total: allTransactions.length,
      pages: pageCount,
      cursor: cursor,
      _source: 'wgep_aggressive_pagination'
    };
    
  } catch (error) {
    console.error('💥 WGEP AGGRESSIVE PAGINATION ERROR:', error);
    return {
      success: false,
      error: error.message,
      result: allTransactions,
      total: allTransactions.length,
      pages: pageCount
    };
  }
}

/**
 * 🔥 WGEP COMPLETE TRANSACTIONS API
 */
export default async function handler(req, res) {
  console.log('🔥 WGEP COMPLETE TRANSACTIONS API: Starting request processing');
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // API Key validation
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.error('🚨 MORALIS API KEY MISSING');
      return res.status(503).json({ 
        error: 'Moralis API Key missing or invalid.',
        _debug: 'Check MORALIS_API_KEY environment variable'
      });
    }

    // Extract parameters
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { 
      address = '0x308e77281612bdc267d5feaf4599f2759cb3ed85', // 🔥 WGEP DEFAULT
      chain = 'pulsechain',
      max_pages = 100
    } = params;

    console.log('🔥 WGEP PARAMS:', { 
      address: address.slice(0, 8) + '...',
      chain,
      max_pages: parseInt(max_pages) || 100
    });

    // Convert chain names to Moralis chain IDs
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
    console.log(`🔥 WGEP CHAIN MAPPING: ${chain} -> ${chainId}`);

    // 🔥 AGGRESSIVE PAGINATION: Lade ALLE Transaktionen
    console.log(`🔥 WGEP AGGRESSIVE MODE: Loading ALL transactions for ${address}`);
    
    const aggressiveResult = await loadAllWGEPTransactions(
      address, 
      chainId, 
      parseInt(max_pages) || 100
    );
    
    if (!aggressiveResult.success) {
      return res.status(500).json({
        error: 'WGEP aggressive pagination failed',
        details: aggressiveResult.error,
        partial_data: aggressiveResult.result,
        _source: 'wgep_aggressive_pagination_failed'
      });
    }
    
    // 📊 WGEP-SPEZIFISCHE TRANSACTION CATEGORIZATION
    const categorizedTransactions = aggressiveResult.result.map(tx => {
      const isIncoming = tx.to_address?.toLowerCase() === address.toLowerCase();
      const isOutgoing = tx.from_address?.toLowerCase() === address.toLowerCase();
      
      // 🔥 WGEP-SPEZIFISCHE ROI Token Detection
      const WGEP_ROI_TOKENS = ['HEX', 'INC', 'PLSX', 'LOAN', 'FLEX', 'WGEP', 'MISOR', 'FLEXMES', 'PLS', 'BORK', 'MASKMAN'];
      const isROIToken = WGEP_ROI_TOKENS.includes(tx.token_symbol?.toUpperCase());
      
      // 🔥 WGEP-SPEZIFISCHE Minter Detection
      const WGEP_KNOWN_MINTERS = [
        '0x0000000000000000000000000000000000000000',
        '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
        '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3',
        '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1',
        '0xa4b89c0d48421c4ae9c7743e9e58b06e5ad8e2c6',
        '0xb7c3a5e1c6b45b9db4d4b8e6f4e2c7f8b8a7e6d5',
        '0xc8d4b2f5e7a9c6b3d8e1f4a7b2c5d8e9f6a3b7c4',
        // 🔥 WGEP-SPEZIFISCHE MINTERS
        '0x308e77281612bdc267d5feaf4599f2759cb3ed85', // WGEP Wallet selbst
        '0x3f020b', // WGEP Contract
        '0x8a0a17db', // WGEP Minter
        '0x179ee188', // WGEP Distributor
        '0x8447c358', // WGEP Pool
        '0x85a09fa7', // WGEP Exchange
        '0xd0834ad5'  // WGEP Treasury
      ];
      const fromMinter = WGEP_KNOWN_MINTERS.includes(tx.from_address?.toLowerCase());
      
      // 🔥 WGEP-SPEZIFISCHE Tax Category Classification
      let taxCategory = 'transfer'; // Default: steuerfreier Transfer
      let isTaxable = false;
      let wgepSpecific = false;
      
      if (isIncoming && (fromMinter || isROIToken)) {
        taxCategory = 'roi_income';
        isTaxable = true;
        wgepSpecific = true;
      } else if (isOutgoing) {
        taxCategory = 'purchase';
        isTaxable = false; // Käufe sind nicht steuerpflichtig
      } else if (isIncoming) {
        taxCategory = 'sale_income';
        isTaxable = true; // Verkaufserlöse sind steuerpflichtig
      }
      
      return {
        ...tx,
        // 🔥 WGEP-spezifische Felder
        direction: isIncoming ? 'in' : 'out',
        taxCategory,
        isTaxable,
        isROI: fromMinter || isROIToken,
        fromMinter,
        isROIToken,
        wgepSpecific,
        // 🔥 WGEP-Spezifische Token-Erkennung
        isWGEP: tx.token_symbol?.toUpperCase() === 'WGEP',
        isHEX: tx.token_symbol?.toUpperCase() === 'HEX',
        isPLS: tx.token_symbol?.toUpperCase() === 'PLS',
        isUSDC: tx.token_symbol?.toUpperCase() === 'USDC',
        isETH: tx.token_symbol?.toUpperCase() === 'ETH'
      };
    });
    
    console.log(`🔥 WGEP AGGRESSIVE SUCCESS: ${aggressiveResult.total} transactions loaded and categorized`);
    
    // 🔥 WGEP-SPEZIFISCHE STATISTIKEN
    const wgepStats = {
      total: aggressiveResult.total,
      wgepTransactions: categorizedTransactions.filter(tx => tx.isWGEP).length,
      hexTransactions: categorizedTransactions.filter(tx => tx.isHEX).length,
      plsTransactions: categorizedTransactions.filter(tx => tx.isPLS).length,
      usdcTransactions: categorizedTransactions.filter(tx => tx.isUSDC).length,
      ethTransactions: categorizedTransactions.filter(tx => tx.isETH).length,
      roiIncome: categorizedTransactions.filter(tx => tx.taxCategory === 'roi_income').length,
      purchases: categorizedTransactions.filter(tx => tx.taxCategory === 'purchase').length,
      sales: categorizedTransactions.filter(tx => tx.taxCategory === 'sale_income').length,
      transfers: categorizedTransactions.filter(tx => tx.taxCategory === 'transfer').length,
      taxable: categorizedTransactions.filter(tx => tx.isTaxable).length,
      wgepSpecific: categorizedTransactions.filter(tx => tx.wgepSpecific).length
    };
    
    return res.status(200).json({
      result: categorizedTransactions,
      cursor: aggressiveResult.cursor,
      page: 1,
      page_size: aggressiveResult.total,
      total: aggressiveResult.total,
      pages_loaded: aggressiveResult.pages,
      _source: 'wgep_aggressive_pagination_success',
      _chain: chainId,
      _address: address,
      _timestamp: new Date().toISOString(),
      _count: aggressiveResult.total,
      _aggressive_mode: true,
      _wgep_specific: true,
      _tax_categorization: wgepStats,
      _wgep_stats: wgepStats
    });

  } catch (error) {
    console.error('💥 WGEP COMPLETE TRANSACTIONS API CRITICAL ERROR:', error);
    console.error('💥 ERROR STACK:', error.stack);
    
    return res.status(500).json({
      error: 'WGEP Complete Transactions API failed',
      details: error.message,
      _source: 'wgep_aggressive_pagination_error',
      _timestamp: new Date().toISOString()
    });
  }
} 