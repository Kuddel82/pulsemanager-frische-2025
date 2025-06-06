# PulseManager.vip - PowerShell Backup Script
# Erweiterte Version mit Progress Bars und besserer Fehlerbehandlung

param(
    [string]$BackupPath = "$env:USERPROFILE\Desktop\PulseManager_Backups",
    [switch]$OpenBackup,
    [switch]$Compress
)

# 🎨 Konsolen-Konfiguration
$Host.UI.RawUI.WindowTitle = "PulseManager.vip - Backup Tool"
Clear-Host

# 🎯 Banner anzeigen
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   🚀 PulseManager.vip - BACKUP SYSTEM" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# 📅 Zeitstempel generieren
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = Join-Path $BackupPath "Backup_$timestamp"

Write-Host "📦 Erstelle Backup-Verzeichnis..." -ForegroundColor Green
Write-Host "📍 Ziel: $backupDir" -ForegroundColor Gray
Write-Host ""

# 📁 Backup-Verzeichnis erstellen
try {
    if (-not (Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    }
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "✅ Backup-Verzeichnis erfolgreich erstellt" -ForegroundColor Green
} catch {
    Write-Host "❌ FEHLER: Backup-Verzeichnis konnte nicht erstellt werden!" -ForegroundColor Red
    Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Drücke Enter zum Beenden"
    exit 1
}

Write-Host ""

# 🚫 Ausschluss-Listen definieren
$excludeDirs = @(
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.vercel',
    '.vscode',
    'coverage',
    '.nyc_output'
)

$excludeFiles = @(
    '*.log',
    '*.tmp',
    'package-lock.json',
    '.DS_Store',
    'Thumbs.db'
)

# 🔄 Projektdateien kopieren mit Progress
Write-Host "🔁 Kopiere Projektdateien..." -ForegroundColor Green

$sourceItems = Get-ChildItem -Path . -Recurse | Where-Object {
    $item = $_
    $shouldExclude = $false
    
    # Prüfe Verzeichnis-Ausschlüsse
    foreach ($excludeDir in $excludeDirs) {
        if ($item.FullName -like "*\$excludeDir\*" -or $item.Name -eq $excludeDir) {
            $shouldExclude = $true
            break
        }
    }
    
    # Prüfe Datei-Ausschlüsse
    if (-not $shouldExclude -and $item.PSIsContainer -eq $false) {
        foreach ($excludeFile in $excludeFiles) {
            if ($item.Name -like $excludeFile) {
                $shouldExclude = $true
                break
            }
        }
    }
    
    return -not $shouldExclude
}

$totalItems = $sourceItems.Count
$copiedItems = 0

foreach ($item in $sourceItems) {
    $copiedItems++
    $percentComplete = [math]::Round(($copiedItems / $totalItems) * 100, 1)
    
    Write-Progress -Activity "Kopiere Projektdateien" -Status "$copiedItems von $totalItems Dateien" -PercentComplete $percentComplete
    
    $relativePath = $item.FullName.Substring((Get-Location).Path.Length + 1)
    $destinationPath = Join-Path $backupDir $relativePath
    
    try {
        if ($item.PSIsContainer) {
            # Verzeichnis erstellen
            if (-not (Test-Path $destinationPath)) {
                New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
            }
        } else {
            # Datei kopieren
            $destinationDir = Split-Path $destinationPath -Parent
            if (-not (Test-Path $destinationDir)) {
                New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
            }
            Copy-Item -Path $item.FullName -Destination $destinationPath -Force
        }
    } catch {
        Write-Warning "Konnte nicht kopiert werden: $relativePath"
    }
}
}

Write-Progress -Activity "Kopiere Projektdateien" -Completed
Write-Host "    ✅ $copiedItems Dateien erfolgreich kopiert" -ForegroundColor Green
Write-Host ""

# 🔐 Spezielle Dateien sichern
Write-Host "🔐 Sichere wichtige Konfigurationsdateien..." -ForegroundColor Green

$specialFiles = @('.env', '.env.local', '.env.production', 'vercel.json', '.gitignore')
foreach ($file in $specialFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $backupDir -Force
        Write-Host "    ✅ $file gesichert" -ForegroundColor Green
    } else {
        Write-Host "    ℹ️  $file nicht gefunden" -ForegroundColor Gray
    }
}

Write-Host ""

