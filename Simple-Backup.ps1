# PulseManager.vip - Einfaches Backup Script
# Funktioniert garantiert ohne Syntax-Probleme

param(
    [string]$BackupPath = "$env:USERPROFILE\Desktop\PulseManager_Backups"
)

Clear-Host
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   PulseManager.vip - BACKUP SYSTEM" -ForegroundColor Yellow  
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Zeitstempel
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = Join-Path $BackupPath "Backup_$timestamp"

Write-Host "Erstelle Backup..." -ForegroundColor Green
Write-Host "Ziel: $backupDir" -ForegroundColor Gray
Write-Host ""

# Backup-Ordner erstellen
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
}
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Ausschluss-Liste
$exclude = @('node_modules', '.git', 'dist', 'build', '.next', '.vercel', '.vscode')

# Dateien kopieren
Write-Host "Kopiere Projektdateien..." -ForegroundColor Green
Get-ChildItem -Path . -Recurse | Where-Object {
    $shouldInclude = $true
    foreach ($ex in $exclude) {
        if ($_.FullName -like "*\$ex\*" -or $_.Name -eq $ex) {
            $shouldInclude = $false
            break
        }
    }
    $shouldInclude
} | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $destPath = Join-Path $backupDir $relativePath
    
    if ($_.PSIsContainer) {
        if (-not (Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        }
    } else {
        $destDir = Split-Path $destPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path $_.FullName -Destination $destPath -Force
    }
}

# Spezielle Dateien
Write-Host "Sichere Konfigurationsdateien..." -ForegroundColor Green
$specialFiles = @('.env', '.env.local', 'vercel.json', '.gitignore')
foreach ($file in $specialFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $backupDir -Force
        Write-Host "  ✓ $file gesichert" -ForegroundColor Green
    }
}

# Backup-Info erstellen
$infoContent = "PulseManager.vip Backup`n" +
"======================`n" +
"Erstellt: $timestamp`n" +
"Quelle: $(Get-Location)`n`n" +
"Projekt-Status:`n" +
"* React 18 + Vite`n" +
"* Supabase Backend`n" +
"* Stripe Payment`n" +
"* WalletConnect v2`n" +
"* Device Licensing`n" +
"* i18n Support`n`n" +
"Wiederherstellung:`n" +
"1. npm install`n" +
"2. .env konfigurieren`n" +
"3. npm run dev"

$infoContent | Out-File -FilePath (Join-Path $backupDir "BACKUP_INFO.txt") -Encoding UTF8

# Größe berechnen
$size = (Get-ChildItem $backupDir -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($size / 1MB, 2)

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   BACKUP ERFOLGREICH!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backup-Pfad: $backupDir" -ForegroundColor Gray
Write-Host "Backup-Größe: $sizeMB MB" -ForegroundColor Gray
Write-Host ""

# Optional öffnen
$open = Read-Host "Backup-Ordner öffnen? (j/N)"
if ($open -eq 'j') {
    Start-Process "explorer.exe" $backupDir
}

Write-Host "Backup abgeschlossen!" -ForegroundColor Green 