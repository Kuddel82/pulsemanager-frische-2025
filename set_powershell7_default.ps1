# ============================================
# PowerShell 7 als STANDARD setzen
# ============================================
Write-Host "Setze PowerShell 7 als Standard..." -ForegroundColor Green

# 1. Systemweite PATH-Variable aendern (benoetigt Admin)
try {
    $currentPath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
    if ($currentPath) {
        $pathEntries = $currentPath -split ';'
        
        # PowerShell 5.1 entfernen
        $filteredPath = $pathEntries | Where-Object { $_ -notlike '*WindowsPowerShell*' }
        
        # PowerShell 7 an den Anfang setzen
        $pwsh7Path = "C:\Program Files\PowerShell\7"
        if (Test-Path $pwsh7Path) {
            $newPath = @($pwsh7Path) + $filteredPath
            $finalPath = $newPath -join ';'
            
            [System.Environment]::SetEnvironmentVariable("PATH", $finalPath, "Machine")
            Write-Host "Systemweite PATH-Variable aktualisiert!" -ForegroundColor Green
        }
    }
} catch {
    Write-Warning "Admin-Rechte benoetigt fuer systemweite Aenderung"
}

# 2. User-PATH aendern (funktioniert ohne Admin)
try {
    $userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    if ($userPath) {
        $userEntries = $userPath -split ';'
        $filteredUserPath = $userEntries | Where-Object { $_ -notlike '*WindowsPowerShell*' }
        
        $pwsh7Path = "C:\Program Files\PowerShell\7"
        if (Test-Path $pwsh7Path) {
            $newUserPath = @($pwsh7Path) + $filteredUserPath
            $finalUserPath = $newUserPath -join ';'
            
            [System.Environment]::SetEnvironmentVariable("PATH", $finalUserPath, "User")
            Write-Host "User PATH-Variable aktualisiert!" -ForegroundColor Green
        }
    }
} catch {
    Write-Warning "Fehler beim Aktualisieren der User PATH-Variable"
}

# 3. PowerShell Profil aktualisieren
try {
    $profilePath = $PROFILE
    $profileDir = Split-Path $profilePath -Parent

    if (-not (Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    }

    $aliasContent = @"
# PowerShell 7 als Standard
Set-Alias powershell pwsh -Option AllScope -Force
"@

    if (Test-Path $profilePath) {
        $currentContent = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
        if ($currentContent -and $currentContent -notlike "*Set-Alias powershell pwsh*") {
            Add-Content $profilePath $aliasContent
        }
    } else {
        Set-Content $profilePath $aliasContent
    }

    Write-Host "PowerShell Profil aktualisiert!" -ForegroundColor Green
} catch {
    Write-Warning "Fehler beim Aktualisieren des PowerShell Profils"
}

# 4. Registry-Eintrag fuer 'powershell' Befehl (benoetigt Admin)
try {
    $regPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\powershell.exe"
    if (Test-Path $regPath) {
        Set-ItemProperty -Path $regPath -Name "(Default)" -Value "C:\Program Files\PowerShell\7\pwsh.exe"
        Write-Host "Registry aktualisiert - 'powershell' zeigt auf PowerShell 7!" -ForegroundColor Green
    }
} catch {
    Write-Warning "Registry-Aenderung benoetigt Admin-Rechte"
}

Write-Host ""
Write-Host "PowerShell 7 ist jetzt der STANDARD!" -ForegroundColor Yellow
Write-Host "Starte neue Terminal-Session fuer vollstaendige Wirkung." -ForegroundColor Yellow 