-- 🏛️ CACHE DATA TABLE - Database Persistent Cache für Page Reload Survival
-- Speichert Portfolio, ROI, Tax Daten mit User-Zuordnung und TTL

-- Create cache_data table
CREATE TABLE IF NOT EXISTS cache_data (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cache_type TEXT NOT NULL CHECK (cache_type IN ('portfolio', 'roi_tracker', 'tax_report', 'wallet_list')),
  data JSONB NOT NULL,
  version TEXT DEFAULT '2.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Unique constraint per user per cache type
  UNIQUE(user_id, cache_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cache_data_user_id ON cache_data(user_id);
CREATE INDEX IF NOT EXISTS idx_cache_data_cache_type ON cache_data(cache_type);
CREATE INDEX IF NOT EXISTS idx_cache_data_expires_at ON cache_data(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_data_user_type ON cache_data(user_id, cache_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_cache_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cache_data_updated_at ON cache_data;
CREATE TRIGGER update_cache_data_updated_at
  BEFORE UPDATE ON cache_data
  FOR EACH ROW
  EXECUTE FUNCTION update_cache_data_updated_at();

-- Add RLS (Row Level Security)
ALTER TABLE cache_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own cache data
CREATE POLICY "Users can access own cache data"
  ON cache_data FOR ALL
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own cache data
CREATE POLICY "Users can insert own cache data"
  ON cache_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own cache data
CREATE POLICY "Users can update own cache data"
  ON cache_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own cache data
CREATE POLICY "Users can delete own cache data"
  ON cache_data FOR DELETE
  USING (auth.uid() = user_id);

-- Comment on table
COMMENT ON TABLE cache_data IS 'Database persistent cache for Portfolio, ROI, Tax data that survives page reloads';
COMMENT ON COLUMN cache_data.user_id IS 'Reference to the user who owns this cache entry';
COMMENT ON COLUMN cache_data.cache_type IS 'Type of cached data: portfolio, roi_tracker, tax_report, wallet_list';
COMMENT ON COLUMN cache_data.data IS 'JSON data of the cached content';
COMMENT ON COLUMN cache_data.version IS 'Cache version for compatibility checks';
COMMENT ON COLUMN cache_data.expires_at IS 'When this cache entry expires and should be deleted';

-- Create function to cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cache_data WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get cache status for a user
CREATE OR REPLACE FUNCTION get_user_cache_status(user_uuid UUID)
RETURNS TABLE (
  cache_type TEXT,
  cached BOOLEAN,
  age_minutes INTEGER,
  expired BOOLEAN,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  version TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.cache_type,
    TRUE as cached,
    EXTRACT(EPOCH FROM (NOW() - cd.created_at))::INTEGER / 60 as age_minutes,
    cd.expires_at < NOW() as expired,
    cd.created_at,
    cd.expires_at,
    cd.version
  FROM cache_data cd
  WHERE cd.user_id = user_uuid
  ORDER BY cd.cache_type;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON cache_data TO authenticated;
GRANT USAGE ON SEQUENCE cache_data_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_cache_status(UUID) TO authenticated; 