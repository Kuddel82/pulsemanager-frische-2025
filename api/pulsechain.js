// 🚀 PulseChain API Proxy - Vercel Serverless Function v0.0.5
// Eliminiert CORS-Probleme durch Server-seitigen Proxy
// Route: /api/pulsechain?address=0x...&action=tokenlist
// Deploy Time: 2025-01-08 FORCE CACHE CLEAR

export default async function handler(req, res) {
  // CORS Headers für alle Origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Nur GET-Requests erlauben
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, action = 'tokenlist', module = 'account', tag = 'latest' } = req.query;

    // Validierung der Wallet-Adresse
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address',
        provided: address 
      });
    }

    // PulseChain API Base URL
    const baseUrl = 'https://scan.pulsechain.com/api';
    let apiUrl;

    // Verschiedene API-Endpoints basierend auf Action
    switch (action) {
      case 'balance':
        // Native PLS Balance
        apiUrl = `${baseUrl}?module=${module}&action=balance&address=${address}&tag=${tag}`;
        break;
        
      case 'tokenlist':
        // ERC20 Token Balances
        apiUrl = `${baseUrl}?module=${module}&action=tokenlist&address=${address}&page=1&offset=100`;
        break;
        
      case 'txlist':
        // Normal Transactions
        const { startblock = '0', endblock = 'latest', page = '1', offset = '50', sort = 'desc' } = req.query;
        apiUrl = `${baseUrl}?module=${module}&action=txlist&address=${address}&startblock=${startblock}&endblock=${endblock}&page=${page}&offset=${offset}&sort=${sort}`;
        break;
        
      case 'tokentx':
        // Token Transfers
        const { 
          startblock: tsb = '0', 
          endblock: teb = 'latest', 
          page: tpage = '1', 
          offset: toffset = '50', 
          sort: tsort = 'desc' 
        } = req.query;
        apiUrl = `${baseUrl}?module=${module}&action=tokentx&address=${address}&startblock=${tsb}&endblock=${teb}&page=${tpage}&offset=${toffset}&sort=${tsort}`;
        break;
        
      default:
        return res.status(400).json({ 
          error: 'Unsupported action',
          supportedActions: ['balance', 'tokenlist', 'txlist', 'tokentx']
        });
    }

    console.log(`🔗 PROXY: Fetching ${action} for ${address}`);
    console.log(`🔗 API URL: ${apiUrl}`);

    // Fetch von PulseChain API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'PulseManager-v1.0',
        'Accept': 'application/json'
      }
    });

    console.log(`📡 API Response Status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`PulseChain API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 API Data Status: ${data.status}, Results: ${Array.isArray(data.result) ? data.result.length : 'N/A'}`);

    // Debug-Informationen hinzufügen
    const responseData = {
      ...data,
      _proxy: {
        timestamp: new Date().toISOString(),
        address: address,
        action: action,
        apiUrl: apiUrl,
        status: response.status,
        resultCount: Array.isArray(data.result) ? data.result.length : null
      }
    };

    // Erfolgreiche Antwort
    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 PROXY ERROR:', error.message);
    
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 