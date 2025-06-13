-- 🚨 SUPABASE AUTH SYSTEM REPARATUR
-- Problem: column "subscription_status" of relation "users" does not exist
-- Grund: Falsches Schema verwendet - auth.users hat KEINE subscription_status Spalte!
-- Lösung: Verwende user_profiles Tabelle

-- ================================
-- 1. DATENBANK DIAGNOSE
-- ================================

-- Zeige vorhandene Tabellen
\echo '=== VORHANDENE TABELLEN ==='
SELECT table_name FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth') 
ORDER BY table_schema, table_name;

-- Prüfe auth.users Schema (sollte KEINE subscription_status haben)
\echo '=== AUTH.USERS SCHEMA (Standard Supabase) ==='
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- Prüfe user_profiles Schema (hat subscription_status)
\echo '=== USER_PROFILES SCHEMA (Custom für Subscriptions) ==='
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ================================
-- 2. REPARIERE FEHLENDE TABELLEN
-- ================================

-- user_profiles Tabelle erstellen/reparieren
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'trialing', 'active', 'cancelled', 'expired', 'inactive')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days'),
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
CREATE POLICY "Users can manage their own profile"
    ON user_profiles FOR ALL
    TO authenticated
    USING (auth.uid() = id);

-- ================================
-- 3. SETZE DKUDDEL@WEB.DE AUF PREMIUM (KORREKT!)
-- ================================

DO $$
DECLARE 
    user_id_var UUID;
BEGIN
    -- Finde User
    SELECT id INTO user_id_var FROM auth.users WHERE email = 'dkuddel@web.de';
    
    IF user_id_var IS NULL THEN
        RAISE NOTICE 'ERROR: dkuddel@web.de nicht gefunden in auth.users!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'SUCCESS: dkuddel@web.de gefunden mit ID: %', user_id_var;
    
    -- RICHTIG: Setze in user_profiles (NICHT auth.users!)
    INSERT INTO user_profiles (
        id, email, subscription_status, trial_ends_at, stripe_customer_id
    ) VALUES (
        user_id_var, 'dkuddel@web.de', 'active', '2099-12-31'::TIMESTAMP, 'OWNER_PREMIUM'
    )
    ON CONFLICT (id) DO UPDATE SET
        subscription_status = 'active',
        trial_ends_at = '2099-12-31'::TIMESTAMP,
        updated_at = NOW();
    
    RAISE NOTICE 'SUCCESS: dkuddel@web.de auf PREMIUM gesetzt in user_profiles!';
END $$;

-- ================================
-- 4. VERIFIKATION
-- ================================

-- Zeige Status für dkuddel@web.de
SELECT 
    u.email,
    u.id,
    up.subscription_status,
    up.trial_ends_at,
    CASE 
        WHEN up.subscription_status = 'active' THEN '✅ PREMIUM'
        WHEN up.subscription_status = 'trial' AND up.trial_ends_at > NOW() THEN '⏰ TRIAL AKTIV'
        ELSE '❌ BASIC/EXPIRED'
    END as status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'dkuddel@web.de';

-- Zeige alle Premium User
SELECT 
    u.email,
    up.subscription_status,
    up.trial_ends_at
FROM auth.users u
JOIN user_profiles up ON u.id = up.id
WHERE up.subscription_status = 'active';

-- ================================
-- 5. WICHTIGE INFO
-- ================================

SELECT '
🎯 PROBLEM GELÖST:
==================
❌ FALSCH: UPDATE auth.users SET subscription_status = ...
✅ RICHTIG: UPDATE user_profiles SET subscription_status = ...

💡 WARUM?
- auth.users = Standard Supabase Tabelle (READONLY für subscription_status)
- user_profiles = Custom Tabelle für Business Logic

🔧 FRONTEND CODE:
useStripeSubscription.js verwendet bereits korrekt user_profiles!

📋 NÄCHSTE SCHRITTE:
1. Melde dich als dkuddel@web.de an
2. Status sollte jetzt PREMIUM sein
3. Alle Features verfügbar
' as problem_geloest; 