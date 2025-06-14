// 💾 PORTFOLIO RESTORE API - Simplified Mock Version (bis Cache-Table erstellt ist)
// Löst das Problem: "Nach Login ist Portfolio leer"

export default async function handler(req, res) {
  console.log('💾 PORTFOLIO RESTORE API: Mock version - Request received');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ 
      error: 'userId erforderlich',
      usage: '/api/portfolio-restore?userId=123'
    });
  }

  try {
    console.log(`💾 MOCK RESTORE: User ${userId} - returning no cache`);

    // Temporary: Kein Cache verfügbar (bis wir die Supabase Tabelle erstellen)
    return res.status(200).json({
      success: false,
      reason: 'no_cache_table_yet',
      message: 'Portfolio-Cache noch nicht implementiert - Manual Load erforderlich',
      metadata: {
        apiVersion: 'mock-v1',
        needsManualLoad: true,
        restoredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Portfolio restore error:', error);
    return res.status(500).json({
      error: 'Fehler beim Wiederherstellen des Portfolios',
      message: error.message
    });
  }
} 