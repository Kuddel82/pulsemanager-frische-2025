-- Investments Table für ROI-Tracking und Steuerberichte
-- Erstellt: PulseManager Investment & Tax Management System

-- Erstelle investments Tabelle
CREATE TABLE IF NOT EXISTS investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    token_name VARCHAR(100),
    token_address VARCHAR(42),
    chain_id INTEGER NOT NULL DEFAULT 369,
    chain_name VARCHAR(50) DEFAULT 'PulseChain',
    
    -- Purchase Information
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    purchase_price_usd DECIMAL(20,8) NOT NULL,
    purchase_amount DECIMAL(30,18) NOT NULL,
    purchase_total_usd DECIMAL(20,2) NOT NULL,
    
    -- Current Information
    current_price_usd DECIMAL(20,8) DEFAULT 0,
    current_value_usd DECIMAL(20,2) DEFAULT 0,
    last_price_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- ROI Calculation
    roi_percentage DECIMAL(10,4) DEFAULT 0,
    roi_absolute_usd DECIMAL(20,2) DEFAULT 0,
    
    -- Tax Information
    tax_relevant BOOLEAN DEFAULT true,
    tax_category VARCHAR(50) DEFAULT 'crypto_investment',
    tax_notes TEXT,
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices für Performance
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_wallet_id ON investments(wallet_id);
CREATE INDEX IF NOT EXISTS idx_investments_symbol ON investments(symbol);
CREATE INDEX IF NOT EXISTS idx_investments_chain_id ON investments(chain_id);
CREATE INDEX IF NOT EXISTS idx_investments_purchase_date ON investments(purchase_date);
CREATE INDEX IF NOT EXISTS idx_investments_active ON investments(is_active);
CREATE INDEX IF NOT EXISTS idx_investments_tax_relevant ON investments(tax_relevant);

-- RLS (Row Level Security) aktivieren
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "investments_select" ON investments 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "investments_insert" ON investments 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investments_update" ON investments 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "investments_delete" ON investments 
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_investments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER investments_updated_at
    BEFORE UPDATE ON investments
    FOR EACH ROW
    EXECUTE FUNCTION update_investments_updated_at();

-- Function: ROI berechnen und aktualisieren
CREATE OR REPLACE FUNCTION calculate_investment_roi(
    investment_id_param UUID,
    current_price_param DECIMAL(20,8)
)
RETURNS BOOLEAN AS $$
DECLARE
    investment_record RECORD;
    new_current_value DECIMAL(20,2);
    new_roi_absolute DECIMAL(20,2);
    new_roi_percentage DECIMAL(10,4);
    updated_count INTEGER;
BEGIN
    -- Investment-Record laden
    SELECT * INTO investment_record 
    FROM investments 
    WHERE id = investment_id_param;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- ROI berechnen
    new_current_value = investment_record.purchase_amount * current_price_param;
    new_roi_absolute = new_current_value - investment_record.purchase_total_usd;
    new_roi_percentage = CASE 
        WHEN investment_record.purchase_total_usd > 0 
        THEN (new_roi_absolute / investment_record.purchase_total_usd) * 100
        ELSE 0 
    END;
    
    -- Investment aktualisieren
    UPDATE investments 
    SET 
        current_price_usd = current_price_param,
        current_value_usd = new_current_value,
        roi_absolute_usd = new_roi_absolute,
        roi_percentage = new_roi_percentage,
        last_price_update = NOW(),
        updated_at = NOW()
    WHERE id = investment_id_param;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Benutzer-Portfolio-Übersicht
CREATE OR REPLACE FUNCTION get_user_portfolio_summary(
    user_id_param UUID
)
RETURNS TABLE(
    total_investments INTEGER,
    total_purchase_value_usd DECIMAL(20,2),
    total_current_value_usd DECIMAL(20,2),
    total_roi_absolute_usd DECIMAL(20,2),
    total_roi_percentage DECIMAL(10,4),
    best_performing_symbol VARCHAR(20),
    worst_performing_symbol VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    WITH portfolio_stats AS (
        SELECT 
            COUNT(*)::INTEGER as investment_count,
            SUM(purchase_total_usd) as purchase_total,
            SUM(current_value_usd) as current_total,
            SUM(roi_absolute_usd) as roi_total,
            CASE 
                WHEN SUM(purchase_total_usd) > 0 
                THEN (SUM(roi_absolute_usd) / SUM(purchase_total_usd)) * 100
                ELSE 0 
            END as roi_percent
        FROM investments 
        WHERE user_id = user_id_param 
        AND is_active = true
    ),
    best_worst AS (
        SELECT 
            (SELECT symbol FROM investments 
             WHERE user_id = user_id_param AND is_active = true 
             ORDER BY roi_percentage DESC LIMIT 1) as best_symbol,
            (SELECT symbol FROM investments 
             WHERE user_id = user_id_param AND is_active = true 
             ORDER BY roi_percentage ASC LIMIT 1) as worst_symbol
    )
    SELECT 
        ps.investment_count,
        ps.purchase_total,
        ps.current_total,
        ps.roi_total,
        ps.roi_percent,
        bw.best_symbol,
        bw.worst_symbol
    FROM portfolio_stats ps, best_worst bw;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Tax Report generieren
CREATE OR REPLACE FUNCTION get_user_tax_report(
    user_id_param UUID,
    year_param INTEGER DEFAULT NULL
)
RETURNS TABLE(
    investment_id UUID,
    symbol VARCHAR(20),
    purchase_date TIMESTAMP WITH TIME ZONE,
    purchase_total_usd DECIMAL(20,2),
    current_value_usd DECIMAL(20,2),
    roi_absolute_usd DECIMAL(20,2),
    roi_percentage DECIMAL(10,4),
    tax_category VARCHAR(50),
    holding_period_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.symbol,
        i.purchase_date,
        i.purchase_total_usd,
        i.current_value_usd,
        i.roi_absolute_usd,
        i.roi_percentage,
        i.tax_category,
        EXTRACT(DAY FROM (NOW() - i.purchase_date))::INTEGER as holding_days
    FROM investments i
    WHERE i.user_id = user_id_param 
    AND i.is_active = true
    AND i.tax_relevant = true
    AND (year_param IS NULL OR EXTRACT(YEAR FROM i.purchase_date) = year_param)
    ORDER BY i.purchase_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kommentare für Dokumentation
COMMENT ON TABLE investments IS 'Investment-Tracking für ROI-Berechnung und Steuerberichte (DSGVO-konform)';
COMMENT ON COLUMN investments.symbol IS 'Token-Symbol (z.B. PLS, ETH, HEX)';
COMMENT ON COLUMN investments.purchase_price_usd IS 'Kaufpreis pro Token in USD';
COMMENT ON COLUMN investments.purchase_amount IS 'Anzahl gekaufter Token';
COMMENT ON COLUMN investments.roi_percentage IS 'ROI in Prozent (positiv = Gewinn, negativ = Verlust)';
COMMENT ON COLUMN investments.tax_relevant IS 'Ob dieser Trade steuerrelevant ist';
COMMENT ON COLUMN investments.tax_category IS 'Steuer-Kategorie für Compliance'; 