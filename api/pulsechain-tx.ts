import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { address, action = 'txlist', startblock = '0', endblock = '99999999', sort = 'asc' } = req.query;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing address' });
  }
  const url = `https://scan.pulsechain.com/api?module=account&action=${action}&address=${address}&startblock=${startblock}&endblock=${endblock}&sort=${sort}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'PulseChain tx fetch failed' });
  }
} 