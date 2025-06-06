@echo off
echo Deploying React DOM Error Fixes...
git add .
git commit -m "Fix React DOM removeChild errors - Add safe view transitions, unique keys, and anti-double-click protection"
git push origin main
echo.
echo DOM Error fixes deployed successfully!
pause 