/*
📊 SUPABASE: Transactions Cache Setup für TAX SERVICE - FIXED VERSION
Ziel: Unbegrenzte Transaktionen + performante Steuerberichte
*/

-- 🗃️ TRANSACTIONS CACHE TABELLE (Haupttabelle)
CREATE TABLE IF NOT EXISTS transactions_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 👤 User-Referenz
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID, -- Kann NULL sein falls lokale Wallet-IDs
  wallet_address TEXT, -- 🔧 FIXED: Fehlende Spalte hinzugefügt
  
  -- 🔗 Blockchain-Daten
  tx_hash TEXT NOT NULL,
  block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  block_number BIGINT,
  
  -- 🪙 Token-Informationen
  token_symbol TEXT,
  token_name TEXT,
  contract_address TEXT,
  token_decimal INTEGER DEFAULT 18,
  
  -- 📍 Transaktions-Adressen
  from_address TEXT,
  to_address TEXT,
  
  -- 💰 Werte
  raw_value TEXT, -- Für große Zahlen (BigInt als String)
  amount NUMERIC(36, 18), -- Berechneter Token-Amount
  price_usd NUMERIC(16, 8) DEFAULT 0, -- Preis zum Zeitpunkt
  value_usd NUMERIC(16, 2) DEFAULT 0, -- USD-Wert
  
  -- 🏷️ Kategorisierung
  is_incoming BOOLEAN DEFAULT false,
  is_roi_transaction BOOLEAN DEFAULT false, -- Minting/Airdrop
  
  -- ⛽ Gas-Daten
  gas BIGINT,
  gas_price BIGINT,
  gas_used BIGINT,
  
  -- 📋 Meta-Daten
  source TEXT DEFAULT 'pulsechain_api',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 🔒 Eindeutigkeit pro User
  UNIQUE(user_id, tx_hash)
);

-- 🚀 PERFORMANCE-INDIZES
CREATE INDEX IF NOT EXISTS idx_transactions_cache_user_id ON transactions_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cache_timestamp ON transactions_cache(block_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_cache_user_timestamp ON transactions_cache(user_id, block_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_cache_contract ON transactions_cache(contract_address);
CREATE INDEX IF NOT EXISTS idx_transactions_cache_roi ON transactions_cache(user_id, is_roi_transaction, value_usd) WHERE is_roi_transaction = true;
CREATE INDEX IF NOT EXISTS idx_transactions_cache_created ON transactions_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_cache_wallet_address ON transactions_cache(wallet_address); -- 🔧 FIXED: Index für wallet_address

-- 🛡️ ROW LEVEL SECURITY (DSGVO-konform)
ALTER TABLE transactions_cache ENABLE ROW LEVEL SECURITY;

-- 🗑️ LÖSCHE ALTE POLICIES (falls vorhanden)
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions_cache;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions_cache;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions_cache;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions_cache;

-- ✅ NEUE POLICIES ERSTELLEN
CREATE POLICY "Users can view own transactions" ON transactions_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions_cache
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions_cache
  FOR DELETE USING (auth.uid() = user_id);

-- 📊 TAX SUMMARY VIEW (für schnelle Berichte)
CREATE OR REPLACE VIEW tax_summary_view AS
SELECT 
  user_id,
  
  -- 📊 Steuerrelevante Transaktionen (nur ROI/Minting)
  COUNT(*) FILTER (WHERE is_roi_transaction = true AND value_usd > 0) as taxable_transactions_count,
  COALESCE(SUM(value_usd) FILTER (WHERE is_roi_transaction = true), 0) as taxable_income_usd,
  
  -- 🛒 Käufe (nicht steuerpflichtig)
  COUNT(*) FILTER (WHERE is_incoming = true AND is_roi_transaction = false) as purchases_count,
  COALESCE(SUM(value_usd) FILTER (WHERE is_incoming = true AND is_roi_transaction = false), 0) as purchases_usd,
  
  -- 💸 Verkäufe
  COUNT(*) FILTER (WHERE is_incoming = false) as sales_count,
  COALESCE(SUM(value_usd) FILTER (WHERE is_incoming = false), 0) as sales_usd,
  
  -- 📈 Gesamtstatistiken
  COUNT(*) as total_transactions,
  MIN(block_timestamp) as first_transaction,
  MAX(block_timestamp) as last_transaction,
  MAX(created_at) as cache_updated_at
  
FROM transactions_cache
GROUP BY user_id;

-- 🔧 HELPER FUNCTIONS

-- Bereinige alte Cache-Einträge (älter als 7 Tage)
CREATE OR REPLACE FUNCTION cleanup_old_transaction_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM transactions_cache 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Berechne Steuer-Zusammenfassung für User
CREATE OR REPLACE FUNCTION get_tax_summary(target_user_id UUID)
RETURNS TABLE(
  taxable_income_usd NUMERIC,
  taxable_transactions_count BIGINT,
  purchases_usd NUMERIC,
  sales_usd NUMERIC,
  total_transactions_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(tc.value_usd) FILTER (WHERE tc.is_roi_transaction = true), 0) as taxable_income_usd,
    COUNT(*) FILTER (WHERE tc.is_roi_transaction = true AND tc.value_usd > 0) as taxable_transactions_count,
    COALESCE(SUM(tc.value_usd) FILTER (WHERE tc.is_incoming = true AND tc.is_roi_transaction = false), 0) as purchases_usd,
    COALESCE(SUM(tc.value_usd) FILTER (WHERE tc.is_incoming = false), 0) as sales_usd,
    COUNT(*) as total_transactions_count
  FROM transactions_cache tc
  WHERE tc.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 📋 KOMMENTARE UND DOKUMENTATION
COMMENT ON TABLE transactions_cache IS 'Cache für Blockchain-Transaktionen zur Steuerberechnung';
COMMENT ON COLUMN transactions_cache.is_roi_transaction IS 'True für ROI/Minting/Airdrops (steuerpflichtig nach § 22 EStG)';
COMMENT ON COLUMN transactions_cache.value_usd IS 'USD-Wert zum Zeitpunkt der Transaktion für Steuerberechnung';
COMMENT ON VIEW tax_summary_view IS 'Aggregierte Steuer-Statistiken pro User';

-- ✅ Setup-Bestätigung
DO $$
BEGIN
  RAISE NOTICE '✅ TRANSACTIONS CACHE SETUP COMPLETE (SAFE VERSION):';
  RAISE NOTICE '   - Table: transactions_cache (with RLS)';
  RAISE NOTICE '   - View: tax_summary_view';
  RAISE NOTICE '   - Functions: cleanup_old_transaction_cache(), get_tax_summary()';
  RAISE NOTICE '   - Indexes: Performance-optimiert für TAX SERVICE';
  RAISE NOTICE '🎯 Ready for unlimited transaction processing!';
END $$;

-- 🔧 FIXED: Fehlende Spalte zu existierender Tabelle hinzufügen
ALTER TABLE transactions_cache ADD COLUMN IF NOT EXISTS wallet_address TEXT; 