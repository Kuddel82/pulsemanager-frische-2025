-- 🔥 100% SICHERE LÖSUNG - Erstellt Tabelle falls nötig

-- 1. ERSTELLE TABELLE FALLS SIE NICHT EXISTIERT
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. FÜGE USER HINZU ODER UPDATE IHN
INSERT INTO user_profiles (email, subscription_tier, subscription_status)
VALUES ('dkuddel@web.de', 'premium', 'active')
ON CONFLICT (email) 
DO UPDATE SET 
    subscription_tier = 'premium',
    subscription_status = 'active';

-- 3. ZEIGE ERGEBNIS
SELECT * FROM user_profiles WHERE email = 'dkuddel@web.de'; 