# 🔵 MORALIS ENTERPRISE SETUP GUIDE

## 🎯 **ÜBERSICHT**
Diese Anleitung erklärt, wie du deine Moralis Web3 Data API korrekt für PulseManager konfigurierst.

---

## 🔑 **1. MORALIS API KEY SETUP**

### **Schritt 1: Moralis Account**
1. Gehe zu https://admin.moralis.io/
2. Registriere dich oder logge dich ein
3. Erstelle ein neues Projekt

### **Schritt 2: API Key generieren**
1. Gehe zu "Web3 APIs" → "Your API Key"
2. Kopiere deinen API Key
3. **WICHTIG:** Notiere dir den Key sicher!

### **Schritt 3: Environment Variables setzen**

#### **Lokale Entwicklung (.env file):**
```bash
# Erstelle eine .env Datei im Root-Verzeichnis
MORALIS_API_KEY=dein_echter_moralis_api_key_hier
MORALIS_BASE_URL=https://deep-index.moralis.io/api/v2.2
```

#### **Vercel Production Deployment:**
1. Gehe zu deinem Vercel Dashboard
2. Settings → Environment Variables
3. Füge hinzu:
   - `MORALIS_API_KEY` = dein API Key
   - `MORALIS_BASE_URL` = https://deep-index.moralis.io/api/v2.2

---

## 🧪 **2. API INTEGRATION TESTEN**

### **Test 1: Development Server starten**
```bash
npm run dev
```

### **Test 2: Browser-Console Test**
```javascript
// Öffne Browser Console (F12) und führe aus:
testMoralisIntegration()
```

### **Test 3: Manual API Test**
```bash
# Terminal test (benötigt node-fetch)
node test-moralis-integration.js
```

---

## 📊 **3. UNTERSTÜTZTE MORALIS WEB3 DATA API ENDPOINTS**

### **✅ Vollständig implementiert:**

| **Endpoint** | **URL** | **Funktion** |
|-------------|---------|--------------|
| **Token Balances** | `/api/moralis-tokens?endpoint=wallet-tokens` | ERC20 Token-Bestände |
| **Token Prices** | `/api/moralis-prices?endpoint=token-prices` | Live Token-Preise |
| **Transaction History** | `/api/moralis-transactions?endpoint=wallet-history` | Transaktions-Historie |
| **Token Metadata** | `/api/moralis-token-metadata?endpoint=token-metadata` | Token-Informationen |
| **Portfolio Overview** | `/api/moralis-portfolio?endpoint=portfolio` | Portfolio-Übersicht |

### **🌐 Multi-Chain Support:**
- **PulseChain:** `chain=369` oder `chain=pulsechain`
- **Ethereum:** `chain=1` oder `chain=ethereum`

---

## 🔒 **4. SICHERHEIT & BEST PRACTICES**

### **✅ API Key Security (korrekt implementiert):**
- ✅ API Key ist nur serverseitig verfügbar (`process.env.MORALIS_API_KEY`)
- ✅ Frontend kann NICHT auf API Key zugreifen (F12 zeigt nichts)
- ✅ Alle API-Calls laufen über sichere Proxy-Endpunkte
- ✅ Rate Limiting und Error Handling implementiert

### **🛡️ Scam Protection:**
- ✅ Plausibilitätsprüfung für Token-Preise >$1000
- ✅ Trusted Token Whitelist für bekannte Tokens
- ✅ Portfolio-Wert-Limits für verdächtige Token

---

## 🚀 **5. MORALIS WEB3 DATA API FEATURES**

### **Was du mit der aktuellen Integration bekommst:**

#### **Real-time Token Data:**
- ✅ Live ERC20 Token Balances
- ✅ Real-time Token Preise (USD)
- ✅ Token Metadata (Symbol, Name, Decimals)
- ✅ Multi-Chain Support (PulseChain + Ethereum)

#### **Portfolio Management:**
- ✅ Automatische Portfolio-Berechnung
- ✅ Token-Wert in USD
- ✅ Portfolio-Distribution
- ✅ Historical Transaction Data

#### **Tax & ROI Tracking:**
- ✅ ROI-Transaction Detection
- ✅ Deutsche Steuerlogik (§ 22 EStG)
- ✅ CSV/PDF Export für Steuerberater
- ✅ Unlimited Transaction History

---

## 🔧 **6. TROUBLESHOOTING**

### **Problem: "Moralis API not configured"**
**Lösung:**
1. Prüfe `.env` Datei existiert
2. Prüfe `MORALIS_API_KEY` ist gesetzt
3. Restart development server

### **Problem: "401 Invalid API key"**
**Lösung:**
1. Prüfe API Key ist korrekt kopiert
2. Keine Leerzeichen vor/nach dem Key
3. Moralis Dashboard prüfen ob Key aktiv

### **Problem: "429 Rate limit exceeded"**
**Lösung:**
1. Warte 1 Minute
2. Reduziere API-Calls
3. Upgrade Moralis Plan bei Bedarf

### **Problem: Portfolio lädt nicht**
**Lösung:**
1. Browser Console öffnen (F12)
2. Schaue nach API-Fehlern
3. Teste API mit `testMoralisIntegration()`

---

## 📚 **7. OFFIZIELLE DOCUMENTATION**

### **Moralis Web3 Data API:**
- **Hauptdokumentation:** https://docs.moralis.com/web3-data-api/evm
- **ERC20 Endpoints:** https://docs.moralis.com/web3-data-api/evm/reference/get-wallet-token-balances
- **Price Endpoints:** https://docs.moralis.com/web3-data-api/evm/reference/get-multiple-token-prices
- **Rate Limits:** https://docs.moralis.com/web3-data-api/evm/rate-limits

### **Chain Support:**
- **PulseChain:** Chain ID 0x171 (369)
- **Ethereum:** Chain ID 0x1 (1)
- **Weitere Chains:** https://docs.moralis.com/web3-data-api/evm/supported-chains

---

## ✅ **8. VERIFICATION CHECKLIST**

Prüfe diese Punkte um sicherzustellen, dass alles korrekt funktioniert:

- [ ] Moralis API Key in `.env` gesetzt
- [ ] Development server läuft (`npm run dev`)
- [ ] Browser Console zeigt keine API-Fehler
- [ ] Portfolio lädt echte Token-Daten
- [ ] Token-Preise sind aktuell (nicht 0)
- [ ] Test-Script läuft erfolgreich
- [ ] Multi-Chain Support funktioniert
- [ ] API Key ist nicht im Frontend sichtbar

---

## 🎉 **FAZIT**

Mit der korrekten Moralis-Integration hast du Zugriff auf:
- **Enterprise-Grade Web3 Data**
- **Real-time Token Preise**
- **Multi-Chain Support**
- **Professional API Architecture**
- **DSGVO-konforme Sicherheit**

Dein PulseManager ist jetzt mit modernster Blockchain-API-Technologie ausgestattet! 🚀 