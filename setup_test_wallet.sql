-- 🚀 Test Wallet Setup für sofortige Portfolio-Ergebnisse
-- Diese Wallet hat bekannte Token-Holdings auf PulseChain

-- Lösche bestehende Test-Wallets falls vorhanden
DELETE FROM wallets WHERE address = '0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a';

-- Füge die Test-Wallet hinzu (funktioniert für alle User)
INSERT INTO wallets (
  user_id,
  address,
  chain_id,
  name,
  is_active,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Nimmt den ersten verfügbaren User
  '0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a',
  369, -- PulseChain ID
  'Test Portfolio Wallet',
  true,
  NOW(),
  NOW()
);

-- Bestätige die Einfügung
SELECT 
  address,
  chain_id,
  name,
  is_active
FROM wallets 
WHERE address = '0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a'; 