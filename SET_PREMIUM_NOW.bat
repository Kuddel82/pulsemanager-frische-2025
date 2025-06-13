@echo off
cls
echo.
echo 🚀 PULSEMANAGER - PREMIUM SETUP FÜR dkuddel@web.de
echo ================================================
echo.
echo Ziel: dkuddel@web.de auf unbestimmte Zeit Premium machen
echo.
echo 📋 ANWEISUNGEN:
echo.
echo 1. Öffne Supabase Dashboard (https://app.supabase.com/)
echo 2. Wähle dein PulseManager-Projekt
echo 3. Gehe zu "SQL Editor"
echo 4. Kopiere den kompletten Inhalt von make_dkuddel_premium_complete.sql
echo 5. Füge ihn in den SQL Editor ein und führe ihn aus
echo.
echo 📁 SQL-Files erstellt:
echo    ✅ make_dkuddel_premium_complete.sql (VOLLSTÄNDIG - beide Tabellen)
echo    ✅ make_dkuddel_premium.sql (nur subscriptions Tabelle)
echo.
echo ⚡ DAS SCRIPT SETZT:
echo    - user_profiles.subscription_status = 'active'
echo    - user_profiles.trial_ends_at = 2099-12-31
echo    - subscriptions.status = 'active' 
echo    - subscriptions.end_date = 2099-12-31
echo    - subscriptions.paypal_subscription_id = 'MANUAL_PREMIUM_UNLIMITED'
echo.
echo 🔍 VERIFICATION:
echo    Das Script zeigt automatisch den finalen Status in beiden Tabellen
echo.

pause

echo.
echo 📄 ZEIGE SQL-SCRIPT INHALT:
echo ================================
echo.
type make_dkuddel_premium_complete.sql
echo.
echo ================================
echo.
echo ✅ PREMIUM-SETUP BEREIT!
echo.
echo Nach dem Ausführen in Supabase sollte dkuddel@web.de
echo sofort Premium-Zugang zu allen Features haben.
echo.
pause 