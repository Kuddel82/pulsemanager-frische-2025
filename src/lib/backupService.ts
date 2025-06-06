import { supabase } from './supabase';
import * as fs from 'fs';
import * as path from 'path';
import { scheduleJob } from 'node-schedule';

export const backupService = {
  async createBackup(backupPath: string) {
    try {
      // Backup-Verzeichnis erstellen
      const backupDir = path.join(backupPath, 'backup');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Alle Tabellen exportieren
      const tables = ['profiles', 'wallets', 'transactions', 'tax_reports', 'premium_subscriptions'];
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Fehler beim Export von ${table}:`, error);
          continue;
        }

        // JSON-Datei erstellen
        const filePath = path.join(backupDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Backup von ${table} erstellt: ${filePath}`);
      }

      // Backup-Metadaten speichern
      const metadata = {
        timestamp: new Date().toISOString(),
        tables: tables,
        version: '1.0'
      };
      
      fs.writeFileSync(
        path.join(backupDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      return true;
    } catch (error) {
      console.error('Fehler beim Backup:', error);
      return false;
    }
  },

  async restoreBackup(backupPath: string) {
    try {
      const backupDir = path.join(backupPath, 'backup');
      
      // Metadaten prüfen
      const metadataPath = path.join(backupDir, 'metadata.json');
      if (!fs.existsSync(metadataPath)) {
        throw new Error('Keine gültigen Backup-Daten gefunden');
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      
      // Alle Tabellen wiederherstellen
      for (const table of metadata.tables) {
        const filePath = path.join(backupDir, `${table}.json`);
        if (!fs.existsSync(filePath)) continue;

        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Daten in Supabase wiederherstellen
        const { error } = await supabase
          .from(table)
          .upsert(data);

        if (error) {
          console.error(`Fehler beim Wiederherstellen von ${table}:`, error);
        } else {
          console.log(`${table} erfolgreich wiederhergestellt`);
        }
      }

      return true;
    } catch (error) {
      console.error('Fehler beim Wiederherstellen:', error);
      return false;
    }
  },

  startAutomaticBackups() {
    // Täglich um 00:00 Uhr
    scheduleJob('0 0 * * *', async () => {
      console.log('Starte automatisches Backup...');
      const backupPath = 'C:\\Users\\Anwender\\Desktop\\Cursor 3.06.2025';
      const timestamp = new Date().toISOString().split('T')[0];
      const backupDir = path.join(backupPath, `backup_${timestamp}`);

      try {
        // Backup-Verzeichnis erstellen
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        // Alle Tabellen exportieren
        const tables = ['profiles', 'wallets', 'transactions', 'tax_reports', 'premium_subscriptions'];
        
        for (const table of tables) {
          const { data, error } = await supabase
            .from(table)
            .select('*');

          if (error) {
            console.error(`Fehler beim Export von ${table}:`, error);
            continue;
          }

          // JSON-Datei erstellen
          const filePath = path.join(backupDir, `${table}.json`);
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
          console.log(`Automatisches Backup von ${table} erstellt: ${filePath}`);
        }

        // Backup-Metadaten speichern
        const metadata = {
          timestamp: new Date().toISOString(),
          tables: tables,
          version: '1.0',
          type: 'automatic'
        };
        
        fs.writeFileSync(
          path.join(backupDir, 'metadata.json'),
          JSON.stringify(metadata, null, 2)
        );

        // Alte Backups aufräumen (behalte nur die letzten 7 Tage)
        this.cleanupOldBackups(backupPath);

        console.log('Automatisches Backup erfolgreich erstellt');
      } catch (error) {
        console.error('Fehler beim automatischen Backup:', error);
      }
    });
  },

  cleanupOldBackups(backupPath: string) {
    try {
      const dirs = fs.readdirSync(backupPath)
        .filter(dir => dir.startsWith('backup_'))
        .map(dir => ({
          name: dir,
          path: path.join(backupPath, dir),
          date: new Date(dir.replace('backup_', ''))
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      // Behalte nur die letzten 7 Backups
      if (dirs.length > 7) {
        dirs.slice(7).forEach(dir => {
          fs.rmSync(dir.path, { recursive: true, force: true });
          console.log(`Altes Backup gelöscht: ${dir.name}`);
        });
      }
    } catch (error) {
      console.error('Fehler beim Aufräumen alter Backups:', error);
    }
  },

  async createInitialBackup() {
    console.log('Erstelle erstes Backup...');
    const backupPath = 'C:\\Users\\Anwender\\Desktop\\Cursor 3.06.2025';
    const timestamp = new Date().toISOString().split('T')[0];
    const backupDir = path.join(backupPath, `backup_${timestamp}`);

    try {
      // Backup-Verzeichnis erstellen
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Alle Tabellen exportieren
      const tables = ['profiles', 'wallets', 'transactions', 'tax_reports', 'premium_subscriptions'];
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Fehler beim Export von ${table}:`, error);
          continue;
        }

        // JSON-Datei erstellen
        const filePath = path.join(backupDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Backup von ${table} erstellt: ${filePath}`);
      }

      // Backup-Metadaten speichern
      const metadata = {
        timestamp: new Date().toISOString(),
        tables: tables,
        version: '1.0',
        type: 'initial'
      };
      
      fs.writeFileSync(
        path.join(backupDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log('Erstes Backup erfolgreich erstellt');
      return true;
    } catch (error) {
      console.error('Fehler beim Erstellen des ersten Backups:', error);
      return false;
    }
  },

  async backup() {
    // Temporäre Implementierung
    console.log('Backup service called')
    return true
  },
  
  async restore() {
    // Temporäre Implementierung
    console.log('Restore service called')
    return true
  }
}; 