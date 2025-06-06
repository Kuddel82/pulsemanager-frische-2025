@echo off
echo CLEARING VERCEL CACHE AND PUSHING
echo =================================
git add -A
git commit -m "CLEAR CACHE: Force rebuild with updated vercel.json"
git push origin master --force
echo =================================
echo CHECK VERCEL DEPLOYMENT LOGS!
echo The build should NOT mention Dashboard anymore!
echo =================================
pause 