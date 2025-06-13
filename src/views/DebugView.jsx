// 🐛 DEBUG VIEW - Echtzeit-Monitoring für DATENKONSISTENZ-FIX
// Datum: 2025-01-08 - CRITICAL DEBUG für Echte Daten

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Bug, 
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Monitor,
  Database,
  Globe,
  Clock,
  Zap,
  DollarSign,
  Calculator,
  AlertOctagon
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import CentralDataService from '@/services/CentralDataService';
import { useAuth } from '@/contexts/AuthContext';

const DebugView = () => {
  const { user } = useAuth();
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Führe umfangreichen System-Test durch
  const runSystemTest = async () => {
    setLoading(true);
    const results = {};
    
    try {
      console.log('🔬 DEBUG FIXED: Starting comprehensive system test...');
      
      // Test 1: Portfolio Data Loading
      const startTime = Date.now();
      const portfolioData = await CentralDataService.loadCompletePortfolio(user.id);
      const loadTime = Date.now() - startTime;
      
      results.portfolioLoad = {
        success: !portfolioData.error,
        time: loadTime,
        data: portfolioData,
        message: portfolioData.error || 'Portfolio loaded successfully'
      };

      // Test 2: API Endpoints
      const apiTests = {};
      
      // Test PulseChain API
      try {
        const pcResponse = await fetch('/api/pulsechain?module=proxy&action=eth_blockNumber');
        apiTests.pulsechain = {
          success: pcResponse.ok,
          status: pcResponse.status,
          message: pcResponse.ok ? 'PulseChain API reachable' : 'PulseChain API error'
        };
      } catch (error) {
        apiTests.pulsechain = { success: false, message: error.message };
      }

              // Test Moralis API
        try {
          const moralisResponse = await fetch('/api/moralis-prices?endpoint=token-prices&addresses=0x2b591e99afe9f32eaa6214f7b7629768c40eeb39&chain=369');
          apiTests.moralis = {
            success: moralisResponse.ok,
            status: moralisResponse.status,
            message: moralisResponse.ok ? 'Moralis API reachable' : 'Moralis API error'
          };
        } catch (error) {
          apiTests.moralis = { success: false, message: error.message };
        }

      results.apiTests = apiTests;

      // Test 3: Data Quality (EXTENDED)
      const dataQuality = {};
      
      if (portfolioData && !portfolioData.error) {
        dataQuality.tokensFound = {
          success: (portfolioData?.tokens?.length || 0) > 0,
          count: portfolioData?.tokens?.length || 0,
          message: `${portfolioData?.tokens?.length || 0} tokens found`
        };
        
        dataQuality.totalValue = {
          success: portfolioData.totalValue > 0,
          value: portfolioData.totalValue,
          message: `Total value: ${formatCurrency(portfolioData.totalValue)}`
        };
        
        dataQuality.roiTransactions = {
          success: portfolioData.roiTransactions.length > 0,
          count: portfolioData.roiTransactions.length,
          message: `${portfolioData.roiTransactions.length} ROI transactions found`
        };
        
        dataQuality.taxTransactions = {
          success: portfolioData.taxTransactions.length > 0,
          count: portfolioData.taxTransactions.length,
          message: `${portfolioData.taxTransactions.length} tax transactions found`
        };
        
        // Test real prices
                    const tokensWithRealPrices = (portfolioData?.tokens || []).filter(t => t.priceSource === 'moralis_live').length;
        dataQuality.realPrices = {
          success: tokensWithRealPrices > 0,
          count: tokensWithRealPrices,
          total: portfolioData?.tokens?.length || 0,
          message: `${tokensWithRealPrices}/${portfolioData?.tokens?.length || 0} tokens have real prices`
        };

        // EXTENDED: Check for problematic data
        const tokensWithZeroPrice = portfolioData.debug?.tokensWithZeroPrice || 0;
        const tokensWithZeroValue = portfolioData.debug?.tokensWithZeroValue || 0;
        const roiWithZeroValue = portfolioData.debug?.roiTransactionsWithZeroValue || 0;

        dataQuality.missingPrices = {
          success: tokensWithZeroPrice === 0,
          count: tokensWithZeroPrice,
          message: `${tokensWithZeroPrice} tokens missing prices`
        };

        dataQuality.zeroValues = {
          success: tokensWithZeroValue < (portfolioData?.tokens?.length || 0) * 0.5, // Less than 50% with zero value
          count: tokensWithZeroValue,
          total: portfolioData?.tokens?.length || 0,
          message: `${tokensWithZeroValue} tokens have zero value`
        };

        dataQuality.roiZeroValues = {
          success: roiWithZeroValue < portfolioData.roiTransactions.length * 0.3, // Less than 30% with zero value
          count: roiWithZeroValue,
          total: portfolioData.roiTransactions.length,
          message: `${roiWithZeroValue} ROI transactions have zero value`
        };

        // Expected vs Actual transaction count
        const totalTransactionsLoaded = portfolioData.debug?.totalTransactionsLoaded || 0;
        dataQuality.transactionCount = {
          success: totalTransactionsLoaded > 1000, // Expect more than 1000 transactions
          count: totalTransactionsLoaded,
          message: `${totalTransactionsLoaded} total transactions loaded (expected >1000)`
        };
      }
      
      results.dataQuality = dataQuality;

      // Test 4: Performance Metrics (EXTENDED)
      results.performance = {
        loadTime: loadTime,
        tokensPerSecond: portfolioData?.tokens ? ((portfolioData?.tokens?.length || 0) / (loadTime / 1000)).toFixed(2) : 0,
        apiCalls: portfolioData?.debug?.apiCalls || 0,
        pricesUpdated: portfolioData?.debug?.pricesUpdated || 0,
        transactionsPerSecond: portfolioData?.taxTransactions ? ((portfolioData?.taxTransactions?.length || 0) / (loadTime / 1000)).toFixed(2) : 0
      };

      // Test 5: Value Consistency Check
      if (portfolioData && !portfolioData.error) {
        const expectedValueRange = { min: 10000, max: 100000 }; // Expected $10K-$100K based on user description
        const actualValue = portfolioData.totalValue;
        
        results.valueConsistency = {
          success: actualValue >= expectedValueRange.min && actualValue <= expectedValueRange.max,
          actualValue: actualValue,
          expectedRange: expectedValueRange,
          message: `Portfolio value: ${formatCurrency(actualValue)} (expected: ${formatCurrency(expectedValueRange.min)}-${formatCurrency(expectedValueRange.max)})`
        };
      }

      setTestResults(results);
      setDebugData(portfolioData);
      
      console.log('✅ DEBUG FIXED: System test completed', results);
      
    } catch (error) {
      console.error('💥 DEBUG FIXED: System test failed', error);
      setTestResults({
        error: {
          success: false,
          message: error.message
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // ❌ DISABLED FOR MORALIS PRO: No auto-loading to save API calls
  // Initial test removed - only manual loading via button
  // useEffect(() => {
  //   if (user?.id) {
  //     runSystemTest();
  //   }
  // }, [user?.id]);

  // ❌ DISABLED FOR MORALIS PRO: Auto-refresh removed to save costs
  // useEffect(() => {
  //   if (autoRefresh) {
  //     const interval = setInterval(runSystemTest, 30000); // 30 seconds
  //     return () => clearInterval(interval);
  //   }
  // }, [autoRefresh, user?.id]);

  const getStatusIcon = (success) => {
    if (success === true) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (success === false) return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (success) => {
    if (success === true) return <Badge className="bg-green-500">OK</Badge>;
    if (success === false) return <Badge className="bg-red-500">FAIL</Badge>;
    return <Badge className="bg-yellow-500">WARN</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Bug className="h-8 w-8 mr-3" />
              Debug Monitor - DATENKONSISTENZ FIX
            </h1>
            <p className="text-gray-600">
              Live-Überwachung der Datenqualität • Token-Preise • ROI-Werte • Transaktions-Count
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="h-4 w-4 mr-2" />
              Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button onClick={runSystemTest} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Test System
            </Button>
          </div>
        </div>

        {/* Critical Issues Alert */}
        {testResults.valueConsistency && !testResults.valueConsistency.success && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertOctagon className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">🚨 VALUE INCONSISTENCY DETECTED</p>
                  <p className="text-red-700">{testResults.valueConsistency.message}</p>
                  <p className="text-sm text-red-600 mt-1">
                    This suggests token balance calculation or price mapping issues.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Monitor className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Portfolio Load</p>
                  <div className="flex items-center">
                    {getStatusIcon(testResults.portfolioLoad?.success)}
                    <span className="ml-2 font-bold">
                      {testResults.portfolioLoad?.time}ms
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">API Status</p>
                  <div className="flex items-center">
                    {getStatusIcon(
                      testResults.apiTests?.pulsechain?.success && 
                      testResults.apiTests?.moralis?.success
                    )}
                    <span className="ml-2 font-bold">
                      {Object.values(testResults.apiTests || {}).filter(t => t.success).length}/
                      {Object.keys(testResults.apiTests || {}).length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Portfolio Value</p>
                  <div className="flex items-center">
                    {getStatusIcon(testResults.valueConsistency?.success)}
                    <span className="ml-2 font-bold">
                      {formatCurrency(debugData?.totalValue || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Missing Prices</p>
                  <div className="flex items-center">
                    {getStatusIcon(testResults.dataQuality?.missingPrices?.success)}
                    <span className="ml-2 font-bold">
                      {testResults.dataQuality?.missingPrices?.count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-indigo-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <div className="flex items-center">
                    {getStatusIcon(testResults.dataQuality?.transactionCount?.success)}
                    <span className="ml-2 font-bold">
                      {testResults.dataQuality?.transactionCount?.count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Data Quality Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Data Quality Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(testResults.dataQuality || {}).map(([check, result]) => (
                  <div key={check} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.success)}
                      <div>
                        <div className="font-medium">{check.replace(/([A-Z])/g, ' $1').toLowerCase()}</div>
                        <div className="text-sm text-gray-500">{result.message}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(result.success)}
                      {result.count !== undefined && (
                        <div className="text-sm text-gray-500">
                          {result.total ? `${result.count}/${result.total}` : result.count}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                API Endpoints Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(testResults.apiTests || {}).map(([api, result]) => (
                  <div key={api} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.success)}
                      <div>
                        <div className="font-medium capitalize">{api}</div>
                        <div className="text-sm text-gray-500">{result.message}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(result.success)}
                      {result.status && (
                        <div className="text-sm text-gray-500">HTTP {result.status}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Performance Metrics */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Performance Metrics (FIXED)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.performance && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{testResults.performance.loadTime}ms</p>
                  <p className="text-sm text-gray-600">Load Time</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{testResults.performance.tokensPerSecond}</p>
                  <p className="text-sm text-gray-600">Tokens/Second</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{testResults.performance.apiCalls}</p>
                  <p className="text-sm text-gray-600">API Calls</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{testResults.performance.pricesUpdated}</p>
                  <p className="text-sm text-gray-600">Prices Updated</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{testResults.performance.transactionsPerSecond}</p>
                  <p className="text-sm text-gray-600">Transactions/Sec</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Problematic Tokens/Transactions */}
        {debugData && !debugData.error && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertOctagon className="h-5 w-5 mr-2" />
                Problematic Data (DEBUGGING)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Tokens with Missing Prices */}
                <div>
                  <h4 className="font-semibold mb-3 text-red-600">
                    Tokens with Missing Prices ({debugData.debug?.tokensWithZeroPrice || 0})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {debugData.tokens
                      .filter(token => token.price === 0 && token.balance > 0)
                      .slice(0, 10)
                      .map((token, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                          <div>
                            <span className="font-medium">{token.symbol}</span>
                            <div className="text-gray-500">{token.contractAddress?.slice(0, 10)}...</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatNumber(token.balance, 2)}</div>
                            <div className="text-red-600">$0.00</div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

                {/* ROI Transactions with Zero Value */}
                <div>
                  <h4 className="font-semibold mb-3 text-yellow-600">
                    ROI Transactions with $0 Value ({debugData.debug?.roiTransactionsWithZeroValue || 0})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {debugData.roiTransactions
                      .filter(tx => tx.value === 0 && tx.amount > 0)
                      .slice(0, 10)
                      .map((tx, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded text-sm">
                          <div>
                            <span className="font-medium">{tx.tokenSymbol}</span>
                            <div className="text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatNumber(tx.amount, 4)}</div>
                            <div className="text-yellow-600">Price: $0.00</div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-time Portfolio Data */}
        {debugData && !debugData.error && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Live Portfolio Data (FIXED)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(debugData.totalValue)}</p>
                  <p className="text-sm text-gray-600">Total Value</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{debugData.tokens.length}</p>
                  <p className="text-sm text-gray-600">Tokens</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{debugData.roiTransactions.length}</p>
                  <p className="text-sm text-gray-600">ROI Transactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(debugData.monthlyROI)}</p>
                  <p className="text-sm text-gray-600">Monthly ROI</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{debugData.taxTransactions.length}</p>
                  <p className="text-sm text-gray-600">Tax Transactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{debugData.debug?.pricesUpdated || 0}</p>
                  <p className="text-sm text-gray-600">Real Prices</p>
                </div>
              </div>

              {/* Top Tokens Preview */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Top Tokens (Live Data with Price Sources)</h4>
                <div className="space-y-2">
                  {debugData.tokens.slice(0, 8).map((token, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{token.symbol}</span>
                        <Badge variant={token.priceSource === 'moralis_live' ? 'default' : 
                                       token.priceSource === 'fallback' ? 'secondary' : 'destructive'}>
                          {token.priceSource}
                        </Badge>
                        {token.price === 0 && <Badge variant="destructive" className="text-xs">NO PRICE</Badge>}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(token.value)}</div>
                        <div className="text-sm text-gray-500">
                          {formatNumber(token.balance, 2)} @ {formatCurrency(token.price, 6)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Health Status */}
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    DATENKONSISTENZ-FIX Status: {debugData && !debugData.error ? 'OPERATIONAL' : 'DEGRADED'}
                  </p>
                  <p className="text-sm text-green-700">
                    Portfolio: {formatCurrency(debugData?.totalValue || 0)} • 
                    Tokens: {debugData?.tokens?.length || 0} • 
                    ROI: {debugData?.roiTransactions?.length || 0} • 
                    Tax: {debugData?.taxTransactions?.length || 0}
                    {autoRefresh && ' • Auto-Refresh aktiv (30s)'}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-green-600">
                <Clock className="h-4 w-4 inline mr-1" />
                {new Date().toLocaleTimeString('de-DE')}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DebugView; 