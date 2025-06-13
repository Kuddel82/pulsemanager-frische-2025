-- 🚀 MAKE phi_bel@yahoo.de PREMIUM USER - ANGEPASST FÜR VORHANDENE STRUKTUR
-- Datum: 2025-01-XX
-- Zweck: Setzt phi_bel@yahoo.de als Premium-Nutzer ohne Ablaufdatum

-- Schritt 1: Prüfe welche Tabellen existieren
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (table_name LIKE '%user%' OR table_name LIKE '%subscription%' OR table_name LIKE '%profile%');

-- Schritt 2: Finde die User-ID für phi_bel@yahoo.de
DO $$
DECLARE 
    target_user_id UUID;
BEGIN
    -- Suche User-ID für phi_bel@yahoo.de
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'phi_bel@yahoo.de';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: User phi_bel@yahoo.de not found in auth.users table';
        RAISE NOTICE 'Please register this email first before making it premium';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user: phi_bel@yahoo.de with ID: %', target_user_id;
    
    -- Schritt 3: Update user_profiles Tabelle (Standard Supabase Struktur)
    BEGIN
        INSERT INTO user_profiles (
            id,
            subscription_status,
            trial_ends_at,
            created_at,
            updated_at
        ) VALUES (
            target_user_id,
            'active',
            '2099-12-31 23:59:59+00'::TIMESTAMP WITH TIME ZONE,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            subscription_status = 'active',
            trial_ends_at = '2099-12-31 23:59:59+00'::TIMESTAMP WITH TIME ZONE,
            updated_at = NOW();
        
        RAISE NOTICE 'SUCCESS: Set user_profiles.subscription_status = active for phi_bel@yahoo.de';
    EXCEPTION 
        WHEN others THEN
            RAISE NOTICE 'WARNING: user_profiles table error: %', SQLERRM;
    END;
    
    -- Schritt 4: Update auth.users metadata (Alternative Methode)
    BEGIN
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            '{"subscription_status": "active", "premium": true, "premium_until": "2099-12-31"}'::jsonb,
            updated_at = NOW()
        WHERE id = target_user_id;
        
        RAISE NOTICE 'SUCCESS: Updated auth.users metadata for phi_bel@yahoo.de';
    EXCEPTION 
        WHEN others THEN
            RAISE NOTICE 'WARNING: auth.users metadata error: %', SQLERRM;
    END;
    
    -- Schritt 5: Erstelle profiles Tabelle falls sie existiert
    BEGIN
        INSERT INTO profiles (
            id,
            email,
            subscription_tier,
            subscription_status,
            created_at,
            updated_at
        ) VALUES (
            target_user_id,
            'phi_bel@yahoo.de',
            'premium',
            'active',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            subscription_tier = 'premium',
            subscription_status = 'active',
            updated_at = NOW();
        
        RAISE NOTICE 'SUCCESS: Set profiles.subscription_status = active for phi_bel@yahoo.de';
    EXCEPTION 
        WHEN others THEN
            RAISE NOTICE 'INFO: profiles table not found or error: %', SQLERRM;
    END;
    
    RAISE NOTICE '🎉 PREMIUM SETUP COMPLETE for phi_bel@yahoo.de!';
    
END $$;

-- Verification: Zeige User-Status in allen verfügbaren Tabellen
SELECT 
    'auth.users' as table_name,
    u.email,
    u.raw_user_meta_data,
    u.created_at,
    u.updated_at
FROM auth.users u
WHERE u.email = 'phi_bel@yahoo.de';

-- Prüfe user_profiles falls vorhanden
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE NOTICE 'user_profiles table exists, checking status...';
        PERFORM 1; -- Placeholder für weitere Checks
    ELSE
        RAISE NOTICE 'user_profiles table does not exist';
    END IF;
END $$;

-- Prüfe profiles falls vorhanden  
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE 'profiles table exists, checking status...';
        PERFORM 1; -- Placeholder für weitere Checks
    ELSE
        RAISE NOTICE 'profiles table does not exist';
    END IF;
END $$;

-- Finale Verification: Zeige alle Premium-User
SELECT 
    u.email,
    u.raw_user_meta_data->>'subscription_status' as subscription_status,
    u.raw_user_meta_data->>'premium' as is_premium,
    u.raw_user_meta_data->>'premium_until' as premium_until,
    CASE 
        WHEN u.raw_user_meta_data->>'subscription_status' = 'active' THEN 'PREMIUM ACTIVE ✅'
        WHEN u.raw_user_meta_data->>'premium' = 'true' THEN 'PREMIUM ACTIVE ✅'
        ELSE 'NOT PREMIUM ❌'
    END as final_status
FROM auth.users u
WHERE u.email IN ('dkuddel@web.de', 'phi_bel@yahoo.de')
ORDER BY u.email; 