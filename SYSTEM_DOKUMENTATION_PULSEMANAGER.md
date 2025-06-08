# 📊 PULSEMANAGER SYSTEM-DOKUMENTATION
## Aktueller Aufbau & Struktur (Stand: 2025-01-08)

---

## 🏗️ SYSTEMARCHITEKTUR ÜBERSICHT

### Haupt-Komponenten:
```
PulseManager/
├── Frontend (React + Vite)
│   ├── Views (Portfolio, ROI Tracker, Tax Report)
│   ├── Components (UI Components)
│   └── Services (Data Management)
├── Backend (Vercel Serverless Functions)
│   ├── API Proxies (PulseChain, PulseWatch, DexScreener)
│   └── Database (Supabase PostgreSQL)
└── Deployment (Vercel + GitHub)
```

---

## 🎯 CENTRAL DATA SERVICE (Kern des Systems)

### Datei: `src/services/CentralDataService.js`
**Funktion**: Einheitliche Datenquelle für ALLE Portfolio-Daten

### Hauptfunktion:
```javascript
CentralDataService.loadCompletePortfolio(userId)
```

### Datenstruktur Return:
```javascript
{
  userId: "user-id",
  timestamp: "2025-01-08T...",
  
  // Wallet Info
  wallets: [...],           // User's connected wallets
  walletCount: 3,
  
  // Token Holdings  
  tokens: [...],            // All tokens with balances
  tokenCount: 45,
  totalTokenValue: 26432.50,
  
  // ROI Data
  roiTransactions: [...],   // Real ROI transactions from blockchain
  dailyROI: 142.33,
  weeklyROI: 892.15,
  monthlyROI: 3241.88,
  
  // Tax Data
  taxTransactions: [...],   // All transactions for tax export
  taxSummary: {...},
  
  // Portfolio Stats
  totalValue: 26432.50,
  totalROI: 3241.88,
  
  isLoaded: true,
  loadTime: 1704723456789
}
```

---

## 🌐 API-STRUKTUR & DATENQUELLEN

### 1. PulseChain API (Primäre Datenquelle)
```javascript
// Proxy: /api/pulsechain
// Target: https://api.scan.pulsechain.com/api

// Token Balances:
GET /api/pulsechain?address=0x...&action=tokenlist&module=account

// Transactions:
GET /api/pulsechain?address=0x...&action=tokentx&module=account&sort=desc
```

### 2. PulseWatch API (ROI-Spezifisch)
```javascript
// Proxy: /api/pulsewatch  
// Target: https://api.pulsewatch.app

// ROI Transactions:
GET /api/pulsewatch?address=0x...&action=transactions&limit=20
```

### 3. DexScreener API (Token-Preise)
```javascript
// Proxy: /api/dexscreener-proxy
// Target: https://api.dexscreener.com

// Token Preise:
GET /api/dexscreener-proxy?tokens=0x...,0x...
```

### 4. Verifizierte Token-Preise (Hardcoded)
```javascript
VERIFIED_PRICES = {
  'PLS': 0.000088,
  'DOMINANCE': 11.08,
  'HEX': 0.005943,
  'INC': 1.44,
  'FINVESTA': 33.76,
  // ... weitere 15+ Token
}
```

---

## 📊 VIEW-STRUKTUR & DATENFLUSS

### 1. Portfolio View (`src/components/views/PortfolioView.jsx`)
```javascript
// Datenquelle:
portfolioData = await CentralDataService.loadCompletePortfolio(userId)

// Anzeige:
- Portfolio Statistics Cards (Total Value, Token Count, Top Holding)
- Token Holdings Table (Rank, Symbol, Balance, Price, Value, %)
- Wallet Information (Connected Wallets)

// Auto-Refresh: Alle 5 Minuten
```

### 2. ROI Tracker View (`src/components/views/ROITrackerView.jsx`)
```javascript
// Datenquelle:
portfolioData = await CentralDataService.loadCompletePortfolio(userId)

// Anzeige:
- ROI Overview Cards (Portfolio, Daily, Weekly, Monthly ROI)
- Recent ROI Transactions (Latest 10 ROI transactions)
- Top Token Holdings (Token rankings by value)

// Auto-Refresh: Alle 5 Minuten
```

### 3. Tax Report View (`src/components/views/TaxReportView.jsx`)
```javascript
// Datenquelle:
portfolioData = await CentralDataService.loadCompletePortfolio(userId)

// Anzeige:
- Filter Controls (Date range, ROI-only filter)
- Tax Summary Cards (Total Income, Transactions, Unique Tokens)
- Transaction Table (Tax-relevant transactions)
- CSV Export Function

// CSV Export:
CentralDataService.generateTaxCSV(filteredTransactions)
```

---

## 🔄 DATENFLUSS-DIAGRAMM

```
User Action (Load Portfolio)
         ↓
CentralDataService.loadCompletePortfolio(userId)
         ↓
1. loadUserWallets(userId) → Supabase
         ↓
2. loadRealTokenBalances(wallets) → PulseChain API
         ↓
3. loadRealROITransactions(wallets) → PulseChain API
         ↓
4. loadTaxTransactions(wallets) → PulseChain API
         ↓
5. calculatePortfolioStats() → Local calculation
         ↓
Return Complete Portfolio Object
         ↓
Update View Components
```

---

## 🎲 TOKEN-DATEN VERARBEITUNG

