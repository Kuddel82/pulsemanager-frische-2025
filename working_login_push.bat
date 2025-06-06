@echo off
echo PUSHING WORKING LOGIN FORM
echo =========================
git add -A
git commit -m "WORKING LOGIN: Simple form with inline styles - no router"
git push origin master --force
echo =========================
echo DONE! Login should work now!
echo =========================
pause 