-- 🔧 SPALTEN FIXEN - Fügt fehlende Spalten hinzu

-- 1. ZEIGE AKTUELLE SPALTEN DER TABELLE
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. FÜGE FEHLENDE SPALTEN HINZU (falls sie nicht existieren)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- 3. JETZT PREMIUM SETZEN (mit existierenden Spalten)
UPDATE user_profiles 
SET subscription_tier = 'premium',
    subscription_status = 'active'
WHERE email = 'dkuddel@web.de';

-- 4. FALLS KEIN USER MIT DIESER EMAIL EXISTIERT, FÜGE IHN HINZU
INSERT INTO user_profiles (email, subscription_tier, subscription_status)
SELECT 'dkuddel@web.de', 'premium', 'active'
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE email = 'dkuddel@web.de'
);

-- 5. ZEIGE ERGEBNIS
SELECT * FROM user_profiles WHERE email = 'dkuddel@web.de'; 