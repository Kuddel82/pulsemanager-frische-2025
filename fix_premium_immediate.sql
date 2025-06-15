-- 🚨 PREMIUM FIX für dkuddel@web.de - SOFORTIGE REPARATUR
-- Setzt Premium Status in BEIDEN relevanten Tabellen

-- 1. user_profiles Tabelle (Stripe/Trial System)
INSERT INTO user_profiles (id, subscription_status, trial_ends_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'dkuddel@web.de'),
  'active',
  '2099-12-31T23:59:59Z',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  subscription_status = 'active',
  trial_ends_at = '2099-12-31T23:59:59Z',
  updated_at = NOW();

-- 2. subscriptions Tabelle (PayPal System)
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

-- 3. VERIFICATION: Zeige finale Status
SELECT 
  'user_profiles' as table_name,
  u.email,
  up.subscription_status,
  up.trial_ends_at,
  CASE 
    WHEN up.subscription_status = 'active' THEN 'PREMIUM ACTIVE ✅'
    ELSE 'NOT PREMIUM ❌'
  END as final_status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'dkuddel@web.de'

UNION ALL

SELECT 
  'subscriptions' as table_name,
  u.email,
  s.status,
  s.end_date,
  CASE 
    WHEN s.status = 'active' AND s.end_date > NOW() THEN 'PREMIUM ACTIVE ✅'
    ELSE 'NOT PREMIUM ❌'
  END as final_status
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.email = 'dkuddel@web.de'; 