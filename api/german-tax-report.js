/**
 * 🇩🇪 EINFACHE FUNKTIONIERENDE CRYPTO TAX API
 * 
 * ✅ Verwendet ERC20 Transfers API (funktioniert!)
 * ✅ Einfache Logik ohne Komplikationen
 * ✅ KORREKTE Chain IDs: 0x1 (ETH) + 0x171 (PulseChain)
 * ✅ Deutsche Steuer-Kategorisierung
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

// EINFACHES RATE LIMITING
let lastRequestTime = 0;
const MIN_REQUEST_DELAY = 200;

async function rateLimitedDelay() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_DELAY) {
    const delayNeeded = MIN_REQUEST_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }
  
  lastRequestTime = Date.now();
}

/**
 * EINFACHE Moralis Fetch Function
 */
async function moralisFetch(endpoint, params = {}) {
  await rateLimitedDelay();
  
  try {
    const url = new URL(`${MORALIS_BASE_URL}/${endpoint}`);
    
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.append(key, val);
      }
    });

    console.log(`🚀 MORALIS FETCH: ${url.toString()}`);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP_${res.status}: ${res.statusText}`);
    }

    const jsonData = await res.json();
    console.log(`✅ MORALIS SUCCESS: ${endpoint} returned ${jsonData?.result?.length || 0} items`);
    
    return jsonData;

  } catch (error) {
    console.error(`💥 MORALIS FETCH ERROR: ${error.message}`);
    throw error;
  }
}

/**
 * EINFACHE Wallet History - Verwendet ERC20 Transfers
 */
async function getWalletHistory(address, chainId, limit = 500) {
  console.log(`🔍 Getting ERC20 transfers for ${address.slice(0, 8)}... on chain ${chainId}`);
  
  try {
    const params = {
      chain: chainId,
      limit: Math.min(limit, 500),
      order: 'DESC'
    };
    
    const result = await moralisFetch(`${address}/erc20/transfers`, params);
    
    if (!result || !result.result) {
      console.log(`📄 No ERC20 transfers found for chain ${chainId}`);
      return [];
    }
    
    console.log(`✅ ERC20 Transfers: ${result.result.length} transfers found for chain ${chainId}`);
    
    // Konvertiere zu TaxReport-Format
    return result.result.map(tx => ({
      ...tx,
      category: 'token transfer',
      summary: `${tx.token_symbol} transfer`,
      possible_spam: false,
      native_transfers: [],
      erc20_transfers: [tx],
      nft_transfers: [],
      direction: tx.to_address?.toLowerCase() === address.toLowerCase() ? 'in' : 'out',
      directionIcon: tx.to_address?.toLowerCase() === address.toLowerCase() ? '📥 IN' : '📤 OUT',
      taxCategory: tx.to_address?.toLowerCase() === address.toLowerCase() ? 'Token Transfer (In)' : 'Token Transfer (Out)',
      formattedValue: tx.value_decimal || '0',
      tokenSymbol: tx.token_symbol || 'UNKNOWN'
    }));
    
  } catch (error) {
    console.error(`❌ ERC20 Transfers Error for chain ${chainId}:`, error.message);
    return [];
  }
}

/**
 * 🇩🇪 HAUPTFUNKTION - Deutsche Steuer API
 */
export default async function handler(req, res) {
  console.log('🔥🔥🔥 EINFACHE TAX API - SOLLTE FUNKTIONIEREN! 🔥🔥🔥');
  
  try {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // API Key Check
    if (!MORALIS_API_KEY) {
      console.error('🚨 MORALIS API KEY MISSING');
      return res.status(503).json({ 
        error: 'Moralis API Key missing',
        success: false
      });
    }

    // Extract parameters
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { address, limit = 500 } = params;

    console.log('🇩🇪 TAX PARAMS:', { 
      address: address ? address.slice(0, 8) + '...' : 'MISSING', 
      limit
    });

    // Validate address
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
        taxReport: null
      });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
        taxReport: null
      });
    }

    console.log(`🔍 Processing wallet: ${address.slice(0, 8)}...`);

    // KORREKTE CHAIN IDs
    const chains = [
      { id: '0x1', name: 'Ethereum', short: 'ETH' },
      { id: '0x171', name: 'PulseChain', short: 'PLS' }
    ];

    let allTransactions = [];
    let chainResults = {};

    // PARALLEL PROCESSING
    const chainPromises = chains.map(async (chain) => {
      console.log(`🚀 Processing ${chain.name} (${chain.id})...`);
      
      try {
        const transactions = await getWalletHistory(address, chain.id, limit);
        
        chainResults[chain.short] = {
          count: transactions.length,
          transactions: transactions
        };
        
        // Add chain info to transactions
        const processedTransactions = transactions.map(tx => ({
          ...tx,
          sourceChain: chain.name,
          sourceChainShort: chain.short,
          sourceChainId: chain.id
        }));
        
        allTransactions.push(...processedTransactions);
        
        console.log(`✅ ${chain.name}: ${transactions.length} transactions processed`);
        
      } catch (error) {
        console.error(`❌ ${chain.name} processing failed:`, error.message);
        chainResults[chain.short] = {
          count: 0,
          transactions: [],
          error: error.message
        };
      }
    });

    // WARTE AUF ALLE CHAINS
    await Promise.all(chainPromises);

    console.log(`📊 TOTAL TRANSACTIONS: ${allTransactions.length}`);
    console.log(`📊 CHAIN BREAKDOWN:`, chainResults);

    // SORTIERE NACH TIMESTAMP (neueste zuerst)
    allTransactions.sort((a, b) => {
      const timeA = new Date(a.block_timestamp || a.timestamp || 0).getTime();
      const timeB = new Date(b.block_timestamp || b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    // DEUTSCHE STEUER-KATEGORISIERUNG
    const categorizedTransactions = allTransactions.map(tx => {
      let taxCategory = tx.taxCategory || 'Sonstige';
      let direction = tx.direction || 'unknown';
      let directionIcon = tx.directionIcon || '❓';
      let formattedValue = tx.formattedValue || '0';
      let tokenSymbol = tx.tokenSymbol || 'N/A';

      // ROI DETECTION für bekannte Tokens
      if (['WGEP', 'MASKMAN', 'BORK'].includes(tokenSymbol)) {
        if (direction === 'in') {
          taxCategory = 'ROI Einkommen (§22 EStG)';
          directionIcon = '💰 ROI';
        }
      }

      return {
        ...tx,
        taxCategory,
        direction,
        directionIcon,
        formattedValue,
        tokenSymbol,
        timestamp: tx.block_timestamp || tx.timestamp
      };
    });

    // ZUSAMMENFASSUNG
    const summary = {
      totalTransactions: categorizedTransactions.length,
      ethereumCount: chainResults.ETH?.count || 0,
      pulsechainCount: chainResults.PLS?.count || 0,
      roiCount: categorizedTransactions.filter(tx => tx.taxCategory.includes('ROI')).length,
      totalROIValueEUR: 0,
      totalTaxEUR: 0
    };

    const taxReport = {
      walletAddress: address,
      generatedAt: new Date().toISOString(),
      summary,
      transactions: categorizedTransactions,
      chainResults
    };

    console.log(`✅ TAX REPORT GENERATED: ${categorizedTransactions.length} transactions`);
    console.log(`📊 SUMMARY:`, summary);

    return res.status(200).json({
      success: true,
      taxReport,
      debug: {
        originalCount: allTransactions.length,
        processedCount: categorizedTransactions.length,
        chains: Object.keys(chainResults)
      }
    });

  } catch (error) {
    console.error('💥 TAX API ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}