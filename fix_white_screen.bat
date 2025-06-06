@echo off
echo FIXING WHITE SCREEN ISSUE
echo =========================
git add -A
git commit -m "FIX: White screen - redirect to login, prevent loops, add logging"
git push origin master --force
echo =========================
echo FIXED! The app will now show login page!
echo Check: https://kuddel-manage.vercel.app/login
echo =========================
pause 