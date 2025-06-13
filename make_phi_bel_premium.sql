-- 🚀 MAKE phi_bel@yahoo.de PREMIUM USER FOR UNLIMITED TIME
-- Datum: 2025-01-XX
-- Zweck: Setzt phi_bel@yahoo.de als Premium-Nutzer ohne Ablaufdatum

-- Schritt 1: Finde die User-ID für phi_bel@yahoo.de
DO $$
DECLARE 
    target_user_id UUID;
    existing_subscription_id UUID;
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
    
    -- Prüfe ob bereits eine Subscription existiert
    SELECT id INTO existing_subscription_id 
    FROM subscriptions 
    WHERE user_id = target_user_id;
    
    IF existing_subscription_id IS NOT NULL THEN
        -- Update bestehende Subscription
        UPDATE subscriptions 
        SET 
            status = 'active',
            start_date = NOW(),
            end_date = '2099-12-31 23:59:59+00'::TIMESTAMP WITH TIME ZONE, -- Quasi unendlich
            paypal_subscription_id = 'MANUAL_PREMIUM_UNLIMITED',
            updated_at = NOW()
        WHERE user_id = target_user_id;
        
        RAISE NOTICE 'SUCCESS: Updated existing subscription for phi_bel@yahoo.de';
        RAISE NOTICE 'Status: active, End Date: 2099-12-31 (unlimited)';
    ELSE
        -- Erstelle neue Subscription
        INSERT INTO subscriptions (
            user_id,
            status,
            start_date,
            end_date,
            paypal_subscription_id,
            created_at,
            updated_at
        ) VALUES (
            target_user_id,
            'active',
            NOW(),
            '2099-12-31 23:59:59+00'::TIMESTAMP WITH TIME ZONE, -- Quasi unendlich
            'MANUAL_PREMIUM_UNLIMITED',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'SUCCESS: Created new premium subscription for phi_bel@yahoo.de';
        RAISE NOTICE 'Status: active, End Date: 2099-12-31 (unlimited)';
    END IF;
    
    -- Update user_profiles Tabelle (falls vorhanden)
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
            RAISE NOTICE 'WARNING: user_profiles table not found or error: %', SQLERRM;
    END;
    
    -- Verification: Zeige finale Subscription
    RAISE NOTICE '--- FINAL SUBSCRIPTION STATUS ---';
    FOR existing_subscription_id IN
        SELECT s.id
        FROM subscriptions s
        JOIN auth.users u ON s.user_id = u.id
        WHERE u.email = 'phi_bel@yahoo.de'
    LOOP
        RAISE NOTICE 'Subscription ID: %', existing_subscription_id;
    END LOOP;
    
END $$;

-- Verification Query: Zeige alle Subscriptions für phi_bel@yahoo.de
SELECT 
    u.email,
    s.status,
    s.start_date,
    s.end_date,
    s.paypal_subscription_id,
    CASE 
        WHEN s.end_date > NOW() THEN 'ACTIVE/VALID'
        ELSE 'EXPIRED'
    END as subscription_validity,
    EXTRACT(DAYS FROM (s.end_date - NOW())) as days_remaining
FROM auth.users u
JOIN subscriptions s ON u.id = s.user_id
WHERE u.email = 'phi_bel@yahoo.de';

-- Zusätzliche Info: Alle Premium-User anzeigen
SELECT 
    u.email,
    s.status,
    s.end_date,
    CASE 
        WHEN s.end_date > NOW() THEN 'PREMIUM ACTIVE'
        ELSE 'EXPIRED'
    END as premium_status
FROM auth.users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active' AND s.end_date > NOW()
ORDER BY s.end_date DESC; 