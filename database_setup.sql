-- 🏗️ PULSEMANAGER DATABASE SETUP
-- Vollständige Datenbankstruktur für neue Supabase-Instanz
-- Execute in Supabase SQL Editor: https://supabase.com/dashboard -> SQL Editor

-- ================================
-- 1. CREATE USER_PROFILES TABLE
-- ================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'cancelled', 'expired')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR ALL
    TO authenticated
    USING (auth.uid() = id);

-- ================================
-- 2. CREATE SUBSCRIPTIONS TABLE
-- ================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paypal_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscription"
    ON subscriptions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
    ON subscriptions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ================================
-- 3. CREATE ROI ENTRIES TABLE
-- ================================

CREATE TABLE IF NOT EXISTS roi_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    symbol TEXT,
    quantity DECIMAL(78, 18),
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(78, 18) NOT NULL,
    current_value DECIMAL(78, 18) NOT NULL,
    wallet_address TEXT,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS roi_entries_user_id_idx ON roi_entries(user_id);

-- Enable RLS
ALTER TABLE roi_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own ROI entries"
    ON roi_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ROI entries"
    ON roi_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ================================
-- 4. CREATE SHARED FUNCTIONS
-- ================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 5. SET OWNER TO PERMANENT PREMIUM
-- ================================

DO $$
DECLARE
    owner_user_id UUID;
BEGIN
    -- Get user ID for dkuddel@web.de
    SELECT id INTO owner_user_id 
    FROM auth.users 
    WHERE email = 'dkuddel@web.de';
    
    IF owner_user_id IS NULL THEN
        RAISE NOTICE 'User dkuddel@web.de not found - will be set to premium after registration';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user ID: %, setting to permanent premium...', owner_user_id;
    
    -- Insert/Update user profile
    INSERT INTO user_profiles (
        id,
        email,
        subscription_status,
        trial_ends_at,
        stripe_customer_id
    ) VALUES (
        owner_user_id,
        'dkuddel@web.de',
        'active',
        NOW() + INTERVAL '100 years',
        'OWNER_PERMANENT_PREMIUM'
    )
    ON CONFLICT (id) DO UPDATE SET
        subscription_status = 'active',
        trial_ends_at = NOW() + INTERVAL '100 years',
        stripe_customer_id = 'OWNER_PERMANENT_PREMIUM',
        updated_at = NOW();
        
    -- Insert/Update subscription
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
        NOW() + INTERVAL '100 years',
        'OWNER_PERMANENT_PREMIUM'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'active',
        end_date = NOW() + INTERVAL '100 years',
        updated_at = NOW(),
        paypal_subscription_id = 'OWNER_PERMANENT_PREMIUM';
    
    -- Update auth.users metadata
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        '{"subscription_status": "active", "premium": true, "owner": true}'::jsonb
    WHERE id = owner_user_id;
    
    RAISE NOTICE '🎉 OWNER dkuddel@web.de set to PERMANENT PREMIUM!';
    
EXCEPTION 
    WHEN others THEN
        RAISE NOTICE 'Error setting owner premium: %', SQLERRM;
END $$;

-- ================================
-- 6. VERIFICATION
-- ================================

-- Show created tables
SELECT 'Tables created:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'subscriptions', 'roi_entries');

-- Show owner status (if exists)
SELECT 'Owner status:' as status;
SELECT email, raw_user_meta_data->>'premium' as is_premium 
FROM auth.users 
WHERE email = 'dkuddel@web.de';

SELECT '✅ Database setup complete!' as result;
