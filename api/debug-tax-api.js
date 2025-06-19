/**
 * 🐛 DEBUG TAX API - Findet heraus warum keine Transaktionen geladen werden
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

/**
 * Debug Moralis API Call
 */
async function debugMoralisCall(endpoint, params) {
  try {
    const url = new URL(`${MORALIS_BASE_URL}/${endpoint}`);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, val);
      }
    });

    console.log(`🐛 DEBUG MORALIS: ${url.toString()}`);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`🐛 DEBUG RESPONSE STATUS: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`🐛 DEBUG ERROR: ${errorText}`);
      return { error: `${res.status} - ${res.statusText}`, details: errorText };
    }

    const jsonData = await res.json();
    console.log(`🐛 DEBUG SUCCESS: ${jsonData?.result?.length || 0} items`);
    console.log(`🐛 DEBUG CURSOR: ${jsonData?.cursor ? 'Available' : 'None'}`);
    
    return { success: true, data: jsonData };

  } catch (error) {
    console.error(`🐛 DEBUG EXCEPTION: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * 🐛 DEBUG TAX API
 */
export default async function handler(req, res) {
  console.log('🐛 DEBUG TAX API: Starte Debug-Session');
  
  try {
    // CORS Setup
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // API Key Check
    if (!MORALIS_API_KEY) {
      return res.status(503).json({ 
        error: 'Moralis API Key missing',
        debug: 'Check MORALIS_API_KEY environment variable'
      });
    }

    // Parameter Extraction
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { address = '0x3f020b8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c' } = params;

    console.log(`🐛 DEBUG ADDRESS: ${address}`);

    const debugResults = {
      apiKey: MORALIS_API_KEY ? '✅ Found' : '❌ Missing',
      address: address,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // 🧪 TEST 1: PulseChain ERC20 Transfers
    console.log('🐛 TEST 1: PulseChain ERC20 Transfers');
    const test1 = await debugMoralisCall(`${address}/erc20/transfers`, {
      chain: '0x171',
      limit: 10
    });
    debugResults.tests.pulsechain_erc20 = test1;

    // 🧪 TEST 2: Ethereum ERC20 Transfers
    console.log('🐛 TEST 2: Ethereum ERC20 Transfers');
    const test2 = await debugMoralisCall(`${address}/erc20/transfers`, {
      chain: '0x1',
      limit: 10
    });
    debugResults.tests.ethereum_erc20 = test2;

    // 🧪 TEST 3: PulseChain Native Transactions
    console.log('🐛 TEST 3: PulseChain Native Transactions');
    const test3 = await debugMoralisCall(`${address}`, {
      chain: '0x171',
      limit: 10
    });
    debugResults.tests.pulsechain_native = test3;

    // 🧪 TEST 4: Ethereum Native Transactions
    console.log('🐛 TEST 4: Ethereum Native Transactions');
    const test4 = await debugMoralisCall(`${address}`, {
      chain: '0x1',
      limit: 10
    });
    debugResults.tests.ethereum_native = test4;

    // 🧪 TEST 5: PulseChain Internal Transactions
    console.log('🐛 TEST 5: PulseChain Internal Transactions');
    const test5 = await debugMoralisCall(`${address}/internal-transactions`, {
      chain: '0x171',
      limit: 10
    });
    debugResults.tests.pulsechain_internal = test5;

    // 🧪 TEST 6: Ethereum Internal Transactions
    console.log('🐛 TEST 6: Ethereum Internal Transactions');
    const test6 = await debugMoralisCall(`${address}/internal-transactions`, {
      chain: '0x1',
      limit: 10
    });
    debugResults.tests.ethereum_internal = test6;

    // 📊 SUMMARY
    const summary = {
      totalTests: 6,
      successfulTests: Object.values(debugResults.tests).filter(t => t.success).length,
      failedTests: Object.values(debugResults.tests).filter(t => t.error).length,
      totalTransactions: Object.values(debugResults.tests)
        .filter(t => t.success && t.data?.result)
        .reduce((sum, t) => sum + (t.data.result.length || 0), 0)
    };

    debugResults.summary = summary;

    console.log('🐛 DEBUG SUMMARY:', summary);

    return res.status(200).json({
      success: true,
      debug: debugResults,
      message: 'Debug-Session abgeschlossen'
    });

  } catch (error) {
    console.error('🐛 DEBUG ERROR:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Debug API Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 