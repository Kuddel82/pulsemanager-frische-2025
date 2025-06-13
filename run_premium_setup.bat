@echo off
echo.
echo 🚀 PULSEMANAGER - PREMIUM USER SETUP
echo =====================================
echo.
echo Target User: dkuddel@web.de
echo Action: Set as Premium User (unlimited time)
echo.

echo 📋 ANWEISUNGEN FÜR SUPABASE PREMIUM-SETUP:
echo.
echo 1. Öffne Supabase Dashboard: https://app.supabase.com/
echo 2. Wähle dein PulseManager Projekt
echo 3. Gehe zu "SQL Editor"
echo 4. Kopiere den Inhalt von make_dkuddel_premium.sql
echo 5. Füge ihn in den SQL Editor ein
echo 6. Klicke "Run" um das Script auszuführen
echo.

echo 📄 SQL SCRIPT LOCATION:
echo    make_dkuddel_premium.sql
echo.

echo ✅ WAS DAS SCRIPT MACHT:
echo    - Sucht User dkuddel@web.de in auth.users
echo    - Erstellt/Updated subscription auf 'active'
echo    - Setzt end_date auf 2099-12-31 (praktisch unbegrenzt)
echo    - PayPal ID: MANUAL_PREMIUM_UNLIMITED
echo.

echo 🔍 VERIFICATION:
echo    Nach dem Ausführen zeigt das Script automatisch
echo    den finalen Status der Subscription an.
echo.

pause
echo.
echo 📱 ALTERNATIVE: Direct Supabase URL
echo    Falls du direkten DB-Zugang hast:
echo.
type make_dkuddel_premium.sql
echo.
pause 