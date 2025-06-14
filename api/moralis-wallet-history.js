// 🚀 MORALIS WALLET HISTORY API - CLEAN IMPLEMENTATION
// Ersetzt alle alten Token-Price Services durch die neue Wallet History API
// Datum: 2025-01-11 - SAUBERE IMPLEMENTIERUNG ohne Konflikte

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

export default async function handler(req, res) {
  console.log('🚀 WALLET HISTORY API: Request received');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use GET.',
      allowedMethods: ['GET']
    });
  }

  const { 
    address,
    chain = '0x171', // PulseChain Standard
    from_date,
    to_date,
    from_block,
    to_block,
    include_internal_transactions = 'true',
    nft_metadata = 'true',
    order = 'DESC',
    limit = 100,
    cursor
  } = req.query;

  // Validation
  if (!address) {
    return res.status(400).json({ 
      error: 'Wallet address fehlt',
      usage: '/api/moralis-wallet-history?address=0x...&chain=0x171'
    });
  }

  if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
    return res.status(503).json({ 
      error: 'Moralis API Key nicht konfiguriert'
    });
  }

  try {
    console.log(`🚀 WALLET HISTORY: Loading for ${address.slice(0, 8)}... on chain ${chain}`);

    // 🌐 Build API URL
    const apiUrl = `${MORALIS_BASE_URL}/wallets/${address}/history`;
    
    // 📋 Build query parameters
    const params = new URLSearchParams({
      chain: chain,
      order: order,
      limit: limit.toString()
    });

    // 📅 Add optional parameters
    if (from_date) params.append('from_date', from_date);
    if (to_date) params.append('to_date', to_date);
    if (from_block) params.append('from_block', from_block);
    if (to_block) params.append('to_block', to_block);
    if (include_internal_transactions) params.append('include_internal_transactions', include_internal_transactions);
    if (nft_metadata) params.append('nft_metadata', nft_metadata);
    if (cursor) params.append('cursor', cursor);

    const fullUrl = `${apiUrl}?${params.toString()}`;
    
    // 📡 Make API request
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    if (!response.ok) {
      console.error(`❌ Moralis Wallet History Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `Moralis API Error: ${response.status}`,
        message: response.statusText 
      });
    }

    const data = await response.json();
    
    console.log(`✅ WALLET HISTORY: Loaded ${data.result?.length || 0} transactions`);
    console.log(`📊 PAGINATION: Page ${data.page || 1}, Cursor: ${data.cursor ? 'Available' : 'End'}`);

    // 🔍 Extract token information from transactions
    const tokenInfo = extractTokenInfoFromHistory(data.result || []);

    return res.status(200).json({
      success: true,
      transactions: data.result || [],
      pagination: {
        page: data.page,
        pageSize: data.page_size,
        cursor: data.cursor,
        hasMore: !!data.cursor
      },
      tokenInfo: tokenInfo,
      source: 'moralis_wallet_history',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 WALLET HISTORY ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      address,
      chain
    });
  }
}

/**
 * 🔍 EXTRACT TOKEN INFO from Wallet History
 * Extrahiert alle Token-Informationen aus der Transaktionshistorie
 */
function extractTokenInfoFromHistory(transactions) {
  const tokenMap = {};
  const tokenStats = {
    totalTransactions: transactions.length,
    nativeTransfers: 0,
    erc20Transfers: 0,
    nftTransfers: 0,
    uniqueTokens: 0
  };

  console.log(`🔍 EXTRACTING TOKEN INFO: Analyzing ${transactions.length} transactions`);

  transactions.forEach(tx => {
    try {
      // 💰 Native Token Transfers (PLS, ETH)
      if (tx.native_transfers && tx.native_transfers.length > 0) {
        tokenStats.nativeTransfers += tx.native_transfers.length;
        
        tx.native_transfers.forEach(transfer => {
          const symbol = transfer.token_symbol || (tx.chain === '0x171' ? 'PLS' : 'ETH');
          const tokenKey = `native_${symbol}`;
          
          if (!tokenMap[tokenKey]) {
            tokenMap[tokenKey] = {
              symbol: symbol,
              name: tx.chain === '0x171' ? 'PulseChain' : 'Ethereum',
              address: 'native',
              decimals: 18,
              type: 'native',
              logo: transfer.token_logo,
              transferCount: 0,
              lastSeen: tx.block_timestamp
            };
          }
          tokenMap[tokenKey].transferCount++;
        });
      }

      // 🪙 ERC20 Token Transfers
      if (tx.erc20_transfer && tx.erc20_transfer.length > 0) {
        tokenStats.erc20Transfers += tx.erc20_transfer.length;
        
        tx.erc20_transfer.forEach(transfer => {
          const tokenAddress = transfer.address?.toLowerCase();
          
          if (tokenAddress) {
            if (!tokenMap[tokenAddress]) {
              tokenMap[tokenAddress] = {
                symbol: transfer.token_symbol || 'UNKNOWN',
                name: transfer.token_name || 'Unknown Token',
                address: tokenAddress,
                decimals: parseInt(transfer.token_decimals) || 18,
                type: 'erc20',
                logo: transfer.token_logo,
                transferCount: 0,
                lastSeen: tx.block_timestamp,
                possibleSpam: transfer.possible_spam === 'true',
                verified: transfer.verified_contract === 'true'
              };
            }
            tokenMap[tokenAddress].transferCount++;
            tokenMap[tokenAddress].lastSeen = tx.block_timestamp;
          }
        });
      }

      // 🎨 NFT Transfers
      if (tx.nft_transfers && tx.nft_transfers.length > 0) {
        tokenStats.nftTransfers += tx.nft_transfers.length;
        
        tx.nft_transfers.forEach(nft => {
          const tokenAddress = nft.token_address?.toLowerCase();
          
          if (tokenAddress) {
            const nftKey = `${tokenAddress}_nft`;
            
            if (!tokenMap[nftKey]) {
              tokenMap[nftKey] = {
                symbol: nft.token_symbol || 'NFT',
                name: nft.token_name || 'NFT Collection',
                address: tokenAddress,
                decimals: 0,
                type: 'nft',
                contractType: nft.contract_type,
                transferCount: 0,
                lastSeen: tx.block_timestamp,
                possibleSpam: nft.possible_spam === 'true',
                verified: nft.verified_collection === 'true'
              };
            }
            tokenMap[nftKey].transferCount++;
          }
        });
      }

    } catch (error) {
      console.warn(`⚠️ Error processing transaction ${tx.hash}:`, error.message);
    }
  });

  tokenStats.uniqueTokens = Object.keys(tokenMap).length;
  
  console.log(`✅ TOKEN EXTRACTION COMPLETE:`, tokenStats);

  return {
    tokens: tokenMap,
    stats: tokenStats
  };
} 