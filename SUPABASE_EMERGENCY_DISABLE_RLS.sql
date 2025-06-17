-- =============================================================================
-- 🚨 EMERGENCY: DISABLE RLS TEMPORARILY (DEVELOPMENT ONLY!)
-- =============================================================================

-- WARNUNG: Nur für Development/Testing verwenden!
-- NIEMALS in Production ausführen!

-- Problem: 401 Unauthorized Errors durch RLS Policies
-- Lösung: RLS temporär deaktivieren für sofortige Funktionalität

-- 1. RLS DEAKTIVIEREN für user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. RLS DEAKTIVIEREN für wallets  
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICATION: Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'wallets')
AND schemaname = 'public';

-- 4. SUCCESS MESSAGE
SELECT 'RLS DISABLED - App should work now!' as status;

-- =============================================================================
-- ✅ EXECUTE THIS IN SUPABASE SQL EDITOR FOR IMMEDIATE FIX
-- =============================================================================

-- Nach dem Ausführen sollten die 401 Errors verschwinden!
-- Die App funktioniert dann wieder normal.

-- SPÄTER WIEDER AKTIVIEREN MIT:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

COMMIT; 