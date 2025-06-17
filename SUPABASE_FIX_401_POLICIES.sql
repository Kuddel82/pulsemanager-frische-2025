-- =============================================================================
-- 🔐 SUPABASE 401 UNAUTHORIZED FIX - RLS POLICIES REPARATUR
-- =============================================================================

-- Problem: 401 Unauthorized bei user_profiles und wallets Tabellen
-- Lösung: Korrekte RLS Policies für authentifizierte User

-- 1. DISABLE RLS temporär für Debugging (VORSICHT!)
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;

-- 2. BESSERE LÖSUNG: Korrekte RLS Policies erstellen

-- ✅ USER_PROFILES Table Policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Policy: Users können ihr eigenes Profil lesen
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users können ihr eigenes Profil updaten
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users können ihr eigenes Profil erstellen
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ✅ WALLETS Table Policies
DROP POLICY IF EXISTS "Users can view own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can insert own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can delete own wallets" ON wallets;

-- Policy: Users können ihre eigenen Wallets lesen
CREATE POLICY "Users can view own wallets" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users können ihre eigenen Wallets erstellen
CREATE POLICY "Users can insert own wallets" ON wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users können ihre eigenen Wallets updaten
CREATE POLICY "Users can update own wallets" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users können ihre eigenen Wallets löschen
CREATE POLICY "Users can delete own wallets" ON wallets
    FOR DELETE USING (auth.uid() = user_id);

-- 3. RLS AKTIVIEREN (falls deaktiviert)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- 4. ANON KEY POLICIES (für Public Access wenn nötig)
-- VORSICHT: Nur für nicht-sensitive Daten!

-- Optional: Anon users können Public Profiles lesen (falls gewünscht)
-- CREATE POLICY "Anon can view public profiles" ON user_profiles
--     FOR SELECT USING (true);

-- 5. DEBUGGING: Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'wallets')
ORDER BY tablename, policyname;

-- 6. USER VERIFICATION: Check if auth.uid() works
-- SELECT auth.uid() as current_user_id;

-- 7. TABLE STRUCTURE VERIFICATION
-- \d user_profiles
-- \d wallets

-- =============================================================================
-- 🔧 ZUSÄTZLICHE FIXES für häufige Probleme
-- =============================================================================

-- Fix 1: Stelle sicher dass user_profiles.id UUID ist und mit auth.users.id verknüpft
-- ALTER TABLE user_profiles ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;

-- Fix 2: Trigger für automatische user_profile Erstellung bei Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, created_at)
  VALUES (new.id, new.email, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fix 3: Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- =============================================================================
-- 🚨 NOTFALL-LÖSUNG: RLS komplett deaktivieren (NUR FÜR DEVELOPMENT!)
-- =============================================================================

-- WARNUNG: Nur für lokale Entwicklung verwenden!
-- NIEMALS in Production!

-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;

-- Wenn du diese Lösung verwendest, kommentiere sie später wieder aus:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 📋 TESTING QUERIES
-- =============================================================================

-- Test 1: Check if policies work
-- SELECT * FROM user_profiles WHERE id = auth.uid();

-- Test 2: Check wallet access
-- SELECT * FROM wallets WHERE user_id = auth.uid();

-- Test 3: Check auth status
-- SELECT auth.uid(), auth.role();

-- =============================================================================
-- ✅ EXECUTE THIS SCRIPT IN SUPABASE SQL EDITOR
-- =============================================================================

-- 1. Gehe zu: https://supabase.com/dashboard
-- 2. Wähle dein Projekt
-- 3. Gehe zu "SQL Editor"
-- 4. Füge dieses Script ein
-- 5. Klicke "Run"
-- 6. Teste die App erneut

COMMIT; 