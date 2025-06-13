// 🧪 API TEST COMPONENT - Debug CSP und Moralis
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const APITestComponent = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [testAddress, setTestAddress] = useState('0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE'); // Sample address

  const runTest = async (testName, testFunction) => {
    setIsLoading(true);
    setTestResults(prev => ({ ...prev, [testName]: { status: 'loading', message: 'Testing...' } }));
    
    try {
      const result = await testFunction();
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          status: 'success', 
          message: 'Test erfolgreich!', 
          data: result 
        } 
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          status: 'error', 
          message: error.message,
          error: error
        } 
      }));
    }
    setIsLoading(false);
  };

  // Test 1: Moralis API Verbindung
  const testMoralisConnection = async () => {
    const response = await fetch('/api/test-moralis');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  };

  // Test 2: Proxy API - Transaktionen
  const testProxyTransactions = async () => {
    if (!testAddress) throw new Error('Wallet-Adresse erforderlich');
    const response = await fetch(
      `/api/moralis-proxy?endpoint=transactions&address=${testAddress}&chain=eth&limit=10`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  };

  // Test 3: Proxy API - ERC20 Transfers
  const testProxyERC20 = async () => {
    if (!testAddress) throw new Error('Wallet-Adresse erforderlich');
    const response = await fetch(
      `/api/moralis-proxy?endpoint=erc20-transfers&address=${testAddress}&chain=eth&limit=10`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  };

  // Test 4: Direct Moralis (sollte CSP-Error geben)
  const testDirectMoralis = async () => {
    // Dies sollte durch CSP blockiert werden
    const response = await fetch('https://deep-index.moralis.io/api/v2.2/erc20/metadata?chain=eth&addresses=0xA0b86a33E6441b0a05f1974fc59d1b92f8b0aa8c');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'loading': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 API Connection Test - CSP Debug
        </CardTitle>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Wallet-Adresse für Tests"
            value={testAddress}
            onChange={(e) => setTestAddress(e.target.value)}
            className="flex-1"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Test 1: Moralis Verbindung */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">1. Moralis API Key Test</h3>
            <Button 
              onClick={() => runTest('moralisConnection', testMoralisConnection)}
              disabled={isLoading}
              className="w-full mb-2"
            >
              Test API Key
            </Button>
            {testResults.moralisConnection && (
              <div className={`p-2 rounded text-sm ${getStatusColor(testResults.moralisConnection.status)}`}>
                {testResults.moralisConnection.message}
                {testResults.moralisConnection.data && (
                  <details className="mt-2">
                    <summary>Details</summary>
                    <pre className="text-xs mt-1 overflow-auto">
                      {JSON.stringify(testResults.moralisConnection.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Test 2: Proxy Transaktionen */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">2. Proxy API - Transaktionen</h3>
            <Button 
              onClick={() => runTest('proxyTransactions', testProxyTransactions)}
              disabled={isLoading || !testAddress}
              className="w-full mb-2"
            >
              Test Transaktionen
            </Button>
            {testResults.proxyTransactions && (
              <div className={`p-2 rounded text-sm ${getStatusColor(testResults.proxyTransactions.status)}`}>
                {testResults.proxyTransactions.message}
                {testResults.proxyTransactions.data?.result && (
                  <div className="mt-1 text-xs">
                    📊 {testResults.proxyTransactions.data.result.length} Transaktionen geladen
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test 3: Proxy ERC20 */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">3. Proxy API - ERC20 Transfers</h3>
            <Button 
              onClick={() => runTest('proxyERC20', testProxyERC20)}
              disabled={isLoading || !testAddress}
              className="w-full mb-2"
            >
              Test ERC20 Transfers
            </Button>
            {testResults.proxyERC20 && (
              <div className={`p-2 rounded text-sm ${getStatusColor(testResults.proxyERC20.status)}`}>
                {testResults.proxyERC20.message}
                {testResults.proxyERC20.data?.result && (
                  <div className="mt-1 text-xs">
                    🔄 {testResults.proxyERC20.data.result.length} Transfers geladen
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test 4: Direct Moralis (CSP Test) */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">4. Direct Moralis (CSP Test)</h3>
            <Button 
              onClick={() => runTest('directMoralis', testDirectMoralis)}
              disabled={isLoading}
              className="w-full mb-2"
              variant="outline"
            >
              Test Direct Call (sollte fehlen)
            </Button>
            {testResults.directMoralis && (
              <div className={`p-2 rounded text-sm ${getStatusColor(testResults.directMoralis.status)}`}>
                {testResults.directMoralis.status === 'error' ? 
                  '✅ CSP blockiert wie erwartet!' : 
                  '⚠️ CSP-Blockierung funktioniert nicht!'
                }
                <div className="text-xs mt-1">{testResults.directMoralis.message}</div>
              </div>
            )}
          </div>

        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Interpretation der Ergebnisse:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>Test 1 (API Key):</strong> Muss erfolgreich sein - prüft Moralis-Schlüssel</li>
            <li><strong>Test 2 & 3 (Proxy):</strong> Müssen erfolgreich sein - neue CSP-sichere API</li>
            <li><strong>Test 4 (Direct):</strong> Muss FEHLEN - bestätigt CSP-Schutz</li>
          </ul>
        </div>

      </CardContent>
    </Card>
  );
}; 