// 📄 TAX REPORT VIEW - SIMPLIFIED PRO PLAN VERSION
// Transfer-based tax analysis with DirectMoralisService

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  RefreshCw, 
  Download,
  Calendar,
  AlertCircle,
  DollarSign,
  Activity,
  BarChart3,
  FileText,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { DirectMoralisService } from '../services/DirectMoralisService';
import { supabase } from '../lib/supabaseClient';

const TaxReportView = () => {
  const { user } = useAuth();
  const { canAccessTaxReport, getAccessMessage, isPremium } = useSubscription();
  
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [filterCategory, setFilterCategory] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Load Tax Data
  const loadTaxData = async () => {
    if (!user?.id || !canAccessTaxReport()) {
      setError('Tax Report nur für Premium-Mitglieder verfügbar');
      return;
    }
    
    // Get user wallets
    const { data: wallets } = await supabase
      .from('wallets')
      .select('address, chain_id')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (!wallets || wallets.length === 0) {
      setError('Keine Wallets gefunden für Steueranalyse');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📄 TAX: Loading transfer data for', wallets.length, 'wallets');
      
      let allTransfers = [];
      let totalCUs = 0;
      
      // Load transfer data for all wallets
      for (const wallet of wallets) {
        const chain = wallet.chain_id === 369 ? '0x171' : '0x1';
        
        const result = await DirectMoralisService.getTaxData(wallet.address, chain, {
          getAllPages: true,
          limit: 500
        });
        
        if (result.success) {
          // Add wallet info to transfers
          const transfersWithWallet = result.allTransfers.map(transfer => ({
            ...transfer,
            walletAddress: wallet.address,
            chain: chain,
            year: new Date(transfer.block_timestamp).getFullYear().toString()
          }));
          
          allTransfers.push(...transfersWithWallet);
          totalCUs += result.cuUsed;
          
          console.log(`✅ Loaded ${result.allTransfers.length} transfers for ${wallet.address}`);
        } else {
          console.warn(`⚠️ Failed to load transfers for ${wallet.address}:`, result.error);
        }
      }
      
      // Filter by selected year
      const yearFilteredTransfers = allTransfers.filter(transfer => transfer.year === selectedYear);
      
      // Calculate tax statistics
      const taxStats = calculateTaxStats(yearFilteredTransfers);
      
      setTaxData({
        allTransfers: yearFilteredTransfers,
        taxableTransfers: taxStats.taxableTransfers,
        purchases: taxStats.purchases,
        sales: taxStats.sales,
        stats: taxStats,
        walletCount: wallets.length,
        cuUsed: totalCUs,
        year: selectedYear,
        source: 'direct_moralis_pro_tax'
      });
      
      setLastUpdate(new Date());
      console.log('✅ Tax Data loaded for', selectedYear, ':', taxStats);
      
    } catch (error) {
      console.error('💥 Tax loading error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate tax statistics
  const calculateTaxStats = (transfers) => {
    // Taxable: Incoming transfers from zero address (minting/rewards)
    const taxableTransfers = transfers.filter(transfer => {
      const isIncoming = transfer.to_address?.toLowerCase() === transfer.walletAddress?.toLowerCase();
      const fromZeroAddress = transfer.from_address === '0x0000000000000000000000000000000000000000';
      return isIncoming && fromZeroAddress;
    });
    
    // Purchases: Outgoing transfers
    const purchases = transfers.filter(transfer => {
      const isOutgoing = transfer.from_address?.toLowerCase() === transfer.walletAddress?.toLowerCase();
      return isOutgoing;
    });
    
    // Sales: Would need additional logic to identify actual sales vs transfers
    const sales = []; // Simplified for now
    
    // Calculate values (simplified estimation)
    let taxableIncome = 0;
    let purchaseValue = 0;
    
    taxableTransfers.forEach(transfer => {
      const decimals = parseInt(transfer.decimals) || 18;
      const amount = parseFloat(transfer.value) / Math.pow(10, decimals);
      taxableIncome += amount * 0.001; // Simplified price estimation
    });
    
    purchases.forEach(transfer => {
      const decimals = parseInt(transfer.decimals) || 18;
      const amount = parseFloat(transfer.value) / Math.pow(10, decimals);
      purchaseValue += amount * 0.001; // Simplified price estimation
    });
    
    return {
      taxableTransfers,
      purchases,
      sales,
      taxableIncome,
      purchaseValue,
      salesValue: 0,
      taxableCount: taxableTransfers.length,
      purchaseCount: purchases.length,
      salesCount: sales.length
    };
  };

  // Get filtered transactions based on category
  const getFilteredTransactions = () => {
    if (!taxData) return [];
    
    switch (filterCategory) {
      case 'taxable':
        return taxData.taxableTransfers;
      case 'purchases':
        return taxData.purchases;
      case 'sales':
        return taxData.sales;
      default:
        return taxData.allTransfers;
    }
  };

  // Format functions
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  // Download CSV function (placeholder)
  const downloadCSV = () => {
    const filteredTransactions = getFilteredTransactions();
    console.log('📥 CSV Download würde starten für', filteredTransactions.length, 'Transaktionen');
    alert(`CSV Download: ${filteredTransactions.length} Transaktionen für ${selectedYear}`);
  };

  // Access Control Check
  if (!canAccessTaxReport()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tax Report</h1>
        </div>
        
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-lg font-medium mb-2">Premium Feature</h3>
          <p className="text-gray-600 mb-4">{getAccessMessage()}</p>
          <p className="text-sm text-gray-500">
            Der Tax Report analysiert Ihre Transaktionen und erstellt steuerrelevante Berichte.
          </p>
        </Card>
      </div>
    );
  }

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tax Report</h1>
          <p className="text-gray-600">Transfer-based tax analysis</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={loadTaxData}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Lädt...' : 'Tax laden'}</span>
          </Button>
          
          {taxData && (
            <Button 
              onClick={downloadCSV}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>CSV Export</span>
            </Button>
          )}
        </div>
      </div>

      {/* Subscription Status */}
      <Card className="bg-green-500/10 border-green-400/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-medium">{getAccessMessage()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-500/10 border-red-400/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Steuerjahr auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            {['2025', '2026', '2027'].map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? 'default' : 'outline'}
                onClick={() => setSelectedYear(year)}
                className="flex items-center space-x-1"
              >
                <Calendar className="h-4 w-4" />
                <span>{year}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tax Summary */}
      {taxData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { key: 'all', label: 'Alle Transaktionen', count: taxData.allTransfers.length },
                  { key: 'taxable', label: 'Steuerpflichtig (ROI)', count: taxData.stats.taxableCount },
                  { key: 'purchases', label: 'Käufe', count: taxData.stats.purchaseCount },
                  { key: 'sales', label: 'Verkäufe', count: taxData.stats.salesCount }
                ].map(filter => (
                  <Button
                    key={filter.key}
                    variant={filterCategory === filter.key ? 'default' : 'outline'}
                    className="w-full justify-between"
                    onClick={() => setFilterCategory(filter.key)}
                  >
                    <span>{filter.label}</span>
                    <Badge variant="secondary">{filter.count}</Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tax Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Steuer Übersicht ({selectedYear})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                
                {/* Steuerpflichtig */}
                <div className="flex justify-between items-center p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
                  <div>
                    <span className="font-medium">ROI/Minting Einkommen</span>
                    <p className="text-xs text-gray-600">§ 22 EStG - Sonstige Einkünfte</p>
                  </div>
                  <span className="font-bold text-green-400">{formatCurrency(taxData.stats.taxableIncome)}</span>
                </div>
                
                {/* Käufe */}
                <div className="flex justify-between items-center p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                  <div>
                    <span className="font-medium">Käufe/Transfers</span>
                    <p className="text-xs text-gray-600">Nicht steuerpflichtig ({taxData.stats.purchaseCount} Transaktionen)</p>
                  </div>
                  <span className="font-bold text-blue-400">{formatCurrency(taxData.stats.purchaseValue)}</span>
                </div>
                
                {/* CU Usage */}
                <div className="flex justify-between items-center p-3 bg-purple-500/10 border border-purple-400/20 rounded-lg">
                  <div>
                    <span className="font-medium">API Verbrauch</span>
                    <p className="text-xs text-gray-600">Moralis CU verwendet</p>
                  </div>
                  <span className="font-bold text-purple-400">{taxData.cuUsed} CUs</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-lg">
                    <div>
                      <span className="font-bold">Steuerpflichtiges Einkommen</span>
                      <p className="text-xs text-gray-600">Basierend auf § 22 EStG</p>
                    </div>
                    <span className="font-bold text-red-400">{formatCurrency(taxData.stats.taxableIncome)}</span>
                  </div>
                </div>
                
                {/* Steuerhinweis */}
                <div className="text-xs text-gray-600 p-2 bg-yellow-500/10 border border-yellow-400/20 rounded">
                  ⚖️ Steuerrechtliche Beratung durch einen Experten empfohlen
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* Transactions Table */}
      {taxData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Transaktionen ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTransactions.slice(0, 50).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium">{transaction.token_symbol || 'Unknown'}</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(transaction.block_timestamp)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.from_address === '0x0000000000000000000000000000000000000000' ? 'Minting' : 
                         transaction.from_address?.slice(0, 8) + '...' + ' → ' + transaction.to_address?.slice(0, 8) + '...'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-400">
                      {((parseFloat(transaction.value) / Math.pow(10, transaction.decimals || 18)) * 0.001).toFixed(4)} USD
                    </div>
                    <div className="text-sm text-gray-600">
                      {(parseFloat(transaction.value) / Math.pow(10, transaction.decimals || 18)).toFixed(4)} {transaction.token_symbol}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTransactions.length > 50 && (
                <div className="text-center p-4 text-gray-500">
                  ... und {filteredTransactions.length - 50} weitere Transaktionen
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Update Info */}
      {lastUpdate && (
        <div className="text-center text-sm text-gray-500">
          Letzte Aktualisierung: {lastUpdate.toLocaleString('de-DE')}
        </div>
      )}
    </div>
  );
};

export default TaxReportView; 