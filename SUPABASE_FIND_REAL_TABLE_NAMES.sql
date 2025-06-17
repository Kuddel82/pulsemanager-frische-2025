-- =============================================================================
-- 🔍 FIND REAL TABLE NAMES IN SUPABASE
-- =============================================================================

-- 1. Alle Tabellen im public Schema anzeigen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Suche nach Tabellen die 'wallet' enthalten könnten
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name ILIKE '%wallet%' OR 
    table_name ILIKE '%brief%' OR
    table_name ILIKE '%purse%' OR
    table_name ILIKE '%address%'
)
ORDER BY table_name;

-- 3. Suche nach user_id Spalten (um verwandte Tabellen zu finden)
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'user_id'
ORDER BY table_name;

-- 4. Zeige Struktur aller Tabellen mit user_id
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
AND t.table_name IN (
    SELECT DISTINCT table_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND column_name = 'user_id'
)
ORDER BY t.table_name, c.ordinal_position; 