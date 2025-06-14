// 🔍 WALLET DEBUG INFO - Zeigt alle User-Wallets und deren Status
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CentralDataService from '@/services/CentralDataService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Database, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { formatTime } from '@/lib/utils';

const WalletDebugInfo = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadWalletInfo = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      console.log('🔍 DEBUG: Loading wallet info...');
      
      // 1. Load wallets directly from Supabase
      const walletsFromDB = await CentralDataService.loadUserWallets(user.id);
      
      // 2. Load portfolio data to see what's working (COST OPTIMIZED)
      const portfolioData = await CentralDataService.loadCompletePortfolio(user.id, { 
        includeROI: false,
        includeTax: false 
      });
      
      // 3. Enhance wallet info with additional data
      const enhancedWallets = walletsFromDB.map(wallet => ({
        ...wallet,
        hasPortfolioData: portfolioData?.wallets?.some(pw => pw.address === wallet.address) || false,
        totalValue: portfolioData?.totalValue || 0,
        tokenCount: portfolioData?.tokens?.filter(t => t.walletAddress === wallet.address)?.length || 0
      }));
      
      setWallets(enhancedWallets);
      setLastUpdate(new Date());
      
      console.log('🔍 DEBUG: Wallet info loaded', {
        walletsInDB: walletsFromDB.length,
        portfolioWallets: portfolioData?.wallets?.length || 0,
        totalValue: portfolioData?.totalValue || 0,
        totalTokens: portfolioData?.tokens?.length || 0
      });
      
    } catch (error) {
      console.error('💥 DEBUG: Wallet info error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadWalletInfo();
    }
  }, [user?.id]);

  if (!user?.id) {
    return (
      <div className="pulse-card p-4">
        <p className="pulse-text-secondary">Bitte loggen Sie sich ein um Wallet-Informationen zu sehen.</p>
      </div>
    );
  }

  return (
    <div className="pulse-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center text-lg font-bold pulse-title">
          <Wallet className="h-5 w-5 mr-2 text-blue-400" />
          🔍 Wallet Debug Info
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadWalletInfo}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {wallets.length === 0 ? (
        <div className="text-center py-6">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
          <p className="pulse-text mb-2">❌ Keine Wallets gefunden!</p>
          <p className="pulse-text-secondary text-sm">
            Das ist wahrscheinlich der Grund für wenig Transaktionen.<br/>
            Fügen Sie Ihre Wallet-Adressen in den Einstellungen hinzu.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm pulse-text-secondary mb-4">
            Gefunden: {wallets.length} Wallet(s) • 
            Letzte Aktualisierung: {lastUpdate ? formatTime(lastUpdate) : 'Nie'}
          </div>
          
          {wallets.map((wallet, index) => (
            <div key={wallet.id || index} className="border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Wallet className="h-5 w-5 text-blue-400" />
                  <div>
                    <div className="font-mono text-sm pulse-text">
                      {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                    </div>
                    <div className="text-xs pulse-text-secondary">
                      Chain ID: {wallet.chain_id} • 
                      {wallet.is_active ? '✅ Aktiv' : '❌ Inaktiv'}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Badge variant={wallet.hasPortfolioData ? 'default' : 'destructive'}>
                    {wallet.hasPortfolioData ? 'Portfolio ✅' : 'Portfolio ❌'}
                  </Badge>
                  <Badge variant={wallet.chain_id === 369 ? 'default' : 'secondary'}>
                    {wallet.chain_id === 369 ? 'PulseChain' : `Chain ${wallet.chain_id}`}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="pulse-text-secondary">Erstellt:</span>
                  <div className="pulse-text">
                    {wallet.created_at ? new Date(wallet.created_at).toLocaleDateString('de-DE') : 'Unbekannt'}
                  </div>
                </div>
                <div>
                  <span className="pulse-text-secondary">Tokens:</span>
                  <div className="pulse-text">{wallet.tokenCount}</div>
                </div>
                <div>
                  <span className="pulse-text-secondary">Wallet ID:</span>
                  <div className="pulse-text font-mono">{wallet.id}</div>
                </div>
              </div>
              
              {wallet.name && (
                <div className="mt-2 text-sm">
                  <span className="pulse-text-secondary">Name: </span>
                  <span className="pulse-text">{wallet.name}</span>
                </div>
              )}
              
              {!wallet.hasPortfolioData && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-400/20 rounded text-sm">
                  ⚠️ Diese Wallet hat keine Portfolio-Daten. Möglicherweise API-Problem oder keine Tokens.
                </div>
              )}
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded">
            <h4 className="font-medium pulse-text mb-2">🚀 Empfohlene Aktionen:</h4>
            <ul className="text-sm pulse-text-secondary space-y-1">
              <li>• Stellen Sie sicher, dass alle wichtigen Wallet-Adressen hinzugefügt sind</li>
              <li>• PulseChain-Wallets (Chain ID 369) werden bevorzugt für Transaktionshistorie</li>
              <li>• Wallets ohne Portfolio-Daten könnten leer sein oder API-Probleme haben</li>
              <li>• Bei wenig Transaktionen: Prüfen Sie ob die richtige Adresse verwendet wird</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDebugInfo; 