import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Download, FileText, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * 🎯 STEUERREPORT DOWNLOAD COMPONENT
 * 
 * Ermöglicht Benutzern das Herunterladen von professionellen PDF-Steuerreports
 * aus ihren tax_cache und roi_cache Daten für spezifische Jahre.
 */
export default function TaxReportDownload({ walletAddress }) {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [error, setError] = useState(null);

  // Verfügbare Jahre (2020 bis aktuelles Jahr)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: currentYear - 2019 }, 
    (_, i) => (currentYear - i).toString()
  );

  const handleDownload = async () => {
    if (!user?.id || !walletAddress || !selectedYear) {
      setError('Fehlende Daten: User ID, Wallet oder Jahr');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setDownloadStatus(null);

    try {
      // API-Aufruf für PDF-Generation
      const response = await fetch(
        `/api/export-tax-report?userId=${user.id}&wallet=${walletAddress}&year=${selectedYear}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // PDF-Blob erstellen und herunterladen
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Steuerreport_${selectedYear}_${walletAddress.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadStatus({
        type: 'success',
        message: `Steuerreport ${selectedYear} erfolgreich heruntergeladen`,
        size: Math.round(blob.size / 1024)
      });

    } catch (error) {
      console.error('❌ Fehler beim Steuerreport-Download:', error);
      setError(error.message);
      setDownloadStatus({
        type: 'error',
        message: 'PDF-Generation fehlgeschlagen'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getWalletDisplay = () => {
    if (!walletAddress) return 'Keine Wallet verbunden';
    return `${walletAddress.substring(0, 6)}...${walletAddress.substring(-4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          📊 Steuerreport Download
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User & Wallet Info */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-slate-600">User</div>
              <div className="font-mono text-sm">{user?.email || 'Nicht eingeloggt'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-600">Wallet</div>
              <div className="font-mono text-sm">{getWalletDisplay()}</div>
            </div>
          </div>
        </div>

        {/* Jahr-Auswahl */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Steuerjahr auswählen
          </label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="Jahr wählen" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                  {year === currentYear.toString() && (
                    <span className="ml-2 text-blue-600">(aktuell)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Download Button */}
        <Button 
          onClick={handleDownload}
          disabled={isGenerating || !user?.id || !walletAddress}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              PDF wird generiert...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Steuerreport {selectedYear} herunterladen
            </>
          )}
        </Button>

        {/* Status Anzeige */}
        {downloadStatus && (
          <div className={`rounded-lg p-4 ${
            downloadStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {downloadStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <div className={`font-medium ${
                downloadStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {downloadStatus.message}
              </div>
            </div>
            {downloadStatus.size && (
              <div className="text-sm text-green-600 mt-1">
                Dateigröße: {downloadStatus.size} KB
              </div>
            )}
          </div>
        )}

        {/* Fehler-Anzeige */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="font-medium text-red-800">Fehler</div>
            </div>
            <div className="text-sm text-red-600 mt-1">{error}</div>
          </div>
        )}

        {/* Info-Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">📋 Was ist enthalten?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Alle Verkäufe und Gewinn/Verlust-Berechnungen</li>
            <li>• ROI-Einnahmen aus DeFi-Protokollen</li>
            <li>• Steuerliche Bewertung nach deutscher Rechtslage</li>
            <li>• Haltedauer-Analyse (>1 Jahr = steuerfrei)</li>
            <li>• Geschätzte Steuerlast (26% Kapitalertragssteuer)</li>
          </ul>
        </div>

        {/* Rechtlicher Hinweis */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <div className="font-medium text-amber-800">⚠️ Rechtlicher Hinweis</div>
              <div className="text-sm text-amber-700 mt-1">
                Dieser Report dient nur zu Informationszwecken und stellt keine Steuerberatung dar. 
                Konsultieren Sie einen Steuerberater für genaue Berechnungen und rechtliche Beratung.
              </div>
            </div>
          </div>
        </div>

        {/* Verfügbare Jahre */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-slate-600">Verfügbare Jahre:</span>
          {availableYears.map(year => (
            <Badge 
              key={year} 
              variant={year === selectedYear ? 'default' : 'outline'}
              className="text-xs"
            >
              {year}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 