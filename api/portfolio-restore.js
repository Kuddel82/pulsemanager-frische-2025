// 💾 PORTFOLIO RESTORE API - Lädt letztes Portfolio OHNE API-Calls
// Löst das Problem: "Nach Login ist Portfolio leer"

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('💾 PORTFOLIO RESTORE API: Request received');
  
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

  if (!process.env.SUPABASE_URL) {
    return res.status(503).json({ 
      error: 'Supabase-Konfiguration fehlt'
    });
  }

  try {
    console.log(`💾 RESTORE: Loading cached portfolio for user ${userId}`);

    // Hole neuesten Cache-Eintrag für diesen User
    const { data: cacheEntry, error: cacheError } = await supabase
      .from('portfolio_cache')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (cacheError) {
      if (cacheError.code === 'PGRST116') {
        // Kein Cache gefunden - das ist ok
        console.log('📭 RESTORE: No portfolio cache found for user');
        return res.status(200).json({
          success: false,
          reason: 'no_cache',
          message: 'Noch kein Portfolio gecacht'
        });
      } else {
        console.error('💥 RESTORE: Cache read error:', cacheError);
        return res.status(500).json({
          error: 'Fehler beim Lesen des Caches',
          details: cacheError.message
        });
      }
    }

    // Berechne Cache-Alter
    const now = new Date();
    const lastUpdate = new Date(cacheEntry.updated_at);
    const ageMinutes = Math.round((now - lastUpdate) / (1000 * 60));
    const isStale = ageMinutes > 60; // > 1 Stunde = veraltet

    console.log(`✅ RESTORE: Found cached portfolio (${ageMinutes} minutes old)`);

    return res.status(200).json({
      success: true,
      data: cacheEntry.cache_data,
      lastUpdate: cacheEntry.updated_at,
      ageMinutes: ageMinutes,
      isStale: isStale,
      stats: cacheEntry.cache_stats || {
        totalTokens: cacheEntry.cache_data?.length || 0,
        totalValue: cacheEntry.total_value || 0
      },
      metadata: {
        walletAddress: cacheEntry.wallet_address,
        chainId: cacheEntry.chain_id,
        restoredAt: now.toISOString()
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