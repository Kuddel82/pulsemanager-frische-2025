-- PulseManager Database Schema
-- PostgreSQL Database für Security & Analytics
-- Version: 1.0.0
-- Datum: 2024-06-14

-- Datenbankstruktur für PulseManager Security System
-- Unterstützt API-Key Management, Usage Analytics, Rate Limiting

-- ==============================================
-- HAUPTTABELLEN
-- ==============================================

-- Benutzer-Tabelle
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    subscription_type VARCHAR(50) DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium', 'enterprise')),
    wallet_address VARCHAR(42),
    license_key VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    -- Zusätzliche Metadaten
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    
    -- Indexe für Performance
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_wallet CHECK (wallet_address IS NULL OR wallet_address ~* '^0x[a-fA-F0-9]{40}$')
);

-- API Keys Tabelle
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL, -- bcrypt Hash des API-Keys
    permissions JSONB DEFAULT '["read"]', -- Array von Berechtigungen
    rate_limit INTEGER DEFAULT 100, -- Requests pro 15 Minuten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optionales Ablaufdatum
    is_active BOOLEAN DEFAULT true,
    
    -- Zusätzliche Metadaten
    description TEXT,
    created_by_ip INET,
    usage_count INTEGER DEFAULT 0,
    
    CONSTRAINT unique_user_key_name UNIQUE (user_id, key_name),
    CONSTRAINT valid_permissions CHECK (jsonb_typeof(permissions) = 'array')
);

-- API Usage Analytics Tabelle
CREATE TABLE IF NOT EXISTS api_usage (
    id BIGSERIAL PRIMARY KEY,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    payload_size INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    
    -- Request Details
    query_params JSONB,
    request_headers JSONB,
    response_size INTEGER,
    
    -- Indexe für Performance
    CONSTRAINT valid_http_method CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD')),
    CONSTRAINT valid_status_code CHECK (status_code >= 100 AND status_code < 600)
);

-- Rate Limiting Cache Tabelle
CREATE TABLE IF NOT EXISTS rate_limit_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    request_count INTEGER DEFAULT 0,
    last_request TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_key_window UNIQUE (api_key_id, window_start)
);

-- System Konfiguration Tabelle
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Security Logs Tabelle
CREATE TABLE IF NOT EXISTS security_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'AUTH_SUCCESS', 'AUTH_FAILURE', 'RATE_LIMIT', 'ANOMALY'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    event_details JSONB,
    severity VARCHAR(20) DEFAULT 'INFO' CHECK (severity IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Zusätzliche Felder
    endpoint VARCHAR(255),
    response_code INTEGER,
    processing_time_ms INTEGER
);

-- ==============================================
-- INDEXE FÜR PERFORMANCE
-- ==============================================

-- Users Indexe
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

-- API Keys Indexe
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used ON api_keys(last_used);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);

-- API Usage Indexe (für Analytics Performance)
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key_id ON api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_code ON api_usage(status_code);
CREATE INDEX IF NOT EXISTS idx_api_usage_ip_address ON api_usage(ip_address);

