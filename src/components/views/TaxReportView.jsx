import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Download, Printer, AlertTriangle, Edit, CalendarClock, Gift, Info, Loader2, Wallet, FileText } from 'lucide-react'; // Added Wallet and FileText
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppContext } from '@/contexts/AppContext';
import { generateTaxReport, exportTaxReport } from '@/lib/TaxReport'
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { calculateTaxInfo, formatAmount, convertPlsToUsd } from '@/lib/investmentUtils';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { taxService } from '@/lib/taxService';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TaxReportView = () => {
  const { language, translations, connectedWalletAddress, appDataVersion } = useAppContext();
  const t = translations[language];
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [taxInfo, setTaxInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [dummyHoldingData, setDummyHoldingData] = useState([]);
  const [dummyPrinterTokenData, setDummyPrinterTokenData] = useState([]);

  const [taxReport, setTaxReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [report, setReport] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [roiData, setRoiData] = useState([]);

  useEffect(() => {
    const loadTaxData = async () => {
      if (connectedWalletAddress) {
        setIsLoadingData(true);
        await new Promise(resolve => setTimeout(resolve, 700)); 
        
        setDummyHoldingData([
          { id: 1, token: t.plsUsdPairPLS || "PulseCoin (PLS)", purchaseDate: "2024-01-15", purchaseValue: "100.00", holdingDuration: `167 ${t.days}`, taxStatus: t.taxable, taxFreeDate: "2025-01-16" },
          { id: 2, token: t.plsxUsdPairPLSX || "PulseX (PLSX)", purchaseDate: "2023-10-01", purchaseValue: "50.00", holdingDuration: `273 ${t.days}`, taxStatus: t.taxable, taxFreeDate: "2024-10-02" },
          { id: 3, token: t.hexUsdPairHEX || "HEX (PulseChain)", purchaseDate: "2023-03-20", purchaseValue: "200.00", holdingDuration: `438 ${t.days}`, taxStatus: t.taxFree, taxFreeDate: t.taxFree },
        ]);
        setDummyPrinterTokenData([
          { id: 1, token: "DruckerTokenA (DTA)", distributionDate: "2024-03-01", amount: "1000", valueAtDistribution: "10.00", notes: t.reward },
          { id: 2, token: "DruckerTokenB (DTB)", distributionDate: "2024-04-15", amount: "500", valueAtDistribution: "25.00", notes: t.airdrop },
          { id: 3, token: "DruckerTokenA (DTA)", distributionDate: "2024-05-01", amount: "1200", valueAtDistribution: "15.00", notes: t.reward },
        ]);
        setIsLoadingData(false);
      } else {
        setDummyHoldingData([]);
        setDummyPrinterTokenData([]);
      }
    };
    loadTaxData();
  }, [connectedWalletAddress]); // FIXED: Removed problematic dependencies

  // FIXED: Define loadReport with useCallback before useEffect
  const loadReport = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const reportData = await taxService.generateTaxReport(user.id, selectedYear);
      setReport(reportData);
      setTransactions(reportData.report_data.transactions);
      setHoldings(reportData.report_data.holdings);
      setRoiData(reportData.report_data.roi);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Der Steuerbericht konnte nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedYear, toast]); // FIXED: Added proper dependencies

  useEffect(() => {
    if (user) {
      loadReport();
    }
  }, [user, loadReport]); // FIXED: Added loadReport to dependencies

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      const doc = await taxService.generatePDFExport(report.id);
      doc.save(`steuerbericht-${selectedYear}.pdf`);
      toast({
        title: 'Erfolg',
        description: 'Der Steuerbericht wurde als PDF exportiert.'
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Der PDF-Export konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data, headers) => {
    const headerRow = headers.map(h => h.label).join(',');
    const dataRows = data.map(row => 
      headers.map(header => {
        let cellValue = row[header.key];
        if (typeof cellValue === 'string') {
          cellValue = `"${cellValue.replace(/"/g, '""')}"`;
        }
        return cellValue;
      }).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
  };

  const downloadCSV = (csvData, filename) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportCSV = (dataType) => {
    setIsExporting(true);
    let dataToExport;
    let headers;
    let filename;

    if (dataType === 'holding') {
      dataToExport = dummyHoldingData;
      headers = [
        { key: 'token', label: t.holdingPeriodTableToken || 'Token' },
        { key: 'purchaseDate', label: t.holdingPeriodTablePurchaseDate || 'Purchase Date' },
        { key: 'purchaseValue', label: t.holdingPeriodTablePurchaseValue || 'Purchase Value (EUR)' },
        { key: 'holdingDuration', label: t.holdingPeriodTableHoldingDuration || 'Holding Duration' },
        { key: 'taxStatus', label: t.holdingPeriodTableTaxStatus || 'Tax Status (DE)' },
        { key: 'taxFreeDate', label: t.holdingPeriodTableTaxFreeDate || 'Tax-Free Date (DE)' },
      ];
      filename = 'holding_period_report.csv';
    } else if (dataType === 'printer') {
      dataToExport = dummyPrinterTokenData;
      headers = [
        { key: 'token', label: t.printerTokenTableToken || 'Token' },
        { key: 'distributionDate', label: t.printerTokenTableDistributionDate || 'Distribution Date' },
        { key: 'amount', label: t.printerTokenTableAmount || 'Amount' },
        { key: 'valueAtDistribution', label: t.printerTokenTableValueAtDistribution || 'Value at Distribution (EUR)' },
        { key: 'notes', label: t.printerTokenTableNotes || 'Notes' },
      ];
      filename = 'printer_token_income_log.csv';
    } else {
      setIsExporting(false);
      return;
    }

    const csvString = convertToCSV(dataToExport, headers);
    downloadCSV(csvString, filename);
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handleGenerateTaxReport = () => {
    setIsGenerating(true);
    try {
      const report = generateTaxReport(selectedYear);
      setTaxReport(report);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportTaxReport = () => {
    if (!taxReport) return;
    const csv = exportTaxReport(taxReport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `tax_report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateTaxReport = () => {
    const report = {
      year: selectedYear,
      user: user.email,
      transactions: transactions.map(tx => ({
        date: tx.purchase_date,
        token: tx.symbol,
        amount: formatAmount(tx.quantity),
        purchasePrice: tx.purchase_price,
        currentPrice: tx.current_value,
        profitLoss: tx.profit_loss
      })),
      summary: taxInfo
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsechain-tax-report-${selectedYear}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCSV = () => {
    const headers = ['Date', 'Token', 'Amount', 'Purchase Price (PLS)', 'Current Price (PLS)', 'Profit/Loss (PLS)'];
    const rows = transactions.map(tx => [
      tx.purchase_date,
      tx.symbol,
      formatAmount(tx.quantity),
      tx.purchase_price,
      tx.current_value,
      tx.profit_loss
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsechain-tax-report-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">{t.taxReportViewTitle}</h1>
      </div>

      <p className="text-lg text-foreground/80 mb-6">
        {t.taxReportDescription}
      </p>

      {!connectedWalletAddress && (
         <Card className="shadow-xl bg-background/70 dark:bg-slate-800/70 mb-8 text-center py-10">
            <CardHeader>
                <Wallet className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>{t.connectWalletToView || "Connect Wallet to View"}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{t.taxReportWalletMessage || "Please connect your wallet to view tax-related data."}</p>
            </CardContent>
        </Card>
      )}

      {connectedWalletAddress && isLoadingData && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {connectedWalletAddress && !isLoadingData && (
        <>
          <Card className="shadow-xl bg-background/70 dark:bg-slate-800/70 mb-8">
            <CardHeader>
              <CardTitle>{t.taxExportOptionsTitle}</CardTitle>
              <CardDescription>
                {t.taxExportOptionsDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="taxReportYear" className="block text-sm font-medium text-foreground mb-1">Jahr für Steuerreport</label>
                  <input id="taxReportYear" type="number" className="w-full p-2 border border-input rounded-md bg-background focus:ring-primary focus:border-primary" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} />
                </div>
                <Button onClick={handleGenerateTaxReport} className="w-full mt-4" disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileSpreadsheet className="mr-2 h-5 w-5" />}
                  Echten Steuerreport generieren
                </Button>
                {taxReport && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Steuerreport für {selectedYear}</span>
                      <Button onClick={handleExportTaxReport} size="sm" variant="outline"><Download className="mr-2 h-4 w-4" /> CSV Export</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Typ</TableHead>
                          <TableHead>Menge</TableHead>
                          <TableHead>Preis</TableHead>
                          <TableHead>Datum</TableHead>
                          <TableHead>Gewinn/Verlust</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taxReport.transactions.map((t, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{t.symbol}</TableCell>
                            <TableCell>{t.type}</TableCell>
                            <TableCell>{t.amount}</TableCell>
                            <TableCell>{t.price}</TableCell>
                            <TableCell>{new Date(t.timestamp).toLocaleDateString()}</TableCell>
                            <TableCell>{t.profit.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 font-semibold">Summe realisierte Gewinne: {taxReport.realizedGains.toFixed(2)} | Verluste: {taxReport.realizedLosses.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-sky-100 dark:bg-sky-900/30 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 rounded-md mb-8">
              <div className="flex items-start">
                  <Edit className="h-5 w-5 mr-2 mt-0.5 text-sky-500 flex-shrink-0" />
                  <div>
                      <p className="font-semibold">{t.taxPlannedForBuild2}</p>
                      <p className="text-sm">{t.taxReportPlannedFeatures}</p>
                  </div>
              </div>
          </div>
          
          <Card className="shadow-xl bg-background/70 dark:bg-slate-800/70 mb-8">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <CalendarClock className="mr-2 h-6 w-6 text-primary" />
                  {t.holdingPeriodTrackingTitle}
                </CardTitle>
                <CardDescription>
                  {t.roiTokenOverviewDescription}
                </CardDescription>
              </div>
              <Button onClick={() => handleExportCSV('holding')} variant="outline" size="sm" disabled={isExporting || dummyHoldingData.length === 0}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {t.taxExportCSV}
              </Button>
            </CardHeader>
            <CardContent>
              {dummyHoldingData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.holdingPeriodTableToken}</TableHead>
                      <TableHead>{t.holdingPeriodTablePurchaseDate}</TableHead>
                      <TableHead className="text-right">{t.holdingPeriodTablePurchaseValue}</TableHead>
                      <TableHead>{t.holdingPeriodTableHoldingDuration}</TableHead>
                      <TableHead>{t.holdingPeriodTableTaxStatus}</TableHead>
                      <TableHead>{t.holdingPeriodTableTaxFreeDate}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dummyHoldingData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{item.token}</TableCell>
                        <TableCell>{item.purchaseDate}</TableCell>
                        <TableCell className="text-right">{item.purchaseValue}</TableCell>
                        <TableCell>{item.holdingDuration}</TableCell>
                        <TableCell className={item.taxStatus === t.taxFree ? 'text-green-500' : 'text-orange-500'}>{item.taxStatus}</TableCell>
                        <TableCell>{item.taxFreeDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-5">{t.noDataAvailable}</p>
              )}
              <div className="mt-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 border-l-4 border-indigo-500 text-indigo-700 dark:text-indigo-300 rounded-md flex items-start">
                <Info className="h-5 w-5 mr-2 mt-0.5 text-indigo-500 flex-shrink-0" />
                <p className="text-sm">{t.holdingPeriodNote}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl bg-background/70 dark:bg-slate-800/70 mb-8">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <Gift className="mr-2 h-6 w-6 text-primary" />
                  {t.printerTokenROITitle}
                </CardTitle>
                <CardDescription>
                  {language === 'de' ? 'Protokoll der Ausschüttungen von Druckertoken (Beispieldaten).' : 'Log of distributions from printer tokens (example data).'}
                </CardDescription>
              </div>
              <Button onClick={() => handleExportCSV('printer')} variant="outline" size="sm" disabled={isExporting || dummyPrinterTokenData.length === 0}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {t.taxExportCSV}
              </Button>
            </CardHeader>
            <CardContent>
              {dummyPrinterTokenData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.printerTokenTableToken}</TableHead>
                      <TableHead>{t.printerTokenTableDistributionDate}</TableHead>
                      <TableHead className="text-right">{t.printerTokenTableAmount}</TableHead>
                      <TableHead className="text-right">{t.printerTokenTableValueAtDistribution}</TableHead>
                      <TableHead>{t.printerTokenTableNotes}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dummyPrinterTokenData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{item.token}</TableCell>
                        <TableCell>{item.distributionDate}</TableCell>
                        <TableCell className="text-right">{item.amount}</TableCell>
                        <TableCell className="text-right">{item.valueAtDistribution}</TableCell>
                        <TableCell>{item.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-5">{t.noDataAvailable}</p>
              )}
              <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500 text-purple-700 dark:text-purple-300 rounded-md flex items-start">
                <Info className="h-5 w-5 mr-2 mt-0.5 text-purple-500 flex-shrink-0" />
                <p className="text-sm">{t.printerTokenNote}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
      <div className="mt-8 p-6 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-md shadow-md">
        <div className="flex items-center">
          <AlertTriangle className="h-8 w-8 mr-3 text-red-500 dark:text-red-400" />
          <div>
            <p className="font-bold text-lg">{t.importantDisclaimerTitle}</p>
            <p className="text-sm">{t.importantDisclaimerText}</p>
          </div>
        </div>
      </div>

      <Card className="shadow-xl bg-background/70 dark:bg-slate-800/70 mb-8">
        <CardHeader>
          <CardTitle>PulseChain Tax Report {selectedYear}</CardTitle>
          <CardDescription>
            View and export your PulseChain transaction history for tax purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Summary</h3>
              {taxInfo && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Profit</p>
                    <p className="text-lg font-medium">{taxInfo.totalProfit} PLS</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Loss</p>
                    <p className="text-lg font-medium">{taxInfo.totalLoss} PLS</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Net Profit</p>
                    <p className="text-lg font-medium">{taxInfo.netProfit} PLS</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Holding Period</p>
                    <p className="text-lg font-medium">{taxInfo.holdingPeriod} days</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-x-4">
              <Button onClick={generateTaxReport} className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button onClick={generateCSV} className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purchase Price (PLS)</TableHead>
                <TableHead>Current Price (PLS)</TableHead>
                <TableHead>Profit/Loss (PLS)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(tx.purchase_date).toLocaleDateString()}</TableCell>
                  <TableCell>{tx.symbol}</TableCell>
                  <TableCell>{formatAmount(tx.quantity)}</TableCell>
                  <TableCell>{tx.purchase_price}</TableCell>
                  <TableCell>{tx.current_value}</TableCell>
                  <TableCell className={parseFloat(tx.profit_loss) >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {tx.profit_loss}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-xl bg-background/70 dark:bg-slate-800/70 mb-8">
        <CardHeader>
          <CardTitle>Zusammenfassung {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold mb-2">Gesamtumsatz</h3>
              <p className="text-2xl">{report.report_data.summary.total_volume.toLocaleString('de-DE')} EUR</p>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold mb-2">Gewinn/Verlust</h3>
              <p className="text-2xl">{report.report_data.summary.total_profit_loss.toLocaleString('de-DE')} EUR</p>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold mb-2">Transaktionen</h3>
              <p className="text-2xl">{report.report_data.summary.total_transactions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl bg-background/70 dark:bg-slate-800/70 mb-8">
        <CardHeader>
          <CardTitle>Transaktionen</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Menge</TableHead>
                <TableHead>Preis in EUR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.transaction_date), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell>{transaction.token_symbol}</TableCell>
                  <TableCell>{transaction.transaction_type}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{transaction.price_in_eur.toLocaleString('de-DE')} EUR</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-xl bg-background/70 dark:bg-slate-800/70 mb-8">
        <CardHeader>
          <CardTitle>Haltefristen</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Menge</TableHead>
                <TableHead>Erster Kauf</TableHead>
                <TableHead>Haltefrist</TableHead>
                <TableHead>Durchschnittspreis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => (
                <TableRow key={holding.id}>
                  <TableCell>{holding.token_symbol}</TableCell>
                  <TableCell>{holding.amount}</TableCell>
                  <TableCell>
                    {format(new Date(holding.first_purchase_date), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell>{holding.holding_period} Tage</TableCell>
                  <TableCell>{holding.average_purchase_price.toLocaleString('de-DE')} EUR</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-xl bg-background/70 dark:bg-slate-800/70 mb-8">
        <CardHeader>
          <CardTitle>Täglicher ROI</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead>Wert in EUR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roiData.map((roi) => (
                <TableRow key={roi.id}>
                  <TableCell>
                    {format(new Date(roi.date), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell>{roi.token_symbol}</TableCell>
                  <TableCell>{roi.daily_roi.toLocaleString('de-DE')}%</TableCell>
                  <TableCell>{roi.value_in_eur.toLocaleString('de-DE')} EUR</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-xl bg-background/70 dark:bg-slate-800/70 mb-8">
        <CardHeader>
          <CardTitle>PulseChain Tax Report {selectedYear}</CardTitle>
          <CardDescription>
            View and export your PulseChain transaction history for tax purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Summary</h3>
              {taxInfo && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Profit</p>
                    <p className="text-lg font-medium">{taxInfo.totalProfit} PLS</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Loss</p>
                    <p className="text-lg font-medium">{taxInfo.totalLoss} PLS</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Net Profit</p>
                    <p className="text-lg font-medium">{taxInfo.netProfit} PLS</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Holding Period</p>
                    <p className="text-lg font-medium">{taxInfo.holdingPeriod} days</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-x-4">
              <Button onClick={handleExportPDF} disabled={loading}>
                <FileText className="mr-2 h-4 w-4" />
                PDF Export
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purchase Price (PLS)</TableHead>
                <TableHead>Current Price (PLS)</TableHead>
                <TableHead>Profit/Loss (PLS)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(tx.purchase_date).toLocaleDateString()}</TableCell>
                  <TableCell>{tx.symbol}</TableCell>
                  <TableCell>{formatAmount(tx.quantity)}</TableCell>
                  <TableCell>{tx.purchase_price}</TableCell>
                  <TableCell>{tx.current_value}</TableCell>
                  <TableCell className={parseFloat(tx.profit_loss) >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {tx.profit_loss}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </motion.div>
  );
};

export default TaxReportView;