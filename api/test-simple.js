// 🧪 SIMPLE TEST API - No dependencies
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { address } = req.query;
  
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    return res.status(200).json({
      result: [],
      _test_mode: true,
      _message: 'Simple test - NULL address OK'
    });
  }
  
  return res.status(200).json({
    result: [{ test: 'ok' }],
    _test_mode: true,
    _message: 'Simple test API working'
  });
} 