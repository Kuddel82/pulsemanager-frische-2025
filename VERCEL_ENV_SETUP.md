# 🚀 VERCEL ENVIRONMENT VARIABLES SETUP

## Für www.pulsemanager.vip Live-Deployment

Du musst die Environment Variables auch in Vercel konfigurieren, damit die Live-Website funktioniert.

### Schritt-für-Schritt Anleitung:

1. **Gehe zu Vercel Dashboard:** https://vercel.com/dashboard
2. **Wähle dein PulseManager Projekt**
3. **Gehe zu Settings → Environment Variables**
4. **Füge die folgenden Variables hinzu:**

### Variable 1:
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://haixlpufbsboumblzlqcf.supabase.co`
- **Environment:** Production, Preview, Development (alle auswählen)

### Variable 2:
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhaXhscHVmYnNib3VtbHpscWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NjU2MjQsImV4cCI6MjA2NDQ0MTYyNH0.iY-MiQCWyCnnOh40GokRSQIK4HM_cd0kG6-02-ijZVE`
- **Environment:** Production, Preview, Development (alle auswählen)

### Nach dem Hinzufügen:
1. **Redeploy triggern:** Push einen neuen Commit oder trigger manuell
2. **Warten auf Deployment:** ~2-3 Minuten
3. **Testen:** www.pulsemanager.vip öffnen und Login testen

## ✅ Erwartetes Ergebnis:
- Login/Register Formulare funktionieren
- Echte User-Registrierung möglich
- Session-Management aktiv
- Dashboard-Zugriff nach Anmeldung

## ❌ Troubleshooting:
Wenn noch Fehler auftreten:
- Vercel Environment Variables nochmal prüfen
- Build Logs in Vercel checken
- Browser Console für Auth-Errors prüfen 