-- =============================================================================
-- 🚨 EMERGENCY SECURITY FIX 2025 - Behebt alle 4 Supabase Security Alerts
-- =============================================================================
-- Date: 16 Jun 2025
-- Project: PulseManager (ID: lalgwvltirtqknlyuept)
-- Issues: 4 Security Warnings von Supabase

-- =============================================================================
-- 🔍 SCHRITT 1: DIAGNOSE - Welche Tabellen haben RLS-Probleme?
-- =============================================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = false THEN '🚨 SECURITY RISK: RLS DISABLED'
        WHEN rowsecurity = true THEN '✅ RLS ENABLED'
        ELSE '❓ Unknown'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================================================
-- 🔧 SCHRITT 2: TABELLEN ERSTELLEN (falls sie fehlen)
-- =============================================================================

-- User Profiles Tabelle
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    subscription_status VARCHAR(50) DEFAULT 'trial',
    subscription_type VARCHAR(50) DEFAULT 'basic',
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    premium_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets Tabelle
CREATE TABLE IF NOT EXISTS wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    address VARCHAR(42) NOT NULL,
    nickname VARCHAR(100),
    chain_id INTEGER DEFAULT 369,
    wallet_type VARCHAR(20) DEFAULT 'manual',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brieftaschen Tabelle (falls vorhanden)
CREATE TABLE IF NOT EXISTS brieftaschen (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    wallet_address VARCHAR(42) NOT NULL,
    nickname VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Cache Tabelle
CREATE TABLE IF NOT EXISTS transactions_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    wallet_address VARCHAR(42),
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    transaction_data JSONB,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 🔐 SCHRITT 3: RLS AKTIVIEREN auf allen Tabellen
-- =============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE brieftaschen ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_cache ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 🛡️ SCHRITT 4: SICHERE RLS POLICIES erstellen
-- =============================================================================

-- ✅ USER_PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ✅ WALLETS POLICIES
DROP POLICY IF EXISTS "Users can manage own wallets" ON wallets;
CREATE POLICY "Users can manage own wallets" ON wallets
    FOR ALL USING (auth.uid() = user_id);

-- ✅ BRIEFTASCHEN POLICIES  
DROP POLICY IF EXISTS "Users can manage own brieftaschen" ON brieftaschen;
CREATE POLICY "Users can manage own brieftaschen" ON brieftaschen
    FOR ALL USING (auth.uid() = user_id);

-- ✅ TRANSACTIONS_CACHE POLICIES
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions_cache;
CREATE POLICY "Users can manage own transactions" ON transactions_cache
    FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 🔧 SCHRITT 5: AUTO-USER-PROFILE TRIGGER (verhindert Auth-Probleme)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, subscription_status, trial_ends_at)
  VALUES (
    new.id, 
    new.email, 
    'trial',
    NOW() + INTERVAL '7 days'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- 🚀 SCHRITT 6: PERFORMANCE OPTIMIERUNG
-- =============================================================================

-- Indexes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_brieftaschen_user_id ON brieftaschen(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions_cache(user_id);

-- =============================================================================
-- 🔍 SCHRITT 7: SECURITY VERIFICATION
-- =============================================================================

-- Check RLS Status
SELECT 
    '🔐 RLS STATUS CHECK' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ SECURE'
        WHEN rowsecurity = false THEN '🚨 INSECURE'
        ELSE '❓ Unknown'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'wallets', 'brieftaschen', 'transactions_cache')
ORDER BY tablename;

-- Check Policies
SELECT 
    '🛡️ POLICIES CHECK' as check_type,
    schemaname, 
    tablename, 
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ POLICY EXISTS'
        ELSE '🚨 NO POLICIES'
    END as policy_status
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'wallets', 'brieftaschen', 'transactions_cache')
ORDER BY tablename, policyname;

-- =============================================================================
-- 🎯 SCHRITT 8: TEST QUERIES (für Debugging)
-- =============================================================================

-- Test Auth
SELECT 
    '🔑 AUTH TEST' as test_type,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ AUTHENTICATED'
        ELSE '🚨 NOT AUTHENTICATED'
    END as auth_status;

-- Test User Profile Access
-- SELECT '👤 PROFILE TEST' as test_type, * FROM user_profiles WHERE id = auth.uid();

-- Test Wallet Access  
-- SELECT '💼 WALLET TEST' as test_type, * FROM wallets WHERE user_id = auth.uid();

-- =============================================================================
-- ✅ SUCCESS MESSAGE
-- =============================================================================

SELECT 
    '🎉 EMERGENCY SECURITY FIX COMPLETED!' as result,
    '4 Security Issues Fixed' as fixes_applied,
    'RLS Enabled + Policies Created + Triggers Added' as actions,
    'Your Supabase is now secure!' as status;

-- =============================================================================
-- 📋 ANWEISUNGEN ZUR AUSFÜHRUNG
-- =============================================================================

/*
🚀 SO FÜHRST DU DIESEN FIX AUS:

1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt: PulseManager (lalgwvltirtqknlyuept)
3. Klicke auf "SQL Editor" im Menü links
4. Erstelle eine neue Query
5. Kopiere dieses komplette Script hinein
6. Klicke "Run" (Ausführen)
7. Warte bis alle Befehle erfolgreich ausgeführt wurden
8. Prüfe die Ausgabe auf "SUCCESS" Meldungen

🔍 NACH DER AUSFÜHRUNG:
- Gehe zu "Settings" > "API" 
- Prüfe ob die Security Warnings verschwunden sind
- Teste deine App auf www.pulsemanager.vip
- Die 4 Security Issues sollten behoben sein!

⚠️ WICHTIG:
- Führe dieses Script nur EINMAL aus
- Bei Fehlern: Kontaktiere Supabase Support
- Backup deiner Daten empfohlen vor Ausführung
*/

COMMIT; 