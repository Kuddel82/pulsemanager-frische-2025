-- Transactions Table für Steuer-Reporting
-- Speichert alle Wallet-Transaktionen für DSGVO-konforme Steuerberichte

-- Erstelle transactions Tabelle
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL DEFAULT 369,
    
    -- Transaction Details
    tx_hash VARCHAR(66) NOT NULL, -- 0x + 64 hex chars
    block_number BIGINT,
    block_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Token Information
    token_symbol VARCHAR(20) NOT NULL,
    token_name VARCHAR(100),
    contract_address VARCHAR(42),
    
    -- Transaction Data
    amount DECIMAL(36,18) NOT NULL,
    amount_raw VARCHAR(100), -- For very large numbers
    decimals INTEGER DEFAULT 18,
    
    -- Value Information
    value_usd DECIMAL(20,2) DEFAULT 0,
    gas_used BIGINT,
    gas_price BIGINT,
    gas_fee_eth DECIMAL(20,8) DEFAULT 0,
    gas_fee_usd DECIMAL(20,2) DEFAULT 0,
    
    -- Address Information
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    
    -- Transaction Type Classification
    tx_type VARCHAR(20) DEFAULT 'transfer', -- 'transfer', 'swap', 'stake', 'unstake', 'airdrop', 'mining'
    direction VARCHAR(10) DEFAULT 'unknown', -- 'in', 'out', 'self'
    
    -- Tax Relevant Fields
    is_taxable BOOLEAN DEFAULT true,
    tax_category VARCHAR(30), -- 'income', 'capital_gain', 'capital_loss', 'fee', 'gift'
    cost_basis_usd DECIMAL(20,2),
    
    -- Metadata
    manual_entry BOOLEAN DEFAULT false,
    notes TEXT,
    tags TEXT[], -- For user categorization
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices für Performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_chain ON transactions(chain_id);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(block_timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_token ON transactions(token_symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(tx_type);
CREATE INDEX IF NOT EXISTS idx_transactions_direction ON transactions(direction);
CREATE INDEX IF NOT EXISTS idx_transactions_taxable ON transactions(is_taxable);

-- Unique Constraint: Eine Transaktion pro Hash pro Token
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_transaction 
ON transactions(user_id, tx_hash, token_symbol, wallet_address);

-- RLS (Row Level Security) aktivieren
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können nur ihre eigenen Transaktionen sehen
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Transaktionen einfügen
CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Transaktionen aktualisieren
CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Transaktionen löschen
CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transactions_updated_at();

-- Funktionen für Steuer-Reporting
CREATE OR REPLACE FUNCTION get_tax_summary(
    user_uuid UUID, 
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    total_income_usd DECIMAL(20,2),
    total_capital_gains_usd DECIMAL(20,2),
    total_capital_losses_usd DECIMAL(20,2),
    total_fees_usd DECIMAL(20,2),
    total_transactions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN tax_category = 'income' THEN value_usd ELSE 0 END), 0) as total_income_usd,
        COALESCE(SUM(CASE WHEN tax_category = 'capital_gain' THEN value_usd ELSE 0 END), 0) as total_capital_gains_usd,
        COALESCE(SUM(CASE WHEN tax_category = 'capital_loss' THEN ABS(value_usd) ELSE 0 END), 0) as total_capital_losses_usd,
        COALESCE(SUM(gas_fee_usd), 0) as total_fees_usd,
        COUNT(*) as total_transactions
    FROM transactions t
    WHERE t.user_id = user_uuid
    AND t.is_taxable = true
    AND (start_date IS NULL OR t.block_timestamp >= start_date::timestamp)
    AND (end_date IS NULL OR t.block_timestamp <= end_date::timestamp + interval '1 day');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Transaktionen für CSV Export
CREATE OR REPLACE FUNCTION get_transactions_for_export(
    user_uuid UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    wallet_filter VARCHAR(42) DEFAULT NULL
)
RETURNS TABLE(
    date_time TIMESTAMP WITH TIME ZONE,
    tx_hash VARCHAR(66),
    token_symbol VARCHAR(20),
    amount DECIMAL(36,18),
    value_usd DECIMAL(20,2),
    tx_type VARCHAR(20),
    direction VARCHAR(10),
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    gas_fee_usd DECIMAL(20,2),
    tax_category VARCHAR(30)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.block_timestamp,
        t.tx_hash,
        t.token_symbol,
        t.amount,
        t.value_usd,
        t.tx_type,
        t.direction,
        t.from_address,
        t.to_address,
        t.gas_fee_usd,
        t.tax_category
    FROM transactions t
    WHERE t.user_id = user_uuid
    AND (start_date IS NULL OR t.block_timestamp >= start_date::timestamp)
    AND (end_date IS NULL OR t.block_timestamp <= end_date::timestamp + interval '1 day')
    AND (wallet_filter IS NULL OR t.wallet_address = wallet_filter)
    ORDER BY t.block_timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 