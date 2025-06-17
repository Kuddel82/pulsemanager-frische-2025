-- =============================================================================
-- 🔍 DIAGNOSE: WAS IST SCHIEFGELAUFEN?
-- =============================================================================

-- 1. Check if tables exist
SELECT 
    'TABLE EXISTENCE CHECK' as check_type,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'wallets')
ORDER BY table_name;

-- 2. Check RLS status
SELECT 
    'RLS STATUS CHECK' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '❌ RLS ENABLED (PROBLEM!)'
        WHEN rowsecurity = false THEN '✅ RLS DISABLED (GOOD!)'
        ELSE '❓ Unknown'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'wallets')
ORDER BY tablename;

-- 3. Check table structure
SELECT 
    'TABLE STRUCTURE CHECK' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'wallets')
ORDER BY table_name, ordinal_position;

-- 4. Check if we can insert (test permissions)
-- DO $$
-- BEGIN
--     INSERT INTO user_profiles (id, email) VALUES (gen_random_uuid(), 'test@test.com');
--     RAISE NOTICE '✅ INSERT TEST SUCCESSFUL';
--     DELETE FROM user_profiles WHERE email = 'test@test.com';
-- EXCEPTION WHEN OTHERS THEN
--     RAISE NOTICE '❌ INSERT TEST FAILED: %', SQLERRM;
-- END $$;

-- 5. Show current user and role
SELECT 
    'AUTH CHECK' as check_type,
    current_user as current_db_user,
    session_user as session_db_user;

-- 6. List ALL tables (maybe the names are different)
SELECT 
    'ALL TABLES' as check_type,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 