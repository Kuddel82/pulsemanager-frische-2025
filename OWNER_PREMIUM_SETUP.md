# 🎉 OWNER PREMIUM SETUP

## Schritt-für-Schritt Anleitung um `dkuddel@web.de` auf PERMANENT PREMIUM zu setzen:

### 📋 VORAUSSETZUNGEN:
1. ✅ Account `dkuddel@web.de` muss in Supabase registriert sein
2. ✅ Zugang zur Supabase Console

---

## 🚀 PREMIUM FREISCHALTUNG:

### **METHOD 1: Supabase SQL Editor (EMPFOHLEN)**

1. **Gehe zu Supabase Console:**
   - https://supabase.com/dashboard/projects
   - Wähle dein `PulseManager` Projekt

2. **Öffne SQL Editor:**
   - Links im Menü: `SQL Editor`
   - Klicke `New query`

3. **Führe das Premium-Script aus:**
   - Kopiere den kompletten Inhalt von `set_owner_premium.sql`
   - Füge ihn in den SQL Editor ein
   - Klicke `Run` (RUN-Button)

4. **Überprüfe die Ausgabe:**
   ```
   ✅ Subscriptions table updated successfully
   ✅ User_profiles table updated successfully  
   ✅ Auth.users metadata updated successfully
   🎉 OWNER dkuddel@web.de set to PERMANENT PREMIUM!
   ```

---

### **METHOD 2: Manuell über Supabase Table Editor**

**Falls SQL Editor nicht funktioniert:**

1. **Erstelle user_profiles Tabelle** (falls nicht vorhanden):
   - Gehe zu `Table Editor`
   - `Create new table`: `user_profiles`
   - Columns:
     - `id` (uuid, primary key, references auth.users.id)
     - `subscription_status` (text, default: 'trialing')
     - `trial_ends_at` (timestamptz)
     - `stripe_customer_id` (text)

2. **Füge deinen Premium-Eintrag hinzu:**
   - Öffne `user_profiles` Tabelle
   - `Insert row`
   - `id`: Deine User-ID aus auth.users
   - `subscription_status`: `active`
   - `trial_ends_at`: `2124-01-01 00:00:00+00` (100 Jahre)
   - `stripe_customer_id`: `OWNER_PERMANENT_PREMIUM`

---

## 🔍 VERIFIZIERUNG:

### **Test ob Premium funktioniert:**

1. **Logge dich in die App ein** mit `dkuddel@web.de`

2. **Öffne Browser Console** (F12)

3. **Überprüfe Subscription Status:**
   ```javascript
   // Sollte 'active' zeigen
   console.log("Subscription Status:", window.appContext?.subscriptionStatus);
   ```

4. **Teste Premium Features:**
   - Alle Views sollten zugänglich sein
   - Keine "Premium Required" Meldungen
   - ROI Tracker, Tax Reports, etc. verfügbar

---

## 🎯 ERWARTETES ERGEBNIS:

- ✅ **Permanent Premium** bis 2124
- ✅ **Alle Features** freigeschaltet
- ✅ **Keine Trial-Beschränkungen**
- ✅ **Owner-Status** in Metadaten

---

## 🛠️ TROUBLESHOOTING:

### **Falls Premium nicht funktioniert:**

1. **Check User ID:**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'dkuddel@web.de';
   ```

2. **Check Subscription:**
   ```sql
   SELECT * FROM user_profiles WHERE id = (
     SELECT id FROM auth.users WHERE email = 'dkuddel@web.de'
   );
   ```

3. **Manual Fix:**
   ```sql
   UPDATE user_profiles 
   SET subscription_status = 'active',
       trial_ends_at = NOW() + INTERVAL '100 years'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'dkuddel@web.de');
   ```

---

## 💡 HINWEISE:

- **Premium Status ist permanent** (100 Jahre gültig)
- **Funktioniert für alle Premium-Features**
- **Ist owner-sicher** (nur für dkuddel@web.de)
- **Überschreibt alle Trial-Beschränkungen**

🎊 **VIEL SPASS MIT DEINER PREMIUM PULSEMANAGER APP!** 🎊 