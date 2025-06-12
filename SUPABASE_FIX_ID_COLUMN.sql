-- 🔧 ID SPALTE FIXEN - Auto-Increment für id

-- 1. ZEIGE AKTUELLE TABELLENSTRUKTUR
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. ERSTELLE SEQUENCE FÜR AUTO-INCREMENT (falls nicht existiert)
CREATE SEQUENCE IF NOT EXISTS user_profiles_id_seq;

-- 3. SETZE DEFAULT WERT FÜR ID SPALTE
ALTER TABLE user_profiles 
ALTER COLUMN id SET DEFAULT nextval('user_profiles_id_seq');

-- 4. VERKNÜPFE SEQUENCE MIT TABELLE
ALTER SEQUENCE user_profiles_id_seq OWNED BY user_profiles.id;

-- 5. SETZE SEQUENCE AUF HÖCHSTEN WERT (falls schon Daten vorhanden)
SELECT setval('user_profiles_id_seq', COALESCE((SELECT MAX(id) FROM user_profiles), 0) + 1, false);

-- 6. JETZT PREMIUM SETZEN (ohne id zu spezifizieren)
UPDATE user_profiles 
SET subscription_tier = 'premium',
    subscription_status = 'active'
WHERE email = 'dkuddel@web.de';

-- 7. FALLS USER NICHT EXISTIERT, FÜGE IHN HINZU (id wird automatisch gesetzt)
INSERT INTO user_profiles (email, subscription_tier, subscription_status)
SELECT 'dkuddel@web.de', 'premium', 'active'
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE email = 'dkuddel@web.de'
);

-- 8. ZEIGE ERGEBNIS
SELECT * FROM user_profiles WHERE email = 'dkuddel@web.de'; 