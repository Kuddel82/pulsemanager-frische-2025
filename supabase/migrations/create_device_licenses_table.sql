-- Device Licenses Table für 1-Lizenz-pro-Gerät System
-- Erstellt: PulseManager Device Licensing System

-- Erstelle device_licenses Tabelle
CREATE TABLE IF NOT EXISTS device_licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_key VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    device_info JSONB DEFAULT '{}',
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices für Performance
CREATE INDEX IF NOT EXISTS idx_device_licenses_license_key ON device_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_device_licenses_device_id ON device_licenses(device_id);
CREATE INDEX IF NOT EXISTS idx_device_licenses_user_id ON device_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_device_licenses_active ON device_licenses(is_active);

-- Unique Constraint: Ein Lizenz-Key kann nur auf einem Gerät aktiv sein
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_license 
ON device_licenses(license_key) 
WHERE is_active = true;

-- Unique Constraint: Ein Gerät kann nur eine aktive Lizenz haben
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_device 
ON device_licenses(device_id) 
WHERE is_active = true;

-- RLS (Row Level Security) aktivieren
ALTER TABLE device_licenses ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können nur ihre eigenen Lizenzen sehen
CREATE POLICY "Users can view own licenses" ON device_licenses
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Lizenzen einfügen
CREATE POLICY "Users can insert own licenses" ON device_licenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Lizenzen aktualisieren
CREATE POLICY "Users can update own licenses" ON device_licenses
    FOR UPDATE USING (auth.uid() = user_id);

-- Function: Updated_at Timestamp automatisch setzen
CREATE OR REPLACE FUNCTION update_device_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Updated_at bei Änderungen automatisch setzen
CREATE TRIGGER device_licenses_updated_at
    BEFORE UPDATE ON device_licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_device_licenses_updated_at();

-- Function: Lizenz-Validierung
CREATE OR REPLACE FUNCTION validate_license_for_device(
    license_key_param VARCHAR(255),
    device_id_param VARCHAR(255)
)
RETURNS BOOLEAN AS $$
DECLARE
    license_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM device_licenses 
        WHERE license_key = license_key_param 
        AND device_id = device_id_param 
        AND is_active = true
    ) INTO license_exists;
    
    RETURN license_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Lizenz deaktivieren
CREATE OR REPLACE FUNCTION deactivate_license(
    license_key_param VARCHAR(255),
    user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE device_licenses 
    SET is_active = false, updated_at = NOW()
    WHERE license_key = license_key_param 
    AND user_id = user_id_param;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kommentare für Dokumentation
COMMENT ON TABLE device_licenses IS 'Verwaltet Geräte-basierte Lizenzierung für 1-Lizenz-pro-Gerät System';
COMMENT ON COLUMN device_licenses.license_key IS 'Eindeutiger Lizenz-Schlüssel';
COMMENT ON COLUMN device_licenses.device_id IS 'Hardware-basierter Geräte-Fingerprint';
COMMENT ON COLUMN device_licenses.device_info IS 'Zusätzliche Geräteinformationen (User-Agent, Platform, etc.)';
COMMENT ON COLUMN device_licenses.last_verified IS 'Letzter Zeitpunkt der Lizenz-Verifikation'; 