-- Token Balances Table für Wallet Parser
-- Speichert Token-Daten von scan.pulsechain.com und anderen Blockchain APIs

-- Erstelle token_balances Tabelle
CREATE TABLE IF NOT EXISTS token_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL DEFAULT 369,
    token_name VARCHAR(100),
    token_symbol VARCHAR(20) NOT NULL,
    contract_address VARCHAR(42),
    balance DECIMAL(36,18) NOT NULL DEFAULT 0,
    decimals INTEGER DEFAULT 18,
    value_usd DECIMAL(20,2) DEFAULT 0,
    token_type VARCHAR(20) DEFAULT 'ERC20', -- 'native', 'ERC20', 'manual'
    manual_entry BOOLEAN DEFAULT false,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices für Performance
CREATE INDEX IF NOT EXISTS idx_token_balances_user_id ON token_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_token_balances_wallet ON token_balances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_balances_chain ON token_balances(chain_id);
CREATE INDEX IF NOT EXISTS idx_token_balances_symbol ON token_balances(token_symbol);
CREATE INDEX IF NOT EXISTS idx_token_balances_value ON token_balances(value_usd);

-- Unique Constraint: Ein Token pro Wallet pro Chain
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_token_balance 
ON token_balances(user_id, wallet_address, chain_id, token_symbol);

-- RLS (Row Level Security) aktivieren
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können nur ihre eigenen Token-Balances sehen
CREATE POLICY "Users can view own token balances" ON token_balances
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Token-Balances einfügen
CREATE POLICY "Users can insert own token balances" ON token_balances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Token-Balances aktualisieren
CREATE POLICY "Users can update own token balances" ON token_balances
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Token-Balances löschen
CREATE POLICY "Users can delete own token balances" ON token_balances
    FOR DELETE USING (auth.uid() = user_id);

-- Funktionen für Token-Management
CREATE OR REPLACE FUNCTION get_user_portfolio_value(user_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(value_usd), 0)
        FROM token_balances 
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Token nach Wert sortiert abrufen
CREATE OR REPLACE FUNCTION get_top_tokens(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    token_symbol VARCHAR(20),
    token_name VARCHAR(100),
    balance DECIMAL(36,18),
    value_usd DECIMAL(20,2),
    wallet_address VARCHAR(42),
    chain_id INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tb.token_symbol,
        tb.token_name,
        tb.balance,
        tb.value_usd,
        tb.wallet_address,
        tb.chain_id
    FROM token_balances tb
    WHERE tb.user_id = user_uuid
    ORDER BY tb.value_usd DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 