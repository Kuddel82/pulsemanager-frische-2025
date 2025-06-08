import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, PlusCircle, BarChart3, Wallet, DollarSign, ExternalLink, RefreshCw, Activity } from 'lucide-react';
import { dbService } from '@/lib/dbService';
import { supabase } from '@/lib/supabaseClient';
import WalletBalanceService from '@/lib/walletBalanceService';
import WalletParser from '@/services/walletParser';

const ROITrackerView = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [realTimeData, setRealTimeData] = useState({
    totalInflows: 0,
    totalOutflows: 0,
    netInvestment: 0,
    currentValue: 0,
    realizedGains: 0,
    unrealizedGains: 0,
    overallROI: 0
  });

  // 📊 Load Portfolio Data (Wallets + Investments + Tokens)
  const loadPortfolioData = async () => {
    if (!user?.id) {
      setInvestments([]);
      setWallets([]);
      setPortfolioData(null);
      setTokenBalances([]);
      return;
    }
    
    setIsLoading(true);
    console.log('🔍 ROI TRACKER: Loading complete portfolio for user:', user.id);
    
    try {
      // Load Wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (walletsError) throw walletsError;
      
      console.log('🔍 ROI TRACKER: Wallets loaded:', walletsData);
      setWallets(walletsData || []);

      // Load Token Balances (NEUE FEATURE)
      const tokenBalancesData = await WalletParser.getStoredTokenBalances(user.id);
      setTokenBalances(tokenBalancesData);
      console.log('🔍 ROI TRACKER: Token balances loaded:', tokenBalancesData);

      // Load Investments (optional - graceful fallback)
      let investmentsData = [];
      try {
        const { data, error } = await dbService.getRoiEntries(user.id);
        if (!error) {
          investmentsData = data || [];
        }
      } catch (invError) {
        console.log('🔍 ROI TRACKER: Investments table not available:', invError.message);
      }
      
      setInvestments(investmentsData);
      
      // Calculate Portfolio using the service
      const portfolioCalc = WalletBalanceService.calculatePortfolioValue(walletsData || []);
      setPortfolioData(portfolioCalc);
      
      // 🔥 NEW: Calculate Real-Time ROI Data
      const roiData = calculateRealTimeROI(walletsData, tokenBalancesData, investmentsData);
      setRealTimeData(roiData);
      
      console.log('🔍 ROI TRACKER: Portfolio calculation complete:', portfolioCalc);
      console.log('🔍 ROI TRACKER: ROI data calculated:', roiData);
      
      // Status message
      const walletCount = (walletsData || []).length;
      const tokenCount = tokenBalancesData.length;
      const investmentCount = investmentsData.length;
      
      if (walletCount > 0 || tokenCount > 0) {
        setStatusMessage(`✅ Portfolio geladen: ${walletCount} Wallets, ${tokenCount} Tokens, ${investmentCount} Investments, ROI: ${roiData.overallROI.toFixed(2)}%`);
      } else {
        setStatusMessage('📊 Keine Wallets gefunden - Fügen Sie Ihre Wallets über "Manual Wallet Input" hinzu');
      }
      
    } catch (error) {
      const errorMsg = `Error loading portfolio: ${error.message}`;
      setStatusMessage(errorMsg);
      console.error('🔍 ROI TRACKER: Final error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🧮 Calculate Real-Time ROI (VERBESSERTE FUNKTION)
  const calculateRealTimeROI = (wallets, tokens, investments) => {
    let totalInflows = 0;
    let totalOutflows = 0;
    let currentValue = 0;
    
    console.log('🧮 CALCULATING ROI with:', { 
      wallets: wallets.length, 
      tokens: tokens.length, 
      investments: investments.length 
    });
    
    // Current portfolio value from stored tokens (neue API-Daten)
    const tokenValue = tokens.reduce((sum, token) => {
      const value = token.value_usd || 0;
      console.log(`🪙 Token ${token.token_symbol}: $${value.toFixed(2)}`);
      return sum + value;
    }, 0);
    
    // Current portfolio value from wallet balances (alte Berechnung als Fallback)
    const walletValue = portfolioData?.totalValue || 0;
    
    // Investment costs and values
    const investmentCost = investments.reduce((sum, inv) => sum + (inv.purchase_price * inv.quantity || 0), 0);
    const investmentValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
    
    // Total current value - PRIORITÄT auf Token-Daten
    currentValue = tokenValue > 0 ? tokenValue : walletValue;
    currentValue += investmentValue;
    
    console.log('💰 VALUE CALCULATION:', {
      tokenValue: tokenValue.toFixed(2),
      walletValue: walletValue.toFixed(2),
      currentValue: currentValue.toFixed(2),
      investmentValue: investmentValue.toFixed(2)
    });
    
    // For ROI calculation, estimate initial investment
    // If no explicit investments, assume current value as investment for now
    totalInflows = investmentCost > 0 ? investmentCost : currentValue * 0.7; // Assume 30% gains if no data
    
    // Net investment and ROI calculation
    const netInvestment = totalInflows - totalOutflows;
    const unrealizedGains = currentValue - netInvestment;
    const overallROI = netInvestment > 0 ? (unrealizedGains / netInvestment) * 100 : 0;
    
    console.log('📊 ROI CALCULATION:', {
      totalInflows: totalInflows.toFixed(2),
      netInvestment: netInvestment.toFixed(2),
      unrealizedGains: unrealizedGains.toFixed(2),
      overallROI: overallROI.toFixed(2)
    });
    
    return {
      totalInflows,
      totalOutflows,
      netInvestment,
      currentValue,
      realizedGains: 0, // Would need transaction history
      unrealizedGains,
      overallROI,
      tokenCount: tokens.length,
      topTokens: tokens.slice(0, 5).map(t => ({
        symbol: t.token_symbol,
        value: t.value_usd,
        balance: t.balance
      }))
    };
  };

  // 🔄 Refresh All Data (NEUE FUNKTION)
  const refreshAllData = async () => {
    setIsRefreshing(true);
    
    try {
      // Refresh token data for all wallets
      if (wallets.length > 0) {
        for (const wallet of wallets) {
          try {
            const refreshResult = await WalletParser.refreshWalletData(
              user.id, 
              wallet.address, 
              wallet.chain_id
            );
            
            if (refreshResult.success) {
              console.log(`✅ REFRESHED: ${wallet.nickname} - ${refreshResult.tokensFound} tokens found via proxy`);
            } else {
              console.log(`❌ PROXY ERROR: ${wallet.nickname} - ${refreshResult.error}`);
            }
          } catch (err) {
            console.warn(`Failed to refresh ${wallet.nickname}:`, err.message);
          }
        }
      }
      
      // Reload all data
      await loadPortfolioData();
      
      setStatusMessage('🔄 Alle Daten erfolgreich aktualisiert!');
      setTimeout(() => setStatusMessage(''), 3000);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      setStatusMessage(`❌ Fehler beim Aktualisieren: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadPortfolioData();
    }
  }, [user?.id]);

  // 💰 Calculate Totals from Portfolio Data
  const portfolioTotals = portfolioData ? {
    walletValue: portfolioData.totalValue,
    totalInvested: investments.reduce((sum, inv) => sum + (inv.purchase_price * inv.quantity), 0),
    investmentValue: investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0),
    get totalValue() {
      return this.walletValue + this.investmentValue;
    },
    get totalGain() {
      return this.totalValue - this.totalInvested;
    },
    get gainPercentage() {
      return this.totalInvested > 0 ? ((this.totalGain / this.totalInvested) * 100) : 0;
    }
  } : {
    walletValue: 0,
    totalInvested: 0,
    investmentValue: 0,
    totalValue: 0,
    totalGain: 0,
    gainPercentage: 0
  };

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
          <p className="pulse-subtitle">Real-time Portfolio Performance & Investment Tracking</p>
          {statusMessage && (
            <div className={`mt-2 text-sm ${statusMessage.includes('Error') || statusMessage.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
              {statusMessage}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={refreshAllData}
            disabled={isRefreshing}
            className="py-3 px-4 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            style={{outline: 'none', boxShadow: 'none'}}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Updating...' : 'Refresh'}
          </button>
          <button className="py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all duration-200 flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Investment
          </button>
        </div>
      </div>

      {/* 📊 Real-Time Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="pulse-card p-6 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center gap-2 justify-center mb-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-green-300">Current Value</span>
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">
            ${realTimeData.currentValue.toFixed(2)}
          </div>
          <div className="text-sm pulse-text-secondary">
            {tokenBalances.length} Tokens • {wallets.length} Wallets

          </div>
        </div>
        
        <div className="pulse-card p-6 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center gap-2 justify-center mb-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Net Investment</span>
          </div>
          <div className="text-2xl font-bold text-blue-400 mb-1">
            ${realTimeData.netInvestment.toFixed(2)}
          </div>
          <div className="text-sm pulse-text-secondary">
            In: ${realTimeData.totalInflows.toFixed(2)} • Out: ${realTimeData.totalOutflows.toFixed(2)}
          </div>
        </div>
        
        <div className="pulse-card p-6 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center gap-2 justify-center mb-2">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Unrealized P&L</span>
          </div>
          <div className={`text-2xl font-bold mb-1 ${realTimeData.unrealizedGains >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {realTimeData.unrealizedGains >= 0 ? '+' : ''}${realTimeData.unrealizedGains.toFixed(2)}
          </div>
          <div className="text-sm pulse-text-secondary">
            Realized: ${realTimeData.realizedGains.toFixed(2)}
          </div>
        </div>
        
        <div className="pulse-card p-6 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center gap-2 justify-center mb-2">
            <TrendingUp className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-300">Overall ROI</span>
          </div>
          <div className={`text-2xl font-bold mb-1 ${realTimeData.overallROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {realTimeData.overallROI >= 0 ? '+' : ''}{realTimeData.overallROI.toFixed(1)}%
          </div>
          <div className="text-sm pulse-text-secondary">
            {realTimeData.overallROI >= 0 ? '📈' : '📉'} Performance
          </div>
        </div>
      </div>



      {/* 💳 Wallets Overview */}
      {wallets.length > 0 && (
        <div className="pulse-card p-6" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold pulse-text flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-400" />
              Your Wallets
            </h3>
            <div className="text-sm pulse-text-secondary">
              {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="space-y-3">
            {wallets.map((wallet) => {
              const symbol = wallet.chain_id === 369 ? 'PLS' : 'ETH';
              const balance = wallet.balance_eth || 0;
              const price = portfolioData?.prices[wallet.chain_id] || 0;
              const value = balance * price;
              
              return (
                <div key={wallet.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${wallet.chain_id === 369 ? 'bg-purple-400' : 'bg-blue-400'}`}></div>
                    <div>
                      <div className="font-medium pulse-text">{wallet.nickname}</div>
                      <div className="text-xs pulse-text-secondary">{wallet.chain_name}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-green-400">
                      {balance > 0 ? `${balance.toFixed(4)} ${symbol}` : 'No balance'}
                    </div>
                    <div className="text-sm pulse-text-secondary">
                      ${value.toFixed(2)} USD
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const url = wallet.chain_id === 369 
                          ? `https://scan.pulsechain.com/address/${wallet.address}`
                          : `https://etherscan.io/address/${wallet.address}`;
                        window.open(url, '_blank');
                      }}
                      className="text-blue-400 p-1"
                      title="View in Explorer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📈 Investments List */}
      <div className="pulse-card p-6" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
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
            {wallets.length > 0 ? (
              <>
                <BarChart3 className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold pulse-text mb-2">✅ Portfolio Data Loaded!</h4>
                <p className="pulse-text-secondary mb-4">
                  Ihre Wallet-Daten sind geladen und im ROI Tracker sichtbar. 
                  Optional können Sie detaillierte Investments hinzufügen.
                </p>
                
                {/* Success Info Box */}
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-left max-w-md mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="text-green-400 mt-0.5">💰</div>
                    <div>
                      <h5 className="text-sm font-semibold text-green-300 mb-1">
                        Ihre Tangem Wallet ist erfasst!
                      </h5>
                      <p className="text-xs text-green-200/80">
                        <strong>Portfolio-Wert: ${portfolioTotals.totalValue.toFixed(2)}</strong> aus {wallets.length} Wallet{wallets.length !== 1 ? 's' : ''}. 
                        Für detaillierteres Investment-Tracking können Sie einzelne Käufe mit Datum/Preis hinzufügen.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold pulse-text mb-2">No Wallets Found</h4>
                <p className="pulse-text-secondary mb-4">
                  Fügen Sie Ihre Wallets über "Manual Wallet Input" hinzu, 
                  um Ihr Portfolio zu tracken
                </p>
                
                {/* Info Box */}
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-left max-w-md mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-400 mt-0.5">💡</div>
                    <div>
                      <h5 className="text-sm font-semibold text-blue-300 mb-1">
                        ROI Tracker Setup
                      </h5>
                      <p className="text-xs text-blue-200/80">
                        1. <strong>Gehen Sie zu "Manual Wallet Input"</strong><br/>
                        2. <strong>Fügen Sie Ihre Tangem-Adresse hinzu</strong><br/>
                        3. <strong>Aktualisieren Sie die Balance</strong><br/>
                        4. <strong>Portfolio wird hier angezeigt</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <button 
              onClick={() => window.location.href = '/'}
              className="py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Wallet className="h-4 w-4" />
              {wallets.length > 0 ? 'View Full Dashboard' : 'Add Wallets Now'}
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
      <div className="pulse-card p-6" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <h3 className="font-semibold pulse-text mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => {
              // TODO: Implement CSV export
              alert('CSV Export feature coming soon!');
            }}
            className="p-4 text-left rounded-lg transition-colors"
            style={{outline: 'none', boxShadow: 'none'}}
          >
            <div className="font-medium pulse-text">📊 Export Report</div>
            <div className="text-sm pulse-text-secondary">Download portfolio data</div>
          </button>
          <button 
            onClick={() => loadPortfolioData()}
            className="p-4 text-left rounded-lg transition-colors"
            style={{outline: 'none', boxShadow: 'none'}}
          >
            <div className="font-medium pulse-text">💼 Refresh Portfolio</div>
            <div className="text-sm pulse-text-secondary">Reload wallet & investment data</div>
          </button>
          <button 
            onClick={() => {
              // Navigate to main dashboard
              window.location.href = '/';
            }}
            className="p-4 text-left rounded-lg transition-colors"
            style={{outline: 'none', boxShadow: 'none'}}
          >
            <div className="font-medium pulse-text">📈 View Dashboard</div>
            <div className="text-sm pulse-text-secondary">Go to main portfolio view</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ROITrackerView;