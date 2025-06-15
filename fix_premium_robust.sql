-- 🚨 ROBUSTE PREMIUM REPARATUR für dkuddel@web.de
-- Erstellt fehlende Tabellen und setzt dann Premium Status

-- ================================
-- 1. ERSTELLE FEHLENDE TABELLEN
-- ================================

-- subscriptions Tabelle erstellen (falls nicht vorhanden)
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

-- user_profiles Tabelle erstellen (falls nicht vorhanden)
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

-- ================================
-- 2. SETZE PREMIUM STATUS für dkuddel@web.de
-- ================================

-- 2.1 user_profiles Tabelle (Stripe/Trial System)
INSERT INTO user_profiles (id, email, subscription_status, trial_ends_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'dkuddel@web.de'),
  'dkuddel@web.de',
  'active',
  '2099-12-31T23:59:59Z',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  subscription_status = 'active',
  trial_ends_at = '2099-12-31T23:59:59Z',
  updated_at = NOW();

-- 2.2 subscriptions Tabelle (PayPal System)
INSERT INTO subscriptions (
  user_id,
  status,
  start_date,
  end_date,
  paypal_subscription_id,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'dkuddel@web.de'),
  'active',
  NOW(),
  '2099-12-31T23:59:59Z',
  'MANUAL_UNLIMITED_dkuddel',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  status = 'active',
  end_date = '2099-12-31T23:59:59Z',
  updated_at = NOW();

-- ================================
-- 3. VERIFICATION: Zeige finale Status
-- ================================

-- Prüfe User ID
SELECT 
  'USER ID CHECK' as info,
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'dkuddel@web.de';

-- Prüfe user_profiles Status
SELECT 
  'user_profiles' as table_name,
  u.email,
  up.subscription_status,
  up.trial_ends_at,
  CASE 
    WHEN up.subscription_status = 'active' THEN '✅ PREMIUM ACTIVE'
    ELSE '❌ NOT PREMIUM'
  END as final_status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'dkuddel@web.de';

-- Prüfe subscriptions Status  
SELECT 
  'subscriptions' as table_name,
  u.email,
  s.status,
  s.end_date,
  s.paypal_subscription_id,
  CASE 
    WHEN s.status = 'active' AND s.end_date > NOW() THEN '✅ PREMIUM ACTIVE'
    ELSE '❌ NOT PREMIUM'
  END as final_status
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.email = 'dkuddel@web.de';

-- Zeige alle Premium-User zur Bestätigung
SELECT 
  'ALL PREMIUM USERS' as info,
  u.email,
  'user_profiles' as source,
  up.subscription_status
FROM auth.users u
JOIN user_profiles up ON u.id = up.id
WHERE up.subscription_status = 'active'

UNION ALL

SELECT 
  'ALL PREMIUM USERS' as info,
  u.email,
  'subscriptions' as source,
  s.status
FROM auth.users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active' AND s.end_date > NOW()
ORDER BY email; 