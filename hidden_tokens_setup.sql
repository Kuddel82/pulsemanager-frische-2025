-- 💾 HIDDEN TOKENS TABLE SETUP
-- Tabelle für versteckte Token pro User (Scam-Schutz)

-- Erstelle die Tabelle
CREATE TABLE IF NOT EXISTS hidden_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) aktivieren
ALTER TABLE hidden_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: User kann nur eigene Daten sehen/bearbeiten
CREATE POLICY "Users can only access their own hidden tokens" ON hidden_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Policy: User kann eigene Daten erstellen
CREATE POLICY "Users can create their own hidden tokens" ON hidden_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_hidden_tokens_user_id ON hidden_tokens(user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hidden_tokens_updated_at 
  BEFORE UPDATE ON hidden_tokens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Kommentar für Dokumentation
COMMENT ON TABLE hidden_tokens IS 'Speichert versteckte Token-Adressen pro User für Scam-Schutz';
COMMENT ON COLUMN hidden_tokens.user_id IS 'Referenz zum auth.users';
COMMENT ON COLUMN hidden_tokens.tokens IS 'Array von Token-Identifiern (contract_address oder symbol)';
COMMENT ON COLUMN hidden_tokens.created_at IS 'Erstellungszeitpunkt';
COMMENT ON COLUMN hidden_tokens.updated_at IS 'Letzte Änderung';

-- Test-Query (optional)
-- SELECT * FROM hidden_tokens WHERE user_id = auth.uid(); 