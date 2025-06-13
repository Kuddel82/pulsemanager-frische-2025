-- ✅ COPY THIS COMPLETE CODE INTO SUPABASE SQL EDITOR
-- DO NOT copy the filename, copy THIS content below:

DO $$
DECLARE 
    target_user_id UUID;
    existing_subscription_id UUID;
BEGIN
    -- Schritt 1: Finde User-ID für dkuddel@web.de
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'dkuddel@web.de';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: User dkuddel@web.de not found in auth.users table. Please register first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'SUCCESS: Found user dkuddel@web.de with ID: %', target_user_id;
    
    -- Schritt 2: Update/Insert in user_profiles (Stripe-System)
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
    
    RAISE NOTICE 'SUCCESS: user_profiles.subscription_status = active for dkuddel@web.de';
    
    -- Schritt 3: Update/Insert in subscriptions (PayPal-System)
    SELECT id INTO existing_subscription_id 
    FROM subscriptions 
    WHERE user_id = target_user_id;
    
    IF existing_subscription_id IS NOT NULL THEN
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
    
    RAISE NOTICE '=== PREMIUM SETUP COMPLETE FOR dkuddel@web.de ===';
    
    -- FINAL VERIFICATION QUERIES
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    
    -- Show user_profiles status
    FOR existing_subscription_id IN
        SELECT 
            CASE 
                WHEN up.subscription_status = 'active' THEN 'user_profiles: PREMIUM ACTIVE ✅'
                ELSE 'user_profiles: NOT ACTIVE ❌'
            END as status_info
        FROM auth.users u
        LEFT JOIN user_profiles up ON u.id = up.id
        WHERE u.email = 'dkuddel@web.de'
    LOOP
        RAISE NOTICE '%', existing_subscription_id.status_info;
    END LOOP;
    
    -- Show subscriptions status
    FOR existing_subscription_id IN
        SELECT 
            CASE 
                WHEN s.status = 'active' AND s.end_date > NOW() THEN 'subscriptions: PREMIUM ACTIVE ✅'
                ELSE 'subscriptions: NOT ACTIVE ❌'
            END as status_info
        FROM auth.users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
        WHERE u.email = 'dkuddel@web.de'
    LOOP
        RAISE NOTICE '%', existing_subscription_id.status_info;
    END LOOP;
    
END $$;

-- Separate Verification Query (runs outside DO block)
SELECT 
    'FINAL STATUS' as info,
    u.email,
    up.subscription_status as stripe_status,
    s.status as paypal_status,
    s.end_date,
    CASE 
        WHEN (up.subscription_status = 'active' OR s.status = 'active') AND s.end_date > NOW() 
        THEN 'PREMIUM ACTIVE ✅'
        ELSE 'NOT PREMIUM ❌'
    END as final_status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.email = 'dkuddel@web.de'; 