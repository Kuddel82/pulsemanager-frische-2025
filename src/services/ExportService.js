/**
 * 🇩🇪 GERMAN TAX EXPORT SERVICE
 * 
 * Browser-kompatible Version für Frontend-Exports
 * Server-APIs übernehmen PDF/CSV/ELSTER Generierung
 */

class ExportService {
  constructor() {
    this.apiBase = window.location.origin;
  }

  /**
   * 📄 PDF Export über Server-API
   */
  async exportToPDF(wallet, year = new Date().getFullYear(), options = {}) {
    try {
      console.log('📄 PDF Export gestartet:', { wallet, year });
      
      const response = await fetch(`${this.apiBase}/api/export-pdf?wallet=${wallet}&year=${year}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF Export fehlgeschlagen');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Browser Download
        if (result.data.downloadUrl) {
          this.triggerDownload(result.data.downloadUrl, result.data.filename);
        }
        
        return {
          success: true,
          filename: result.data.filename,
          url: result.data.downloadUrl,
          summary: result.data.summary
        };
      } else {
        throw new Error(result.error || 'PDF Export fehlgeschlagen');
      }

    } catch (error) {
      console.error('❌ PDF Export Error:', error);
      throw error;
    }
  }

  /**
   * 📊 CSV Export über Server-API
   */
  async exportToCSV(wallet, year = new Date().getFullYear(), options = {}) {
    try {
      console.log('📊 CSV Export gestartet:', { wallet, year });
      
      const response = await fetch(`${this.apiBase}/api/export-csv?wallet=${wallet}&year=${year}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'CSV Export fehlgeschlagen');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Browser Download
        if (result.data.downloadUrl) {
          this.triggerDownload(result.data.downloadUrl, result.data.filename);
        }
        
        return {
          success: true,
          filename: result.data.filename,
          url: result.data.downloadUrl,
          summary: result.data.summary
        };
      } else {
        throw new Error(result.error || 'CSV Export fehlgeschlagen');
      }

    } catch (error) {
      console.error('❌ CSV Export Error:', error);
      throw error;
    }
  }

  /**
   * 🏛️ ELSTER XML Export über Server-API
   */
  async exportToElsterXML(wallet, year = new Date().getFullYear(), taxpayer = {}) {
    try {
      console.log('🏛️ ELSTER Export gestartet:', { wallet, year });
      
      const response = await fetch(`${this.apiBase}/api/export-elster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet,
          year,
          taxpayer
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ELSTER Export fehlgeschlagen');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Browser Download
        if (result.data.downloadUrl) {
          this.triggerDownload(result.data.downloadUrl, result.data.filename);
        }
        
        return {
          success: true,
          filename: result.data.filename,
          url: result.data.downloadUrl,
          warning: result.data.warning,
          summary: result.data.summary
        };
      } else {
        throw new Error(result.error || 'ELSTER Export fehlgeschlagen');
      }

    } catch (error) {
      console.error('❌ ELSTER Export Error:', error);
      throw error;
    }
  }

  /**
   * 🔗 Alle Formate exportieren
   */
  async exportAll(wallet, year = new Date().getFullYear(), taxpayer = {}) {
    const results = {
      pdf: null,
      csv: null,
      elster: null,
      errors: []
    };

    try {
      // PDF Export
      try {
        results.pdf = await this.exportToPDF(wallet, year);
        console.log('✅ PDF Export erfolgreich');
      } catch (error) {
        console.error('❌ PDF Export fehlgeschlagen:', error);
        results.errors.push({ format: 'PDF', error: error.message });
      }

      // CSV Export
      try {
        results.csv = await this.exportToCSV(wallet, year);
        console.log('✅ CSV Export erfolgreich');
      } catch (error) {
        console.error('❌ CSV Export fehlgeschlagen:', error);
        results.errors.push({ format: 'CSV', error: error.message });
      }

      // ELSTER Export
      try {
        results.elster = await this.exportToElsterXML(wallet, year, taxpayer);
        console.log('✅ ELSTER Export erfolgreich');
      } catch (error) {
        console.error('❌ ELSTER Export fehlgeschlagen:', error);
        results.errors.push({ format: 'ELSTER', error: error.message });
      }

      return results;

    } catch (error) {
      console.error('❌ Export All fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * 💾 Browser Download Trigger
   */
  triggerDownload(url, filename) {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      console.log('✅ Download gestartet:', filename);
    } catch (error) {
      console.error('❌ Download Error:', error);
      // Fallback: URL in neuem Tab öffnen
      window.open(url, '_blank');
    }
  }

  /**
   * 📋 Format Validierung
   */
  validateFormat(format) {
    const allowedFormats = ['pdf', 'csv', 'elster'];
    if (!allowedFormats.includes(format.toLowerCase())) {
      throw new Error(`Ungültiges Format: ${format}. Erlaubt: ${allowedFormats.join(', ')}`);
    }
    return format.toLowerCase();
  }

  /**
   * 🔍 Wallet Validierung
   */
  validateWallet(wallet) {
    if (!wallet || typeof wallet !== 'string') {
      throw new Error('Wallet-Adresse ist erforderlich');
    }
    
    // Ethereum Address Validierung
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      throw new Error('Ungültige Wallet-Adresse Format');
    }
    
    return wallet.toLowerCase();
  }

  /**
   * 📅 Jahr Validierung
   */
  validateYear(year) {
    const currentYear = new Date().getFullYear();
    const minYear = 2020; // Erste Krypto-relevante Jahre
    
    if (!year || year < minYear || year > currentYear) {
      throw new Error(`Ungültiges Jahr: ${year}. Erlaubt: ${minYear}-${currentYear}`);
    }
    
    return parseInt(year);
  }

  /**
   * 🎯 Export Status Check
   */
  async checkExportStatus(token) {
    try {
      const response = await fetch(`${this.apiBase}/api/export-status?token=${token}`);
      
      if (!response.ok) {
        throw new Error('Status Check fehlgeschlagen');
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ Status Check Error:', error);
      throw error;
    }
  }
}

// Export als Singleton
const exportService = new ExportService();
export default exportService; 