-- Composite Indexe für häufige Queries
CREATE INDEX IF NOT EXISTS idx_api_usage_key_timestamp ON api_usage(api_key_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint_timestamp ON api_usage(endpoint, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_timestamp ON api_usage(status_code, timestamp);

-- Rate Limiting Indexe
CREATE INDEX IF NOT EXISTS idx_rate_limit_cache_key_window ON rate_limit_cache(api_key_id, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_cache_last_request ON rate_limit_cache(last_request);

-- Security Logs Indexe
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);

-- ==============================================
-- TRIGGER FUNKTIONEN
-- ==============================================

-- Funktion: Updated At Timestamp automatisch setzen
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Funktion: API Key Usage Count erhöhen
CREATE OR REPLACE FUNCTION increment_api_key_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE api_keys 
    SET usage_count = usage_count + 1,
        last_used = CURRENT_TIMESTAMP
    WHERE id = NEW.api_key_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Funktion: Rate Limit Cache automatisch bereinigen
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM rate_limit_cache 
    WHERE window_start < CURRENT_TIMESTAMP - INTERVAL '2 hours';
    RETURN NULL;
END;
$$ language 'plpgsql';

-- ==============================================
-- TRIGGER DEFINITIONEN
-- ==============================================

-- Updated At Trigger für users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Updated At Trigger für system_config
DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
CREATE TRIGGER update_system_config_updated_at 
    BEFORE UPDATE ON system_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- API Key Usage Trigger
DROP TRIGGER IF EXISTS increment_usage_on_api_call ON api_usage;
CREATE TRIGGER increment_usage_on_api_call
    AFTER INSERT ON api_usage
    FOR EACH ROW
    EXECUTE FUNCTION increment_api_key_usage();

-- Rate Limit Cleanup Trigger
DROP TRIGGER IF EXISTS cleanup_rate_limits_on_insert ON rate_limit_cache;
CREATE TRIGGER cleanup_rate_limits_on_insert
    AFTER INSERT ON rate_limit_cache
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_old_rate_limits();

-- ==============================================
-- VIEWS FÜR ANALYTICS
-- ==============================================

-- View: Aktive API Keys mit User Info
CREATE OR REPLACE VIEW active_api_keys AS
SELECT 
    ak.id,
    ak.key_name,
    ak.permissions,
    ak.rate_limit,
    ak.created_at,
    ak.last_used,
    ak.usage_count,
    u.email,
    u.subscription_type,
    u.wallet_address
FROM api_keys ak
JOIN users u ON ak.user_id = u.id
WHERE ak.is_active = true AND u.is_active = true;

-- View: Daily Usage Statistics
CREATE OR REPLACE VIEW daily_usage_stats AS
SELECT 
    DATE(timestamp) as usage_date,
    COUNT(*) as total_requests,
    COUNT(DISTINCT api_key_id) as unique_keys,
    COUNT(CASE WHEN status_code < 400 THEN 1 END) as successful_requests,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_requests,
    AVG(response_time_ms) as avg_response_time,
    SUM(payload_size) as total_data_transferred
FROM api_usage 
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY usage_date DESC;

-- View: Top Endpoints
CREATE OR REPLACE VIEW top_endpoints AS
SELECT 
    endpoint,
    COUNT(*) as request_count,
    COUNT(DISTINCT api_key_id) as unique_users,
    AVG(response_time_ms) as avg_response_time,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM api_usage 
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY endpoint
ORDER BY request_count DESC
LIMIT 20;

-- View: User Activity Summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.subscription_type,
    COUNT(DISTINCT ak.id) as api_key_count,
    COALESCE(SUM(ak.usage_count), 0) as total_api_calls,
    MAX(ak.last_used) as last_api_usage,
    u.last_login,
    u.login_count
FROM users u
LEFT JOIN api_keys ak ON u.id = ak.user_id AND ak.is_active = true
WHERE u.is_active = true
GROUP BY u.id, u.email, u.subscription_type, u.last_login, u.login_count
ORDER BY total_api_calls DESC;

-- ==============================================
-- STORED PROCEDURES
-- ==============================================

-- Procedure: Cleanup alter API Usage Logs
CREATE OR REPLACE FUNCTION cleanup_old_api_usage(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_usage 
    WHERE timestamp < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO security_logs (event_type, event_details, severity)
    VALUES ('CLEANUP', jsonb_build_object(
        'table', 'api_usage',
        'deleted_rows', deleted_count,
        'retention_days', retention_days
    ), 'INFO');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Procedure: API Key Rotation
CREATE OR REPLACE FUNCTION rotate_api_key(old_key_id UUID, new_key_name VARCHAR(100))
RETURNS UUID AS $$
DECLARE
    new_key_id UUID;
    user_id_val UUID;
    permissions_val JSONB;
    rate_limit_val INTEGER;
BEGIN
    -- Hole Daten vom alten Key
    SELECT user_id, permissions, rate_limit 
    INTO user_id_val, permissions_val, rate_limit_val
    FROM api_keys 
    WHERE id = old_key_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'API Key nicht gefunden oder inaktiv';
    END IF;
    
    -- Erstelle neuen Key
    INSERT INTO api_keys (user_id, key_name, permissions, rate_limit)
    VALUES (user_id_val, new_key_name, permissions_val, rate_limit_val)
    RETURNING id INTO new_key_id;
    
    -- Deaktiviere alten Key
    UPDATE api_keys SET is_active = false WHERE id = old_key_id;
    
    -- Log die Rotation
    INSERT INTO security_logs (event_type, user_id, event_details, severity)
    VALUES ('KEY_ROTATION', user_id_val, jsonb_build_object(
        'old_key_id', old_key_id,
        'new_key_id', new_key_id,
        'new_key_name', new_key_name
    ), 'INFO');
    
    RETURN new_key_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- INITIALE SYSTEM KONFIGURATION
-- ==============================================

-- Standard System Config einfügen
INSERT INTO system_config (config_key, config_value, description) VALUES
('rate_limit_default', '100', 'Standard Rate Limit pro 15 Minuten'),
('rate_limit_premium', '1000', 'Premium Rate Limit pro 15 Minuten'),
('rate_limit_enterprise', '5000', 'Enterprise Rate Limit pro 15 Minuten'),
('jwt_expiry_hours', '24', 'JWT Token Gültigkeit in Stunden'),
('max_api_keys_per_user', '10', 'Maximale API Keys pro Benutzer'),
('data_retention_days', '90', 'Datenaufbewahrung für API Logs'),
('security_log_retention_days', '365', 'Datenaufbewahrung für Security Logs'),
('enable_anomaly_detection', 'true', 'Anomalie-Erkennung aktiviert'),
('admin_notification_email', 'admin@pulsemanager.vip', 'E-Mail für Admin-Benachrichtigungen')
ON CONFLICT (config_key) DO NOTHING;

-- ==============================================
-- DATENBANK BERECHTIGUNGEN
-- ==============================================

-- Erstelle Read-Only User für Monitoring
-- CREATE USER pulsemanager_readonly WITH PASSWORD 'readonly_password_change_me';
-- GRANT CONNECT ON DATABASE pulsemanager TO pulsemanager_readonly;
-- GRANT USAGE ON SCHEMA public TO pulsemanager_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO pulsemanager_readonly;

-- Erstelle Analytics User
-- CREATE USER pulsemanager_analytics WITH PASSWORD 'analytics_password_change_me';
-- GRANT CONNECT ON DATABASE pulsemanager TO pulsemanager_analytics;
-- GRANT USAGE ON SCHEMA public TO pulsemanager_analytics;
-- GRANT SELECT ON api_usage, users, api_keys TO pulsemanager_analytics;
-- GRANT SELECT ON daily_usage_stats, top_endpoints, user_activity_summary TO pulsemanager_analytics;

-- ==============================================
-- ABSCHLUSS
-- ==============================================

-- Analyse der Tabellen für bessere Performance
ANALYZE users;
ANALYZE api_keys;
ANALYZE api_usage;
ANALYZE rate_limit_cache;
ANALYZE system_config;
ANALYZE security_logs;

-- Schema Version setzen
INSERT INTO system_config (config_key, config_value, description) VALUES
('schema_version', '"1.0.0"', 'Aktuelle Datenbankschema Version')
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = '"1.0.0"',
    updated_at = CURRENT_TIMESTAMP;

-- Erfolgsmeldung
SELECT 'PulseManager Database Schema erfolgreich initialisiert!' as status; 