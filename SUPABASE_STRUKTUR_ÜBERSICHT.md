# 🗄️ SUPABASE DATENBANK STRUKTUR - KOMPLETT ÜBERSICHT

## 📊 **HAUPTTABELLEN (Core System)**

### 1. **👤 USER_PROFILES** - Benutzer & Subscriptions
```sql
- id (UUID) - Verknüpft mit auth.users  
- email (TEXT) - Email des Users
- subscription_status (TEXT) - 'trial', 'active', 'cancelled', 'expired'
- trial_ends_at (TIMESTAMP) - Wann Trial endet
- stripe_customer_id (TEXT) - Stripe Integration
- created_at / updated_at (TIMESTAMP)
```

### 2. **💳 SUBSCRIPTIONS** - Alternative PayPal Subscriptions  
```sql
- id (UUID) - Unique ID
- user_id (UUID) - Verknüpft mit Users
- status (TEXT) - 'trial', 'active', 'cancelled', 'expired'  
- start_date / end_date (TIMESTAMP)
- paypal_subscription_id (TEXT) - PayPal Integration
```

### 3. **🔗 TRANSACTIONS_CACHE** - Moralis API Cache
```sql
- user_id (UUID) - Welcher User
- wallet_address (TEXT) - Welche Wallet  
- chain (TEXT) - 'eth', 'pulse', etc.
- transaction_data (JSONB) - Cached Moralis Daten
- expires_at (TIMESTAMP) - Cache Ablauf (10 min)
```

### 4. **🙈 HIDDEN_TOKENS** - Portfolio Filtering
```sql
- user_id (UUID) - Welcher User
- token_address (TEXT) - Token Contract Address
- chain (TEXT) - Welche Blockchain
- hidden_at (TIMESTAMP) - Wann versteckt
```

### 5. **💰 ROI_ENTRIES** - ROI Tracking & Steuer
```sql
- user_id (UUID) - Welcher User
- token_address (TEXT) - Token Contract
- purchase_price (DECIMAL) - Einkaufspreis  
- purchase_date (TIMESTAMP) - Kaufdatum
- purchase_amount (DECIMAL) - Gekaufte Menge
- notes (TEXT) - Notizen
```

---

## 🔧 **CACHE & PERFORMANCE TABELLEN**

### 6. **📈 PORTFOLIO_CACHE** - Portfolio Performance Cache
```sql
- user_id (UUID) - Welcher User
- wallet_address (TEXT) - Welche Wallet
- portfolio_data (JSONB) - Gecachte Portfolio Daten
- total_value_usd (DECIMAL) - Gesamtwert USD
- expires_at (TIMESTAMP) - Cache Ablauf
```

### 7. **💲 TOKEN_PRICE_CACHE** - Token Preis Cache
```sql
- token_address (TEXT) - Token Contract
- chain (TEXT) - Blockchain
- price_usd (DECIMAL) - Aktueller USD Preis
- price_source (TEXT) - 'moralis', 'coingecko', etc.
- cached_at (TIMESTAMP) - Wann gecacht
```

### 8. **🎯 ROI_ANALYSIS_CACHE** - ROI Analyse Cache
```sql
- user_id (UUID) - Welcher User
- analysis_data (JSONB) - ROI Berechnungen
- total_roi_percent (DECIMAL) - Gesamt ROI %
- best_performer (TEXT) - Bester Token
- worst_performer (TEXT) - Schlechtester Token
```

---

## 📊 **STEUER & TRACKING TABELLEN**

### 9. **🧾 TAX_REPORTS** - Steuerreports (Deutsch)
```sql
- user_id (UUID) - Welcher User
- report_year (INTEGER) - Steuerjahr
- report_data (JSONB) - Kompletter Steuerreport
- fifo_calculations (JSONB) - FIFO Berechnungen
- total_gains_eur (DECIMAL) - Gesamtgewinn EUR
- generated_at (TIMESTAMP) - Wann erstellt
```

### 10. **🔄 TOKEN_TRANSACTIONS** - Detaillierte TX Historie
```sql
- user_id (UUID) - Welcher User
- transaction_hash (TEXT) - TX Hash
- token_address (TEXT) - Token Contract
- action_type (TEXT) - 'buy', 'sell', 'transfer', 'roi'
- amount (DECIMAL) - Menge
- price_eur (DECIMAL) - Preis in EUR zur Zeit der TX
- timestamp (TIMESTAMP) - TX Zeitstempel
```

### 11. **📋 FIFO_QUEUE** - FIFO Berechnung für Steuern
```sql
- user_id (UUID) - Welcher User
- token_address (TEXT) - Token Contract  
- purchase_date (TIMESTAMP) - Kaufdatum
- amount_remaining (DECIMAL) - Noch verfügbare Menge
- purchase_price_eur (DECIMAL) - Kaufpreis in EUR
```

---

## 🔐 **AUTH & SECURITY**

### 12. **🔑 AUTH.USERS** - Supabase Standard Auth
```sql
- id (UUID) - User ID (Primary)
- email (TEXT) - Email
- encrypted_password (TEXT) - Passwort Hash
- email_confirmed_at (TIMESTAMP) - Email bestätigt
- created_at / updated_at (TIMESTAMP)
```

### 13. **📊 USER_ACTIVITY_LOG** - Activity Tracking
```sql
- user_id (UUID) - Welcher User
- action (TEXT) - 'login', 'portfolio_view', 'tax_export'
- details (JSONB) - Zusätzliche Details
- ip_address (INET) - IP des Users
- timestamp (TIMESTAMP) - Wann passiert
```

### 14. **⏱️ API_USAGE_TRACKING** - API Rate Limiting
```sql
- user_id (UUID) - Welcher User
- endpoint (TEXT) - Welcher API Endpoint
- requests_count (INTEGER) - Anzahl Requests
- window_start (TIMESTAMP) - Rate Limit Fenster Start
- last_request (TIMESTAMP) - Letzter Request
```

---

## 🎯 **ZUSAMMENFASSUNG**

**GESAMT: 14 Haupttabellen**

**💡 Hauptfunktionen:**
- ✅ **User Management** (auth.users, user_profiles)
- ✅ **Subscription System** (subscriptions, trial management)  
- ✅ **Portfolio Tracking** (portfolio_cache, token_price_cache)
- ✅ **ROI Management** (roi_entries, roi_analysis_cache)
- ✅ **Steuer System** (tax_reports, fifo_queue, token_transactions)
- ✅ **Performance** (Alle cache Tabellen, 10min expiry)
- ✅ **Security** (RLS Policies, activity logs, rate limiting)

**🔒 Alle Tabellen haben:**
- ✅ Row Level Security (RLS) aktiviert
- ✅ user_id Foreign Keys zu auth.users
- ✅ Indizes für Performance  
- ✅ Timestamp Tracking
- ✅ CASCADE DELETE bei User-Löschung 