@echo off
cd "C:\Users\Anwender\Desktop\PulseManager_QUICKBACKUP_2025-06-05_22-27"
git add -A
git commit -m "NUCLEAR OPTION: Renamed App.jsx to MainApp.jsx to bypass Vercel cache"
git push
echo NUCLEAR OPTION DEPLOYED! 