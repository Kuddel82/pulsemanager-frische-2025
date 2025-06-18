// 🚀 SIMPLE MORALIS API - NACH OFFIZIELLER DOKUMENTATION
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjNiYjEyNDQ0LWVkYmUtNDQyNi1hOThlLWFlNzBjZTAzZGRhNCIsIm9yZ0lkIjoiNDUxOTc4IiwidXNlcklkIjoiNDY1MDQ5IiwidHlwZUlkIjoiY2JhYzQ1ZTctODk4Ni00ZGFlLWE4NTUtMDA3ZmFlNjM4ZDgyIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDk0MzkxNzEsImV4cCI6NDkwNTE5OTE3MX0.nTFPzga8CQX4Yxryvu2zCkCVHsJp5VDoIy_CthTrOvc';
    const WALLET = '0x308e77f00ecd3c1ba0dba8bbba78b4cd2fd4d42a';

    try {
        console.log('🚀 TESTING SIMPLE MORALIS API...');

        // 1. PulseChain ERC20 Transfers - GENAU nach Dokumentation
        const pulseUrl = `https://deep-index.moralis.io/api/v2.2/${WALLET}/erc20/transfers?chain=0x171&limit=100`;
        
        console.log('📡 Calling:', pulseUrl);
        
        const response = await fetch(pulseUrl, {
            method: 'GET',
            headers: {
                'X-API-Key': MORALIS_API_KEY,
                'Accept': 'application/json'
            }
        });

        console.log('📊 Response Status:', response.status);
        console.log('📊 Response Headers:', Object.fromEntries(response.headers));

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error Response:', errorText);
            
            return res.status(500).json({
                success: false,
                error: `Moralis API Error: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        console.log('✅ Success! Data structure:', {
            hasResult: !!data.result,
            resultType: Array.isArray(data.result) ? 'array' : typeof data.result,
            resultLength: data.result?.length || 0,
            hasCursor: !!data.cursor,
            firstItem: data.result?.[0] || null
        });

        // Prüfe ob 2025+ Transaktionen dabei sind
        const transfers2025Plus = data.result?.filter(tx => {
            const year = new Date(tx.block_timestamp).getFullYear();
            return year >= 2025;
        }) || [];

        console.log(`📅 Gefunden: ${transfers2025Plus.length} Transaktionen ab 2025`);

        // Zeige erste paar Transaktionen
        transfers2025Plus.slice(0, 5).forEach((tx, i) => {
            console.log(`🔍 TX ${i+1}:`, {
                date: tx.block_timestamp,
                year: new Date(tx.block_timestamp).getFullYear(),
                token: tx.token_symbol,
                value: tx.value,
                hash: tx.transaction_hash?.substring(0, 10) + '...'
            });
        });

        return res.status(200).json({
            success: true,
            message: 'Moralis API Test erfolgreich',
            data: {
                totalTransfers: data.result?.length || 0,
                transfers2025Plus: transfers2025Plus.length,
                cursor: data.cursor,
                sampleTransfers: transfers2025Plus.slice(0, 3)
            },
            rawResponse: data
        });

    } catch (error) {
        console.error('❌ Moralis API Test Fehler:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
} 