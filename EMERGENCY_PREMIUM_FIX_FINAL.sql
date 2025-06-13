-- 🚨 EMERGENCY: FINAL PREMIUM FIX für dkuddel@web.de
-- SOFORT in Supabase SQL Editor ausführen!

-- 1. PRÜFE AKTUELLEN STATUS
SELECT 
  'BEFORE UPDATE' as status,
  auth.users.email,
  user_profiles.subscription_status,
  user_profiles.trial_start_date,
  user_profiles.created_at
FROM auth.users 
LEFT JOIN user_profiles ON auth.users.id = user_profiles.user_id
WHERE auth.users.email = 'dkuddel@web.de';

-- 2. SETZE SOFORT AUF PREMIUM (falls user_profile existiert)
UPDATE user_profiles 
SET 
  subscription_status = 'active',
  trial_start_date = NULL,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'dkuddel@web.de'
);

-- 3. ERSTELLE user_profile falls nicht existiert
INSERT INTO user_profiles (
  user_id, 
  subscription_status, 
  trial_start_date, 
  created_at, 
  updated_at
)
SELECT 
  id, 
  'active', 
  NULL, 
  NOW(), 
  NOW()
FROM auth.users 
WHERE email = 'dkuddel@web.de' 
AND id NOT IN (SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO UPDATE SET
  subscription_status = 'active',
  trial_start_date = NULL,
  updated_at = NOW();

-- 4. VERIFIKATION
SELECT 
  'AFTER UPDATE' as status,
  auth.users.email,
  user_profiles.subscription_status,
  user_profiles.trial_start_date,
  user_profiles.updated_at
FROM auth.users 
LEFT JOIN user_profiles ON auth.users.id = user_profiles.user_id
WHERE auth.users.email = 'dkuddel@web.de';

-- ✅ Nach diesem Script sollte Status = 'active' sein! 