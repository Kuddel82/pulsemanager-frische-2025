-- Erstelle die subscriptions Tabelle
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'cancelled', 'expired')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paypal_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Erstelle Indizes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- Erstelle eine Funktion zum Aktualisieren des updated_at Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Erstelle einen Trigger für die automatische Aktualisierung des updated_at Timestamps
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Erstelle Row Level Security (RLS) Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy für Benutzer: Nur Zugriff auf eigene Daten
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy für Benutzer: Nur Einfügen eigener Daten
CREATE POLICY "Users can insert their own subscription"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy für Benutzer: Nur Aktualisieren eigener Daten
CREATE POLICY "Users can update their own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Kommentare
COMMENT ON TABLE subscriptions IS 'Speichert Benutzerabonnements mit PayPal-Integration';
COMMENT ON COLUMN subscriptions.user_id IS 'Referenz auf den Benutzer';
COMMENT ON COLUMN subscriptions.status IS 'Status des Abonnements (trial, active, cancelled, expired)';
COMMENT ON COLUMN subscriptions.start_date IS 'Startdatum des Abonnements';
COMMENT ON COLUMN subscriptions.end_date IS 'Enddatum des Abonnements';
COMMENT ON COLUMN subscriptions.paypal_subscription_id IS 'PayPal Subscription ID für die Abrechnung'; 