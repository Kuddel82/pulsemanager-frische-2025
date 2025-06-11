-- 🛡️ SUPABASE FIX: Fehlende wallet_address Spalte reparieren
-- Ausführen in: Supabase Dashboard > SQL Editor

-- 1️⃣ Fehlende Spalte hinzufügen
ALTER TABLE transactions_cache ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- 2️⃣ Index für Performance hinzufügen
CREATE INDEX IF NOT EXISTS idx_transactions_cache_wallet_address ON transactions_cache(wallet_address);

-- 3️⃣ Bestätigung
DO $$
BEGIN
  RAISE NOTICE '✅ WALLET_ADDRESS SPALTE HINZUGEFÜGT';
  RAISE NOTICE '✅ INDEX ERSTELLT';
  RAISE NOTICE '🎯 400 Bad Request sollte jetzt behoben sein!';
END $$; 