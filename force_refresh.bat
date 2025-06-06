@echo off
echo Force refresh - Dashboard button in Portfolio should be visible...
git add .
git commit -m "Force refresh: Dashboard button already exists in Portfolio view - cache bust"
git push origin main
echo.
echo Dashboard button refresh deployed!
pause 