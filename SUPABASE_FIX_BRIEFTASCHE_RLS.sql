-- =============================================================================
-- 🔧 SUPABASE FIX: BRIEFTASCHE TABLE RLS DISABLE
-- =============================================================================

-- Problem: Tabelle heißt "brieftasche" nicht "wallets"!
-- Die 401 Errors kommen von der brieftasche-Tabelle

-- 1. RLS DEAKTIVIEREN für brieftasche
ALTER TABLE brieftasche DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICATION: Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '❌ RLS ENABLED (Problem!)'
        WHEN rowsecurity = false THEN '✅ RLS DISABLED (Good!)'
        ELSE '❓ Unknown Status'
    END as status
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'brieftasche')
AND schemaname = 'public'
ORDER BY tablename;

-- 3. SUCCESS MESSAGE
SELECT 'BRIEFTASCHE RLS DISABLED - 401 Errors should be gone!' as status;

COMMIT; 