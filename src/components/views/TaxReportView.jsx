// 📄 Tax Report View - DSGVO-konforme Steuerberichte für PulseChain
// Zeigt Transaktionen, berechnet Steuer-relevante Daten und bietet CSV-Export

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Eye,
  RefreshCw,
  ExternalLink,
  Calculator
} from 'lucide-react';

const TaxReportView = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [taxSummary, setTaxSummary] = useState({
    totalIncomeUsd: 0,
    totalCapitalGainsUsd: 0,
    totalCapitalLossesUsd: 0,
    totalFeesUsd: 0,
    totalTransactions: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Filter States
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    endDate: new Date().toISOString().split('T')[0], // Today
    walletAddress: '',
    txType: '',
    taxCategory: '',
    minAmount: '',
    maxAmount: ''
  });

  // Load transactions
  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }
  }, [user?.id]);

  // Filter transactions when filters change
  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      console.log('📄 TAX REPORT: Loading transactions for user:', user.id);

      // Load transactions from database
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('block_timestamp', { ascending: false });

      if (transactionError) {
        console.warn('Transactions table might not exist yet:', transactionError.message);
        setTransactions([]);
        setStatusMessage('📊 Keine Transaktionen gefunden - Transactions-Tabelle muss noch erstellt werden');
        return;
      }

      setTransactions(transactionData || []);
      console.log(`📄 TAX REPORT: Loaded ${(transactionData || []).length} transactions`);

      // Load tax summary
      await loadTaxSummary();

      setStatusMessage(`✅ ${(transactionData || []).length} Transaktionen geladen`);

    } catch (error) {
      console.error('Error loading transactions:', error);
      setStatusMessage(`❌ Fehler beim Laden: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTaxSummary = async () => {
    try {
      // Call the PostgreSQL function for tax summary
      const { data, error } = await supabase
        .rpc('get_tax_summary', {
          user_uuid: user.id,
          start_date: filters.startDate,
          end_date: filters.endDate
        });

      if (error) {
        console.warn('Tax summary function not available:', error.message);
        return;
      }

      if (data && data.length > 0) {
        setTaxSummary({
          totalIncomeUsd: parseFloat(data[0].total_income_usd) || 0,
          totalCapitalGainsUsd: parseFloat(data[0].total_capital_gains_usd) || 0,
          totalCapitalLossesUsd: parseFloat(data[0].total_capital_losses_usd) || 0,
          totalFeesUsd: parseFloat(data[0].total_fees_usd) || 0,
          totalTransactions: parseInt(data[0].total_transactions) || 0
        });
      }

    } catch (error) {
      console.warn('Error loading tax summary:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Date filter
    if (filters.startDate) {
      filtered = filtered.filter(tx => 
        !tx.block_timestamp || new Date(tx.block_timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(tx => 
        !tx.block_timestamp || new Date(tx.block_timestamp) <= new Date(filters.endDate + 'T23:59:59')
      );
    }

    // Wallet filter
    if (filters.walletAddress) {
      filtered = filtered.filter(tx => 
        tx.wallet_address?.toLowerCase().includes(filters.walletAddress.toLowerCase()) ||
        tx.from_address?.toLowerCase().includes(filters.walletAddress.toLowerCase()) ||
        tx.to_address?.toLowerCase().includes(filters.walletAddress.toLowerCase())
      );
    }

    // Transaction type filter
    if (filters.txType) {
      filtered = filtered.filter(tx => tx.tx_type === filters.txType);
    }

    // Tax category filter
    if (filters.taxCategory) {
      filtered = filtered.filter(tx => tx.tax_category === filters.taxCategory);
    }

    // Amount filters
    if (filters.minAmount) {
      filtered = filtered.filter(tx => parseFloat(tx.value_usd) >= parseFloat(filters.minAmount));
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(tx => parseFloat(tx.value_usd) <= parseFloat(filters.maxAmount));
    }

    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      walletAddress: '',
      txType: '',
      taxCategory: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // Use PostgreSQL function for export data
      const { data, error } = await supabase
        .rpc('get_transactions_for_export', {
          user_uuid: user.id,
          start_date: filters.startDate,
          end_date: filters.endDate,
          wallet_filter: filters.walletAddress || null
        });

      if (error) {
        // Fallback to client-side CSV generation
        generateClientSideCSV();
        return;
      }

      // Generate CSV from database function result
      const csvHeader = 'Date,Hash,Token,Amount,Value USD,Type,Direction,From,To,Gas Fee USD,Tax Category\n';
      const csvData = (data || []).map(tx => [
        tx.date_time ? new Date(tx.date_time).toLocaleString('de-DE') : '',
        tx.tx_hash || '',
        tx.token_symbol || '',
        tx.amount || '',
        tx.value_usd || '',
        tx.tx_type || '',
        tx.direction || '',
        tx.from_address || '',
        tx.to_address || '',
        tx.gas_fee_usd || '',
        tx.tax_category || ''
      ].map(field => `"${field}"`).join(',')).join('\n');

      downloadCSV(csvHeader + csvData, 'tax-report');

    } catch (error) {
      console.error('Error exporting CSV:', error);
      generateClientSideCSV(); // Fallback
    } finally {
      setIsExporting(false);
    }
  };

  const generateClientSideCSV = () => {
    const csvHeader = 'Date,Hash,Token,Amount,Value USD,Type,Direction,From,To,Gas Fee USD,Tax Category\n';
    const csvData = filteredTransactions.map(tx => [
      tx.block_timestamp ? new Date(tx.block_timestamp).toLocaleString('de-DE') : '',
      tx.tx_hash || '',
      tx.token_symbol || '',
      tx.amount || '',
      tx.value_usd || '',
      tx.tx_type || '',
      tx.direction || '',
      tx.from_address || '',
      tx.to_address || '',
      tx.gas_fee_usd || '',
      tx.tax_category || ''
    ].map(field => `"${field}"`).join(',')).join('\n');

    downloadCSV(csvHeader + csvData, 'tax-report-filtered');
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMessage('📄 CSV-Export erfolgreich heruntergeladen');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const openInExplorer = (txHash, chainId = 369) => {
    const explorerUrl = chainId === 369 
      ? `https://scan.pulsechain.com/tx/${txHash}`
      : `https://etherscan.io/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('de-DE');
  };

  const getTypeColor = (txType) => {
    const colors = {
      transfer: 'text-blue-400',
      swap: 'text-green-400',
      stake: 'text-purple-400',
      unstake: 'text-orange-400',
      airdrop: 'text-pink-400',
      mining: 'text-yellow-400'
    };
    return colors[txType] || 'text-gray-400';
  };

  const getCategoryColor = (category) => {
    const colors = {
      income: 'text-green-400',
      capital_gain: 'text-green-400',
      capital_loss: 'text-red-400',
      fee: 'text-orange-400',
      gift: 'text-purple-400'
    };
    return colors[category] || 'text-gray-400';
  };

  if (!user) {
    return (
      <div className="pulse-card p-8 text-center" style={{outline: 'none', boxShadow: 'none'}}>
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="pulse-title mb-2">Tax Reports</h2>
        <p className="pulse-text-secondary">Please log in to view your tax reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="pulse-title mb-2">Tax Reports</h1>
          <p className="pulse-subtitle">DSGVO-konforme Steuerberichte für PulseChain & Ethereum</p>
          {statusMessage && (
            <div className={`mt-2 text-sm ${statusMessage.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
              {statusMessage}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadTransactions}
            disabled={isLoading}
            className="py-3 px-4 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            style={{outline: 'none', boxShadow: 'none'}}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={exportToCSV}
            disabled={isExporting || filteredTransactions.length === 0}
            className="py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="pulse-card p-4 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center gap-2 justify-center mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs font-medium text-green-300">Income</span>
          </div>
          <div className="text-lg font-bold text-green-400">
            {formatCurrency(taxSummary.totalIncomeUsd)}
          </div>
        </div>

        <div className="pulse-card p-4 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center gap-2 justify-center mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs font-medium text-green-300">Capital Gains</span>
          </div>
          <div className="text-lg font-bold text-green-400">
            {formatCurrency(taxSummary.totalCapitalGainsUsd)}
          </div>
        </div>

        <div className="pulse-card p-4 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center gap-2 justify-center mb-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-xs font-medium text-red-300">Capital Losses</span>
          </div>
          <div className="text-lg font-bold text-red-400">
            {formatCurrency(taxSummary.totalCapitalLossesUsd)}
          </div>
        </div>

        <div className="pulse-card p-4 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center gap-2 justify-center mb-2">
            <DollarSign className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-medium text-orange-300">Fees</span>
          </div>
          <div className="text-lg font-bold text-orange-400">
            {formatCurrency(taxSummary.totalFeesUsd)}
          </div>
        </div>

        <div className="pulse-card p-4 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center gap-2 justify-center mb-2">
            <Calculator className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">Transactions</span>
          </div>
          <div className="text-lg font-bold text-blue-400">
            {filteredTransactions.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="pulse-card p-6" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <div className="flex items-center gap-3 mb-4">
          <Filter className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold pulse-text">Filter Transactions</h3>
          <button 
            onClick={resetFilters}
            className="text-xs text-blue-400 underline"
            style={{outline: 'none', boxShadow: 'none'}}
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium pulse-text mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg pulse-text text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium pulse-text mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg pulse-text text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium pulse-text mb-1">Transaction Type</label>
            <select
              value={filters.txType}
              onChange={(e) => handleFilterChange('txType', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg pulse-text text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="">All Types</option>
              <option value="transfer">Transfer</option>
              <option value="swap">Swap</option>
              <option value="stake">Stake</option>
              <option value="unstake">Unstake</option>
              <option value="airdrop">Airdrop</option>
              <option value="mining">Mining</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium pulse-text mb-1">Tax Category</label>
            <select
              value={filters.taxCategory}
              onChange={(e) => handleFilterChange('taxCategory', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg pulse-text text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="">All Categories</option>
              <option value="income">Income</option>
              <option value="capital_gain">Capital Gain</option>
              <option value="capital_loss">Capital Loss</option>
              <option value="fee">Fee</option>
              <option value="gift">Gift</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="pulse-card p-6" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold pulse-text">Transaction History</h3>
          <div className="text-sm pulse-text-secondary">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="pulse-text-secondary">Loading transactions...</p>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold pulse-text mb-2">No Transactions Found</h4>
            <p className="pulse-text-secondary mb-4">
              {transactions.length === 0 
                ? 'No transactions in database yet. Import your transaction history or wait for automatic parsing.'
                : 'No transactions match your current filters. Try adjusting the filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 pulse-text-secondary text-sm">Date</th>
                  <th className="text-left py-3 pulse-text-secondary text-sm">Hash</th>
                  <th className="text-left py-3 pulse-text-secondary text-sm">Token</th>
                  <th className="text-right py-3 pulse-text-secondary text-sm">Amount</th>
                  <th className="text-right py-3 pulse-text-secondary text-sm">Value USD</th>
                  <th className="text-left py-3 pulse-text-secondary text-sm">Type</th>
                  <th className="text-left py-3 pulse-text-secondary text-sm">Tax Category</th>
                  <th className="text-center py-3 pulse-text-secondary text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, index) => (
                  <tr key={tx.id || index} className="border-b border-white/5">
                    <td className="py-4 text-sm pulse-text">
                      {formatDate(tx.block_timestamp)}
                    </td>
                    <td className="py-4 text-sm">
                      <span className="font-mono text-blue-400">
                        {tx.tx_hash ? `${tx.tx_hash.slice(0, 8)}...${tx.tx_hash.slice(-6)}` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 text-sm pulse-text">
                      <div className="font-semibold">{tx.token_symbol}</div>
                      <div className="text-xs pulse-text-secondary">{tx.token_name}</div>
                    </td>
                    <td className="py-4 text-sm text-right pulse-text">
                      {parseFloat(tx.amount || 0).toFixed(4)}
                    </td>
                    <td className="py-4 text-sm text-right font-semibold">
                      {formatCurrency(tx.value_usd)}
                    </td>
                    <td className="py-4 text-sm">
                      <span className={`capitalize ${getTypeColor(tx.tx_type)}`}>
                        {tx.tx_type || 'transfer'}
                      </span>
                    </td>
                    <td className="py-4 text-sm">
                      <span className={`capitalize ${getCategoryColor(tx.tax_category)}`}>
                        {tx.tax_category || 'uncategorized'}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      {tx.tx_hash && (
                        <button
                          onClick={() => openInExplorer(tx.tx_hash, tx.chain_id)}
                          className="text-blue-400 transition-colors p-1"
                          title="View in Explorer"
                          style={{outline: 'none', boxShadow: 'none'}}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tax Notice */}
      <div className="pulse-card p-4 bg-yellow-500/10 border border-yellow-500/20" style={{outline: 'none', boxShadow: 'none'}}>
        <div className="flex items-start gap-3">
          <div className="text-yellow-400 mt-0.5">⚠️</div>
          <div>
            <h5 className="text-sm font-semibold text-yellow-300 mb-1">
              Steuerlicher Hinweis
            </h5>
            <p className="text-xs text-yellow-200/80">
              <strong>Rechtlicher Hinweis:</strong> Diese Berichte dienen nur der Übersicht und sind nicht für die direkte Steuererklärung bestimmt. 
              Konsultieren Sie einen Steuerberater für spezifische Steuerberatung. 
              DSGVO-konform: Ihre Daten bleiben privat und werden nicht an Dritte weitergegeben.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxReportView;