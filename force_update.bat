@echo off
echo FORCE UPDATE WITH VISIBLE CHANGE
echo ================================
git add -A
git commit -m "FORCE UPDATE: Purple screen with timestamp %date% %time%"
git push origin master --force
echo ================================
echo CHECK NOW: https://kuddel-manage.vercel.app
echo You should see a PURPLE screen with timestamp!
echo ================================
pause 