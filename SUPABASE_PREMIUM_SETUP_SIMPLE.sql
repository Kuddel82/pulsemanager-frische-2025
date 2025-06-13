-- 🎯 SIMPLIFIED PREMIUM SETUP - Nur user_profiles Tabelle
-- Funktioniert auch ohne subscriptions-Tabelle

DO $$
DECLARE
    target_email text := 'dkuddel@web.de';
    target_user_id uuid;
    existing_profile_count integer;
BEGIN
    -- Suche User ID anhand der Email
    SELECT auth.users.id INTO target_user_id 
    FROM auth.users 
    WHERE auth.users.email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: User mit Email % nicht gefunden', target_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'User gefunden: % (ID: %)', target_email, target_user_id;
    
    -- Prüfe ob Profile bereits existiert
    SELECT COUNT(*) INTO existing_profile_count 
    FROM user_profiles 
    WHERE user_id = target_user_id;
    
    IF existing_profile_count = 0 THEN
        -- Erstelle neues Premium Profile
        INSERT INTO user_profiles (
            user_id,
            email,
            subscription_tier,
            subscription_status,
            subscription_start_date,
            subscription_end_date,
            api_calls_limit,
            api_calls_used,
            features_enabled,
            created_at,
            updated_at
        ) VALUES (
            target_user_id,
            target_email,
            'premium',
            'active',
            NOW(),
            NOW() + INTERVAL '10 years',
            999999,
            0,
            '["portfolio_tracking", "tax_reports", "roi_analysis", "premium_apis", "unlimited_wallets", "export_data", "priority_support"]'::jsonb,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'SUCCESS: Neues Premium Profile erstellt für %', target_email;
    ELSE
        -- Update bestehendes Profile zu Premium
        UPDATE user_profiles SET
            subscription_tier = 'premium',
            subscription_status = 'active',
            subscription_start_date = NOW(),
            subscription_end_date = NOW() + INTERVAL '10 years',
            api_calls_limit = 999999,
            api_calls_used = 0,
            features_enabled = '["portfolio_tracking", "tax_reports", "roi_analysis", "premium_apis", "unlimited_wallets", "export_data", "priority_support"]'::jsonb,
            updated_at = NOW()
        WHERE user_id = target_user_id;
        
        RAISE NOTICE 'SUCCESS: Bestehendes Profile zu Premium upgegradet für %', target_email;
    END IF;
    
    -- Zeige finales Ergebnis
    RAISE NOTICE '=== PREMIUM SETUP COMPLETED ===';
    RAISE NOTICE 'User: %', target_email;
    RAISE NOTICE 'Status: Premium aktiv für 10 Jahre';
    RAISE NOTICE 'API Limit: 999,999 (unbegrenzt)';
    RAISE NOTICE 'Features: Alle Premium Features aktiviert';
    
END $$; 