# 📋 Backup-Information erstellen
Write-Host "📋 Erstelle Backup-Information..." -ForegroundColor Green

$backupInfo = @"
PulseManager.vip - Backup Information
=====================================

Backup erstellt am: $timestamp
PowerShell Version: $($PSVersionTable.PSVersion)
Quelle: $(Get-Location)
Ziel: $backupDir

Projekt-Status:
- React 18 + Vite Build System
- Supabase Backend Integration  
- Stripe Payment System
- WalletConnect v2 + PulseChain
- 1-License-Per-Device System
- Complete i18n Support (DE/EN)

Wichtige Komponenten:
- Authentication System (AuthContext)
- Device Fingerprinting Service
- Premium Subscription Management
- ROI Tracker + Tax Reports
- Responsive UI/UX Design

Backup-Inhalt:
- Alle Quelldateien (src/, public/, etc.)
- Konfigurationsdateien
- Supabase Migrations
- Dokumentation
- $copiedItems Dateien total

Ausgeschlossen:
- node_modules (kann mit npm install wiederhergestellt werden)
- git-Verzeichnis (separate Git-Backups empfohlen)
- Build-Artefakte (dist/, build/)
- Temporäre Dateien

Wiederherstellung:
1. Kopiere Backup-Ordner an gewünschte Stelle
2. Führe npm install aus
3. Konfiguriere env-Dateien
4. Führe npm run dev für Development aus
"@

$backupInfo | Out-File -FilePath (Join-Path $backupDir "BACKUP_INFO.txt") -Encoding UTF8
Write-Host "    ✅ Backup-Information erstellt" -ForegroundColor Green

# 📊 Backup-Größe berechnen
Write-Host ""
Write-Host "📊 Berechne Backup-Größe..." -ForegroundColor Green

$backupSize = (Get-ChildItem -Path $backupDir -Recurse | Measure-Object -Property Length -Sum).Sum
$backupSizeMB = [math]::Round($backupSize / 1MB, 2)

Write-Host "    📦 Backup-Größe: $backupSizeMB MB ($backupSize Bytes)" -ForegroundColor Green

# 🗜️ Optional: Komprimierung
if ($Compress) {
    Write-Host ""
    Write-Host "🗜️ Komprimiere Backup..." -ForegroundColor Yellow
    
    $zipPath = "$backupDir.zip"
    try {
        Compress-Archive -Path $backupDir -DestinationPath $zipPath -CompressionLevel Optimal
        $zipSize = (Get-Item $zipPath).Length
        $zipSizeMB = [math]::Round($zipSize / 1MB, 2)
        
        Write-Host "    ✅ Backup komprimiert: $zipSizeMB MB" -ForegroundColor Green
        Write-Host "    📁 ZIP-Datei: $zipPath" -ForegroundColor Gray
        
        # Original-Ordner löschen nach erfolgreicher Komprimierung
        Remove-Item -Path $backupDir -Recurse -Force
        $backupDir = $zipPath
    } catch {
        Write-Host "    ⚠️ Komprimierung fehlgeschlagen: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# 🏁 Abschluss
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   ✅ BACKUP ERFOLGREICH ABGESCHLOSSEN!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 Backup gespeichert unter:" -ForegroundColor Green
Write-Host "    $backupDir" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Backup-Details:" -ForegroundColor Green
Write-Host "    ├── Zeitstempel: $timestamp" -ForegroundColor Gray
Write-Host "    ├── Größe: $backupSizeMB MB" -ForegroundColor Gray
Write-Host "    ├── Dateien: $copiedItems" -ForegroundColor Gray
Write-Host "    └── Info-Datei: BACKUP_INFO.txt" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Tipp: Für Wiederherstellung führe 'npm install' im Backup-Ordner aus" -ForegroundColor Yellow
Write-Host ""

# 🚀 Optional: Backup-Ordner öffnen
if ($OpenBackup -or (Read-Host "Backup-Ordner öffnen? (j/N)") -eq 'j') {
    if ($Compress) {
        Start-Process "explorer.exe" -ArgumentList "/select,`"$backupDir`""
    } else {
        Start-Process "explorer.exe" -ArgumentList "`"$backupDir`""
    }
}

Write-Host "Backup-Prozess beendet. Drücke eine beliebige Taste..." -ForegroundColor Green
Read-Host 