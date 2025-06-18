import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

/**
 * 🔥 WGEP TEST COMPONENT
 * Testet die aggressive Pagination für die WGEP-Wallet
 * Löst das 44-Transaktionen-Problem
 */
export default function WGEPTestComponent() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [simpleTestResults, setSimpleTestResults] = useState(null);

  // 🔥 WGEP WALLET ADDRESS
  const WGEP_ADDRESS = '0x308e77281612bdc267d5feaf4599f2759cb3ed85';

  /**
   * 🔥 SIMPLE TEST - Diagnostiziert das Problem
   */
  const runSimpleTest = async () => {
    setLoading(true);
    setError(null);
    setSimpleTestResults(null);

    try {
      console.log('🔥 WGEP SIMPLE TEST: Starting diagnostic test...');
      
      const response = await fetch(`/api/test-wgep-simple`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('🔥 WGEP SIMPLE TEST: Results:', data);
      setSimpleTestResults(data);

    } catch (err) {
      console.error('🔥 WGEP SIMPLE TEST ERROR:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔥 LOAD ALL WGEP TRANSACTIONS
   */
  const loadAllWGEPTransactions = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setTransactions([]);
    setStats(null);

    try {
      console.log('🔥 WGEP TEST: Starting aggressive pagination test...');
      
      // 🔥 NEUE WGEP-API MIT AGGRESSIVER PAGINATION
      const response = await fetch(`/api/wgep-complete-transactions?address=${WGEP_ADDRESS}&chain=pulsechain&max_pages=100`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('🔥 WGEP TEST: Successfully loaded transactions:', {
        total: data.total,
        pages: data.pages_loaded,
        source: data._source
      });

      setTransactions(data.result || []);
      setStats(data._wgep_stats || data._tax_categorization);
      setProgress(100);

    } catch (err) {
      console.error('🔥 WGEP TEST ERROR:', err);
      setError(err.message);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔥 COMPARE WITH OLD API
   */
  const compareWithOldAPI = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔥 WGEP COMPARE: Testing old API vs new API...');
      
      // 🔥 ALTE API (sollte nur 44 Transaktionen zurückgeben)
      const oldResponse = await fetch(`/api/moralis-transactions?address=${WGEP_ADDRESS}&chain=pulsechain&limit=100`);
      const oldData = await oldResponse.json();
      
      // 🔥 NEUE API (sollte alle Transaktionen zurückgeben)
      const newResponse = await fetch(`/api/wgep-complete-transactions?address=${WGEP_ADDRESS}&chain=pulsechain&max_pages=100`);
      const newData = await newResponse.json();
      
      const comparison = {
        oldAPI: {
          total: oldData.total || 0,
          count: oldData.result?.length || 0,
          source: oldData._source
        },
        newAPI: {
          total: newData.total || 0,
          count: newData.result?.length || 0,
          source: newData._source
        },
        improvement: {
          factor: newData.total / (oldData.total || 1),
          difference: newData.total - (oldData.total || 0)
        }
      };

      console.log('🔥 WGEP COMPARE RESULTS:', comparison);
      
      setStats({
        ...newData._wgep_stats,
        comparison
      });

    } catch (err) {
      console.error('🔥 WGEP COMPARE ERROR:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔥 WGEP Complete Transactions Test
            <Badge variant="destructive">AGGRESSIVE PAGINATION</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={runSimpleTest}
              disabled={loading}
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              🔍 Simple Diagnostic Test
            </Button>
            
            <Button 
              onClick={loadAllWGEPTransactions}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? '🔥 Loading...' : '🔥 Load ALL WGEP Transactions'}
            </Button>
            
            <Button 
              onClick={compareWithOldAPI}
              disabled={loading}
              variant="outline"
            >
              🔍 Compare Old vs New API
            </Button>
          </div>

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                🔥 Loading transactions with aggressive pagination...
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                ❌ Error: {error}
              </AlertDescription>
            </Alert>
          )}

          {/* 🔥 SIMPLE TEST RESULTS */}
          {simpleTestResults && (
            <Card>
              <CardHeader>
                <CardTitle>🔍 Simple Diagnostic Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-blue-600">PulseChain ERC20</h4>
                    <p>Success: {simpleTestResults.results.pulsechain.success ? '✅' : '❌'}</p>
                    <p>Total: {simpleTestResults.results.pulsechain.total}</p>
                    <p>Count: {simpleTestResults.results.pulsechain.count}</p>
                    <p>Has Cursor: {simpleTestResults.results.pulsechain.hasCursor ? '✅' : '❌'}</p>
                    {simpleTestResults.results.pulsechain.sample && (
                      <div className="text-xs text-gray-500 mt-2">
                        Sample: {simpleTestResults.results.pulsechain.sample.token} - {simpleTestResults.results.pulsechain.sample.value}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-green-600">Ethereum ERC20</h4>
                    <p>Success: {simpleTestResults.results.ethereum.success ? '✅' : '❌'}</p>
                    <p>Total: {simpleTestResults.results.ethereum.total}</p>
                    <p>Count: {simpleTestResults.results.ethereum.count}</p>
                    <p>Has Cursor: {simpleTestResults.results.ethereum.hasCursor ? '✅' : '❌'}</p>
                    {simpleTestResults.results.ethereum.sample && (
                      <div className="text-xs text-gray-500 mt-2">
                        Sample: {simpleTestResults.results.ethereum.sample.token} - {simpleTestResults.results.ethereum.sample.value}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-purple-600">Wallet History</h4>
                    <p>Success: {simpleTestResults.results.history.success ? '✅' : '❌'}</p>
                    <p>Total: {simpleTestResults.results.history.total}</p>
                    <p>Count: {simpleTestResults.results.history.count}</p>
                    <p>Has Cursor: {simpleTestResults.results.history.hasCursor ? '✅' : '❌'}</p>
                    {simpleTestResults.results.history.sample && (
                      <div className="text-xs text-gray-500 mt-2">
                        Sample: {simpleTestResults.results.history.sample.type} - {simpleTestResults.results.history.sample.value}
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="text-center">
                  <Badge variant="outline" className="text-lg">
                    🔥 Combined: {simpleTestResults.combined.unique} unique transactions
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Total: {simpleTestResults.combined.total} • Unique: {simpleTestResults.combined.unique}
                  </p>
                </div>

                {/* Sample Transactions */}
                {simpleTestResults.combined.transactions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Sample Transactions:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {simpleTestResults.combined.transactions.map((tx, index) => (
                        <div key={index} className="p-2 border rounded text-sm">
                          <div className="flex justify-between">
                            <span>{tx.transaction_hash?.slice(0, 10)}...</span>
                            <Badge variant="outline">{tx.chain}</Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {tx.token_symbol || tx.type} - {tx.value} - {new Date(tx.block_timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.total || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Transactions
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.wgepTransactions || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    WGEP Transactions
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.roiIncome || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ROI Income
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.taxable || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Taxable Transactions
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {stats?.comparison && (
            <Card>
              <CardHeader>
                <CardTitle>🔍 API Comparison Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-red-600">Old API (Problem)</h4>
                    <p>Total: {stats.comparison.oldAPI.total}</p>
                    <p>Count: {stats.comparison.oldAPI.count}</p>
                    <p>Source: {stats.comparison.oldAPI.source}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600">New API (Solution)</h4>
                    <p>Total: {stats.comparison.newAPI.total}</p>
                    <p>Count: {stats.comparison.newAPI.count}</p>
                    <p>Source: {stats.comparison.newAPI.source}</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="text-center">
                  <Badge variant="outline" className="text-lg">
                    🔥 Improvement: {stats.comparison.improvement.factor.toFixed(1)}x more transactions
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    +{stats.comparison.improvement.difference} additional transactions loaded
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              🔥 WGEP Transactions ({transactions.length} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.slice(0, 50).map((tx, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={tx.isWGEP ? "destructive" : "secondary"}>
                          {tx.token_symbol || 'Unknown'}
                        </Badge>
                        <Badge variant={tx.taxCategory === 'roi_income' ? "default" : "outline"}>
                          {tx.taxCategory}
                        </Badge>
                        {tx.wgepSpecific && (
                          <Badge variant="destructive">WGEP</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tx.transaction_hash?.slice(0, 10)}... → {tx.value} {tx.token_symbol}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.block_timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${tx.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.direction === 'in' ? '+' : '-'}{tx.value} {tx.token_symbol}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {transactions.length > 50 && (
                <div className="text-center p-4 text-muted-foreground">
                  ... und {transactions.length - 50} weitere Transaktionen
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 