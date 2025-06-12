// 💼 PORTFOLIO BEISPIEL - Verwendung des optimierten Portfolio-Services
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOrLoadPortfolio, clearPortfolioCache, calculatePortfolioValue } from '../../services/portfolioService';

export default function PortfolioExample() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // 🚀 Portfolio laden - GENAU WIE SIE ES GEZEIGT HABEN
  const loadPortfolio = async (forceRefresh = false) => {
    if (!user?.wallet_address) {
      console.log('⚠️ Keine Wallet-Adresse verfügbar');
      return;
    }

    setLoading(true);
    try {
      // ✅ IHR GEWÜNSCHTES FORMAT:
      const { data: portfolio, source } = await getOrLoadPortfolio(user.id, user.wallet_address, {
        limit: 50,
        forceRefresh
      });

      console.log('Quelle:', source); // 'cache' oder 'fresh'
      console.log('Daten:', portfolio); // Token, Preis, Gesamtwert

      // State setzen
      setPortfolio(portfolio);
      setSource(source);
      
      // Portfolio-Wert berechnen
      const value = calculatePortfolioValue(portfolio);
      setStats(value);

    } catch (error) {
      console.error('💥 Portfolio loading failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cache löschen und neu laden
  const refreshPortfolio = async () => {
    if (!user?.id) return;
    
    await clearPortfolioCache(user.id, user.wallet_address);
    await loadPortfolio(true);
  };

  // Initial load
  useEffect(() => {
    if (user?.id && user?.wallet_address) {
      loadPortfolio();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portfolio</h2>
        <div className="flex gap-2">
          <button
            onClick={() => loadPortfolio()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Reload'}
          </button>
          <button
            onClick={refreshPortfolio}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Force Refresh
          </button>
        </div>
      </div>

      {/* Cache Info */}
      {source && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">Datenquelle:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              source === 'memory_cache' ? 'bg-green-100 text-green-800' :
              source === 'supabase_cache' ? 'bg-blue-100 text-blue-800' :
              source === 'fresh' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {source === 'memory_cache' ? '🚀 Memory Cache' :
               source === 'supabase_cache' ? '💾 Supabase Cache' :
               source === 'fresh' ? '🔄 Fresh Load' :
               '❌ Error'}
            </span>
          </div>
        </div>
      )}

      {/* Portfolio Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalUSD.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Portfolio Value</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {stats.tokensWithValue}
            </div>
            <div className="text-sm text-gray-600">Tokens with Value</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {portfolio.length}
            </div>
            <div className="text-sm text-gray-600">Total Tokens</div>
          </div>
        </div>
      )}

      {/* Token Liste */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-600">Loading portfolio...</div>
        </div>
      ) : portfolio.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Top Tokens</h3>
          <div className="space-y-2">
            {portfolio.slice(0, 10).map((token, index) => (
              <div key={token.address} className="bg-white dark:bg-gray-900 p-4 rounded-lg border flex justify-between items-center">
                <div>
                  <div className="font-medium">{token.symbol}</div>
                  <div className="text-sm text-gray-600">
                    {token.balance.toFixed(4)} 
                    {token.priceUsd && ` @ $${token.priceUsd.toFixed(6)}`}
                  </div>
                </div>
                <div className="text-right">
                  {token.totalValue > 0 ? (
                    <div className="font-medium text-green-600">
                      ${token.totalValue.toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-gray-400">No price</div>
                  )}
                  <div className="text-xs text-gray-500">
                    {token.priceSource}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600">
          No portfolio data available
        </div>
      )}

      {/* Debug Info */}
      <details className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <summary className="cursor-pointer font-medium">Debug Info</summary>
        <pre className="mt-2 text-xs overflow-x-auto">
          {JSON.stringify({ source, portfolioLength: portfolio.length, stats }, null, 2)}
        </pre>
      </details>
    </div>
  );
} 