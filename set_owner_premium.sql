-- 🎉 SET OWNER TO PERMANENT PREMIUM
-- Execute this in Supabase SQL Editor to give dkuddel@web.de permanent premium access

-- First, find the user ID for dkuddel@web.de
DO $$
DECLARE
    owner_user_id UUID;
BEGIN
    -- Get user ID for dkuddel@web.de
    SELECT id INTO owner_user_id 
    FROM auth.users 
    WHERE email = 'dkuddel@web.de';
    
    IF owner_user_id IS NULL THEN
        RAISE NOTICE 'User dkuddel@web.de not found in auth.users';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user ID: %', owner_user_id;
    
    -- ✅ METHOD 1: Update subscriptions table (if exists)
    BEGIN
        INSERT INTO subscriptions (
            user_id, 
            status, 
            start_date, 
            end_date,
            paypal_subscription_id
        ) VALUES (
            owner_user_id,
            'active',
            NOW(),
            NOW() + INTERVAL '100 years', -- Permanent until 2124
            'OWNER_PERMANENT_PREMIUM'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            status = 'active',
            end_date = NOW() + INTERVAL '100 years',
            updated_at = NOW(),
            paypal_subscription_id = 'OWNER_PERMANENT_PREMIUM';
            
        RAISE NOTICE '✅ Subscriptions table updated successfully';
    EXCEPTION 
        WHEN others THEN
            RAISE NOTICE '❌ Subscriptions table not found or error: %', SQLERRM;
    END;
    
    -- ✅ METHOD 2: Update user_profiles table (if exists)
    BEGIN
        -- Create user_profiles table if it doesn't exist
        CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            subscription_status TEXT DEFAULT 'trialing',
            trial_ends_at TIMESTAMP WITH TIME ZONE,
            stripe_customer_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policy if not exists
        DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
        CREATE POLICY "Users can view their own profile"
            ON user_profiles FOR ALL
            TO authenticated
            USING (auth.uid() = id);
            
        -- Insert or update owner profile
        INSERT INTO user_profiles (
            id,
            subscription_status,
            trial_ends_at,
            stripe_customer_id
        ) VALUES (
            owner_user_id,
            'active',
            NOW() + INTERVAL '100 years',
            'OWNER_PERMANENT_PREMIUM'
        )
        ON CONFLICT (id) DO UPDATE SET
            subscription_status = 'active',
            trial_ends_at = NOW() + INTERVAL '100 years',
            stripe_customer_id = 'OWNER_PERMANENT_PREMIUM',
            updated_at = NOW();
            
        RAISE NOTICE '✅ User_profiles table updated successfully';
    EXCEPTION 
        WHEN others THEN
            RAISE NOTICE '❌ User_profiles error: %', SQLERRM;
    END;
    
    -- ✅ METHOD 3: Update auth.users metadata
    BEGIN
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            '{"subscription_status": "active", "premium": true, "owner": true}'::jsonb
        WHERE id = owner_user_id;
        
        RAISE NOTICE '✅ Auth.users metadata updated successfully';
    EXCEPTION 
        WHEN others THEN
            RAISE NOTICE '❌ Auth.users metadata error: %', SQLERRM;
    END;
    
    RAISE NOTICE '🎉 OWNER dkuddel@web.de set to PERMANENT PREMIUM!';
END $$; 