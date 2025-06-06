@echo off
cd "C:\Users\Anwender\Desktop\PulseManager_QUICKBACKUP_2025-06-05_22-27"
git add vercel.json
git commit -m "Aggressive cache clearing - force complete rebuild"
git push
echo Push completed with aggressive rebuild config! 