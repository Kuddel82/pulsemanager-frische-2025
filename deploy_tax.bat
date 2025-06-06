@echo off
echo Deploying PulseChain Tax Reports...
git add .
git commit -m "Tax Reports for PulseChain - German tax law compliance with holding periods and allowances"
git push origin main
echo.
echo Tax Reports deployed successfully!
pause 