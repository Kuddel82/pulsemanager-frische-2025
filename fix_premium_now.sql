-- 🚨 PREMIUM FIX für dkuddel@web.de
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
