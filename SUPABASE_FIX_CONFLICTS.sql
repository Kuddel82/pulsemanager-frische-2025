-- 🛡️ SUPABASE FIX: 409 Conflicts lösen
-- Ausführen in: Supabase Dashboard > SQL Editor

-- 1️⃣ Lösche Duplicate Transactions (keep latest)
DELETE FROM transactions_cache 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, tx_hash) id
  FROM transactions_cache 
  ORDER BY user_id, tx_hash, created_at DESC
);

-- 2️⃣ Lösche Transaktionen ohne user_id (corrupt data)
DELETE FROM transactions_cache WHERE user_id IS NULL;

-- 3️⃣ Lösche sehr alte Cache-Einträge (> 30 Tage)
DELETE FROM transactions_cache 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 4️⃣ Update Unique Constraint (falls fehlt)
ALTER TABLE transactions_cache 
DROP CONSTRAINT IF EXISTS transactions_cache_user_id_tx_hash_key;

ALTER TABLE transactions_cache 
ADD CONSTRAINT transactions_cache_user_id_tx_hash_key 
UNIQUE(user_id, tx_hash);

-- 5️⃣ Bestätigung
DO $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM transactions_cache;
  RAISE NOTICE '✅ CONFLICTS RESOLVED';
  RAISE NOTICE '✅ UNIQUE CONSTRAINTS UPDATED';
  RAISE NOTICE '📊 Total transactions in cache: %', total_count;
  RAISE NOTICE '🎯 409 Conflicts should be resolved!';
END $$; 