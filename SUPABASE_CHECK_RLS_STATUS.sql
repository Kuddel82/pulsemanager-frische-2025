-- =============================================================================
-- 🔍 SUPABASE RLS STATUS CHECK - DIAGNOSE
-- =============================================================================

-- Check if RLS is enabled or disabled on our tables

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
WHERE tablename IN ('user_profiles', 'wallets')
AND schemaname = 'public'
ORDER BY tablename;

-- Check if tables exist at all
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('user_profiles', 'wallets')
AND table_schema = 'public';

-- Check current user authentication
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- List all policies on these tables (should be empty if RLS disabled)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'wallets')
ORDER BY tablename, policyname; 