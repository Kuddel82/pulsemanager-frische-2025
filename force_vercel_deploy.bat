@echo off
echo =======================================
echo VERCEL DEPLOYMENT FORCE - RUNTIME ERRORS ELIMINATION
echo =======================================
echo.
echo Forcing Vercel to redeploy with latest fixes...
echo.

REM Force push to trigger new deployment
pwsh -c "git commit --allow-empty -m 'FORCE DEPLOY: Trigger Vercel rebuild - Runtime errors must be eliminated'"
pwsh -c "git push"

echo.
echo Deployment triggered! Vercel should rebuild in 30-60 seconds.
echo Check https://www.pulsemanager.vip for new build hash (not index-e30ed2bf.js)
echo.
pause 