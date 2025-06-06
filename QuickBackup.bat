@echo off
echo ⚡ ULTRA-SCHNELLES PULSEMANAGER BACKUP
echo ====================================

set "timestamp=%date:~6,4%-%date:~3,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%"
set "timestamp=%timestamp: =0%"
set "BACKUP_DIR=%USERPROFILE%\Desktop\PulseManager_QUICKBACKUP_%timestamp%"

echo 📦 Erstelle: %BACKUP_DIR%
mkdir "%BACKUP_DIR%"

echo ⚡ Kopiere essenzielle Dateien...
robocopy . "%BACKUP_DIR%" /E /XD node_modules .git dist build .next .vercel .vscode /XF *.log *.tmp package-lock.json /R:0 /W:0 /MT:8 /NFL /NDL

echo ✅ BACKUP ABGESCHLOSSEN!
echo 📁 Gespeichert: %BACKUP_DIR%
explorer "%BACKUP_DIR%"
pause 