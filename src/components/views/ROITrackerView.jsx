import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, PlusCircle, BarChart3 } from 'lucide-react';
import { dbService } from '@/lib/dbService';

const ROITrackerView = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // 📊 Fetch Investments
  const fetchInvestments = async () => {
    if (!user?.id) {
      setInvestments([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await dbService.getRoiEntries(user.id);
      if (error) throw error;
      setInvestments(data || []);
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(`Error loading investments: ${error.message}`);
      console.error('ROI Tracker Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchInvestments();
    }
  }, [user?.id]);

  // 💰 Calculate Totals
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.purchase_price * inv.quantity), 0);
  const currentValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
  const totalGain = currentValue - totalInvested;
  const gainPercentage = totalInvested > 0 ? ((totalGain / totalInvested) * 100) : 0;

  if (!user) {
    return (
      <div className="pulse-card p-8 text-center">
        <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="pulse-title mb-2">ROI Tracker</h2>
        <p className="pulse-text-secondary">Please log in to track your investments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🎯 Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="pulse-title mb-2">PulseChain ROI Tracker</h1>
          <p className="pulse-subtitle">Track your PulseChain investment performance</p>
          {statusMessage && (
            <div className={`mt-2 text-sm ${statusMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {statusMessage}
            </div>
          )}
        </div>
        <button className="py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all duration-200 flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Investment
        </button>
      </div>

      {/* 📊 Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="pulse-card p-6 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">
            ${totalInvested.toFixed(2)}
          </div>
          <div className="text-sm pulse-text-secondary">Total Invested</div>
        </div>
        
        <div className="pulse-card p-6 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            ${currentValue.toFixed(2)}
          </div>
          <div className="text-sm pulse-text-secondary">Current Value</div>
        </div>
        
        <div className="pulse-card p-6 text-center">
          <div className={`text-2xl font-bold mb-1 ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${totalGain.toFixed(2)}
          </div>
          <div className="text-sm pulse-text-secondary">Total Gain/Loss</div>
        </div>
        
        <div className="pulse-card p-6 text-center">
          <div className={`text-2xl font-bold mb-1 ${gainPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {gainPercentage.toFixed(1)}%
          </div>
          <div className="text-sm pulse-text-secondary">ROI %</div>
        </div>
      </div>

      {/* 📈 Investments List */}
      <div className="pulse-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold pulse-text">Your Investments</h3>
          <div className="text-sm pulse-text-secondary">
            {investments.length} investment{investments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="pulse-text-secondary">Loading investments...</p>
            </div>
          </div>
        ) : investments.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold pulse-text mb-2">No Investments Yet</h4>
            <p className="pulse-text-secondary mb-6">Start tracking your PulseChain investments</p>
            <button className="py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all duration-200 flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Your First Investment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 pulse-text-secondary">Asset</th>
                  <th className="text-right py-3 pulse-text-secondary">Quantity</th>
                  <th className="text-right py-3 pulse-text-secondary">Invested</th>
                  <th className="text-right py-3 pulse-text-secondary">Current</th>
                  <th className="text-right py-3 pulse-text-secondary">Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((investment, index) => {
                  const invested = investment.purchase_price * investment.quantity;
                  const current = investment.current_value || 0;
                  const gainLoss = current - invested;
                  const gainLossPercent = invested > 0 ? ((gainLoss / invested) * 100) : 0;
                  
                  return (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4">
                        <div>
                          <div className="font-semibold pulse-text">{investment.symbol}</div>
                          <div className="text-sm pulse-text-secondary">{investment.name}</div>
                        </div>
                      </td>
                      <td className="text-right py-4 pulse-text">
                        {investment.quantity?.toLocaleString()}
                      </td>
                      <td className="text-right py-4 pulse-text">
                        ${invested.toFixed(2)}
                      </td>
                      <td className="text-right py-4 pulse-text">
                        ${current.toFixed(2)}
                      </td>
                      <td className="text-right py-4">
                        <div className={gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                          ${gainLoss.toFixed(2)}
                        </div>
                        <div className={`text-xs ${gainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gainLossPercent.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🚀 Quick Actions */}
      <div className="pulse-card p-6">
        <h3 className="font-semibold pulse-text mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left hover:bg-white/5 rounded-lg transition-colors">
            <div className="font-medium pulse-text">📊 Export Report</div>
            <div className="text-sm pulse-text-secondary">Download investment data</div>
          </button>
          <button className="p-4 text-left hover:bg-white/5 rounded-lg transition-colors">
            <div className="font-medium pulse-text">💼 Sync Wallet</div>
            <div className="text-sm pulse-text-secondary">Import from connected wallet</div>
          </button>
          <button className="p-4 text-left hover:bg-white/5 rounded-lg transition-colors">
            <div className="font-medium pulse-text">📈 View Charts</div>
            <div className="text-sm pulse-text-secondary">Performance visualization</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ROITrackerView;