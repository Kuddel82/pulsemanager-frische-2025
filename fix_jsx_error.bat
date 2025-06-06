@echo off
echo Fixing JSX Syntax Error...
git add .
git commit -m "Fix JSX syntax error - Replace < and > symbols with HTML entities in tax report"
git push origin main
echo.
echo JSX Error fixed and deployed!
pause 