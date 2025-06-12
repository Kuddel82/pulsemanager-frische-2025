-- 🔍 SUPABASE DATABASE DIAGNOSE
-- Prüft welche Tabellen existieren und zeigt deren Struktur

-- 1. Zeige alle Tabellen im public Schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Prüfe spezifisch nach user_profiles Tabelle
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Prüfe ob subscriptions Tabelle existiert
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'subscriptions'
) AS subscriptions_table_exists;

-- 4. Zeige auth.users Tabelle Info (falls zugänglich)
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 5. Teste ob User dkuddel@web.de existiert
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'dkuddel@web.de'; 