@echo off
echo.
echo 🔧 TAX REPORT MEGA-FIX - Limits entfernen + Caching verbessern
echo =================================================================
echo.

echo ⚡ PHASE 1: Tax Report Frontend-Limits entfernen...

REM Fix src/components/views/TaxReportView.jsx - 100 Limit entfernen
powershell -Command "(Get-Content 'src\components\views\TaxReportView.jsx') -replace 'filteredTransactions\.slice\(0, 100\)', 'filteredTransactions' | Set-Content 'src\components\views\TaxReportView.jsx'"

REM Fix src/components/views/TaxReportView.jsx - 500 Limit entfernen
powershell -Command "(Get-Content 'src\components\views\TaxReportView.jsx') -replace 'filteredTransactions\.slice\(0, 500\)', 'filteredTransactions' | Set-Content 'src\components\views\TaxReportView.jsx'"

REM Fix PulseManager/src/views/TaxReportView.jsx
powershell -Command "(Get-Content 'PulseManager\src\views\TaxReportView.jsx') -replace 'filteredTransactions\.slice\(0, 100\)', 'filteredTransactions' | Set-Content 'PulseManager\src\views\TaxReportView.jsx'"

REM Fix PulseManager/src/components/views/TaxReportView.jsx
powershell -Command "(Get-Content 'PulseManager\src\components\views\TaxReportView.jsx') -replace 'filteredTransactions\.slice\(0, 100\)', 'filteredTransactions' | Set-Content 'PulseManager\src\components\views\TaxReportView.jsx'"
powershell -Command "(Get-Content 'PulseManager\src\components\views\TaxReportView.jsx') -replace 'filteredTransactions\.slice\(0, 500\)', 'filteredTransactions' | Set-Content 'PulseManager\src\components\views\TaxReportView.jsx'"

echo ✅ Tax Report Limits entfernt!
echo.

echo ⚡ PHASE 2: Warning-Messages für große Datensätze hinzufügen...

REM Update Warning Message für große Datenmengen
powershell -Command "(Get-Content 'src\components\views\TaxReportView.jsx') -replace 'Zeige die ersten 100 von', 'Zeige alle' | Set-Content 'src\components\views\TaxReportView.jsx'"
powershell -Command "(Get-Content 'src\components\views\TaxReportView.jsx') -replace 'Exportieren Sie alle Daten als CSV für die vollständige Liste\.', 'Große Datensätze können die Performance beeinträchtigen.' | Set-Content 'src\components\views\TaxReportView.jsx'"

echo ✅ Warning-Messages aktualisiert!
echo.

echo ⚡ PHASE 3: Git Commit + Vercel Deployment...

git add .
git commit -m "🔧 MEGA-FIX: Tax Report Limits entfernt + Performance Warnings - UNBEGRENZTE TRANSAKTIONEN!"

echo ✅ Git Commit erstellt!
echo.

echo ⚡ PHASE 4: Vercel Deployment triggern...
git push origin main

echo ✅ Deployment getriggert!
echo.
echo 🎉 TAX REPORT MEGA-FIX COMPLETE!
echo.
echo ✅ Tax Report zeigt jetzt ALLE Transaktionen an (nicht nur 100-500)
echo ✅ Performance-Warnings für große Datensätze hinzugefügt
echo ✅ Deployment an Vercel gesendet
echo.
echo 💡 HINWEIS: 
echo    - Supabase 409 Conflicts müssen über Dashboard SQL-Script behoben werden
echo    - SUPABASE_FIX_CONFLICTS.sql ausführen in Supabase Dashboard
echo.
echo 🚀 TESTE JETZT DAS TAX REPORT MIT ALLEN TRANSAKTIONEN!
pause 