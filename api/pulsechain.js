// 🚨 DEPRECATED: PulseChain Scanner API - DEACTIVATED
// This free API has been replaced with 100% Moralis Enterprise
// Datum: 2025-01-11 - ENTERPRISE ONLY: Redirects to Moralis

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.warn('🚨 DEPRECATED: Free PulseChain Scanner API called - redirecting to Moralis Enterprise');

  // Return error response instructing to use Moralis Enterprise
  return res.status(410).json({
    error: 'API_DEPRECATED',
    message: 'Free PulseChain Scanner API has been deactivated',
    replacement: 'Use Moralis Enterprise APIs instead',
    enterprise_apis: {
      tokens: '/api/moralis-tokens',
      prices: '/api/moralis-prices',
      transactions: '/api/moralis-transactions',
      token_transfers: '/api/moralis-token-transfers'
    },
    reason: 'Enterprise reliability requires paid APIs only',
    migration: 'All services now use 100% Moralis Enterprise for maximum reliability'
  });
} 