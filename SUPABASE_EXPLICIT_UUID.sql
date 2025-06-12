-- 🔥 EXPLICIT UUID - Kann NICHT fehlschlagen!

-- 1. AKTIVIERE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. UPDATE FALLS USER EXISTIERT
UPDATE user_profiles 
SET subscription_tier = 'premium',
    subscription_status = 'active'
WHERE email = 'dkuddel@web.de';

-- 3. INSERT FALLS USER NICHT EXISTIERT (mit expliziter UUID)
INSERT INTO user_profiles (id, email, subscription_tier, subscription_status)
SELECT 
    uuid_generate_v4(),
    'dkuddel@web.de', 
    'premium', 
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE email = 'dkuddel@web.de'
);

-- 4. ZEIGE ERGEBNIS
SELECT * FROM user_profiles WHERE email = 'dkuddel@web.de'; 