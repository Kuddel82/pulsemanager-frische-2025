@echo off
echo Fixing import issue and pushing...
git add -A
git commit -m "Fix: Add .jsx extension to imports and verify router is active"
git push origin master
echo Done! Check Vercel deployment.
pause 