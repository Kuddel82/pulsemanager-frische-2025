-- =============================================================================
-- 🚨 NUCLEAR OPTION: DISABLE ALL RLS (DEVELOPMENT ONLY!)
-- =============================================================================

-- WARNUNG: Nur für Development! Deaktiviert ALLE Sicherheitsregeln!

-- 1. Erstelle fehlende Tabellen falls sie nicht existieren
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    address VARCHAR(42) NOT NULL,
    nickname VARCHAR(100),
    chain_id INTEGER DEFAULT 369,
    wallet_type VARCHAR(20) DEFAULT 'manual',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DISABLE RLS AUF ALLEN RELEVANTEN TABELLEN
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;

-- Auch andere mögliche Tabellen
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('brieftaschen', 'Brieftaschen', 'wallet_data', 'token_balances', 'transactions_cache')
    LOOP
        EXECUTE 'ALTER TABLE ' || table_record.tablename || ' DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'RLS disabled for table: %', table_record.tablename;
    END LOOP;
END $$;

-- 3. VERIFICATION
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '❌ RLS STILL ENABLED'
        WHEN rowsecurity = false THEN '✅ RLS DISABLED'
        ELSE '❓ Unknown'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'wallets', 'brieftaschen', 'Brieftaschen', 'wallet_data')
ORDER BY tablename;

-- 4. SUCCESS MESSAGE
SELECT '🚨 NUCLEAR OPTION EXECUTED - ALL RLS DISABLED!' as result; 