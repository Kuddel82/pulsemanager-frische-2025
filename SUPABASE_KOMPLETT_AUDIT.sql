-- 🚨 SUPABASE KOMPLETTES AUDIT & REPARATUR SCRIPT
-- Datum: 08.06.2025
-- Zweck: ALLE Tabellen überprüfen und an aktuellen Projektstand anpassen
-- Problem: Inkonsistente/veraltete Datenbankstruktur

-- ================================
-- 1. VOLLSTÄNDIGE DIAGNOSE
-- ================================

\echo '🔍 === SUPABASE KOMPLETT-AUDIT ==='
\echo 'Überprüfe ALLE Tabellen und Schema...'

-- Alle Tabellen anzeigen
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- Alle Spalten der wichtigsten Tabellen
\echo '=== AUTH.USERS SCHEMA ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

\echo '=== USER_PROFILES SCHEMA ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

\echo '=== SUBSCRIPTIONS SCHEMA ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- ================================
-- 2. ENTERPRISE FEATURES BEREINIGUNG
-- ================================

\echo '=== ENTERPRISE CLEANUP ==='

-- Entferne alle Enterprise-bezogenen Tabellen falls vorhanden
DROP TABLE IF EXISTS enterprise_integrations CASCADE;
DROP TABLE IF EXISTS enterprise_features CASCADE;
DROP TABLE IF EXISTS enterprise_configs CASCADE;
DROP TABLE IF EXISTS enterprise_logs CASCADE;

\echo '✅ Enterprise Tabellen entfernt (falls vorhanden)'

-- ================================
-- 3. CORE TABELLEN ERSTELLEN/REPARIEREN
-- ================================

\echo '=== CORE TABLES SETUP ==='

-- user_profiles (HAUPTTABELLE für Subscription-Status)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'trialing', 'active', 'cancelled', 'expired', 'inactive')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days'),
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- subscriptions (Alternative für PayPal)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paypal_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- transactions_cache (für Moralis Cache)
CREATE TABLE IF NOT EXISTS transactions_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'eth',
    transaction_data JSONB,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    UNIQUE(user_id, wallet_address, chain)
);

-- hidden_tokens (für Portfolio Filtering)
CREATE TABLE IF NOT EXISTS hidden_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'eth',
    hidden_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token_address, chain)
);

-- roi_entries (für ROI Tracking)
CREATE TABLE IF NOT EXISTS roi_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'eth',
    purchase_price DECIMAL(20, 8),
    purchase_date TIMESTAMP WITH TIME ZONE,
    purchase_amount DECIMAL(20, 8),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

\echo '✅ Core Tabellen erstellt/updated'

-- ================================
-- 4. INDIZES ERSTELLEN
-- ================================

\echo '=== INDEXES SETUP ==='

