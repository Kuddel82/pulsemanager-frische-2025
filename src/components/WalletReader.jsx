import { useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '@/lib/supabaseClient';

export default function WalletReader() {
  const { user } = useAuth();
  const { canAccessPortfolio, getAccessMessage, isPremium, tier } = useSubscription();
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isSavingToDb, setIsSavingToDb] = useState(false);

  const getChainName = (chainId) => {
    const chains = {
      1: "Ethereum Mainnet",
      369: "PulseChain Mainnet", 
      943: "PulseChain Testnet",
      11155111: "Ethereum Sepolia",
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  // 💾 NEUE FUNKTION: Speichere Wallet automatisch in Datenbank
  const saveWalletToDatabase = async (walletAddress, walletChainId) => {
    if (!user?.id) {
      console.warn('⚠️ No user logged in, cannot save wallet to database');
      return false;
    }

    setIsSavingToDb(true);
    
    try {
      console.log(`💾 WALLET READER: Auto-saving wallet ${walletAddress} to database`);
      
      // Prüfe ob Wallet bereits existiert
      const { data: existingWallet, error: checkError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('address', walletAddress.toLowerCase())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingWallet) {
        console.log('✅ WALLET READER: Wallet already exists in database, updating...');
        
        // Update existing wallet (activate if inactive)
        const { error: updateError } = await supabase
          .from('wallets')
          .update({
            is_active: true,
            chain_id: walletChainId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingWallet.id);
          
        if (updateError) throw updateError;
        
        console.log('✅ WALLET READER: Existing wallet updated and activated');
        return true;
      } else {
        console.log('💾 WALLET READER: Creating new wallet entry...');
        
        // Create new wallet entry
        const { error: insertError } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            address: walletAddress.toLowerCase(),
            chain_id: walletChainId,
            name: `${getChainName(walletChainId)} Wallet`,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
        
        console.log('✅ WALLET READER: New wallet saved to database');
        return true;
      }
    } catch (error) {
      console.error('💥 WALLET READER: Error saving to database:', error);
      setError(`Database save failed: ${error.message}`);
      return false;
    } finally {
      setIsSavingToDb(false);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Kein Wallet gefunden. Bitte installieren Sie MetaMask oder ein anderes Ethereum-Wallet.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
      
      // Get chain ID
      const chain = await window.ethereum.request({ method: "eth_chainId" });
      
      // Get balance
      const bal = await window.ethereum.request({
        method: "eth_getBalance",
        params: [addr, "latest"],
      });

      const walletChainId = parseInt(chain, 16);
      const walletBalance = (parseInt(bal, 16) / 1e18).toFixed(4);

      setAddress(addr);
      setChainId(walletChainId);
      setBalance(walletBalance);
      
      console.log("✅ Wallet connected:", { addr, chain: walletChainId, balance: walletBalance });

      // 🚀 AUTOMATISCH zur Datenbank hinzufügen
      if (user?.id) {
        console.log("💾 WALLET READER: Auto-saving connected wallet to database...");
        const saved = await saveWalletToDatabase(addr, walletChainId);
        
        if (saved) {
          console.log("🎉 WALLET READER: Wallet automatically added to your account!");
          // Optional: Show success message
          setTimeout(() => {
            console.log("🔄 WALLET READER: Wallet is now available for portfolio loading");
          }, 1000);
        }
      } else {
        console.warn("⚠️ WALLET READER: No user logged in, wallet not saved to database");
        setError("Achtung: Wallet verbunden, aber nicht gespeichert. Bitte loggen Sie sich ein.");
      }
      
    } catch (err) {
      console.error("❌ Wallet connection error:", err);
      
      if (err.code === 4001) {
        setError("Verbindung vom Benutzer abgelehnt");
      } else if (err.code === -32002) {
        setError("Verbindungsanfrage bereits ausstehend. Bitte prüfen Sie Ihr Wallet.");
      } else {
        setError("Verbindung fehlgeschlagen: " + err.message);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setBalance(null);
    setChainId(null);
    setError(null);
    console.log("🔌 Wallet disconnected");
  };

  return (
    <div className="p-6 pulse-card rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-lg">🔌</span>
        </div>
        <div>
          <h3 className="text-lg font-bold pulse-text">Wallet Reader</h3>
          <p className="text-sm pulse-text-secondary">
            Auto-Connect & Save to Portfolio
            {isSavingToDb && <span className="text-orange-400 ml-2">💾 Speichert...</span>}
          </p>
          <div className="text-xs mt-1">
            <span className={`px-2 py-1 rounded-full text-xs ${isPremium ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {getAccessMessage()}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {!user?.id && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-sm">⚠️ Bitte loggen Sie sich ein um Wallets zu speichern</p>
        </div>
      )}

      {!address ? (
        <button 
          onClick={connectWallet} 
          disabled={isConnecting || isSavingToDb}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Verbinde...
            </>
          ) : isSavingToDb ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Speichere...
            </>
          ) : (
            <>
              🔌 Wallet verbinden & speichern
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          {/* Success Message */}
          {user?.id && !isSavingToDb && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">✅ Wallet verbunden und automatisch zu Ihrem Portfolio hinzugefügt!</p>
            </div>
          )}

          {/* Wallet Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-sm pulse-text-secondary">🔑 Adresse:</span>
              <span className="text-sm font-mono pulse-text">{address.slice(0, 6)}...{address.slice(-4)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-sm pulse-text-secondary">🔗 Netzwerk:</span>
              <span className="text-sm pulse-text">{getChainName(chainId)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-sm pulse-text-secondary">💰 Balance:</span>
              <span className="text-sm font-mono pulse-text">
                {balance} {chainId === 369 ? 'PLS' : 'ETH'}
              </span>
            </div>

            {user?.id && (
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <span className="text-sm pulse-text-secondary">💾 Portfolio:</span>
                <span className="text-sm text-green-400">✅ Gespeichert</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button 
              onClick={disconnect}
              className="flex-1 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg text-sm pulse-text transition-colors"
            >
              🔌 Trennen
            </button>
            
            <button 
              onClick={() => navigator.clipboard.writeText(address)}
              className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors"
            >
              📋 Kopieren
            </button>
          </div>

          {/* Chain Info */}
          {chainId && (
            <div className="text-xs pulse-text-secondary text-center">
              {chainId === 369 && "🟢 PulseChain Mainnet erkannt"}
              {chainId === 1 && "🔵 Ethereum Mainnet erkannt"}  
              {chainId === 943 && "🟡 PulseChain Testnet erkannt"}
              {![369, 1, 943].includes(chainId) && "⚠️ Unbekanntes Netzwerk"}
              {user?.id && <span className="block mt-1 text-green-400">💾 Automatisch zu Portfolio hinzugefügt</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 