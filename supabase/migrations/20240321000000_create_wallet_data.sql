-- Erstelle die wallet_data Tabelle
CREATE TABLE IF NOT EXISTS wallet_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  balances JSONB NOT NULL DEFAULT '[]',
  transactions JSONB NOT NULL DEFAULT '[]',
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, wallet_address)
);

-- Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_wallet_data_user_id ON wallet_data(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_data_wallet_address ON wallet_data(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_data_last_update ON wallet_data(last_update);

-- Erstelle eine Funktion zum Aktualisieren des updated_at Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Erstelle einen Trigger für die automatische Aktualisierung des updated_at Timestamps
CREATE TRIGGER update_wallet_data_updated_at
  BEFORE UPDATE ON wallet_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Erstelle Row Level Security (RLS) Policies
ALTER TABLE wallet_data ENABLE ROW LEVEL SECURITY;

-- Policy für Premium-Nutzer: Vollzugriff auf eigene Daten
CREATE POLICY "Premium users can manage their own wallet data"
  ON wallet_data
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND is_premium = true
    )
  );

-- Policy für normale Nutzer: Nur Lesen der eigenen Daten
CREATE POLICY "Regular users can read their own wallet data"
  ON wallet_data
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- Policy für normale Nutzer: Nur Einfügen eigener Daten
CREATE POLICY "Regular users can insert their own wallet data"
  ON wallet_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Policy für normale Nutzer: Nur Aktualisieren eigener Daten
CREATE POLICY "Regular users can update their own wallet data"
  ON wallet_data
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- Policy für normale Nutzer: Nur Löschen eigener Daten
CREATE POLICY "Regular users can delete their own wallet data"
  ON wallet_data
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- Kommentare für die Tabelle und Spalten
COMMENT ON TABLE wallet_data IS 'Speichert Wallet-Daten für Premium-Nutzer mit erhöhter Sicherheit';
COMMENT ON COLUMN wallet_data.user_id IS 'Referenz auf den Benutzer';
COMMENT ON COLUMN wallet_data.wallet_address IS 'Die Wallet-Adresse des Benutzers';
COMMENT ON COLUMN wallet_data.balances IS 'JSON-Array mit Token-Balances';
COMMENT ON COLUMN wallet_data.transactions IS 'JSON-Array mit Transaktionen';
COMMENT ON COLUMN wallet_data.last_update IS 'Zeitpunkt der letzten Aktualisierung'; 