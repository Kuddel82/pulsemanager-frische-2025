-- 🎯 UUID FIX - Arbeitet mit UUID IDs

-- 1. ZEIGE TABELLENSTRUKTUR (inklusive UUID)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. AKTIVIERE UUID EXTENSION (falls nicht aktiv)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. SETZE DEFAULT UUID FÜR ID SPALTE (falls nicht gesetzt)
ALTER TABLE user_profiles 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 4. UPDATE FALLS USER BEREITS EXISTIERT
UPDATE user_profiles 
SET subscription_tier = 'premium',
    subscription_status = 'active'
WHERE email = 'dkuddel@web.de';

-- 5. INSERT FALLS USER NICHT EXISTIERT (UUID wird automatisch generiert)
INSERT INTO user_profiles (email, subscription_tier, subscription_status)
SELECT 'dkuddel@web.de', 'premium', 'active'
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE email = 'dkuddel@web.de'
);

-- 6. ZEIGE ERGEBNIS
SELECT * FROM user_profiles WHERE email = 'dkuddel@web.de'; 