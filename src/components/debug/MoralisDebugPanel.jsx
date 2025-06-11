// 🔥 MORALIS DEBUG PANEL - Test Moralis V2 APIs direkt
// Zeigt alle Moralis-Daten für Debugging

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Target, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react';
import { MoralisV2Service } from '@/services/MoralisV2Service';
import { ROIDetectionService } from '@/services/ROIDetectionService';

const MoralisDebugPanel = () => {
  const [testAddress, setTestAddress] = useState('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'); // Vitalik's address for testing
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const testMoralisAPIs = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔥 TESTING MORALIS V2 APIs with address:', testAddress);

      // Test alle Moralis V2 Services parallel
      const [
        portfolioResult,
        defiSummaryResult,
        defiPositionsResult,
        roiDetectionResult,
        walletStatsResult
      ] = await Promise.all([
        MoralisV2Service.getPortfolioNetWorth(testAddress, '1').catch(err => ({ error: err.message, success: false })),
        MoralisV2Service.getDefiSummary(testAddress, '1').catch(err => ({ error: err.message, success: false })),
        MoralisV2Service.getDefiPositions(testAddress, '1').catch(err => ({ error: err.message, success: false })),
        ROIDetectionService.detectROISources(testAddress, '1').catch(err => ({ error: err.message, success: false })),
        MoralisV2Service.getWalletStats(testAddress, '1').catch(err => ({ error: err.message, success: false }))
      ]);

      const combinedResults = {
        address: testAddress,
        timestamp: new Date().toISOString(),
        
        portfolio: portfolioResult,
        defiSummary: defiSummaryResult,
        defiPositions: defiPositionsResult,
        roiDetection: roiDetectionResult,
        walletStats: walletStatsResult,
        
        // Summary
        summary: {
          totalAPICalls: 5,
          successfulCalls: [portfolioResult, defiSummaryResult, defiPositionsResult, roiDetectionResult, walletStatsResult]
            .filter(r => r.success).length,
          hasPortfolioData: portfolioResult.success,
          hasDefiData: defiSummaryResult.success,
          hasPositions: defiPositionsResult.success && defiPositionsResult.positions?.length > 0,
          hasROIDetection: roiDetectionResult.success,
          totalPortfolioValue: portfolioResult.total_networth_usd || 0,
          totalDefiValue: defiSummaryResult.roiAnalysis?.totalValue || 0,
          unclaimedValue: defiSummaryResult.roiAnalysis?.unclaimedValue || 0
        }
      };

      setResults(combinedResults);
      console.log('✅ MORALIS TEST RESULTS:', combinedResults);

    } catch (err) {
      console.error('💥 MORALIS TEST ERROR:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pulse-card p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold pulse-title">🔥 Moralis V2 Debug Panel</h3>
          <p className="pulse-text-secondary">Test alle Moralis APIs direkt</p>
        </div>
        <Button onClick={testMoralisAPIs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Testing...' : 'Test APIs'}
        </Button>
      </div>

      {/* Test Address Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium pulse-text mb-2">Test Wallet Address:</label>
        <input
          type="text"
          value={testAddress}
          onChange={(e) => setTestAddress(e.target.value)}
          className="w-full p-2 bg-slate-800 border border-white/20 rounded-lg pulse-text"
          placeholder="0x..."
        />
        <p className="text-xs pulse-text-secondary mt-1">
          Default: Vitalik's Wallet (für Testing) • Ändern Sie zu Ihrer eigenen Adresse
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="pulse-card p-4 mb-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
            <span className="pulse-text font-medium">API Test Fehler</span>
          </div>
          <p className="pulse-text-secondary text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="pulse-card p-4 text-center">
              <div className={`text-2xl font-bold ${results.summary.successfulCalls >= 3 ? 'text-green-400' : 'text-red-400'}`}>
                {results.summary.successfulCalls}/5
              </div>
              <p className="text-sm pulse-text-secondary">API Calls</p>
            </div>
            
            <div className="pulse-card p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                ${parseFloat(results.summary.totalPortfolioValue || 0).toFixed(0)}
              </div>
              <p className="text-sm pulse-text-secondary">Portfolio</p>
            </div>
            
            <div className="pulse-card p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                ${parseFloat(results.summary.totalDefiValue || 0).toFixed(0)}
              </div>
              <p className="text-sm pulse-text-secondary">DeFi Value</p>
            </div>
            
            <div className="pulse-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                ${parseFloat(results.summary.unclaimedValue || 0).toFixed(0)}
              </div>
              <p className="text-sm pulse-text-secondary">Unclaimed</p>
            </div>
          </div>

          {/* API Status */}
          <div className="pulse-card p-4">
            <h4 className="font-medium pulse-text mb-3">API Status:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                {results.portfolio.success ? 
                  <CheckCircle className="h-4 w-4 text-green-400" /> : 
                  <AlertCircle className="h-4 w-4 text-red-400" />
                }
                <span className="pulse-text">Portfolio Net Worth</span>
                <Badge variant="outline" className={results.portfolio.success ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}>
                  {results.portfolio.success ? 'OK' : 'FAIL'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                {results.defiSummary.success ? 
                  <CheckCircle className="h-4 w-4 text-green-400" /> : 
                  <AlertCircle className="h-4 w-4 text-red-400" />
                }
                <span className="pulse-text">DeFi Summary</span>
                <Badge variant="outline" className={results.defiSummary.success ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}>
                  {results.defiSummary.success ? 'OK' : 'FAIL'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                {results.defiPositions.success ? 
                  <CheckCircle className="h-4 w-4 text-green-400" /> : 
                  <AlertCircle className="h-4 w-4 text-red-400" />
                }
                <span className="pulse-text">DeFi Positions</span>
                <Badge variant="outline" className={results.defiPositions.success ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}>
                  {results.defiPositions.success ? 'OK' : 'FAIL'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                {results.roiDetection.success ? 
                  <CheckCircle className="h-4 w-4 text-green-400" /> : 
                  <AlertCircle className="h-4 w-4 text-red-400" />
                }
                <span className="pulse-text">ROI Detection</span>
                <Badge variant="outline" className={results.roiDetection.success ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}>
                  {results.roiDetection.success ? 'OK' : 'FAIL'}
                </Badge>
              </div>
            </div>
          </div>

          {/* DeFi Data Details */}
          {results.defiSummary.success && results.defiSummary.roiAnalysis && (
            <div className="pulse-card p-4">
              <h4 className="font-medium pulse-text mb-3">🔥 DeFi Details:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="pulse-text-secondary">Aktive Protokolle:</span>
                  <p className="pulse-text font-medium">{results.defiSummary.roiAnalysis.activeProtocols}</p>
                </div>
                <div>
                  <span className="pulse-text-secondary">Hat Positionen:</span>
                  <p className="pulse-text font-medium">{results.defiSummary.roiAnalysis.hasActivePositions ? 'Ja' : 'Nein'}</p>
                </div>
                <div>
                  <span className="pulse-text-secondary">ROI Potenzial:</span>
                  <p className="pulse-text font-medium">{results.defiSummary.roiAnalysis.roiPotential}</p>
                </div>
                <div>
                  <span className="pulse-text-secondary">Unclaimed Rewards:</span>
                  <p className="pulse-text font-medium">{results.defiSummary.roiAnalysis.hasUnclaimedRewards ? 'Ja' : 'Nein'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Position Details */}
          {results.defiPositions.success && results.defiPositions.positions?.length > 0 && (
            <div className="pulse-card p-4">
              <h4 className="font-medium pulse-text mb-3">🚀 Live DeFi Positionen ({results.defiPositions.positions.length}):</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {results.defiPositions.positions.slice(0, 5).map((position, index) => (
                  <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium pulse-text">{position.protocol}</h5>
                        <p className="text-sm pulse-text-secondary">{position.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-400">${position.balanceUsd?.toFixed(2) || '0.00'}</p>
                        {position.isROISource && (
                          <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                            ROI QUELLE
                          </Badge>
                        )}
                      </div>
                    </div>
                    {position.estimatedDailyROI > 0 && (
                      <p className="text-xs text-purple-400 mt-1">
                        Tägliche ROI: ${position.estimatedDailyROI.toFixed(4)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Details */}
          {results.summary.successfulCalls < 5 && (
            <div className="pulse-card p-4">
              <h4 className="font-medium pulse-text mb-3">⚠️ API Fehler:</h4>
              <div className="space-y-2 text-sm">
                {!results.portfolio.success && (
                  <p className="pulse-text-secondary">Portfolio: {results.portfolio.error}</p>
                )}
                {!results.defiSummary.success && (
                  <p className="pulse-text-secondary">DeFi Summary: {results.defiSummary.error}</p>
                )}
                {!results.defiPositions.success && (
                  <p className="pulse-text-secondary">DeFi Positions: {results.defiPositions.error}</p>
                )}
                {!results.roiDetection.success && (
                  <p className="pulse-text-secondary">ROI Detection: {results.roiDetection.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Raw Data (Collapsible) */}
          <details className="pulse-card p-4">
            <summary className="cursor-pointer font-medium pulse-text">🔍 Raw API Data</summary>
            <pre className="text-xs pulse-text-secondary mt-3 overflow-auto max-h-64 bg-slate-900 p-3 rounded">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default MoralisDebugPanel; 