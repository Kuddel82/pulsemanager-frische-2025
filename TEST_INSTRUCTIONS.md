# 🧪 LOGIN & REGISTER TESTING

## 🌐 Lokaler Test: http://localhost:5173

### ✅ Login Page testen (/login)

1. **Gehe zu:** http://localhost:5173/login
2. **Prüfe UI:**
   - ✅ "PulseManager" Header sichtbar
   - ✅ "Anmelden" Card mit Email/Passwort Feldern
   - ✅ Blue-Purple Gradient Button
   - ✅ "Hier registrieren" Link

3. **Teste Auth-Funktionen:**
   - **Test 1:** Falsche Daten → Error Alert erscheint
   - **Test 2:** Korrekte Daten → Success Alert + Weiterleitung
   - **Test 3:** Während Loading → Button disabled mit Spinner

### ✅ Register Page testen (/register)

1. **Gehe zu:** http://localhost:5173/register
2. **Prüfe UI:**
   - ✅ "Erstelle dein Konto" Header
   - ✅ Email, Passwort, Passwort bestätigen Felder
   - ✅ Passwort Show/Hide Toggle (👁️ Icons)
   - ✅ Green-Blue Gradient Button

3. **Teste Passwort-Features:**
   - **Passwort-Stärke:** Eingabe zeigt Farbbalken (Rot → Gelb → Grün)
   - **Passwort-Match:** Bestätigung zeigt ✓/✗ Indicator
   - **Validierung:** Button nur aktiv wenn alles korrekt

4. **Teste Registrierung:**
   - **Test 1:** Neue Email → Success + Email-Bestätigung Info
   - **Test 2:** Existierende Email → Error Alert
   - **Test 3:** Schwaches Passwort → Error Alert

## 🔍 Browser Console prüfen

Öffne **F12 → Console** und prüfe:
```
🔍 Environment Variables Debug:
VITE_SUPABASE_URL: https://haixlpufbsboumblzlqcf.supabase.co
VITE_SUPABASE_ANON_KEY: SET
```

## 🎯 Erwartete Flows

### Erfolgreiche Registrierung:
```
/register → [Form ausfüllen] → [Submit] → Success Alert → 
  → Email bestätigt? → /dashboard 
  → Email unbestätigt? → /login (mit Info)
```

### Erfolgreicher Login:
```
/login → [Credentials eingeben] → [Submit] → Success Alert → /dashboard
```

## 🚨 Häufige Probleme

### Problem: "Supabase URL required" Error
**Lösung:** Dev-Server neu starten → `npm run dev`

### Problem: Login schlägt immer fehl
**Prüfung:** 
1. Supabase Dashboard öffnen
2. Authentication → Users prüfen
3. Email bestätigt?

### Problem: Seite lädt nicht
**Prüfung:**
1. http://localhost:5173 öffnet PulseManager?
2. Browser Console nach Errors prüfen
3. Netzwerk-Tab auf 404s prüfen 