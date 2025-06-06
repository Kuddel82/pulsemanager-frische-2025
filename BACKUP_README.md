# 📦 PulseManager.vip - Backup System

Professionelles Backup-System für Ihr PulseManager.vip Projekt mit zwei verfügbaren Optionen.

## 🚀 **Verfügbare Backup-Scripts**

### 1. Batch-Datei (Windows CMD)
**Datei:** `backup_pulsemanager.bat`

```cmd
# Einfach ausführen
.\backup_pulsemanager.bat
```

**Features:**
- ✅ Automatische Zeitstempel-Erstellung
- ✅ Intelligente Datei-Filterung
- ✅ Robocopy für effizientes Kopieren
- ✅ Backup-Informations-Datei
- ✅ Größenberechnung
- ✅ Benutzerfreundliche Ausgabe

### 2. PowerShell-Script (Empfohlen)
**Datei:** `Backup-PulseManager.ps1`

```powershell
# Standard-Backup
.\Backup-PulseManager.ps1

# Mit Komprimierung
.\Backup-PulseManager.ps1 -Compress

# Backup öffnen nach Erstellung
.\Backup-PulseManager.ps1 -OpenBackup

# Benutzerdefinierten Pfad verwenden
.\Backup-PulseManager.ps1 -BackupPath "D:\MyBackups"

# Alle Optionen kombiniert
.\Backup-PulseManager.ps1 -Compress -OpenBackup -BackupPath "D:\MyBackups"
```

**Erweiterte Features:**
- 🔥 Progress Bar mit Echtzeit-Fortschritt
- 🗜️ Optional ZIP-Komprimierung
- 📊 Detaillierte Größenberechnung
- ⚡ Parallele Verarbeitung
- 🎨 Farbige Konsolen-Ausgabe
- 🔧 Erweiterte Fehlerbehandlung

## 📁 **Was wird gesichert?**

### ✅ **Enthalten:**
- `src/` - Alle Quelldateien
- `public/` - Statische Assets  
- `api/` - API-Routen
- `supabase/` - Datenbank-Migrationen
- `package.json` - Projekt-Konfiguration
- `vite.config.js` - Build-Konfiguration
- `tailwind.config.js` - Styling-Konfiguration
- `.env` - Umgebungsvariablen (falls vorhanden)
- `vercel.json` - Deployment-Konfiguration
- Dokumentation (`.md` Dateien)

### ❌ **Ausgeschlossen:**
- `node_modules/` - Pakete (können neu installiert werden)
- `.git/` - Git-Verlauf (separates Backup empfohlen)
- `dist/`, `build/` - Build-Artefakte
- `.next/`, `.vercel/` - Framework-Cache
- `*.log`, `*.tmp` - Temporäre Dateien
- `package-lock.json` - Lock-Datei

## 🎯 **Backup-Struktur**

```
PulseManager_Backups/
├── Backup_2024-01-15_14-30-45/
│   ├── src/
│   ├── public/
│   ├── api/
│   ├── supabase/
│   ├── package.json
│   ├── vite.config.js
│   ├── .env
│   └── BACKUP_INFO.txt
└── Backup_2024-01-15_16-22-10.zip (bei -Compress)
```

## 🔄 **Wiederherstellung**

1. **Backup-Ordner kopieren:**
   ```bash
   cp -r Backup_2024-01-15_14-30-45 /path/to/new/location
   cd /path/to/new/location
   ```

2. **Dependencies installieren:**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren:**
   - `.env` Datei prüfen und anpassen
   - Supabase Keys validieren
   - Stripe Keys prüfen

4. **Development starten:**
   ```bash
   npm run dev
   ```

5. **Production Build (optional):**
   ```bash
   npm run build
   ```

## ⚡ **Performance-Tipps**

### PowerShell Execution Policy
Falls PowerShell-Script nicht ausführbar:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Große Projekte
Für sehr große Projekte (>1GB):
```powershell
.\Backup-PulseManager.ps1 -Compress -BackupPath "D:\Backups"
```

### Automatisierung
Für regelmäßige Backups Task Scheduler verwenden:
```cmd
schtasks /create /tn "PulseManager Backup" /tr "powershell.exe -File C:\Path\To\Backup-PulseManager.ps1 -Compress" /sc daily /st 02:00
```

## 🛡️ **Sicherheits-Hinweise**

- **✅ Sensible Daten:** `.env` Dateien werden automatisch gesichert
- **⚠️ API-Keys:** Prüfen Sie Backup-Speicherort auf Sicherheit
- **🔐 Verschlüsselung:** Für kritische Daten zusätzliche Verschlüsselung verwenden
- **☁️ Cloud-Sync:** Backup-Ordner in Cloud-Storage synchronisieren

## 🆘 **Troubleshooting**

### Problem: "Zugriff verweigert"
```cmd
# Als Administrator ausführen
```

### Problem: "PowerShell Script nicht ausführbar"
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problem: "Insufficient disk space"
```powershell
# Mit Komprimierung verwenden
.\Backup-PulseManager.ps1 -Compress
```

## 📞 **Support**

Bei Problemen mit dem Backup-System:
1. Prüfen Sie die `BACKUP_INFO.txt` im Backup-Ordner
2. Kontrollieren Sie Berechtigungen des Ziel-Verzeichnisses  
3. Stellen Sie sicher, dass genügend Speicherplatz verfügbar ist

---

**📝 Version:** 1.0 | **🗓️ Erstellt:** Januar 2024 | **🛠️ PulseManager.vip Team** 