import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { TrendingUp, TrendingDown, Download, Calculator, PieChart, FileText } from 'lucide-react';

export default function ROICalculator() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    totalPLS: 0,
    totalETH: 0,
    roi24h: 0,
    change24h: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load wallets and calculate portfolio
  useEffect(() => {
    if (user?.id) {
      loadPortfolioData();
    }
  }, [user?.id]);

  const loadPortfolioData = async () => {
    try {
      setIsLoading(true);

      // Load user wallets with balances
      const { data: walletsData, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWallets(walletsData || []);

      // Calculate totals
      const totals = walletsData.reduce((acc, wallet) => {
        const balance = parseFloat(wallet.balance_eth || 0);
        
        if (wallet.chain_id === 369) { // PulseChain
          acc.totalPLS += balance;
        } else if (wallet.chain_id === 1) { // Ethereum
          acc.totalETH += balance;
        }
        
        return acc;
      }, {
        totalPLS: 0,
        totalETH: 0
      });

      // Simplified USD calculation (would need real price API)
      const plsUsdPrice = 0.0001; // Placeholder
      const ethUsdPrice = 2400;   // Placeholder

      setPortfolioData({
        ...totals,
        totalValue: (totals.totalPLS * plsUsdPrice) + (totals.totalETH * ethUsdPrice),
        roi24h: 0, // Would need historical data
        change24h: 0 // Would need price tracking
      });

    } catch (err) {
      console.error('Error loading portfolio data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportTaxData = async () => {
    try {
      // Simple CSV export for tax purposes
      const csvHeader = 'Wallet,Chain,Address,Balance,LastSync,Notes\n';
      const csvData = wallets.map(wallet => [
        wallet.nickname || 'Unnamed',
        wallet.chain_name || 'Unknown',
        wallet.address,
        wallet.balance_eth || 0,
        wallet.last_sync || '',
        wallet.notes || ''
      ].join(',')).join('\n');

      const csvContent = csvHeader + csvData;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pulsemanager-portfolio-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting tax data:', error);
    }
  };

  const formatCurrency = (amount, symbol = '$') => {
    return `${symbol}${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCrypto = (amount, symbol) => {
    return `${amount.toFixed(4)} ${symbol}`;
  };

  if (isLoading) {
    return (
      <div className="pulse-card p-6 rounded-xl">
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-2"></div>
          <p className="text-sm pulse-text-secondary">Lade Portfolio-Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pulse-card p-6 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold pulse-text">ROI & Portfolio</h3>
            <p className="text-sm pulse-text-secondary">DSGVO-konform · Steuer-Export</p>
          </div>
        </div>
        
        <button
          onClick={exportTaxData}
          className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="text-blue-300 text-sm font-medium">CSV Export</span>
        </button>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Value */}
        <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">Portfolio Wert</span>
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">
            {formatCurrency(portfolioData.totalValue)}
          </div>
          <div className="text-xs pulse-text-secondary">
            {portfolioData.change24h >= 0 ? '📈' : '📉'} {portfolioData.change24h.toFixed(2)}% (24h)
          </div>
        </div>

        {/* PLS Holdings */}
        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">PLS Holdings</span>
          </div>
          <div className="text-xl font-bold text-purple-400 mb-1">
            {formatCrypto(portfolioData.totalPLS, 'PLS')}
          </div>
          <div className="text-xs pulse-text-secondary">
            {wallets.filter(w => w.chain_id === 369).length} PulseChain Wallets
          </div>
        </div>

        {/* ETH Holdings */}
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">ETH Holdings</span>
          </div>
          <div className="text-xl font-bold text-blue-400 mb-1">
            {formatCrypto(portfolioData.totalETH, 'ETH')}
          </div>
          <div className="text-xs pulse-text-secondary">
            {wallets.filter(w => w.chain_id === 1).length} Ethereum Wallets
          </div>
        </div>
      </div>

      {/* Wallet Breakdown */}
      <div>
        <h4 className="text-sm font-semibold pulse-text mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Wallet-Aufschlüsselung ({wallets.length})
        </h4>

        {wallets.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-lg">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="pulse-text-secondary">Noch keine Wallets für ROI-Berechnung</p>
            <p className="text-sm pulse-text-secondary mt-1">Fügen Sie Wallets hinzu, um Ihr Portfolio zu tracken</p>
          </div>
        ) : (
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${wallet.chain_id === 369 ? 'bg-purple-400' : 'bg-blue-400'}`}></div>
                  <div>
                    <div className="font-medium pulse-text text-sm">{wallet.nickname}</div>
                    <div className="text-xs pulse-text-secondary">{wallet.chain_name}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-sm">
                    {wallet.balance_eth > 0 
                      ? formatCrypto(wallet.balance_eth, wallet.chain_id === 369 ? 'PLS' : 'ETH')
                      : '---'
                    }
                  </div>
                  <div className="text-xs pulse-text-secondary">
                    {wallet.last_sync 
                      ? new Date(wallet.last_sync).toLocaleDateString('de-DE')
                      : 'Nicht synced'
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tax & Disclaimer */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-yellow-400 mt-0.5">⚠️</div>
          <div>
            <h5 className="text-sm font-semibold text-yellow-300 mb-1">
              Steuer-Hinweis
            </h5>
            <p className="text-xs text-yellow-200/80">
              <strong>Rechtlicher Hinweis:</strong> Diese Daten dienen nur der Übersicht. 
              Für steuerliche Zwecke konsultieren Sie einen Steuerberater. 
              CSV-Export verfügbar für Ihre Steuer-Software.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 