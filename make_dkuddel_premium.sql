-- 🚀 MAKE dkuddel@web.de PREMIUM USER FOR UNLIMITED TIME
-- Datum: 2025-01-XX
-- Zweck: Setzt dkuddel@web.de als Premium-Nutzer ohne Ablaufdatum

-- Schritt 1: Finde die User-ID für dkuddel@web.de
DO $$
DECLARE 
    target_user_id UUID;
    existing_subscription_id UUID;
BEGIN
    -- Suche User-ID für dkuddel@web.de
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'dkuddel@web.de';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: User dkuddel@web.de not found in auth.users table';
        RAISE NOTICE 'Please register this email first before making it premium';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user: dkuddel@web.de with ID: %', target_user_id;
    
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
        
        RAISE NOTICE 'SUCCESS: Updated existing subscription for dkuddel@web.de';
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
        
        RAISE NOTICE 'SUCCESS: Created new premium subscription for dkuddel@web.de';
        RAISE NOTICE 'Status: active, End Date: 2099-12-31 (unlimited)';
    END IF;
    
    -- Verification: Zeige finale Subscription
    RAISE NOTICE '--- FINAL SUBSCRIPTION STATUS ---';
    FOR existing_subscription_id IN
        SELECT s.id
        FROM subscriptions s
        JOIN auth.users u ON s.user_id = u.id
        WHERE u.email = 'dkuddel@web.de'
    LOOP
        RAISE NOTICE 'Subscription ID: %', existing_subscription_id;
    END LOOP;
    
END $$;

-- Verification Query: Zeige alle Subscriptions für dkuddel@web.de
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
WHERE u.email = 'dkuddel@web.de';

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