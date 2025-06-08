-- Create transactions table for historical transaction data
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Transaction Details
  hash TEXT NOT NULL UNIQUE,
  block_number BIGINT,
  timestamp TIMESTAMP WITH TIME ZONE,
  from_address TEXT,
  to_address TEXT,
  
  -- Token Information
  token_symbol TEXT,
  token_name TEXT,
  token_contract TEXT,
  token_decimals INTEGER DEFAULT 18,
  
  -- Amount and Value
  amount_raw TEXT, -- Store as string to handle large numbers
  amount_formatted DECIMAL(36,18),
  usd_value DECIMAL(15,2) DEFAULT 0,
  
  -- ROI Classification
  is_roi_transaction BOOLEAN DEFAULT FALSE,
  roi_source_type TEXT, -- 'mint', 'dividend', 'yield', 'airdrop', etc.
  
  -- Tax Categories (German DSGVO compliant)
  tax_category TEXT, -- 'capital_gains', 'other_income', 'exempt'
  tax_relevant BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  gas_used BIGINT,
  gas_price TEXT,
  transaction_fee DECIMAL(18,8),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_wallet ON transactions(user_id, wallet_address);
CREATE INDEX idx_transactions_hash ON transactions(hash);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX idx_transactions_roi ON transactions(user_id, is_roi_transaction) WHERE is_roi_transaction = true;
CREATE INDEX idx_transactions_token ON transactions(token_contract, token_symbol);

-- Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own transactions
CREATE POLICY "Users can access own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 