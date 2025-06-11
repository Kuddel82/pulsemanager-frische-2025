-- 🗄️ CACHE TABLES - Skalierbare Datenspeicherung für PulseManager
-- Eliminiert redundante API-Calls durch intelligentes Caching

-- ================================
-- 1. PORTFOLIO CACHE TABLE
-- ================================

CREATE TABLE IF NOT EXISTS portfolio_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_data JSONB NOT NULL,
    total_value DECIMAL(20,2) DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    wallet_count INTEGER DEFAULT 0,
    api_calls_saved INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 2. TOKEN PRICE CACHE TABLE
-- ================================

CREATE TABLE IF NOT EXISTS token_price_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_address TEXT NOT NULL,
    token_symbol TEXT,
    chain_id INTEGER DEFAULT 369,
    price_usd DECIMAL(36,18) NOT NULL,
    price_source TEXT DEFAULT 'moralis',
    market_cap DECIMAL(20,2),
    volume_24h DECIMAL(20,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(token_address, chain_id)
);

-- ================================
-- 3. ROI ANALYSIS CACHE TABLE
-- ================================

CREATE TABLE IF NOT EXISTS roi_analysis_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    total_roi_usd DECIMAL(20,2) DEFAULT 0,
    daily_roi_usd DECIMAL(20,2) DEFAULT 0,
    weekly_roi_usd DECIMAL(20,2) DEFAULT 0,
    monthly_roi_usd DECIMAL(20,2) DEFAULT 0,
    roi_sources_count INTEGER DEFAULT 0,
    defi_positions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 4. USER ACTIVITY LOG TABLE
-- ================================

CREATE TABLE IF NOT EXISTS user_activity_log (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_page_visited TEXT,
    session_count INTEGER DEFAULT 1,
    total_api_calls INTEGER DEFAULT 0,
    cache_hit_ratio DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 5. API USAGE TRACKING TABLE
-- ================================

CREATE TABLE IF NOT EXISTS api_usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_endpoint TEXT NOT NULL,
    api_provider TEXT NOT NULL, -- 'moralis', 'internal', etc.
    call_count INTEGER DEFAULT 1,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, api_endpoint, api_provider, date)
);

-- ================================
-- 6. INDEXES FOR PERFORMANCE
-- ================================

-- Portfolio Cache Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_cache_updated_at ON portfolio_cache(updated_at);

-- Token Price Cache Indexes
CREATE INDEX IF NOT EXISTS idx_token_price_cache_address ON token_price_cache(token_address);
CREATE INDEX IF NOT EXISTS idx_token_price_cache_symbol ON token_price_cache(token_symbol);
CREATE INDEX IF NOT EXISTS idx_token_price_cache_updated_at ON token_price_cache(updated_at);
CREATE INDEX IF NOT EXISTS idx_token_price_cache_chain ON token_price_cache(chain_id);

-- ROI Analysis Cache Indexes
CREATE INDEX IF NOT EXISTS idx_roi_analysis_cache_updated_at ON roi_analysis_cache(updated_at);

-- User Activity Log Indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_log_last_action ON user_activity_log(last_action_at);

