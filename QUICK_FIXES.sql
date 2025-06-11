-- 🔧 QUICK FIXES für Portfolio-Probleme
-- Führe dieses Script in Supabase SQL Editor aus: https://supabase.com/dashboard

-- 1️⃣ LÖSCHE DUPLIKATE in transactions_cache
DELETE FROM transactions_cache 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, tx_hash) id
  FROM transactions_cache 
  ORDER BY user_id, tx_hash, created_at DESC
);

-- 2️⃣ ERSTELLE CACHE-TABELLEN (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS portfolio_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_data JSONB NOT NULL,
    total_value DECIMAL(20,2) DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    wallet_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_price_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_address TEXT NOT NULL,
    token_symbol TEXT,
    price_usd DECIMAL(36,18) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3️⃣ ENABLE RLS und POLICIES
ALTER TABLE portfolio_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own portfolio cache" ON portfolio_cache;
CREATE POLICY "Users can access own portfolio cache" ON portfolio_cache
    FOR ALL USING (auth.uid() = user_id);

-- 4️⃣ FEHLENDE SPALTE hinzufügen (falls nötig)
ALTER TABLE transactions_cache ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- 5️⃣ ALTE CACHE-Einträge löschen (für frischen Start)
DELETE FROM portfolio_cache WHERE updated_at < NOW() - INTERVAL '1 hour';
DELETE FROM token_price_cache WHERE updated_at < NOW() - INTERVAL '1 hour';

-- ✅ BESTÄTIGUNG
DO $$
BEGIN
  RAISE NOTICE '✅ QUICK FIXES ANGEWENDET:';
  RAISE NOTICE '   - Duplikate entfernt';
  RAISE NOTICE '   - Cache-Tabellen erstellt';
  RAISE NOTICE '   - RLS aktiviert';
  RAISE NOTICE '   - Alte Cache-Einträge gelöscht';
  RAISE NOTICE '🎯 System sollte jetzt funktionieren!';
END $$; 