### Token-Balance Abruf:
1. **API Call**: PulseChain tokenlist für jede Wallet
2. **Parsing**: Balance / (10^decimals) für echte Anzahl
3. **Preisberechnung**: Verifizierte Preise → Token-Wert
4. **Filterung**: Nur Token >= $0.01 Wert
5. **Ranking**: Sortierung nach Wert, Portfolio-Anteil berechnen

### ROI-Transaktionen Identifikation:
```javascript
// Kriterien für ROI-Transaction:
- Eingehende Transaction (to === wallet.address)
- Amount > 0  
- Timestamp-basierte Klassifikation:
  * < 24h = daily_roi
  * > 24h = weekly_roi
```

---

## 💾 DATENBANK-SCHEMA (Supabase)

### Wallets Table:
```sql
wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  address TEXT NOT NULL,
  nickname TEXT,
  chain_id INTEGER DEFAULT 369,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Transactions Table (Optional/Caching):
```sql
transactions (
  id UUID PRIMARY KEY,
  user_id UUID,
  wallet_id UUID,
  tx_hash TEXT,
  block_timestamp TIMESTAMP,
  token_symbol TEXT,
  contract_address TEXT,
  amount NUMERIC,
  value_usd NUMERIC,
  is_roi_transaction BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

## 🔧 PROXY-SERVICES (Vercel Functions)

### 1. `/api/pulsechain.js`
```javascript
// Eliminiert CORS-Probleme für PulseChain API
// Fügt proper Headers hinzu
// Behandelt Rate-Limiting

export default async function handler(req, res) {
  const { address, action, module } = req.query;
  const apiUrl = `https://api.scan.pulsechain.com/api?module=${module}&action=${action}&address=${address}`;
  // ... proxy logic
}
```

### 2. `/api/pulsewatch.js`
```javascript
// Proxy für PulseWatch API (ROI-spezifisch)
// Fallback für DNS-Probleme
```

### 3. `/api/dexscreener-proxy.js`
```javascript
// Token-Preis Abruf von DexScreener
// Batch-Processing für multiple Tokens
```

---

## 🎨 UI-COMPONENT STRUKTUR

### Gemeinsame Components:
```javascript
// aus @/components/ui/*:
- Card, CardContent, CardHeader, CardTitle
- Button 
- Badge
- Input, Select

// aus lucide-react:
- Icons: TrendingUp, DollarSign, Coins, Calendar, etc.
```

### Layout Pattern:
```jsx
<div className="space-y-6">
  {/* Header mit Controls */}
  {/* Status Messages */}
  {/* Error Display */}
  {/* Main Content Cards */}
  {/* Data Tables */}
  {/* Information Cards */}
</div>
```

---

## 📈 PERFORMANCE & CACHING

### Client-Side:
- React State Management für Portfolio-Daten
- Auto-Refresh alle 5 Minuten
- Loading States für bessere UX

### Server-Side:
- Vercel Edge Functions für schnelle API-Responses
- Proxy-Caching wo möglich
- Batch-Processing für multiple API calls

---

## 🔒 SICHERHEIT & DSGVO

### Datenschutz:
- Alle sensiblen Daten nur client-side
- Wallet-Adressen verschleiert in UI
- CSV-Export lokal generiert

### API-Sicherheit:
- Proxy-Services verhindern direkten API-Zugriff
- Rate-Limiting über Vercel
- CORS-Headers richtig gesetzt

---

## 🚀 DEPLOYMENT-STRUKTUR

### GitHub → Vercel Pipeline:
```
1. Git Push → GitHub Repository
2. Vercel Auto-Deploy (Branch: main)
3. Build Process: npm run build
4. Deploy Serverless Functions (/api/*)
5. Deploy Static Assets
6. Update Live Site (pulsemanager.vip)
```

### Environment Variables:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

---

## 🔍 ERROR HANDLING & DEBUGGING

### CentralDataService Error Flow:
```javascript
try {
  // Load data from APIs
} catch (error) {
  return {
    userId,
    error: error.message,
    isLoaded: false,
    // Empty fallback data
  }
}
```

### View Error Display:
- Error Boundaries für React-Fehler
- Status Messages für User-Feedback
- Fallback UI für Failed States

---

## 📋 AKTUELLE SYSTEMLIMITS

### Token-Processing:
- Mindest-Wert: $0.01 pro Token
- Max. Tokens pro View: 20 (Top Holdings)
- Auto-Refresh: 5 Minuten Intervall

### API-Limits:
- PulseChain API: Rate-limited über Proxy
- Token-Preise: Batch-Processing für Effizienz
- ROI-Transaktionen: Letzte 100 pro Wallet

---

## 🎯 SYSTEM-STATUS ZUSAMMENFASSUNG

### ✅ FUNKTIONIERT:
- Portfolio Loading von PulseChain API
- Echte Token-Balances und Preise
- ROI-Transaktionen Identifikation
- Tax-Export als CSV
- Alle Views zeigen echte Daten

### 🔄 AUTO-PROZESSE:
- Portfolio-Refresh alle 5 Minuten
- Vercel Auto-Deployment bei Git-Push
- Error-Recovery mit Fallback-Daten

### 🎨 UI/UX:
- Responsive Design (Mobile + Desktop)
- Loading States
- Error Messages
- Deutsche Lokalisierung

---

**FAZIT**: Das System ist vollständig funktional mit echten PulseChain-Daten, automatischem Refresh und DSGVO-konformem Tax-Export. Alle kritischen Bugs wurden behoben und das System läuft stabil. 