import React, { useState } from 'react';

const WalletTransactionsTest = () => {
  const [walletAddress, setWalletAddress] = useState('0x308e77c5b6b1e5b7b7b7b7b7b7b7b7b7b7b7b7b7');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const testWalletTransactions = async () => {
    setLoading(true);
    setError(null);
    setTransactions([]);
    setStats(null);

    try {
      console.log('🧪 Testing wallet-transactions endpoint...');
      
      const response = await fetch('/api/moralis-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: 'wallet-transactions',
          address: walletAddress,
          chain: '0x1', // Ethereum
          limit: 50
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API Error');
      }

      console.log('✅ Wallet Transactions Response:', data);
      
      const txs = data.result || [];
      setTransactions(txs);

      // Analysiere die Daten
      const withLabels = txs.filter(tx => tx.from_address_label || tx.to_address_label).length;
      const withEntities = txs.filter(tx => tx.from_address_entity || tx.to_address_entity).length;
      const withInternals = txs.filter(tx => tx.internal_transactions?.length > 0).length;
      const totalValue = txs.reduce((sum, tx) => sum + parseFloat(tx.value || 0), 0);

      setStats({
        total: txs.length,
        withLabels,
        withEntities,
        withInternals,
        totalValue: totalValue / 1e18, // Wei zu ETH
        cursor: data.cursor
      });

    } catch (err) {
      console.error('❌ Wallet Transactions Test Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🚀 Wallet Transactions v2.2 Test
      </h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wallet Address:
        </label>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="0x..."
        />
      </div>

      <button
        onClick={testWalletTransactions}
        disabled={loading || !walletAddress}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md mb-4"
      >
        {loading ? '🔄 Testing...' : '🧪 Test Wallet Transactions'}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {stats && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold mb-2">📊 Statistics:</h3>
          <ul className="list-disc list-inside">
            <li><strong>Total Transactions:</strong> {stats.total}</li>
            <li><strong>With Labels:</strong> {stats.withLabels} ({((stats.withLabels/stats.total)*100).toFixed(1)}%)</li>
            <li><strong>With Entities:</strong> {stats.withEntities} ({((stats.withEntities/stats.total)*100).toFixed(1)}%)</li>
            <li><strong>With Internal Txs:</strong> {stats.withInternals} ({((stats.withInternals/stats.total)*100).toFixed(1)}%)</li>
            <li><strong>Total ETH Value:</strong> {stats.totalValue.toFixed(4)} ETH</li>
            <li><strong>Has Cursor:</strong> {stats.cursor ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">🔍 Transaction Details:</h3>
          <div className="max-h-96 overflow-y-auto">
            {transactions.slice(0, 10).map((tx, index) => (
              <div key={tx.hash || index} className="border border-gray-200 rounded p-3 mb-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <strong>Hash:</strong> {tx.hash?.slice(0, 10)}...
                  </div>
                  <div>
                    <strong>Block:</strong> {tx.block_number}
                  </div>
                  <div>
                    <strong>From:</strong> {tx.from_address?.slice(0, 10)}...
                    {tx.from_address_label && (
                      <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {tx.from_address_label}
                      </span>
                    )}
                    {tx.from_address_entity && (
                      <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {tx.from_address_entity}
                      </span>
                    )}
                  </div>
                  <div>
                    <strong>To:</strong> {tx.to_address?.slice(0, 10)}...
                    {tx.to_address_label && (
                      <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {tx.to_address_label}
                      </span>
                    )}
                    {tx.to_address_entity && (
                      <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {tx.to_address_entity}
                      </span>
                    )}
                  </div>
                  <div>
                    <strong>Value:</strong> {(parseFloat(tx.value || 0) / 1e18).toFixed(6)} ETH
                  </div>
                  <div>
                    <strong>Internal Txs:</strong> {tx.internal_transactions?.length || 0}
                  </div>
                </div>
                {tx.internal_transactions?.length > 0 && (
                  <div className="mt-2 pl-4 border-l-2 border-gray-300">
                    <strong>Internal Transactions:</strong>
                    {tx.internal_transactions.slice(0, 3).map((internal, idx) => (
                      <div key={idx} className="text-xs text-gray-600 mt-1">
                        {internal.from?.slice(0, 8)}... → {internal.to?.slice(0, 8)}... 
                        ({(parseFloat(internal.value || 0) / 1e18).toFixed(6)} ETH)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {transactions.length > 10 && (
              <div className="text-center text-gray-500 mt-4">
                ... und {transactions.length - 10} weitere Transaktionen
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletTransactionsTest; 