-- 🚀 COMPLETE PREMIUM SETUP FOR dkuddel@web.de
-- Setzt Premium-Status in ALLEN relevanten Tabellen
-- Datum: 2025-01-XX

-- Schritt 1: user_profiles Tabelle (für Stripe-System)
DO $$
DECLARE 
    target_user_id UUID;
BEGIN
    -- Suche User-ID für dkuddel@web.de
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'dkuddel@web.de';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: User dkuddel@web.de not found in auth.users table';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user: dkuddel@web.de with ID: %', target_user_id;
    
    -- Update/Insert in user_profiles (Stripe-System)
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
    
    RAISE NOTICE 'SUCCESS: Set user_profiles.subscription_status = active for dkuddel@web.de';
    
END $$;

-- Schritt 2: subscriptions Tabelle (für PayPal-System) 
DO $$
DECLARE 
    target_user_id UUID;
    existing_subscription_id UUID;
BEGIN
    -- Suche User-ID für dkuddel@web.de
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'dkuddel@web.de';
    
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
            end_date = '2099-12-31 23:59:59+00'::TIMESTAMP WITH TIME ZONE,
            paypal_subscription_id = 'MANUAL_PREMIUM_UNLIMITED',
            updated_at = NOW()
        WHERE user_id = target_user_id;
        
        RAISE NOTICE 'SUCCESS: Updated existing subscription in subscriptions table';
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
            '2099-12-31 23:59:59+00'::TIMESTAMP WITH TIME ZONE,
            'MANUAL_PREMIUM_UNLIMITED',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'SUCCESS: Created new subscription in subscriptions table';
    END IF;
    
END $$;

-- VERIFICATION: Zeige finale Status in beiden Tabellen
RAISE NOTICE '=== FINAL VERIFICATION ===';

-- user_profiles Status
SELECT 
    'user_profiles' as table_name,
    u.email,
    up.subscription_status,
    up.trial_ends_at,
    CASE 
        WHEN up.subscription_status = 'active' THEN 'PREMIUM ACTIVE'
        WHEN up.trial_ends_at > NOW() THEN 'TRIAL ACTIVE'
        ELSE 'EXPIRED'
    END as status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'dkuddel@web.de';

-- subscriptions Status  
SELECT 
    'subscriptions' as table_name,
    u.email,
    s.status,
    s.start_date,
    s.end_date,
    s.paypal_subscription_id,
    CASE 
        WHEN s.status = 'active' AND s.end_date > NOW() THEN 'PREMIUM ACTIVE'
        ELSE 'EXPIRED'
    END as status
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.email = 'dkuddel@web.de';

-- Alle aktiven Premium-User
SELECT 
    u.email,
    'user_profiles' as source,
    up.subscription_status,
    up.trial_ends_at
FROM auth.users u
JOIN user_profiles up ON u.id = up.id
WHERE up.subscription_status = 'active'

UNION ALL

SELECT 
    u.email,
    'subscriptions' as source,
    s.status,
    s.end_date
FROM auth.users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active' AND s.end_date > NOW()
ORDER BY email; 