-- 🔍 CHECK USER STATUS: dkuddel@web.de
-- Überprüfe alle relevanten Tabellen für Premium Status

-- 1. AUTH USERS
SELECT 
  id, 
  email, 
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'dkuddel@web.de';

-- 2. USER PROFILES
SELECT 
  id,
  subscription_status,
  trial_ends_at,
  created_at,
  updated_at
FROM user_profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'dkuddel@web.de');

-- 3. SUBSCRIPTIONS TABELLE (falls vorhanden)
SELECT 
  id,
  user_id,
  status,
  current_period_start,
  current_period_end,
  created_at
FROM subscriptions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dkuddel@web.de');

-- 4. ALLE TABELLEN ANZEIGEN
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%user%' OR table_name LIKE '%subscription%' OR table_name LIKE '%premium%';

-- 5. MANUELLE PREMIUM ZUWEISUNG (falls nötig)
INSERT INTO user_profiles (id, subscription_status, trial_ends_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'dkuddel@web.de'),
  'active',
  '2030-12-31T23:59:59Z',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  subscription_status = 'active',
  trial_ends_at = '2030-12-31T23:59:59Z',
  updated_at = NOW();

-- 6. VERIFICATION
SELECT 
  u.email,
  p.subscription_status,
  p.trial_ends_at,
  CASE 
    WHEN p.subscription_status = 'active' THEN 'PREMIUM USER'
    WHEN p.subscription_status = 'trialing' AND p.trial_ends_at > NOW() THEN 'TRIAL ACTIVE'
    WHEN p.subscription_status = 'trialing' AND p.trial_ends_at <= NOW() THEN 'TRIAL EXPIRED'
    ELSE 'BASIC USER'
  END as status_description
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE u.email = 'dkuddel@web.de'; 