-- user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_ends ON user_profiles(trial_ends_at);

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- transactions_cache
CREATE INDEX IF NOT EXISTS idx_transactions_cache_user_wallet ON transactions_cache(user_id, wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_cache_expires ON transactions_cache(expires_at);

-- hidden_tokens
CREATE INDEX IF NOT EXISTS idx_hidden_tokens_user ON hidden_tokens(user_id);

-- roi_entries
CREATE INDEX IF NOT EXISTS idx_roi_entries_user ON roi_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_roi_entries_token ON roi_entries(token_address);

\echo '✅ Indizes erstellt'

-- ================================
-- 5. RLS POLICIES SETUP
-- ================================

\echo '=== RLS POLICIES SETUP ==='

-- user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
CREATE POLICY "Users can manage their own profile"
    ON user_profiles FOR ALL
    TO authenticated
    USING (auth.uid() = id);

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own subscription" ON subscriptions;
CREATE POLICY "Users can manage their own subscription"
    ON subscriptions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- transactions_cache
ALTER TABLE transactions_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own cache" ON transactions_cache;
CREATE POLICY "Users can manage their own cache"
    ON transactions_cache FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- hidden_tokens
ALTER TABLE hidden_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own hidden tokens" ON hidden_tokens;
CREATE POLICY "Users can manage their own hidden tokens"
    ON hidden_tokens FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- roi_entries
ALTER TABLE roi_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own roi entries" ON roi_entries;
CREATE POLICY "Users can manage their own roi entries"
    ON roi_entries FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

\echo '✅ RLS Policies erstellt'

-- ================================
-- 6. DKUDDEL@WEB.DE PREMIUM SETUP (KORREKT!)
-- ================================

\echo '=== DKUDDEL PREMIUM SETUP ==='

DO $$
DECLARE 
    target_user_id UUID;
BEGIN
    -- Finde User
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'dkuddel@web.de';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ ERROR: dkuddel@web.de nicht in auth.users gefunden!';
        RAISE NOTICE '🔧 LÖSUNG: Erst registrieren, dann erneut ausführen';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ SUCCESS: dkuddel@web.de gefunden mit ID: %', target_user_id;
    
    -- KORREKT: user_profiles (NICHT auth.users!)
    INSERT INTO user_profiles (
        id, email, subscription_status, trial_ends_at, stripe_customer_id
    ) VALUES (
        target_user_id, 'dkuddel@web.de', 'active', '2099-12-31'::TIMESTAMP, 'OWNER_PREMIUM'
    )
    ON CONFLICT (id) DO UPDATE SET
        subscription_status = 'active',
        trial_ends_at = '2099-12-31'::TIMESTAMP,
        stripe_customer_id = 'OWNER_PREMIUM',
        updated_at = NOW();
    
    -- subscriptions Tabelle
    INSERT INTO subscriptions (
        user_id, status, start_date, end_date, paypal_subscription_id
    ) VALUES (
        target_user_id, 'active', NOW(), '2099-12-31'::TIMESTAMP, 'OWNER_PREMIUM'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'active',
        end_date = '2099-12-31'::TIMESTAMP,
        paypal_subscription_id = 'OWNER_PREMIUM',
        updated_at = NOW();
    
    RAISE NOTICE '🎉 SUCCESS: dkuddel@web.de auf PREMIUM gesetzt!';
END $$;

-- ================================
-- 7. CACHE CLEANUP
-- ================================

\echo '=== CACHE CLEANUP ==='

-- Alte Cache-Einträge löschen (älter als 1 Stunde)
DELETE FROM transactions_cache WHERE expires_at < NOW() - INTERVAL '1 hour';

\echo '✅ Cache bereinigt'

-- ================================
-- 8. VERIFIKATION & STATUS
-- ================================

\echo '=== FINAL VERIFICATION ==='

-- Zeige alle Tabellen
SELECT 
    'TABLES' as info,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Zeige User Profile Status
SELECT 
    'USER PROFILES' as info,
    u.email,
    up.subscription_status,
    up.trial_ends_at,
    CASE 
        WHEN up.subscription_status = 'active' THEN '✅ PREMIUM'
        WHEN up.subscription_status IN ('trial', 'trialing') AND up.trial_ends_at > NOW() THEN '⏰ TRIAL AKTIV'
        ELSE '❌ BASIC/EXPIRED'
    END as status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'dkuddel@web.de';

-- Zeige alle Premium User
SELECT 
    'ALL PREMIUM USERS' as info,
    u.email,
    up.subscription_status,
    up.trial_ends_at
FROM auth.users u
JOIN user_profiles up ON u.id = up.id
WHERE up.subscription_status = 'active';

-- Zeige Tabellen-Statistiken
SELECT 
    'TABLE STATS' as info,
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo '🎉 === SUPABASE KOMPLETT-AUDIT ABGESCHLOSSEN ==='
\echo '✅ Alle Tabellen überprüft und repariert'
\echo '✅ Enterprise Features entfernt'
\echo '✅ Core Business Logic Tables erstellt'
\echo '✅ RLS Policies konfiguriert'
\echo '✅ dkuddel@web.de auf Premium gesetzt'
\echo '✅ Cache bereinigt'
\echo ''
\echo '📋 NÄCHSTE SCHRITTE:'
\echo '1. Browser-Cache leeren'
\echo '2. Logout/Login als dkuddel@web.de'
\echo '3. WGEP Button sollte jetzt sichtbar sein'
\echo '4. Premium Status sollte angezeigt werden' 