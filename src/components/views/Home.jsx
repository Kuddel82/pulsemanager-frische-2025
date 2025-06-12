import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { Crown } from 'lucide-react';
import { logger } from '@/lib/logger';
import WalletReader from '@/components/WalletReader';
import WalletManualInput from '@/components/WalletManualInput';

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { t, language, subscriptionStatus } = useAppContext();

  // 🎯 WGEP Section State
  const [showWGEP, setShowWGEP] = useState(false);

  const safeT = (key, fallback) => {
    if (typeof t === 'function') {
      return t(key) || fallback;
    }
    return fallback;
  };
  
  const handleLogout = async () => {
    logger.info('Home: Attempting logout.');
    try {
      await signOut();
      logger.info('Home: Logout successful, navigating to /auth.');
      navigate('/auth');
    } catch (error) {
      logger.error('Home: Error during logout:', error);
      
    }
  };



  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
        <div className="animate-pulse text-center">
          <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-2xl font-semibold">
            {safeT('common.loadingApp', 'Loading Application...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pulse-text">
      {/* 🎯 PulseChain Welcome Header */}
      <div className="pulse-card p-8 mb-8" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="pulse-title mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'PulseChainer'}
            </h1>
            <p className="pulse-subtitle">
              Ready to track your PulseChain portfolio? 🚀
            </p>
            <div className="pulse-community-badge mt-4">
              🔥 Community Member
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm pulse-text-secondary">Status</div>
              <div className={`font-semibold ${subscriptionStatus === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                {subscriptionStatus === 'active' ? '✅ Premium' : '⚡ Basic'}
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* 🔌 WalletReader - DOM-sichere Wallet-Verbindung */}
      <div className="mb-8">
        <WalletReader />
      </div>

      {/* 📝 Manual Wallet Input - Tangem/Mobile Support */}
      <div className="mb-8">
        <WalletManualInput />
      </div>

      {/* 📊 Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tax Report Navigation */}
        <button
          onClick={() => navigate('/tax-report')}
          className="pulse-card p-6 hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 bg-gradient-to-r from-red-400 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              📊
            </div>
            <div>
              <div className="text-lg font-bold pulse-text">Tax Report</div>
              <div className="text-sm pulse-text-secondary">Steuer-Export für Deutschland</div>
            </div>
          </div>
          <div className="text-xs pulse-text-secondary">→ Klicken zum Öffnen</div>
        </button>

        {/* WGEP Token Section */}
        <button
          onClick={() => setShowWGEP(!showWGEP)}
          className="pulse-card p-6 hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              🖨️
            </div>
            <div>
              <div className="text-lg font-bold pulse-text">WGEP</div>
              <div className="text-sm pulse-text-secondary">World Greatest Ethereum Printer</div>
            </div>
          </div>
          <div className="text-xs pulse-text-secondary">
            {showWGEP ? '↑ Bereich schließen' : '↓ Bereich öffnen'}
          </div>
        </button>
      </div>

      {/* 🖨️ WGEP Information & Trading Section */}
      {showWGEP && (
        <div className="pulse-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              🖨️
            </div>
            <h2 className="text-2xl font-bold pulse-text">World Greatest Ethereum Printer (WGEP)</h2>
          </div>

          {/* Information Section */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">💰 Was ist WGEP?</h3>
                <p className="text-sm pulse-text-secondary">
                  Der World Greatest Ethereum Printer ist ein innovatives DeFi-Protokoll, das darauf ausgelegt ist, 
                  kontinuierliche Renditen durch automatisierte Yield-Farming-Strategien zu generieren.
                </p>
              </div>
              
              <div className="p-4 bg-green-500/10 border border-green-400/20 rounded-lg">
                <h3 className="text-lg font-bold text-green-400 mb-2">🎯 Hauptmerkmale</h3>
                <ul className="text-sm pulse-text-secondary space-y-1">
                  <li>• Automatische Yield-Optimierung</li>
                  <li>• Dezentralisierte Governance</li>
                  <li>• Kompoundierung von Erträgen</li>
                  <li>• Risikomanagement-Tools</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
              <h3 className="text-lg font-bold text-blue-400 mb-2">⚠️ Wichtige Hinweise</h3>
              <p className="text-sm pulse-text-secondary">
                <strong>Risiko:</strong> DeFi-Investitionen bergen Verlustrisiken. Investieren Sie nur, was Sie sich leisten können zu verlieren.
                <br />
                <strong>DYOR:</strong> Führen Sie Ihre eigenen Recherchen durch, bevor Sie investieren.
                <br />
                <strong>Externe Plattform:</strong> Das Trading erfolgt über Matcha.xyz - PulseManager ist nicht für Transaktionen verantwortlich.
              </p>
            </div>
          </div>

          {/* Trading Interface */}
          <div className="bg-black/20 rounded-lg p-4 border border-yellow-500/20">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-6 w-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded flex items-center justify-center text-white font-bold text-xs">
                🖨️
              </div>
              <h3 className="text-lg font-bold pulse-text">WGEP Token kaufen/verkaufen</h3>
            </div>
            
            <iframe
              src="https://matcha.xyz/tokens/ethereum/0xfca88920ca5639ad5e954ea776e73dec54fdc065?sellChain=1&sellAddress=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
              className="w-full h-[600px] rounded-lg border-0"
              title="WGEP Token Trading Interface"
              allowFullScreen
            />
          </div>
          
          <div className="mt-4 text-xs pulse-text-secondary text-center">
            🖨️ <strong>WGEP Trading Interface:</strong><br />
            Nutzen Sie die obenstehende Schnittstelle, um WGEP Token über Matcha.xyz zu handeln.
          </div>
        </div>
      )}

      {/* 🚀 PulseX DEX Embedded Interface */}
      <div className="pulse-card p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded flex items-center justify-center text-white font-bold text-xs">
            PX
          </div>
          <h2 className="text-xl font-bold pulse-text">Token Kauf/Verkauf über PulseX</h2>
        </div>
        
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
          <p className="text-yellow-400 text-sm">
            ⚠️ <strong>Bitte beachten:</strong> Sie interagieren direkt mit PulseX. PulseManager wickelt keine Transaktionen direkt ab, sondern stellt eine komfortable Oberfläche bereit.
          </p>
        </div>

        <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
          <iframe
            src="https://pulsex.mypinata.cloud/ipfs/bafybeiajyhfbf6evh4mdabassmbtsy73ci2gmcgh4ffmjkrgsea35vqxba/#/?chain=pulsechain"
            className="w-full h-[600px] rounded-lg border-0"
            title="PulseX DEX Interface"
            allowFullScreen
          />
        </div>
        
        <div className="mt-4 text-xs pulse-text-secondary text-center">
          💡 <strong>PulseX Kauf/Verkauf-Schnittstelle:</strong><br />
          Nutzen Sie die untenstehende Fenster, um Token direkt auf PulseX zu kaufen oder zu verkaufen.
        </div>
      </div>

      {/* 🌉 Portal Bridge Embedded Interface */}
      <div className="pulse-card p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-6 bg-gradient-to-r from-cyan-400 to-blue-400 rounded flex items-center justify-center text-white font-bold text-xs">
            BR
          </div>
          <h2 className="text-xl font-bold pulse-text">Token über Portal bridgen</h2>
        </div>
        
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
          <p className="text-yellow-400 text-sm">
            ⚠️ <strong>Bitte beachten:</strong> Sie interagieren direkt mit der Portal Bridge. PulseManager wickelt keine Bridge-Transaktionen direkt ab, sondern stellt eine komfortable Oberfläche bereit.
          </p>
        </div>

        <div className="bg-black/20 rounded-lg p-4 border border-cyan-500/20">
          <iframe
            src="https://bridge.mypinata.cloud/ipfs/bafybeif242ld54nzjg2aqxvfse23wpbkqbyqasj3usgslccuajnykonzo4/#/bridge"
            className="w-full h-[600px] rounded-lg border-0"
            title="Portal Bridge Interface"
            allowFullScreen
          />
        </div>
        
        <div className="mt-4 text-xs pulse-text-secondary text-center">
          🌉 <strong>Portal Bridge Schnittstelle:</strong><br />
          Nutzen Sie die untenstehende Fenster, um Token zwischen Blockchains zu transferieren.
        </div>
      </div>


    </div>
  );
};
  
export { Home };
export default Home;