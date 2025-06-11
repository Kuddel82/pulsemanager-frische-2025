-- 🚀 QUICK CACHE SETUP for Live Testing
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard

-- 1. Portfolio Cache Table
CREATE TABLE IF NOT EXISTS portfolio_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_data JSONB NOT NULL,
    total_value DECIMAL(20,2) DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    wallet_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Token Price Cache Table
CREATE TABLE IF NOT EXISTS token_price_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_address TEXT NOT NULL,
    token_symbol TEXT,
    price_usd DECIMAL(36,18) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ROI Analysis Cache Table
CREATE TABLE IF NOT EXISTS roi_analysis_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    total_roi_usd DECIMAL(20,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Activity Log Table
CREATE TABLE IF NOT EXISTS user_activity_log (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_api_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE portfolio_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies
CREATE POLICY "Users can access own portfolio cache" ON portfolio_cache
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own ROI analysis cache" ON roi_analysis_cache
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own activity log" ON user_activity_log
    FOR ALL USING (auth.uid() = user_id);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_cache_updated_at ON portfolio_cache(updated_at);
CREATE INDEX IF NOT EXISTS idx_token_price_cache_address ON token_price_cache(token_address);
CREATE INDEX IF NOT EXISTS idx_roi_analysis_cache_updated_at ON roi_analysis_cache(updated_at);

SELECT '✅ Cache tables created successfully! Your system is now optimized for reduced API usage.' as status; 