@echo off
echo CLEANING UP ALL JUNK FILES...
echo =============================

REM Delete all temporary batch files
del force_update.bat 2>nul
del emergency_fix.bat 2>nul
del fix_white_screen.bat 2>nul
del final_push.bat 2>nul
del kill_and_restart.bat 2>nul
del fix_cache.bat 2>nul
del fix_and_push.bat 2>nul
del push_changes.bat 2>nul

REM Delete duplicate config files
del vite.config.ts 2>nul
del postcss.config.cjs 2>nul
del tsconfig.json 2>nul
del tsconfig.node.json 2>nul

REM Delete duplicate App files
del src\App-Working.jsx 2>nul
del src\App-Simple.jsx 2>nul
del src\App-Simple-Clean.jsx 2>nul
del src\index-clean.css 2>nul

REM Delete unused pages directory if exists
rd /s /q src\pages 2>nul

echo =============================
echo CLEANUP COMPLETE!
echo =============================
pause 