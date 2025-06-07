import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, AlertTriangle } from 'lucide-react';
import { dbService } from '@/lib/dbService';

const TaxReportView = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear] = useState(new Date().getFullYear());
  const [statusMessage, setStatusMessage] = useState('');

  // 📊 Load transactions
  const loadTransactions = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await dbService.getRoiEntries(user.id);
      if (error) throw error;
      setTransactions(data || []);
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(`Error loading data: ${error.message}`);
      console.error('Tax Report Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }
  }, [user?.id]);

  // 💰 Calculate totals
  const totalInvested = transactions.reduce((sum, tx) => sum + (tx.purchase_price * tx.quantity), 0);
  const currentValue = transactions.reduce((sum, tx) => sum + (tx.current_value || 0), 0);
  const totalGainLoss = currentValue - totalInvested;

  // 📄 Export CSV
  const exportCSV = () => {
    if (transactions.length === 0) {
      setStatusMessage('No transactions to export');
      return;
    }

    const headers = ['Date', 'Asset', 'Quantity', 'Purchase Price', 'Current Value', 'Gain/Loss'];
    const csvData = [
      headers.join(','),
      ...transactions.map(tx => [
        tx.purchase_date || 'N/A',
        `${tx.name} (${tx.symbol})`,
        tx.quantity || 0,
        tx.purchase_price || 0,
        tx.current_value || 0,
        ((tx.current_value || 0) - (tx.purchase_price * tx.quantity)).toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsechain-tax-report-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMessage('Tax report downloaded successfully');
  };

  if (!user) {
    return (
      <div className="pulse-card p-8 text-center">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="pulse-title mb-2">Tax Report</h2>
        <p className="pulse-text-secondary">Please log in to generate tax reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🎯 Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="pulse-title mb-2">PulseChain Tax Report {selectedYear}</h1>
          <p className="pulse-subtitle">Export your transaction data for tax purposes</p>
          {statusMessage && (
            <div className={`mt-2 text-sm ${statusMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {statusMessage}
            </div>
          )}
        </div>
        <button 
          onClick={exportCSV} 
          disabled={isLoading || transactions.length === 0}
          className="py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* ⚠️ Disclaimer */}
      <div className="pulse-card p-6 border-l-4 border-red-400 bg-red-400/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-red-400 mb-2">Important Disclaimer</h3>
            <p className="text-sm pulse-text-secondary">
              This tool provides basic transaction export for tax reporting. Always consult with a qualified tax professional. 
              PulseManager is not responsible for tax compliance or accuracy of data.
            </p>
          </div>
        </div>
      </div>

      {/* 📊 Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="pulse-card p-6 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {transactions.length}
          </div>
          <div className="text-sm pulse-text-secondary">Total Transactions</div>
        </div>
        
        <div className="pulse-card p-6 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            ${totalInvested.toFixed(2)}
          </div>
          <div className="text-sm pulse-text-secondary">Total Invested</div>
        </div>
        
        <div className="pulse-card p-6 text-center">
          <div className={`text-2xl font-bold mb-1 ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${totalGainLoss.toFixed(2)}
          </div>
          <div className="text-sm pulse-text-secondary">Total Gain/Loss</div>
        </div>
      </div>

      {/* 📋 Transactions Table */}
      <div className="pulse-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold pulse-text">Transaction History</h3>
          <div className="text-sm pulse-text-secondary">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="pulse-text-secondary">Loading transactions...</p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold pulse-text mb-2">No Transactions Yet</h4>
            <p className="pulse-text-secondary mb-6">Start using the wallet and ROI tracker to generate tax data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 pulse-text-secondary">Date</th>
                  <th className="text-left py-3 pulse-text-secondary">Asset</th>
                  <th className="text-right py-3 pulse-text-secondary">Quantity</th>
                  <th className="text-right py-3 pulse-text-secondary">Price</th>
                  <th className="text-right py-3 pulse-text-secondary">Value</th>
                  <th className="text-right py-3 pulse-text-secondary">Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map((tx, index) => {
                  const invested = (tx.purchase_price || 0) * (tx.quantity || 0);
                  const current = tx.current_value || 0;
                  const gainLoss = current - invested;
                  
                  return (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 pulse-text">
                        {tx.purchase_date ? new Date(tx.purchase_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4">
                        <div>
                          <div className="font-semibold pulse-text">{tx.symbol}</div>
                          <div className="text-sm pulse-text-secondary">{tx.name}</div>
                        </div>
                      </td>
                      <td className="text-right py-4 pulse-text">
                        {tx.quantity?.toLocaleString() || '0'}
                      </td>
                      <td className="text-right py-4 pulse-text">
                        ${(tx.purchase_price || 0).toFixed(4)}
                      </td>
                      <td className="text-right py-4 pulse-text">
                        ${current.toFixed(2)}
                      </td>
                      <td className="text-right py-4">
                        <div className={gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                          ${gainLoss.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {transactions.length > 50 && (
              <p className="text-center py-4 text-sm pulse-text-secondary">
                Showing first 50 transactions. Export CSV for complete data.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 🔗 Quick Actions */}
      <div className="pulse-card p-6">
        <h3 className="font-semibold pulse-text mb-4">Tax Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 text-left hover:bg-white/5 rounded-lg transition-colors">
            <div className="font-medium pulse-text">📊 View ROI Tracker</div>
            <div className="text-sm pulse-text-secondary">Track investment performance</div>
          </button>
          <button className="p-4 text-left hover:bg-white/5 rounded-lg transition-colors">
            <div className="font-medium pulse-text">💼 Connect Wallet</div>
            <div className="text-sm pulse-text-secondary">Import transaction data</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxReportView;