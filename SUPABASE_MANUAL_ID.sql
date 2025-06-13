-- 🎯 MANUAL ID - Setzt ID explizit

-- 1. PRÜFE HÖCHSTE ID
SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM user_profiles;

-- 2. UPDATE FALLS USER EXISTIERT
UPDATE user_profiles 
SET subscription_tier = 'premium',
    subscription_status = 'active'
WHERE email = 'dkuddel@web.de';

-- 3. INSERT FALLS USER NICHT EXISTIERT (mit expliziter ID)
INSERT INTO user_profiles (id, email, subscription_tier, subscription_status)
SELECT 
    COALESCE((SELECT MAX(id) FROM user_profiles), 0) + 1,
    'dkuddel@web.de', 
    'premium', 
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE email = 'dkuddel@web.de'
);

-- 4. ZEIGE ERGEBNIS
SELECT * FROM user_profiles WHERE email = 'dkuddel@web.de'; 