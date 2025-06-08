import { useState } from "react";

export default function WalletReader() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const getChainName = (chainId) => {
    const chains = {
      1: "Ethereum Mainnet",
      369: "PulseChain Mainnet", 
      943: "PulseChain Testnet",
      11155111: "Ethereum Sepolia",
    };
    return chains[chainId] || `Chain ${chainId}`;
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

      setAddress(addr);
      setChainId(parseInt(chain, 16));
      setBalance((parseInt(bal, 16) / 1e18).toFixed(4)); // ETH/PLS Balance
      
      console.log("✅ Wallet connected:", { addr, chain: parseInt(chain, 16), balance: parseInt(bal, 16) / 1e18 });
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
          <p className="text-sm pulse-text-secondary">DOM-sichere Wallet-Verbindung</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {!address ? (
        <button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Verbinde...
            </>
          ) : (
            <>
              🔌 Wallet verbinden
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
} 