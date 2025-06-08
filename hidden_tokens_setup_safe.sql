-- 💾 HIDDEN TOKENS TABLE SETUP (SAFE VERSION)
-- Überspringe bereits existierende Policies und Tabellen

-- Erstelle die Tabelle nur wenn sie nicht existiert
CREATE TABLE IF NOT EXISTS hidden_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktivieren (nur wenn nicht bereits aktiv)
ALTER TABLE hidden_tokens ENABLE ROW LEVEL SECURITY;

-- Policies nur erstellen wenn sie nicht existieren
DO $$
BEGIN
  -- Policy für Zugriff prüfen und erstellen
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hidden_tokens' 
    AND policyname = 'Users can only access their own hidden tokens'
  ) THEN
    CREATE POLICY "Users can only access their own hidden tokens" ON hidden_tokens
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Policy für Insert prüfen und erstellen  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hidden_tokens' 
    AND policyname = 'Users can create their own hidden tokens'
  ) THEN
    CREATE POLICY "Users can create their own hidden tokens" ON hidden_tokens
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Index nur erstellen wenn er nicht existiert
CREATE INDEX IF NOT EXISTS idx_hidden_tokens_user_id ON hidden_tokens(user_id);

-- Trigger-Funktion nur erstellen wenn sie nicht existiert
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger nur erstellen wenn er nicht existiert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_hidden_tokens_updated_at'
  ) THEN
    CREATE TRIGGER update_hidden_tokens_updated_at 
      BEFORE UPDATE ON hidden_tokens 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Test ob alles funktioniert
SELECT 'Hidden tokens table setup completed successfully!' as status; 