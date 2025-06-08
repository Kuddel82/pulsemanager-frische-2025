-- Wallets Table für manuelle Wallet-Eingabe (DOM-sicher)
-- Erstellt: PulseManager Manual Wallet Management System

-- Erstelle wallets Tabelle
CREATE TABLE IF NOT EXISTS wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    address VARCHAR(42) NOT NULL,
    nickname VARCHAR(100),
    chain_id INTEGER NOT NULL DEFAULT 369,
    chain_name VARCHAR(50) DEFAULT 'PulseChain',
    wallet_type VARCHAR(20) DEFAULT 'manual', -- 'manual', 'connected', 'imported'
    balance_eth DECIMAL(20,8) DEFAULT 0,
    balance_usd DECIMAL(20,2) DEFAULT 0,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices für Performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_chain_id ON wallets(chain_id);
CREATE INDEX IF NOT EXISTS idx_wallets_active ON wallets(is_active);

-- Unique Constraint: Ein Benutzer kann nicht dieselbe Adresse doppelt haben
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_wallet 
ON wallets(user_id, address, chain_id) 
WHERE is_active = true;

-- RLS (Row Level Security) aktivieren
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können nur ihre eigenen Wallets sehen
CREATE POLICY "Users can view own wallets" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Wallets einfügen
CREATE POLICY "Users can insert own wallets" ON wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Wallets aktualisieren
CREATE POLICY "Users can update own wallets" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Wallets löschen
CREATE POLICY "Users can delete own wallets" ON wallets
    FOR DELETE USING (auth.uid() = user_id);

-- Function: Updated_at Timestamp automatisch setzen
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Updated_at bei Änderungen automatisch setzen
CREATE TRIGGER wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_wallets_updated_at();

-- Function: Wallet-Adresse validieren
CREATE OR REPLACE FUNCTION validate_wallet_address(
    address_param VARCHAR(42)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Ethereum/PulseChain Adresse: 0x + 40 hex chars
    IF LENGTH(address_param) != 42 THEN
        RETURN false;
    END IF;
    
    IF NOT (address_param ~ '^0x[a-fA-F0-9]{40}$') THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: Benutzer-Wallets abrufen
CREATE OR REPLACE FUNCTION get_user_wallets(
    user_id_param UUID
)
RETURNS TABLE(
    id UUID,
    address VARCHAR(42),
    nickname VARCHAR(100),
    chain_id INTEGER,
    chain_name VARCHAR(50),
    wallet_type VARCHAR(20),
    balance_eth DECIMAL(20,8),
    balance_usd DECIMAL(20,2),
    last_sync TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.address,
        w.nickname,
        w.chain_id,
        w.chain_name,
        w.wallet_type,
        w.balance_eth,
        w.balance_usd,
        w.last_sync,
        w.is_active,
        w.created_at
    FROM wallets w
    WHERE w.user_id = user_id_param 
    AND w.is_active = true
    ORDER BY w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Wallet-Balance aktualisieren
CREATE OR REPLACE FUNCTION update_wallet_balance(
    wallet_id_param UUID,
    balance_eth_param DECIMAL(20,8),
    balance_usd_param DECIMAL(20,2)
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE wallets 
    SET 
        balance_eth = balance_eth_param,
        balance_usd = balance_usd_param,
        last_sync = NOW(),
        updated_at = NOW()
    WHERE id = wallet_id_param;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kommentare für Dokumentation
COMMENT ON TABLE wallets IS 'Benutzer-Wallets für manuelle Eingabe und Portfolio-Tracking (DSGVO-konform)';
COMMENT ON COLUMN wallets.address IS 'Ethereum/PulseChain Wallet-Adresse (0x...)';
COMMENT ON COLUMN wallets.nickname IS 'Benutzer-definierter Name für die Wallet';
COMMENT ON COLUMN wallets.wallet_type IS 'Art der Wallet-Verbindung: manual, connected, imported';
COMMENT ON COLUMN wallets.balance_eth IS 'ETH/PLS Balance (8 Dezimalstellen)';
COMMENT ON COLUMN wallets.balance_usd IS 'USD-Wert der Balance';
COMMENT ON COLUMN wallets.last_sync IS 'Letzter Zeitpunkt der Balance-Synchronisation'; 