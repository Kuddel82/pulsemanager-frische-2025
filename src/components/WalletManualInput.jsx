import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { getWalletBalance, getWalletData } from '@/lib/blockscoutAPI';
import { Plus, Wallet, Trash2, Edit3, Eye, EyeOff, Copy, CheckCircle, RefreshCw } from 'lucide-react';

export default function WalletManualInput() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    address: '',
    nickname: '',
    chainId: 369,
    chainName: 'PulseChain'
  });

  const chains = {
    369: 'PulseChain Mainnet',
    1: 'Ethereum Mainnet',
    943: 'PulseChain Testnet',
    11155111: 'Ethereum Sepolia'
  };

  // Load user wallets
  useEffect(() => {
    if (user?.id) {
      loadWallets();
    }
  }, [user?.id]);

  const loadWallets = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
    } catch (err) {
      console.error('Error loading wallets:', err);
      setError('Fehler beim Laden der Wallets: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateAddress = (address) => {
    // Ethereum/PulseChain address validation
    const regex = /^0x[a-fA-F0-9]{40}$/;
    return regex.test(address);
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    setError('');
    setSuccess('');

    // Validation
    if (!formData.address || !validateAddress(formData.address)) {
      setError('Bitte geben Sie eine gültige Wallet-Adresse ein (0x...)');
      return;
    }

    if (!formData.nickname?.trim()) {
      setError('Bitte geben Sie einen Namen für die Wallet ein');
      return;
    }

    try {
      setIsAdding(true);

      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          address: formData.address.toLowerCase(),
          nickname: formData.nickname.trim(),
          chain_id: formData.chainId,
          chain_name: chains[formData.chainId],
          wallet_type: 'manual'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Diese Wallet-Adresse wurde bereits hinzugefügt');
        }
        throw error;
      }

      setSuccess('✅ Wallet erfolgreich hinzugefügt!');
      setFormData({ address: '', nickname: '', chainId: 369, chainName: 'PulseChain' });
      
      // Auto-load balance für neue Wallet
      try {
        const balanceData = await getWalletBalance(formData.address, formData.chainId);
        await supabase
          .from('wallets')
          .update({
            balance_eth: parseFloat(balanceData.balance.formatted),
            last_sync: new Date().toISOString()
          })
          .eq('id', data.id);
      } catch (balanceError) {
        console.log('Balance auto-load failed:', balanceError.message);
      }
      
      loadWallets(); // Reload list
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding wallet:', err);
      setError('Fehler beim Hinzufügen: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteWallet = async (walletId) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Wallet entfernen möchten?')) return;

    try {
      const { error } = await supabase
        .from('wallets')
        .update({ is_active: false })
        .eq('id', walletId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSuccess('✅ Wallet entfernt');
      loadWallets();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error deleting wallet:', err);
      setError('Fehler beim Entfernen: ' + err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('📋 Adresse kopiert!');
    setTimeout(() => setSuccess(''), 1500);
  };

  const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const refreshWalletBalance = async (wallet) => {
    try {
      setError('');
      const balanceData = await getWalletBalance(wallet.address, wallet.chain_id);
      
      const { error } = await supabase
        .from('wallets')
        .update({
          balance_eth: parseFloat(balanceData.balance.formatted),
          last_sync: new Date().toISOString()
        })
        .eq('id', wallet.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSuccess(`💰 Balance aktualisiert: ${balanceData.balance.display}`);
      loadWallets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error refreshing balance:', err);
      setError('Fehler beim Aktualisieren der Balance: ' + err.message);
    }
  };

  return (
    <div className="pulse-card p-6 rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold pulse-text">Manual Wallet Input</h3>
          <p className="text-sm pulse-text-secondary">DSGVO-konform · Nur Lesezugriff</p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Add Wallet Form */}
      <form onSubmit={handleAddWallet} className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-medium pulse-text mb-2">
              🔑 Wallet-Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="0x1234567890abcdef..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg pulse-text text-sm font-mono focus:outline-none focus:border-purple-400"
              disabled={isAdding}
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium pulse-text mb-2">
              📝 Name/Beschreibung
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="Meine Hauptwallet"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg pulse-text text-sm focus:outline-none focus:border-purple-400"
              disabled={isAdding}
            />
          </div>
        </div>

        {/* Chain Selection */}
        <div>
          <label className="block text-sm font-medium pulse-text mb-2">
            🔗 Blockchain
          </label>
          <select
            value={formData.chainId}
            onChange={(e) => setFormData({ 
              ...formData, 
              chainId: parseInt(e.target.value),
              chainName: chains[parseInt(e.target.value)]
            })}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg pulse-text text-sm focus:outline-none focus:border-purple-400"
            disabled={isAdding}
          >
            {Object.entries(chains).map(([id, name]) => (
              <option key={id} value={id} className="bg-gray-800">
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isAdding || !formData.address || !formData.nickname}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          key="submit-button"
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Wird hinzugefügt...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Wallet hinzufügen
            </>
          )}
        </button>
      </form>

      {/* Wallets List */}
      <div>
        <h4 className="text-sm font-semibold pulse-text mb-3">
          📊 Ihre Wallets ({wallets.length})
        </h4>

        {isLoading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-2"></div>
            <p className="text-sm pulse-text-secondary">Lade Wallets...</p>
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-lg">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="pulse-text-secondary">Noch keine Wallets hinzugefügt</p>
            <p className="text-sm pulse-text-secondary mt-1">Fügen Sie Ihre erste Wallet-Adresse hinzu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium pulse-text">{wallet.nickname}</span>
                      <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                        {wallet.chain_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono pulse-text-secondary">
                        {shortenAddress(wallet.address)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(wallet.address)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    {/* Balance Display */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-400">
                          {wallet.balance_eth > 0 
                            ? `${wallet.balance_eth.toFixed(4)} ${wallet.chain_id === 369 ? 'PLS' : 'ETH'}` 
                            : 'Balance nicht geladen'
                          }
                        </span>
                        {wallet.last_sync && (
                          <span className="text-xs pulse-text-secondary">
                            {new Date(wallet.last_sync).toLocaleString('de-DE')}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => refreshWalletBalance(wallet)}
                        className="text-green-400 hover:text-green-300 transition-colors"
                        title="Balance aktualisieren"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteWallet(wallet.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile/Tangem Info */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 mt-0.5">📱</div>
          <div>
            <h5 className="text-sm font-semibold text-blue-300 mb-1">
              Mobile & Hardware Wallets
            </h5>
            <p className="text-xs text-blue-200/80">
              <strong>Tangem, Ledger, Mobile MetaMask:</strong> Geben Sie einfach Ihre Wallet-Adresse manuell ein. 
              Kein QR-Code nötig - nur die Adresse für Read-Only Portfolio-Tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 