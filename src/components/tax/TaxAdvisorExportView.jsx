import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Download, FileText, FileSpreadsheet, FileCode, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const TaxAdvisorExportView = ({ walletAddress }) => {
  const [exportData, setExportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const loadTaxAdvisorExport = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    setDownloadProgress(0);
    
    try {
      console.log('🔄 Loading Tax Advisor Export for:', walletAddress);
      
      const response = await fetch(`/api/tax-advisor-export?address=${walletAddress}&limit=300000`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Tax Advisor Export loaded:', data);
        setExportData(data);
        setDownloadProgress(100);
      } else {
        throw new Error(data.error || 'Export failed');
      }
    } catch (err) {
      console.error('❌ Tax Advisor Export error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!exportData?.taxAdvisorExport?.exports?.csv) return;
    
    const csvContent = exportData.taxAdvisorExport.exports.csv;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tax-advisor-export-${walletAddress}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadHTML = () => {
    if (!exportData?.taxAdvisorExport?.exports?.html) return;
    
    const htmlContent = exportData.taxAdvisorExport.exports.html;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tax-advisor-report-${walletAddress}-${new Date().toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = () => {
    if (!exportData?.taxAdvisorExport?.exports?.excel) return;
    
    // Convert Excel data to CSV format for download
    const excelData = exportData.taxAdvisorExport.exports.excel;
    const allData = [
      ...excelData.purchases,
      ...excelData.sales,
      ...excelData.roiEvents,
      ...excelData.transfers
    ];
    
    if (allData.length === 0) return;
    
    const headers = Object.keys(allData[0]);
    const csvContent = [
      headers.join(','),
      ...allData.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tax-advisor-excel-${walletAddress}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (walletAddress) {
      loadTaxAdvisorExport();
    }
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Bitte geben Sie eine Wallet-Adresse ein, um den Tax Advisor Export zu starten.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🔥 KRITISCHER DISCLAIMER */}
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>⚠️ WICHTIGER HINWEIS:</strong> Dies ist KEINE Steuerberatung! 
          Diese Datensammlung dient nur als Grundlage für Ihren Steuerberater. 
          Für finale Steuerberechnungen wenden Sie sich an einen qualifizierten Steuerberater.
        </AlertDescription>
      </Alert>

      {/* 📊 EXPORT STATUS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tax Advisor Export Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Lade Transaktionsdaten...</span>
              </div>
              <Progress value={downloadProgress} className="w-full" />
            </div>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Fehler beim Laden: {error}
              </AlertDescription>
            </Alert>
          )}

          {exportData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800">Export erfolgreich erstellt!</span>
              </div>

              {/* 📈 SUMMARY */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {exportData.taxAdvisorExport?.summary?.totalTransactions || 0}
                  </div>
                  <div className="text-sm text-blue-800">Transaktionen</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {exportData.taxAdvisorExport?.summary?.categories?.purchases || 0}
                  </div>
                  <div className="text-sm text-green-800">Käufe</div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {exportData.taxAdvisorExport?.summary?.categories?.sales || 0}
                  </div>
                  <div className="text-sm text-red-800">Verkäufe</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {exportData.taxAdvisorExport?.summary?.categories?.roiEvents || 0}
                  </div>
                  <div className="text-sm text-purple-800">ROI Events</div>
                </div>
              </div>

              {/* 💰 VALUE SUMMARY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-gray-800">
                    €{exportData.taxAdvisorExport?.summary?.totalValues?.purchaseValueEUR?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-600">Gesamtwert Käufe</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-gray-800">
                    €{exportData.taxAdvisorExport?.summary?.totalValues?.salesValueEUR?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-600">Gesamtwert Verkäufe</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-gray-800">
                    €{exportData.taxAdvisorExport?.summary?.totalValues?.roiValueEUR?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-600">Gesamtwert ROI Events</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 📥 DOWNLOAD OPTIONS */}
      {exportData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={downloadCSV} 
                className="flex items-center gap-2"
                variant="outline"
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV Export
              </Button>
              
              <Button 
                onClick={downloadExcel} 
                className="flex items-center gap-2"
                variant="outline"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel Export
              </Button>
              
              <Button 
                onClick={downloadHTML} 
                className="flex items-center gap-2"
                variant="outline"
              >
                <FileCode className="h-4 w-4" />
                HTML Report
              </Button>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              Alle Exporte enthalten strukturierte Daten für Ihren Steuerberater. 
              Keine Steuerberechnungen enthalten.
            </div>
          </CardContent>
        </Card>
      )}

      {/* 📋 FEATURES & LIMITATIONS */}
      {exportData && (
        <Card>
          <CardHeader>
            <CardTitle>System Features & Limitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-green-700">✅ Features</h4>
                <ul className="space-y-1 text-sm">
                  {exportData.safeTaxSystem?.features?.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-orange-700">⚠️ Limitations</h4>
                <ul className="space-y-1 text-sm">
                  {exportData.safeTaxSystem?.limitations?.map((limitation, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔄 RELOAD BUTTON */}
      <div className="flex justify-center">
        <Button 
          onClick={loadTaxAdvisorExport} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Lade...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export neu laden
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TaxAdvisorExportView; 