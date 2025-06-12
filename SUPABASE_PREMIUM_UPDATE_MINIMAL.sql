-- 🎯 MINIMAL PREMIUM UPDATE
-- Funktioniert mit den meisten Tabellenstrukturen

-- OPTION 1: Falls email-Spalte existiert
UPDATE user_profiles 
SET subscription_tier = 'premium'
WHERE email = 'dkuddel@web.de';

-- OPTION 2: Falls nur id-Spalte existiert (ersetze XXX mit der echten ID)
-- UPDATE user_profiles 
-- SET subscription_tier = 'premium'
-- WHERE id = 'DEINE_USER_ID_HIER';

-- OPTION 3: Einfacher INSERT falls Tabelle leer ist
-- INSERT INTO user_profiles (email, subscription_tier) 
-- VALUES ('dkuddel@web.de', 'premium');

-- Zeige Ergebnis
SELECT * FROM user_profiles WHERE email = 'dkuddel@web.de'; 