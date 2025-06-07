# --------------------------------------------
# 🔧 PowerShell Upgrade & Default-Shell Script
# --------------------------------------------
Write-Host "⏳ Prüfe auf PowerShell 7..."

# Prüfen, ob pwsh vorhanden ist
$p = Get-Command pwsh -ErrorAction SilentlyContinue

if (-not $p) {
    Write-Error "❌ PowerShell 7 (pwsh) ist NICHT installiert. Bitte installiere sie von: https://github.com/PowerShell/PowerShell/releases"
    exit 1
} else {
    Write-Host "✅ PowerShell 7 gefunden unter: $($p.Source)"
}

# ExecutionPolicy setzen
Write-Host "⚙️ Setze ExecutionPolicy auf RemoteSigned..."
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

# VSCode-Profil setzen (nur wenn VSCode installiert)
$vscodeSettings = "$env:APPDATA\Code\User\settings.json"
if (Test-Path $vscodeSettings) {
    Write-Host "🔧 Konfiguriere VSCode auf PowerShell 7..."

    $settings = Get-Content $vscodeSettings -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if (-not $settings) {
        $settings = @{}
    }

    $settings["terminal.integrated.defaultProfile.windows"] = "PowerShell"
    $settings["terminal.integrated.profiles.windows"] = @{
        "PowerShell" = @{
            "source" = "PowerShell"
            "path"   = "$($p.Source)"
        }
    }

    $settings | ConvertTo-Json -Depth 10 | Set-Content $vscodeSettings -Encoding UTF8
    Write-Host "✅ VSCode Terminal wurde aktualisiert!"
} else {
    Write-Warning "⚠️ VSCode-Einstellungen nicht gefunden – ggf. manuell prüfen."
}

# Optional: Systemweites Alias setzen (via $PROFILE)
Write-Host "👣 Setze 'powershell' Alias auf pwsh (nur für diesen User)..."
$profilePath = $PROFILE
if (-not (Test-Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force
}

Add-Content $profilePath "`nSet-Alias powershell pwsh"

Write-Host "🎉 Fertig! Bitte starte VSCode/Cursor neu."    PowerShell 7.5.1
PS C:\Users\Anwender>
# Bestätigung
$PSVersionTable.PSVersion

# Ins Projekt wechseln
cd "Desktop\PulseManager_QUICKBACKUP_2025-06-05_22-27"

# Git status prüfen
git status
# Version bestätigen
$PSVersionTable.PSVersion

# Sollte zeigen: 7.5.1

# Ins Projekt
cd "Desktop\PulseManager_QUICKBACKUP_2025-06-05_22-27"

# UTF-8 Test (sollte perfekt funktionieren)
Write-Host "Test: Ümlaüte äöü ßß 🎉"
.\setup_powershell7.ps1
start-ssh-agent.cmd
