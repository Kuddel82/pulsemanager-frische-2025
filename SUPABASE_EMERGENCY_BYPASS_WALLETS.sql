-- =============================================================================
-- 🚨 EMERGENCY: CREATE MISSING WALLETS TABLE
-- =============================================================================

-- Falls die Tabelle gar nicht existiert, erstellen wir sie einfach

-- 1. Erstelle eine einfache wallets Tabelle
CREATE TABLE IF NOT EXISTS wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    address VARCHAR(42) NOT NULL,
    nickname VARCHAR(100),
    chain_id INTEGER DEFAULT 369,
    wallet_type VARCHAR(20) DEFAULT 'manual',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS DEAKTIVIEREN
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;

-- 3. Index für Performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- 4. Verification
SELECT 'wallets table created and RLS disabled!' as result;

-- 5. Check all tables now
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%wallet%'
ORDER BY table_name; 