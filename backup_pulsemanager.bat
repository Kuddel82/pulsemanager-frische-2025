@echo off
setlocal enabledelayedexpansion
title PulseManager.vip - Project Backup Tool

:: 🎨 Farben für bessere Übersicht
color 0A

echo.
echo ===============================================
echo   🚀 PulseManager.vip - BACKUP SYSTEM
echo ===============================================
echo.

:: 📅 Datum und Zeit für eindeutige Backups
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

:: 📁 Backup-Verzeichnis erstellen
set "BACKUP_DIR=%USERPROFILE%\Desktop\PulseManager_Backups\Backup_%timestamp%"

echo 📦 Erstelle Backup-Verzeichnis...
echo 📍 Ziel: %BACKUP_DIR%
echo.

if not exist "%USERPROFILE%\Desktop\PulseManager_Backups" (
    mkdir "%USERPROFILE%\Desktop\PulseManager_Backups"
)
mkdir "%BACKUP_DIR%"

:: ✅ Prüfe ob Backup-Verzeichnis erstellt wurde
if not exist "%BACKUP_DIR%" (
    echo ❌ FEHLER: Backup-Verzeichnis konnte nicht erstellt werden!
    pause
    exit /b 1
)

echo ✅ Backup-Verzeichnis erfolgreich erstellt
echo.

:: 🔄 Projektdateien kopieren (mit Ausnahmen)
echo 🔁 Kopiere Projektdateien...
echo    ├── Kopiere alle Quelldateien...

:: Ausgeschlossene Ordner/Dateien für effizienteres Backup
set "EXCLUDE_DIRS=/XD node_modules .git dist build .next .vercel .vscode"
set "EXCLUDE_FILES=/XF *.log *.tmp package-lock.json"

robocopy . "%BACKUP_DIR%" /E /R:2 /W:1 /MT:8 %EXCLUDE_DIRS% %EXCLUDE_FILES% /NFL /NDL /NP

if %ERRORLEVEL% LEQ 7 (
    echo    ✅ Projektdateien erfolgreich kopiert
) else (
    echo    ⚠️  Warnung: Einige Dateien konnten nicht kopiert werden
)

echo.

:: 🔐 Spezielle Dateien sichern
echo 🔐 Sichere wichtige Konfigurationsdateien...

if exist .env (
    copy .env "%BACKUP_DIR%\" >nul 2>&1
    echo    ✅ .env-Datei gesichert
) else (
    echo    ℹ️  Keine .env-Datei gefunden
)

if exist .env.local (
    copy .env.local "%BACKUP_DIR%\" >nul 2>&1
    echo    ✅ .env.local-Datei gesichert
) else (
    echo    ℹ️  Keine .env.local-Datei gefunden
)

if exist vercel.json (
    copy vercel.json "%BACKUP_DIR%\" >nul 2>&1
    echo    ✅ vercel.json gesichert
)

echo.

:: 📋 Backup-Info erstellen
echo 📋 Erstelle Backup-Information...
(
echo PulseManager.vip - Backup Information
echo =====================================
echo.
echo Backup erstellt am: %timestamp%
echo Quelle: %CD%
echo Ziel: %BACKUP_DIR%
echo.
echo Projekt-Status:
echo - React 18 + Vite Build System
echo - Supabase Backend Integration
echo - Stripe Payment System
echo - WalletConnect v2 + PulseChain
echo - 1-License-Per-Device System
echo - Complete i18n Support ^(DE/EN^)
echo.
echo Wichtige Komponenten:
echo - Authentication System ^(AuthContext^)
echo - Device Fingerprinting Service
echo - Premium Subscription Management
echo - ROI Tracker ^+ Tax Reports
echo - Responsive UI/UX Design
echo.
echo Backup-Inhalt:
echo - Alle Quelldateien ^(src/, public/, etc.^)
echo - Konfigurationsdateien
echo - Supabase Migrations
echo - Dokumentation
echo.
echo Ausgeschlossen:
echo - node_modules ^(kann mit 'npm install' wiederhergestellt werden^)
echo - .git-Verzeichnis ^(separate Git-Backups empfohlen^)
echo - Build-Artefakte ^(dist/, build/^)
echo - Temporäre Dateien
) > "%BACKUP_DIR%\BACKUP_INFO.txt"

echo    ✅ Backup-Information erstellt

:: 📊 Backup-Größe ermitteln
echo.
echo 📊 Berechne Backup-Größe...
for /f "tokens=3" %%a in ('dir "%BACKUP_DIR%" /s /-c ^| find "Datei(en)"') do set "size=%%a"
echo    📦 Backup-Größe: %size% Bytes

:: 🏁 Abschluss
echo.
echo ===============================================
echo   ✅ BACKUP ERFOLGREICH ABGESCHLOSSEN!
echo ===============================================
echo.
echo 📁 Backup gespeichert unter:
echo    %BACKUP_DIR%
echo.
echo 📋 Backup-Details:
echo    ├── Zeitstempel: %timestamp%
echo    ├── Größe: %size% Bytes
echo    └── Info-Datei: BACKUP_INFO.txt
echo.
echo 💡 Tipp: Für Wiederherstellung führe 'npm install' im Backup-Ordner aus
echo.

:: 🚀 Optional: Backup-Ordner öffnen
set /p "open=Backup-Ordner öffnen? (j/N): "
if /i "%open%"=="j" (
    start explorer "%BACKUP_DIR%"
)

echo.
echo Backup-Prozess beendet. Drücke eine beliebige Taste...
pause >nul 