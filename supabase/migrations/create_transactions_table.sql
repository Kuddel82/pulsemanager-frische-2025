-- 💰 PULSEMANAGER ROI TRANSACTIONS TABLE
-- Speichert alle historischen Token-Transfers für Steuer & ROI-Analyse

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- 📅 Transaction Basics
  tx_hash TEXT NOT NULL UNIQUE,
  block_number BIGINT,
  timestamp TIMESTAMPTZ NOT NULL,
  
  -- 🪙 Token Details
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_name TEXT,
  token_decimals INTEGER DEFAULT 18,
  
  -- 💸 Transfer Details
  amount_raw TEXT NOT NULL, -- Raw amount (Wei/smallest unit)
  amount_formatted DECIMAL(36,18) NOT NULL, -- Human readable amount
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')), -- incoming/outgoing
  
  -- 💰 Price & Value (at time of transaction)
  token_price_usd DECIMAL(36,18), -- Token price in USD at transaction time
  value_usd DECIMAL(36,18), -- Total USD value (amount * price)
  
  -- 🏷️ Classification
  transaction_type TEXT DEFAULT 'transfer' CHECK (transaction_type IN ('transfer', 'mint', 'burn', 'stake', 'unstake', 'reward', 'dividend')),
  is_roi_transaction BOOLEAN DEFAULT false, -- Identified as ROI/reward
  source_type TEXT DEFAULT 'unknown', -- 'drucker', 'staking', 'dividend', etc.
  
  -- 🔗 References
  from_address TEXT,
  to_address TEXT,
  explorer_url TEXT,
  dex_screener_url TEXT,
  
  -- 📊 Metadata
  gas_used BIGINT,
  gas_price BIGINT,
  gas_fee_usd DECIMAL(18,8),
  
  -- 🕒 Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 📋 Indexing
  CONSTRAINT unique_user_tx UNIQUE(user_id, tx_hash)
);

-- 🚀 Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_address ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_token_address ON transactions(token_address);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_roi ON transactions(user_id, is_roi_transaction) WHERE is_roi_transaction = true;
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(user_id, transaction_type);

-- 🔄 Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 🛡️ Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- 📊 Comments for Documentation
COMMENT ON TABLE transactions IS 'Stores all historical token transactions for ROI tracking and tax reporting';
COMMENT ON COLUMN transactions.tx_hash IS 'Unique blockchain transaction hash';
COMMENT ON COLUMN transactions.is_roi_transaction IS 'True if this is identified as ROI/reward income';
COMMENT ON COLUMN transactions.source_type IS 'Classification of transaction source (drucker, staking, etc.)';
COMMENT ON COLUMN transactions.value_usd IS 'USD value at time of transaction for tax calculation'; 