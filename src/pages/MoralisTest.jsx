// 🔥 MORALIS V2 API TEST PAGE - Debug DeFi Data Issues
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Target } from 'lucide-react';

const MoralisTest = () => {
  const [testAddress, setTestAddress] = useState('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const testMoralisAPIs = async () => {
    setLoading(true);
    console.log('🔥 TESTING MORALIS V2 APIs');
    
    try {
      // Test Portfolio API
      const portfolioResponse = await fetch(`/api/moralis-v2?endpoint=portfolio&address=${testAddress}&chain=1`);
      const portfolioData = await portfolioResponse.json();
      
      // Test DeFi Summary API  
      const defiSummaryResponse = await fetch(`/api/moralis-v2?endpoint=defi-summary&address=${testAddress}&chain=1`);
      const defiSummaryData = await defiSummaryResponse.json();
      
      // Test DeFi Positions API
      const defiPositionsResponse = await fetch(`/api/moralis-v2?endpoint=defi-positions&address=${testAddress}&chain=1`);
      const defiPositionsData = await defiPositionsResponse.json();
      
      const testResults = {
        address: testAddress,
        timestamp: new Date().toISOString(),
        portfolio: portfolioData,
        defiSummary: defiSummaryData,
        defiPositions: defiPositionsData
      };
      
      setResults(testResults);
      console.log('✅ MORALIS TEST RESULTS:', testResults);
      
    } catch (error) {
      console.error('💥 MORALIS TEST ERROR:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="pulse-card p-6 mb-6">
          <h1 className="text-2xl font-bold pulse-title mb-4">🔥 Moralis V2 API Tester</h1>
          <p className="pulse-text-secondary mb-4">Debug warum DeFi-Daten nicht im ROI Tracker angezeigt werden</p>
          
          <div className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium pulse-text mb-2">Test Wallet Address:</label>
              <input
                type="text"
                value={testAddress}
                onChange={(e) => setTestAddress(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-white/20 rounded-lg pulse-text"
                placeholder="0x..."
              />
            </div>
            <Button onClick={testMoralisAPIs} disabled={loading} className="bg-blue-500 hover:bg-blue-600">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Testing...' : 'Test APIs'}
            </Button>
          </div>
          
          <p className="text-xs pulse-text-secondary">
            💡 Vitalik's Wallet (default) hat normalerweise DeFi-Aktivitäten für Tests
          </p>
        </div>

        {results && !results.error && (
          <div className="space-y-6">
            
            {/* API Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="pulse-card p-4 text-center">
                <div className={`text-2xl font-bold ${!results.portfolio._error ? 'text-green-400' : 'text-red-400'}`}>
                  {!results.portfolio._error ? '✅' : '❌'}
                </div>
                <p className="text-sm pulse-text-secondary">Portfolio API</p>
                <p className="text-xs pulse-text">${results.portfolio.result?.total_networth_usd || '0'}</p>
              </div>
              
              <div className="pulse-card p-4 text-center">
                <div className={`text-2xl font-bold ${!results.defiSummary._error ? 'text-green-400' : 'text-red-400'}`}>
                  {!results.defiSummary._error ? '✅' : '❌'}
                </div>
                <p className="text-sm pulse-text-secondary">DeFi Summary</p>
                <p className="text-xs pulse-text">{results.defiSummary.result?.active_protocols || '0'} protocols</p>
              </div>
              
              <div className="pulse-card p-4 text-center">
                <div className={`text-2xl font-bold ${!results.defiPositions._error ? 'text-green-400' : 'text-red-400'}`}>
                  {!results.defiPositions._error ? '✅' : '❌'}
                </div>
                <p className="text-sm pulse-text-secondary">DeFi Positions</p>
                <p className="text-xs pulse-text">{Array.isArray(results.defiPositions.result) ? results.defiPositions.result.length : 0} positions</p>
              </div>
            </div>

            {/* DeFi Summary Details */}
            {!results.defiSummary._error && results.defiSummary.result && (
              <div className="pulse-card p-6">
                <h3 className="text-lg font-bold pulse-title mb-4">🚀 DeFi Summary Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm pulse-text-secondary">Aktive Protokolle:</p>
                    <p className="text-xl font-bold text-green-400">{results.defiSummary.result.active_protocols}</p>
                  </div>
                  <div>
                    <p className="text-sm pulse-text-secondary">Total Positionen:</p>
                    <p className="text-xl font-bold text-blue-400">{results.defiSummary.result.total_positions}</p>
                  </div>
                  <div>
                    <p className="text-sm pulse-text-secondary">DeFi Wert:</p>
                    <p className="text-xl font-bold text-purple-400">${results.defiSummary.result.total_usd_value}</p>
                  </div>
                  <div>
                    <p className="text-sm pulse-text-secondary">Unclaimed:</p>
                    <p className="text-xl font-bold text-orange-400">${results.defiSummary.result.total_unclaimed_usd_value}</p>
                  </div>
                </div>
              </div>
            )}

            {/* DeFi Positions Details */}
            {!results.defiPositions._error && Array.isArray(results.defiPositions.result) && results.defiPositions.result.length > 0 && (
              <div className="pulse-card p-6">
                <h3 className="text-lg font-bold pulse-title mb-4">🔥 DeFi Positions ({results.defiPositions.result.length})</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {results.defiPositions.result.slice(0, 5).map((position, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium pulse-text">{position.protocol_name || 'Unknown'}</h5>
                          <p className="text-sm pulse-text-secondary">{position.label || 'Position'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400">${parseFloat(position.balance_usd || 0).toFixed(2)}</p>
                          {parseFloat(position.total_unclaimed_usd_value || 0) > 0 && (
                            <p className="text-xs text-blue-400">+${parseFloat(position.total_unclaimed_usd_value).toFixed(2)} unclaimed</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Messages */}
            {(results.portfolio._error || results.defiSummary._error || results.defiPositions._error) && (
              <div className="pulse-card p-6">
                <h3 className="text-lg font-bold pulse-title mb-4 text-red-400">❌ API Fehler</h3>
                <div className="space-y-2 text-sm">
                  {results.portfolio._error && (
                    <p className="pulse-text-secondary">Portfolio: {results.portfolio._error.message}</p>
                  )}
                  {results.defiSummary._error && (
                    <p className="pulse-text-secondary">DeFi Summary: {results.defiSummary._error.message}</p>
                  )}
                  {results.defiPositions._error && (
                    <p className="pulse-text-secondary">DeFi Positions: {results.defiPositions._error.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Problem Diagnosis */}
            <div className="pulse-card p-6">
              <h3 className="text-lg font-bold pulse-title mb-4">🔍 Problem Diagnose</h3>
              <div className="space-y-2 text-sm pulse-text-secondary">
                {results.defiSummary._error?.message?.includes('PulseChain') ? (
                  <p className="text-yellow-400">⚠️ DeFi APIs funktionieren nur mit Ethereum (Chain 1), nicht mit PulseChain (369)</p>
                ) : !results.defiSummary._error && parseInt(results.defiSummary.result?.active_protocols || 0) === 0 ? (
                  <p className="text-yellow-400">⚠️ Diese Wallet hat keine aktiven DeFi-Positionen</p>
                ) : !results.defiSummary._error ? (
                  <p className="text-green-400">✅ DeFi-Daten erfolgreich geladen!</p>
                ) : (
                  <p className="text-red-400">❌ Moralis API Problem - prüfen Sie MORALIS_API_KEY</p>
                )}
                
                <p>• Nur Ethereum-Wallets können DeFi-Daten anzeigen</p>
                <p>• PulseChain wird von Moralis DeFi APIs nicht unterstützt</p>
                <p>• Testen Sie mit einer Ethereum-Wallet die DeFi-Aktivitäten hat</p>
              </div>
            </div>

            {/* Raw Data */}
            <details className="pulse-card p-6">
              <summary className="cursor-pointer font-medium pulse-text">🔍 Raw API Responses</summary>
              <pre className="text-xs pulse-text-secondary bg-slate-900 p-4 rounded overflow-auto max-h-96 mt-4">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>

          </div>
        )}

        {results?.error && (
          <div className="pulse-card p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 mr-2 text-red-400" />
              <h3 className="text-lg font-bold pulse-title text-red-400">Test Fehler</h3>
            </div>
            <p className="pulse-text-secondary">{results.error}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default MoralisTest;
