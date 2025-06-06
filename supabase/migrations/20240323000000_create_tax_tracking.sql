-- Erstelle Tabelle für Token-Transaktionen
CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    token_address TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'transfer_in', 'transfer_out')),
    amount DECIMAL(38,18) NOT NULL,
    price_in_eur DECIMAL(38,2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Erstelle Tabelle für Token-Haltefristen
CREATE TABLE token_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_address TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    amount DECIMAL(38,18) NOT NULL,
    average_purchase_price DECIMAL(38,2) NOT NULL,
    first_purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    last_update_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Erstelle Tabelle für tägliche ROI-Tracking
CREATE TABLE daily_roi_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_address TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    date DATE NOT NULL,
    opening_price DECIMAL(38,2) NOT NULL,
    closing_price DECIMAL(38,2) NOT NULL,
    daily_roi DECIMAL(10,2) NOT NULL,
    amount_held DECIMAL(38,18) NOT NULL,
    value_in_eur DECIMAL(38,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Erstelle Tabelle für Steuerberichte
CREATE TABLE tax_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('annual', 'quarterly')),
    report_data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Erstelle Indizes für bessere Performance
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_date ON token_transactions(transaction_date);
CREATE INDEX idx_token_holdings_user_id ON token_holdings(user_id);
CREATE INDEX idx_daily_roi_tracking_user_id ON daily_roi_tracking(user_id);
CREATE INDEX idx_daily_roi_tracking_date ON daily_roi_tracking(date);
CREATE INDEX idx_tax_reports_user_id ON tax_reports(user_id);
CREATE INDEX idx_tax_reports_year ON tax_reports(year);

-- Erstelle RLS Policies
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_roi_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_reports ENABLE ROW LEVEL SECURITY;

-- Policies für token_transactions
CREATE POLICY "Users can view their own transactions"
    ON token_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON token_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies für token_holdings
CREATE POLICY "Users can view their own holdings"
    ON token_holdings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holdings"
    ON token_holdings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies für daily_roi_tracking
CREATE POLICY "Users can view their own ROI tracking"
    ON daily_roi_tracking FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ROI tracking"
    ON daily_roi_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies für tax_reports
CREATE POLICY "Users can view their own tax reports"
    ON tax_reports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax reports"
    ON tax_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_token_transactions_updated_at
    BEFORE UPDATE ON token_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_holdings_updated_at
    BEFORE UPDATE ON token_holdings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_roi_tracking_updated_at
    BEFORE UPDATE ON daily_roi_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_reports_updated_at
    BEFORE UPDATE ON tax_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 