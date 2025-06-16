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

  // ❌ EMERGENCY DISABLED: Auto-loading komplett deaktiviert für Kostenreduktion
  // useEffect(() => {
  //   if (user?.id) {
  //     loadPortfolioData();
  //   }
  // }, [user?.id]);

  const loadPortfolioData = async () => {
    try {
      setIsLoading(true);

      // Load user wallets with balances (ALLE DATEN)
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (walletsError) throw walletsError;

      setWallets(walletsData || []);

      // Try to load investments (graceful fallback if table doesn't exist)
      // ALLE DATEN abrufen
      let investmentsData = [];
      try {
        const { data: invData, error: invError } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (!invError) {
          investmentsData = invData || [];
        }
      } catch (invErr) {
        console.log('Investments table not available yet:', invErr.message);
      }

      // Calculate wallet totals (vollständige Berechnung aller Wallets)
      console.log('📊 WALLET DATA LOADED:', walletsData);
      
      const walletTotals = (walletsData || []).reduce((acc, wallet) => {
        // Sicherstellen dass balance_eth ein valider Wert ist
        let balance = 0;
        if (wallet.balance_eth && !isNaN(wallet.balance_eth)) {
          balance = parseFloat(wallet.balance_eth);
        }
        
        console.log(`💳 Wallet "${wallet.nickname}": ${balance} ${wallet.chain_id === 369 ? 'PLS' : 'ETH'} (Chain: ${wallet.chain_id})`);
        
        if (wallet.chain_id === 369) { // PulseChain
          acc.totalPLS += balance;
          acc.plsWallets.push({
            nickname: wallet.nickname,
            balance: balance,
            address: wallet.address
          });
        } else if (wallet.chain_id === 1) { // Ethereum
          acc.totalETH += balance;
          acc.ethWallets.push({
            nickname: wallet.nickname,
            balance: balance,
            address: wallet.address
          });
        }
        
        return acc;
      }, {
        totalPLS: 0,
        totalETH: 0,
        plsWallets: [],
        ethWallets: []
      });
      
      console.log('💰 TOTAL PLS:', walletTotals.totalPLS);
      console.log('💰 TOTAL ETH:', walletTotals.totalETH);

      // Calculate investment totals
      console.log('📈 INVESTMENT DATA LOADED:', investmentsData);
      
      const investmentTotals = investmentsData.reduce((acc, inv) => {
        const currentValue = parseFloat(inv.current_value_usd || 0);
        const costBasis = parseFloat(inv.purchase_total_usd || 0);
        
        console.log(`📊 Investment "${inv.symbol}": $${currentValue} (Cost: $${costBasis})`);
        
        acc.totalInvestmentValue += currentValue;
        acc.totalInvestmentCost += costBasis;
        acc.investments.push({
          symbol: inv.symbol,
          currentValue: currentValue,
          costBasis: costBasis,
          roi: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0
        });
        return acc;
      }, {
        totalInvestmentValue: 0,
        totalInvestmentCost: 0,
        investments: []
      });
      
      console.log('📈 TOTAL INVESTMENT VALUE:', investmentTotals.totalInvestmentValue);
      console.log('📈 TOTAL INVESTMENT COST:', investmentTotals.totalInvestmentCost);

      // Price calculations (aktualisierte Preise - Stand Januar 2025)
      const plsUsdPrice = 0.000088; // Aktueller PLS Preis (ca. $0.000088)
      const ethUsdPrice = await getEthRealTimePrice(); // Echter ETH Preis von Moralis

      const walletValueUSD = (walletTotals.totalPLS * plsUsdPrice) + (walletTotals.totalETH * ethUsdPrice);
      const totalPortfolioValue = walletValueUSD + investmentTotals.totalInvestmentValue;
      const totalCostBasis = investmentTotals.totalInvestmentCost;
      
      // Calculate overall ROI
      const overallROI = totalCostBasis > 0 
        ? ((totalPortfolioValue - totalCostBasis) / totalCostBasis) * 100 
        : 0;

      console.log('🔥 FINAL PORTFOLIO CALCULATION:');
      console.log(`💰 Wallet Value: $${walletValueUSD.toFixed(2)}`);
      console.log(`📈 Investment Value: $${investmentTotals.totalInvestmentValue.toFixed(2)}`);
      console.log(`🎯 TOTAL PORTFOLIO: $${totalPortfolioValue.toFixed(2)}`);
      console.log(`📊 Overall ROI: ${overallROI.toFixed(2)}%`);

      const finalPortfolioData = {
        ...walletTotals,
        totalValue: totalPortfolioValue,
        walletValue: walletValueUSD,
        investmentValue: investmentTotals.totalInvestmentValue,
        totalCostBasis: totalCostBasis,
        roi24h: overallROI,
        change24h: 0, // Would need historical price data
        investmentCount: investmentsData.length,
        walletCount: (walletsData || []).length,
        // Detaillierte Aufschlüsselung für Debug
        walletBreakdown: {
          plsWallets: walletTotals.plsWallets,
          ethWallets: walletTotals.ethWallets,
          plsUsdValue: walletTotals.totalPLS * plsUsdPrice,
          ethUsdValue: walletTotals.totalETH * ethUsdPrice
        },
        investmentBreakdown: investmentTotals.investments
      };

      console.log('📋 COMPLETE PORTFOLIO DATA:', finalPortfolioData);
      setPortfolioData(finalPortfolioData);

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
          className="bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="text-blue-300 text-sm font-medium">CSV Export</span>
        </button>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Portfolio Value */}
        <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">Gesamt Portfolio</span>
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">
            {formatCurrency(portfolioData.totalValue)}
          </div>
          <div className="text-xs pulse-text-secondary">
            {portfolioData.walletCount || 0} Wallets • {portfolioData.investmentCount || 0} Investments
          </div>
        </div>

        {/* Wallet Holdings */}
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Wallet Value</span>
          </div>
          <div className="text-xl font-bold text-blue-400 mb-1">
            {formatCurrency(portfolioData.walletValue || 0)}
          </div>
          <div className="text-xs pulse-text-secondary">
            {formatCrypto(portfolioData.totalPLS, 'PLS')} • {formatCrypto(portfolioData.totalETH, 'ETH')}
          </div>
        </div>

        {/* Investment Value */}
        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Investments</span>
          </div>
          <div className="text-xl font-bold text-purple-400 mb-1">
            {formatCurrency(portfolioData.investmentValue || 0)}
          </div>
          <div className="text-xs pulse-text-secondary">
            Basis: {formatCurrency(portfolioData.totalCostBasis || 0)}
          </div>
        </div>

        {/* Overall ROI */}
        <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-600/5 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-300">ROI</span>
          </div>
          <div className={`text-xl font-bold mb-1 ${
            portfolioData.roi24h >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {portfolioData.roi24h >= 0 ? '+' : ''}{portfolioData.roi24h.toFixed(2)}%
          </div>
          <div className="text-xs pulse-text-secondary">
            {portfolioData.roi24h >= 0 ? '📈' : '📉'} Gesamtperformance
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

      {/* Portfolio Info */}
      <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-green-400 mt-0.5">💰</div>
          <div>
            <h5 className="text-sm font-semibold text-green-300 mb-1">
              Komplettes Portfolio
            </h5>
            <p className="text-xs text-green-200/80">
              <strong>Alle Ihre Wallets & Investments:</strong> Vollständige Portfolio-Berechnung 
              mit aktuellen Preisen: PLS ~$0.000088 | ETH ~$3200. 
              Tangem und alle anderen Wallets werden erfasst.
            </p>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      {wallets.length === 0 && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 mt-0.5">💡</div>
            <div>
              <h5 className="text-sm font-semibold text-blue-300 mb-2">
                Portfolio Setup
              </h5>
              <p className="text-xs text-blue-200/80 mb-3">
                Fügen Sie Ihre Wallet-Adressen hinzu, um Ihr Portfolio zu tracken:
              </p>
              <ul className="text-xs text-blue-200/80 space-y-1">
                <li>• <strong>Schritt 1:</strong> Wallet-Adressen über "Manual Wallet Input" hinzufügen</li>
                <li>• <strong>Schritt 2:</strong> Balances werden hier automatisch angezeigt</li>
                <li>• <strong>Schritt 3:</strong> CSV-Export für Steuersoftware verfügbar</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Database Setup Notice */}
      {portfolioData.investmentCount === 0 && wallets.length > 0 && (
        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-orange-400 mt-0.5">🔧</div>
            <div>
              <h5 className="text-sm font-semibold text-orange-300 mb-1">
                Investments-Feature
              </h5>
              <p className="text-xs text-orange-200/80">
                <strong>Optional:</strong> Führen Sie die investments-Tabelle Migration in Supabase aus, 
                um detailliertes Investment-Tracking und ROI-Berechnung zu aktivieren.
              </p>
            </div>
          </div>
        </div>
      )}

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