-- API Usage Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_user_date ON api_usage_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_endpoint ON api_usage_tracking(api_endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_provider ON api_usage_tracking(api_provider);

-- ================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ================================

-- Portfolio Cache RLS
ALTER TABLE portfolio_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own portfolio cache" ON portfolio_cache
    FOR ALL USING (auth.uid() = user_id);

-- ROI Analysis Cache RLS
ALTER TABLE roi_analysis_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own ROI analysis cache" ON roi_analysis_cache
    FOR ALL USING (auth.uid() = user_id);

-- User Activity Log RLS
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own activity log" ON user_activity_log
    FOR ALL USING (auth.uid() = user_id);

-- API Usage Tracking RLS
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own API usage" ON api_usage_tracking
    FOR ALL USING (auth.uid() = user_id);

-- Token Price Cache (public read, admin write)
ALTER TABLE token_price_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read token prices" ON token_price_cache
    FOR SELECT TO authenticated USING (true);

-- ================================
-- 8. FUNCTIONS
-- ================================

-- Function: Update user activity
CREATE OR REPLACE FUNCTION update_user_activity(
    user_id_param UUID,
    page_visited TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO user_activity_log (user_id, last_action_at, last_page_visited)
    VALUES (user_id_param, NOW(), page_visited)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        last_action_at = NOW(),
        last_page_visited = COALESCE(EXCLUDED.last_page_visited, user_activity_log.last_page_visited),
        session_count = user_activity_log.session_count + 1,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Track API usage
CREATE OR REPLACE FUNCTION track_api_usage(
    user_id_param UUID,
    endpoint_param TEXT,
    provider_param TEXT DEFAULT 'moralis'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO api_usage_tracking (user_id, api_endpoint, api_provider, call_count, date)
    VALUES (user_id_param, endpoint_param, provider_param, 1, CURRENT_DATE)
    ON CONFLICT (user_id, api_endpoint, api_provider, date)
    DO UPDATE SET 
        call_count = api_usage_tracking.call_count + 1;
        
    -- Update total API calls in activity log
    UPDATE user_activity_log 
    SET total_api_calls = total_api_calls + 1
    WHERE user_id = user_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user cache stats
CREATE OR REPLACE FUNCTION get_user_cache_stats(user_id_param UUID)
RETURNS TABLE(
    portfolio_cached BOOLEAN,
    portfolio_last_update TIMESTAMP WITH TIME ZONE,
    roi_analysis_cached BOOLEAN,
    roi_analysis_last_update TIMESTAMP WITH TIME ZONE,
    total_api_calls INTEGER,
    cache_hit_ratio DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (pc.user_id IS NOT NULL) as portfolio_cached,
        pc.updated_at as portfolio_last_update,
        (rac.user_id IS NOT NULL) as roi_analysis_cached,
        rac.updated_at as roi_analysis_last_update,
        COALESCE(ual.total_api_calls, 0) as total_api_calls,
        COALESCE(ual.cache_hit_ratio, 0) as cache_hit_ratio
    FROM user_activity_log ual
    LEFT JOIN portfolio_cache pc ON pc.user_id = user_id_param
    LEFT JOIN roi_analysis_cache rac ON rac.user_id = user_id_param
    WHERE ual.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cleanup old cache entries
CREATE OR REPLACE FUNCTION cleanup_old_cache_entries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete old portfolio cache (older than 24 hours)
    DELETE FROM portfolio_cache 
    WHERE updated_at < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old token prices (older than 1 hour)
    DELETE FROM token_price_cache 
    WHERE updated_at < NOW() - INTERVAL '1 hour';
    
    -- Delete old ROI analysis cache (older than 2 hours)
    DELETE FROM roi_analysis_cache 
    WHERE updated_at < NOW() - INTERVAL '2 hours';
    
    -- Delete old API usage tracking (older than 30 days)
    DELETE FROM api_usage_tracking 
    WHERE date < CURRENT_DATE - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 9. TRIGGERS
-- ================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Portfolio cache updated_at trigger
CREATE TRIGGER update_portfolio_cache_updated_at
    BEFORE UPDATE ON portfolio_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Token price cache updated_at trigger
CREATE TRIGGER update_token_price_cache_updated_at
    BEFORE UPDATE ON token_price_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ROI analysis cache updated_at trigger
CREATE TRIGGER update_roi_analysis_cache_updated_at
    BEFORE UPDATE ON roi_analysis_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 10. COMMENTS
-- ================================

COMMENT ON TABLE portfolio_cache IS 'Cached portfolio data per user to reduce API calls';
COMMENT ON TABLE token_price_cache IS 'Cached token prices shared across all users';
COMMENT ON TABLE roi_analysis_cache IS 'Cached ROI analysis per user';
COMMENT ON TABLE user_activity_log IS 'User activity tracking for smart cache refresh';
COMMENT ON TABLE api_usage_tracking IS 'API usage tracking per user per day';

COMMENT ON FUNCTION update_user_activity IS 'Updates user activity timestamp and page visited';
COMMENT ON FUNCTION track_api_usage IS 'Tracks API usage per user per endpoint per day';
COMMENT ON FUNCTION get_user_cache_stats IS 'Returns cache statistics for a user';
COMMENT ON FUNCTION cleanup_old_cache_entries IS 'Cleans up old cache entries automatically'; 