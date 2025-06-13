-- 🚨 SUPABASE DATENBANK REPARATUR
-- Datum: 08.06.2025
-- Problem: column "subscription_status" of relation "users" does not exist
-- Lösung: Korrekte Tabellen-Struktur verwenden

-- ================================
-- 1. DIAGNOSE: Überprüfe vorhandene Tabellen
-- ================================

-- Zeige alle Tabellen im public Schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Zeige auth.users Struktur (sollte KEINE subscription_status haben)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Überprüfe ob user_profiles Tabelle existiert
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ================================
-- 2. ERSTELLE FEHLENDE TABELLEN FALLS NÖTIG
-- ================================

-- user_profiles Tabelle (Haupttabelle für Subscription-Status)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'trialing', 'active', 'cancelled', 'expired', 'inactive')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days'),
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy erstellen
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
CREATE POLICY "Users can manage their own profile"
    ON user_profiles FOR ALL
    TO authenticated
    USING (auth.uid() = id);

-- subscriptions Tabelle (Alternative für PayPal)
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

-- RLS aktivieren
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy erstellen
DROP POLICY IF EXISTS "Users can manage their own subscription" ON subscriptions;
CREATE POLICY "Users can manage their own subscription"
    ON subscriptions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- ================================
-- 3. DKUDDEL@WEB.DE PREMIUM SETZEN (KORREKT)
-- ================================

DO $$
DECLARE 
    target_user_id UUID;
BEGIN
    -- Finde User-ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'dkuddel@web.de';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ ERROR: User dkuddel@web.de not found. Please register first.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ SUCCESS: Found user dkuddel@web.de with ID: %', target_user_id;
    
    -- KORREKTUR: Verwende user_profiles NICHT auth.users!
    INSERT INTO user_profiles (
        id,
        email,
        subscription_status,
        trial_ends_at,
        stripe_customer_id,
        created_at,
        updated_at
    ) VALUES (
        target_user_id,
        'dkuddel@web.de',
        'active',
        '2099-12-31 23:59:59+00'::TIMESTAMP WITH TIME ZONE,
        'OWNER_PERMANENT_PREMIUM',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        subscription_status = 'active',
        trial_ends_at = '2099-12-31 23:59:59+00'::TIMESTAMP WITH TIME ZONE,
        stripe_customer_id = 'OWNER_PERMANENT_PREMIUM',
        updated_at = NOW();
    
    RAISE NOTICE '✅ SUCCESS: user_profiles.subscription_status = active for dkuddel@web.de';
    
    -- Zusätzlich: subscriptions Tabelle
    INSERT INTO subscriptions (
        user_id,
        status,
        start_date,
        end_date,
        paypal_subscription_id
    ) VALUES (
        target_user_id,
        'active',
        NOW(),
        '2099-12-31 23:59:59+00'::TIMESTAMP WITH TIME ZONE,
        'OWNER_PERMANENT_PREMIUM'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'active',
        start_date = NOW(),
        end_date = '2099-12-31 23:59:59+00'::TIMESTAMP WITH TIME ZONE,
        paypal_subscription_id = 'OWNER_PERMANENT_PREMIUM',
        updated_at = NOW();
    
    RAISE NOTICE '✅ SUCCESS: subscriptions.status = active for dkuddel@web.de';
    
END $$;

-- ================================
-- 4. VERIFIKATION: Zeige korrekten Status
-- ================================

-- Zeige alle Daten für dkuddel@web.de
SELECT 
    'auth.users' as table_name,
    u.id,
    u.email,
    u.created_at as auth_created,
    'N/A' as subscription_status,
    'N/A' as trial_ends
FROM auth.users u
WHERE u.email = 'dkuddel@web.de'

UNION ALL

SELECT 
    'user_profiles' as table_name,
    up.id,
    up.email,
    up.created_at,
    up.subscription_status,
    up.trial_ends_at::text as trial_ends
FROM user_profiles up
WHERE up.id = (SELECT id FROM auth.users WHERE email = 'dkuddel@web.de')

UNION ALL

SELECT 
    'subscriptions' as table_name,
    s.user_id as id,
    u.email,
    s.created_at,
    s.status as subscription_status,
    s.end_date::text as trial_ends
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'dkuddel@web.de';

-- Finale Status-Überprüfung
SELECT 
    'FINAL CHECK' as status,
    u.email,
    up.subscription_status as profile_status,
    s.status as subscription_status,
    CASE 
        WHEN up.subscription_status = 'active' OR s.status = 'active' 
        THEN '✅ PREMIUM ACTIVE'
        ELSE '❌ NOT PREMIUM'
    END as final_result
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.email = 'dkuddel@web.de';

-- ================================
-- 5. INFO: Korrekte Verwendung
-- ================================

SELECT '
🎯 WICHTIGE INFO:
================
✅ auth.users        = Standard Supabase Auth (KEINE subscription_status Spalte!)
✅ user_profiles     = Custom Tabelle mit subscription_status
✅ subscriptions     = Alternative Tabelle für PayPal

🚫 NICHT VERWENDEN:
UPDATE auth.users SET subscription_status = ...  ← FEHLER!

✅ KORREKT VERWENDEN:
UPDATE user_profiles SET subscription_status = ... ← RICHTIG!

🔧 Frontend Code verwendet user_profiles Tabelle korrekt.
' as wichtige_hinweise; 