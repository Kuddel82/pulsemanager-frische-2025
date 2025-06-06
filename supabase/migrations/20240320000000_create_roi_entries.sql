-- Create ROI entries table
CREATE TABLE IF NOT EXISTS roi_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    symbol TEXT,
    quantity DECIMAL(78, 18),
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(78, 18) NOT NULL,
    current_value DECIMAL(78, 18) NOT NULL,
    wallet_address TEXT,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS roi_entries_user_id_idx ON roi_entries(user_id);
CREATE INDEX IF NOT EXISTS roi_entries_symbol_idx ON roi_entries(symbol);
CREATE INDEX IF NOT EXISTS roi_entries_purchase_date_idx ON roi_entries(purchase_date);
CREATE INDEX IF NOT EXISTS roi_entries_wallet_address_idx ON roi_entries(wallet_address);
CREATE INDEX IF NOT EXISTS roi_entries_source_idx ON roi_entries(source);

-- Create RLS policies
ALTER TABLE roi_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ROI entries"
    ON roi_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ROI entries"
    ON roi_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ROI entries"
    ON roi_entries FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ROI entries"
    ON roi_entries FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_roi_entries_updated_at
    BEFORE UPDATE ON roi_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 