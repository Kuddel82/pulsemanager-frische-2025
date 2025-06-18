// 🔥 WGEP SIMPLE TEST API
// Einfache Test-API für die WGEP-Wallet 0x308e77281612bdc267d5feaf4599f2759cb3ed85

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

/**
 * 🔥 WGEP SIMPLE TEST API
 */
export default async function handler(req, res) {
  console.log('🔥 WGEP SIMPLE TEST: Starting test...');
  
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

    // 🔥 WGEP WALLET ADDRESS
    const WGEP_ADDRESS = '0x308e77281612bdc267d5feaf4599f2759cb3ed85';
    
    console.log('🔥 WGEP SIMPLE TEST: Testing wallet:', WGEP_ADDRESS);

    // 🔥 TEST 1: Simple ERC20 Transfers (PulseChain)
    console.log('🔥 WGEP SIMPLE TEST: Testing PulseChain ERC20 transfers...');
    
    const pulsechainUrl = `${MORALIS_BASE_URL}/${WGEP_ADDRESS}/erc20/transfers?chain=0x171&limit=100`;
    
    const pulsechainResponse = await fetch(pulsechainUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      }
    });

    let pulsechainData = null;
    if (pulsechainResponse.ok) {
      pulsechainData = await pulsechainResponse.json();
      console.log('🔥 WGEP SIMPLE TEST: PulseChain response:', {
        status: pulsechainResponse.status,
        total: pulsechainData.total || 0,
        count: pulsechainData.result?.length || 0,
        hasCursor: !!pulsechainData.cursor
      });
    } else {
      console.error('🔥 WGEP SIMPLE TEST: PulseChain error:', pulsechainResponse.status, pulsechainResponse.statusText);
    }

    // 🔥 TEST 2: Simple ERC20 Transfers (Ethereum)
    console.log('🔥 WGEP SIMPLE TEST: Testing Ethereum ERC20 transfers...');
    
    const ethereumUrl = `${MORALIS_BASE_URL}/${WGEP_ADDRESS}/erc20/transfers?chain=0x1&limit=100`;
    
    const ethereumResponse = await fetch(ethereumUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      }
    });

    let ethereumData = null;
    if (ethereumResponse.ok) {
      ethereumData = await ethereumResponse.json();
      console.log('🔥 WGEP SIMPLE TEST: Ethereum response:', {
        status: ethereumResponse.status,
        total: ethereumData.total || 0,
        count: ethereumData.result?.length || 0,
        hasCursor: !!ethereumData.cursor
      });
    } else {
      console.error('🔥 WGEP SIMPLE TEST: Ethereum error:', ethereumResponse.status, ethereumResponse.statusText);
    }

    // 🔥 TEST 3: Wallet History (PulseChain)
    console.log('🔥 WGEP SIMPLE TEST: Testing PulseChain wallet history...');
    
    const historyUrl = `${MORALIS_BASE_URL}/wallets/${WGEP_ADDRESS}/history?chain=0x171&limit=100`;
    
    const historyResponse = await fetch(historyUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      }
    });

    let historyData = null;
    if (historyResponse.ok) {
      historyData = await historyResponse.json();
      console.log('🔥 WGEP SIMPLE TEST: History response:', {
        status: historyResponse.status,
        total: historyData.total || 0,
        count: historyData.result?.length || 0,
        hasCursor: !!historyData.cursor
      });
    } else {
      console.error('🔥 WGEP SIMPLE TEST: History error:', historyResponse.status, historyResponse.statusText);
    }

    // 🔥 COMBINE RESULTS
    const allTransactions = [
      ...(pulsechainData?.result || []).map(tx => ({ ...tx, chain: 'pulsechain', source: 'erc20_transfers' })),
      ...(ethereumData?.result || []).map(tx => ({ ...tx, chain: 'ethereum', source: 'erc20_transfers' })),
      ...(historyData?.result || []).map(tx => ({ ...tx, chain: 'pulsechain', source: 'wallet_history' }))
    ];

    // 🔥 REMOVE DUPLICATES (by transaction hash)
    const uniqueTransactions = allTransactions.filter((tx, index, self) => 
      index === self.findIndex(t => t.transaction_hash === tx.transaction_hash)
    );

    console.log('🔥 WGEP SIMPLE TEST: Combined results:', {
      pulsechain: pulsechainData?.result?.length || 0,
      ethereum: ethereumData?.result?.length || 0,
      history: historyData?.result?.length || 0,
      combined: allTransactions.length,
      unique: uniqueTransactions.length
    });

    return res.status(200).json({
      success: true,
      wallet: WGEP_ADDRESS,
      results: {
        pulsechain: {
          success: !!pulsechainData,
          total: pulsechainData?.total || 0,
          count: pulsechainData?.result?.length || 0,
          hasCursor: !!pulsechainData?.cursor,
          sample: pulsechainData?.result?.[0] ? {
            hash: pulsechainData.result[0].transaction_hash?.slice(0, 10) + '...',
            token: pulsechainData.result[0].token_symbol,
            value: pulsechainData.result[0].value,
            timestamp: pulsechainData.result[0].block_timestamp
          } : null
        },
        ethereum: {
          success: !!ethereumData,
          total: ethereumData?.total || 0,
          count: ethereumData?.result?.length || 0,
          hasCursor: !!ethereumData?.cursor,
          sample: ethereumData?.result?.[0] ? {
            hash: ethereumData.result[0].transaction_hash?.slice(0, 10) + '...',
            token: ethereumData.result[0].token_symbol,
            value: ethereumData.result[0].value,
            timestamp: ethereumData.result[0].block_timestamp
          } : null
        },
        history: {
          success: !!historyData,
          total: historyData?.total || 0,
          count: historyData?.result?.length || 0,
          hasCursor: !!historyData?.cursor,
          sample: historyData?.result?.[0] ? {
            hash: historyData.result[0].transaction_hash?.slice(0, 10) + '...',
            type: historyData.result[0].type,
            value: historyData.result[0].value,
            timestamp: historyData.result[0].block_timestamp
          } : null
        }
      },
      combined: {
        total: allTransactions.length,
        unique: uniqueTransactions.length,
        transactions: uniqueTransactions.slice(0, 20) // First 20 for preview
      },
      _source: 'wgep_simple_test',
      _timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 WGEP SIMPLE TEST ERROR:', error);
    
    return res.status(500).json({
      error: 'WGEP Simple Test failed',
      details: error.message,
      _source: 'wgep_simple_test_error',
      _timestamp: new Date().toISOString()
    });
  }
} 