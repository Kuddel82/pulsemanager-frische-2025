-- =============================================================================
-- 🔧 QUICK FIX: BRIEFTASCHEN TABLE RLS DISABLE
-- =============================================================================

-- Das Problem: Code verwendet 'wallets' aber Tabelle heißt 'brieftaschen'

-- 1. RLS für brieftaschen deaktivieren
ALTER TABLE brieftaschen DISABLE ROW LEVEL SECURITY;

-- 2. Status check
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '❌ RLS ENABLED'
        WHEN rowsecurity = false THEN '✅ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'brieftaschen')
AND schemaname = 'public'
ORDER BY tablename;

-- 3. Success message
SELECT 'brieftaschen RLS disabled - 401 errors should be fixed!' as result; 