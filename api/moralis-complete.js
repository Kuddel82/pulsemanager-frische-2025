// 🚀 COMPLETE MORALIS API - ALLES was für Crypto Tax gebraucht wird
const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjNiYjEyNDQ0LWVkYmUtNDQyNi1hOThlLWFlNzBjZTAzZGRhNCIsIm9yZ0lkIjoiNDUxOTc4IiwidXNlcklkIjoiNDY1MDQ5IiwidHlwZUlkIjoiY2JhYzQ1ZTctODk4Ni00ZGFlLWE4NTUtMDA3ZmFlNjM4ZDgyIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDk0MzkxNzEsImV4cCI6NDkwNTE5OTE3MX0.nTFPzga8CQX4Yxryvu2zCkCVHsJp5VDoIy_CthTrOvc';
const BASE_URL = 'https://deep-index.moralis.io/api/v2';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { address = '0x308e77f00ecd3c1ba0dba8bbba78b4cd2fd4d42a' } = req.query;

    try {
        console.log('🚀 COMPLETE MORALIS API TEST für:', address);

        // 1. ERC20 TRANSFERS - ETHEREUM
        console.log('📡 Loading Ethereum ERC20 transfers...');
        const ethTransfers = await fetchMoralisAPI(`${address}/erc20/transfers?chain=0x1&limit=100`);
        
        // 2. ERC20 TRANSFERS - PULSECHAIN  
        console.log('📡 Loading PulseChain ERC20 transfers...');
        const pulseTransfers = await fetchMoralisAPI(`${address}/erc20/transfers?chain=0x171&limit=100`);
        
        // 3. NATIVE BALANCE - ETHEREUM
        console.log('📡 Loading Ethereum balance...');
        const ethBalance = await fetchMoralisAPI(`${address}/balance?chain=0x1`);
        
        // 4. NATIVE BALANCE - PULSECHAIN
        console.log('📡 Loading PulseChain balance...');
        const pulseBalance = await fetchMoralisAPI(`${address}/balance?chain=0x171`);
        
        // 5. ERC20 BALANCES - ETHEREUM
        console.log('📡 Loading Ethereum ERC20 balances...');
        const ethERC20 = await fetchMoralisAPI(`${address}/erc20?chain=0x1`);
        
        // 6. ERC20 BALANCES - PULSECHAIN
        console.log('📡 Loading PulseChain ERC20 balances...');
        const pulseERC20 = await fetchMoralisAPI(`${address}/erc20?chain=0x171`);

        // 7. TRANSACTION HISTORY - ETHEREUM
        console.log('📡 Loading Ethereum transactions...');
        const ethTxs = await fetchMoralisAPI(`${address}?chain=0x1&limit=100`);
        
        // 8. TRANSACTION HISTORY - PULSECHAIN
        console.log('📡 Loading PulseChain transactions...');
        const pulseTxs = await fetchMoralisAPI(`${address}?chain=0x171&limit=100`);

        // ZUSAMMENFASSUNG
        const summary = {
            address,
            timestamp: new Date().toISOString(),
            
            // Transfer Counts
            ethereumERC20Transfers: ethTransfers?.result?.length || 0,
            pulsechainERC20Transfers: pulseTransfers?.result?.length || 0,
            
            // Balance Data
            ethereumBalance: ethBalance?.balance || '0',
            pulsechainBalance: pulseBalance?.balance || '0',
            
            // ERC20 Token Counts
            ethereumTokens: ethERC20?.length || 0,
            pulsechainTokens: pulseERC20?.length || 0,
            
            // Transaction Counts
            ethereumTransactions: ethTxs?.result?.length || 0,
            pulsechainTransactions: pulseTxs?.result?.length || 0,
            
            // Sample Data (erste 3 Items)
            sampleEthTransfers: ethTransfers?.result?.slice(0, 3) || [],
            samplePulseTransfers: pulseTransfers?.result?.slice(0, 3) || [],
            sampleEthTokens: ethERC20?.slice(0, 3) || [],
            samplePulseTokens: pulseERC20?.slice(0, 3) || []
        };

        console.log('✅ COMPLETE MORALIS API Results:', summary);

        return res.status(200).json({
            success: true,
            message: 'Complete Moralis API test erfolgreich',
            summary,
            
            // Raw data für debugging
            rawData: {
                ethTransfers,
                pulseTransfers,
                ethBalance,
                pulseBalance,
                ethERC20,
                pulseERC20,
                ethTxs,
                pulseTxs
            }
        });

    } catch (error) {
        console.error('❌ Complete Moralis API Error:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}

// 🔧 MORALIS API HELPER
async function fetchMoralisAPI(endpoint) {
    const url = `${BASE_URL}/${endpoint}`;
    
    console.log(`📡 Calling: ${url}`);
    
    const response = await fetch(url, {
        headers: {
            'X-API-Key': MORALIS_API_KEY,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Moralis API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Response: ${JSON.stringify(data).substring(0, 200)}...`);
    
    return data;
} 