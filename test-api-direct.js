// 🚨 DIRECT API TEST - DEBUG 0 TRANSAKTIONEN
// Using native fetch (Node 18+)

const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjkwYTFiZTViLWNjNGQtNDEzZC1hMjJjLTU3ODE3MDBlNDAzNiIsIm9yZ0lkIjoiNDE3NzIzIiwidXNlcklkIjoiNDI5MzEzIiwidHlwZUlkIjoiNjZkOWIwMzUtZGUwYS00NDVhLTkzODEtNDM2MTQ5OGMzOWFkIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MzU0NzQxNzYsImV4cCI6NDg5MTIzNDE3Nn0.YbJKSZl8ynC7vKSHD7QPdU2Q9PEJJKLKBdS2dM9WA-c';
// TEST: Versuche verschiedene Wallets
const WALLETS = [
    '0x308e77f00ecd3c1ba0dba8bbba78b4cd2fd4d42a', // Original
    '0x1234567890abcdef1234567890abcdef12345678', // Dummy
    '0x8ba1f109551bD432803012645Hac136c2c24bbb0', // Random PulseChain
];

const WALLET = WALLETS[0]; // Aktuelle

async function testDirectAPI() {
    console.log('🚨 TESTING DIRECT MORALIS API...');
    
    // Test 1: PulseChain 
    console.log('\n🔗 TEST 1: PulseChain (0x171)');
    try {
        const pulseUrl = `https://deep-index.moralis.io/api/v2/${WALLET}/erc20/transfers?chain=0x171&limit=500`;
        console.log('URL:', pulseUrl);
        
        const response = await fetch(pulseUrl, {
            headers: {
                'X-API-Key': MORALIS_API_KEY,
                'Accept': 'application/json'
            }
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Results:', data.result?.length || 0);
            
            if (data.result?.length > 0) {
                const sample = data.result[0];
                console.log('Sample TX:', {
                    symbol: sample.token_symbol,
                    timestamp: sample.block_timestamp,
                    year: new Date(sample.block_timestamp).getFullYear()
                });
            }
        } else {
            const error = await response.text();
            console.log('Error:', error);
        }
    } catch (error) {
        console.log('API Error:', error.message);
    }
    
    // Test 2: Ethereum
    console.log('\n🔗 TEST 2: Ethereum (0x1)');
    try {
        const ethUrl = `https://deep-index.moralis.io/api/v2/${WALLET}/erc20/transfers?chain=0x1&limit=100`;
        console.log('URL:', ethUrl);
        
        const response = await fetch(ethUrl, {
            headers: {
                'X-API-Key': MORALIS_API_KEY,
                'Accept': 'application/json'
            }
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Results:', data.result?.length || 0);
            
            if (data.result?.length > 0) {
                const sample = data.result[0];
                console.log('Sample TX:', {
                    symbol: sample.token_symbol,
                    timestamp: sample.block_timestamp,
                    year: new Date(sample.block_timestamp).getFullYear()
                });
            }
        } else {
            const error = await response.text();
            console.log('Error:', error);
        }
    } catch (error) {
        console.log('API Error:', error.message);
    }
    
    // Test 3: BlockScout Backup
    console.log('\n🔄 TEST 3: BlockScout Backup');
    try {
        const blockscoutUrl = `https://api.scan.pulsechain.com/api?module=account&action=tokentx&address=${WALLET}&startblock=0&endblock=latest&sort=desc&offset=100`;
        console.log('URL:', blockscoutUrl);
        
        const response = await fetch(blockscoutUrl);
        console.log('Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('BlockScout Status:', data.status);
            console.log('Results:', data.result?.length || 0);
            
            if (data.result?.length > 0) {
                const sample = data.result[0];
                console.log('Sample TX:', {
                    symbol: sample.tokenSymbol,
                    timestamp: new Date(parseInt(sample.timeStamp) * 1000).toISOString(),
                    year: new Date(parseInt(sample.timeStamp) * 1000).getFullYear()
                });
            }
        } else {
            const error = await response.text();
            console.log('Error:', error);
        }
    } catch (error) {
        console.log('BlockScout Error:', error.message);
    }
}

testDirectAPI().catch(console.error); 