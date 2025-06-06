@echo off
echo Deploying PulseChain ROI Tracker...
git add .
git commit -m "ROI Tracker for PulseChain - Complete profit/loss analysis with detailed view"
git push origin main
echo.
echo ROI Tracker deployed successfully!
pause 