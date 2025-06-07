@echo off
echo PowerShell 7.5.1 COMMANDS - Bye Bye PowerShell 5.1!
echo ====================================================
echo.
echo Verfügbare Befehle:
echo.
echo git7 add     = git add -A mit PowerShell 7
echo git7 commit  = git commit mit PowerShell 7
echo git7 push    = git push mit PowerShell 7
echo build7       = npm run build mit PowerShell 7
echo status7      = git status mit PowerShell 7
echo pwsh7-shell  = Starte PowerShell 7 interaktiv
echo.

:loop
set /p cmd="PowerShell7> "

if "%cmd%"=="git7 add" (
    pwsh -c "git add -A"
    goto loop
)

if "%cmd%"=="git7 commit" (
    set /p msg="Commit Message: "
    pwsh -c "git commit -m '%msg%'"
    goto loop
)

if "%cmd%"=="git7 push" (
    pwsh -c "git push"
    goto loop
)

if "%cmd%"=="build7" (
    pwsh -c "npm run build"
    goto loop
)

if "%cmd%"=="status7" (
    pwsh -c "git status"
    goto loop
)

if "%cmd%"=="pwsh7-shell" (
    pwsh
    goto loop
)

if "%cmd%"=="exit" (
    exit
)

echo Unbekannter Befehl: %cmd%
goto loop 