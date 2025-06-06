@echo off
echo Deploying PulseChain Portfolio...
git add .
git commit -m "PulseChain Portfolio Focus - Removed trading buttons, added ecosystem coins"
git push origin main
echo.
echo PulseChain Portfolio deployed!
pause 