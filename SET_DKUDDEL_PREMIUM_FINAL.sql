-- 🎯 DKUDDEL PREMIUM STATUS - FINALE KORREKTUR
-- Datum: 08.06.2025
-- Zweck: dkuddel@web.de auf Premium setzen damit Status korrekt angezeigt wird

BEGIN;

-- 1. Überprüfe aktuellen Status
SELECT 
  id, 
  email, 
  subscription_status, 
  trial_start_date, 
  trial_end_date,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'dkuddel@web.de';

-- 2. Update auf Premium Status
UPDATE auth.users 
SET 
  subscription_status = 'active',
  trial_start_date = NULL,
  trial_end_date = NULL,
  updated_at = NOW()
WHERE email = 'dkuddel@web.de';

-- 3. Verifiziere Update
SELECT 
  id, 
  email, 
  subscription_status, 
  trial_start_date, 
  trial_end_date,
  updated_at
FROM auth.users 
WHERE email = 'dkuddel@web.de';

-- 4. Falls User nicht existiert, erstelle ihn als Premium
INSERT INTO auth.users (
  id,
  email,
  subscription_status,
  trial_start_date,
  trial_end_date,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'dkuddel@web.de',
  'active',
  NULL,
  NULL,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'dkuddel@web.de'
);

COMMIT;

-- 💡 HINWEIS:
-- Dieses SQL-Script muss in der Supabase Console ausgeführt werden
-- um dkuddel@web.de auf Premium Status zu setzen! 