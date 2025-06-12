import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  DollarSign, 
  Eye, 
  EyeOff,
  AlertCircle,
  TrendingUp,
  Database,
  Globe
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const CUMonitor = ({ viewName, apiCalls = [], totalCUs = 0, showByDefault = false }) => {
  const [isVisible, setIsVisible] = useState(showByDefault);
  const [sessionCUs, setSessionCUs] = useState(0);
  const [apiCallHistory, setApiCallHistory] = useState([]);

  // Track API calls für diese Session
  useEffect(() => {
    if (apiCalls && apiCalls.length > 0) {
      const newCalls = apiCalls.map(call => ({
        ...call,
        timestamp: new Date(),
        viewName: viewName
      }));
      
      setApiCallHistory(prev => {
        const updated = [...prev, ...newCalls];
        // Nur letzte 10 Calls behalten
        return updated.slice(-10);
      });
      
      // Addiere neue CUs
      const newCUs = apiCalls.reduce((sum, call) => sum + (call.estimatedCUs || 0), 0);
      setSessionCUs(prev => prev + newCUs);
    }
  }, [apiCalls, viewName]);

  // Schätze CU-Kosten basierend auf Endpoint (REALISTISCH)
  const estimateCUs = (endpoint, responseSize = 0) => {
    const endpointCosts = {
      'moralis-tokens': responseSize > 50 ? 25 : 15,
      'moralis-prices': Math.ceil(responseSize / 25) * 10, // Batch pricing
      'moralis-portfolio': 20,
      'moralis-transactions': responseSize > 100 ? 50 : 30,
      'moralis-v2': 15, // Pro API calls
      'erc20/balances': 15,
      'erc20/prices': Math.ceil(responseSize / 25) * 10,
      'erc20/transfers': responseSize > 500 ? 100 : 60,
      'token-price': 5, // Single token price
      'token/price': 5,
      'portfolio-cache': 0, // Cache hit
      'api/moralis': 15, // General Moralis calls
      'failed-call': 1, // Failed API calls still cost something
      'error': 1, // Error calls
      'fallback': 2
    };

    // Realistische Kosten für echte API-Aufrufe
    if (endpoint.includes('error') || endpoint.includes('failed')) {
      return 1; // Failed calls still consume some CUs
    }

    // Finde passenden Endpoint
    const matchedEndpoint = Object.keys(endpointCosts).find(key => 
      endpoint.toLowerCase().includes(key.toLowerCase())
    );
    
    return endpointCosts[matchedEndpoint] || 15; // Realistische Default estimate
  };

  // Berechne Gesamtkosten
  const calculateTotalCost = () => {
    const sessionCost = apiCallHistory.reduce((sum, call) => {
      return sum + (call.estimatedCUs || estimateCUs(call.endpoint, call.responseSize));
    }, 0);
    
    return sessionCost + totalCUs;
  };

  // Farbe basierend auf CU-Verbrauch
  const getCUColor = (cus) => {
    if (cus === 0) return 'text-green-400';
    if (cus < 50) return 'text-blue-400';
    if (cus < 200) return 'text-yellow-400';
    if (cus < 500) return 'text-orange-400';
    return 'text-red-400';
  };

  const totalCost = calculateTotalCost();

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-black/80 border-green-500/30 hover:bg-green-500/10"
        >
          <Activity className="h-4 w-4 mr-2 text-green-400" />
          <span className="text-green-400">CU Monitor</span>
          <Badge variant="outline" className={`ml-2 ${getCUColor(totalCost)}`}>
            {totalCost}
          </Badge>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="pulse-card border-green-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-sm pulse-text">
              <Activity className="h-4 w-4 mr-2 text-green-400" />
              CU Monitor - {viewName}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          
          {/* CU Summary */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-green-500/10 border border-green-400/20 rounded">
              <div className="font-medium text-green-400">Session</div>
              <div className={`font-mono ${getCUColor(sessionCUs)}`}>
                {sessionCUs} CUs
              </div>
            </div>
            <div className="text-center p-2 bg-blue-500/10 border border-blue-400/20 rounded">
              <div className="font-medium text-blue-400">View Total</div>
              <div className={`font-mono ${getCUColor(totalCUs)}`}>
                {totalCUs} CUs
              </div>
            </div>
            <div className="text-center p-2 bg-purple-500/10 border border-purple-400/20 rounded">
              <div className="font-medium text-purple-400">Gesamt</div>
              <div className={`font-mono ${getCUColor(totalCost)}`}>
                {totalCost} CUs
              </div>
            </div>
          </div>

          {/* API Call History */}
          {apiCallHistory.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <Globe className="h-3 w-3 mr-1 text-blue-400" />
                <span className="text-xs pulse-text font-medium">Letzte API-Calls</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {apiCallHistory.slice(-5).reverse().map((call, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-1 bg-white/5 rounded">
                    <div className="flex items-center flex-1 min-w-0">
                      <Badge 
                        variant="outline" 
                        className="text-xs px-1 py-0 mr-2 flex-shrink-0"
                      >
                        {call.endpoint?.split('/').pop() || 'API'}
                      </Badge>
                      <span className="pulse-text-secondary truncate">
                        {call.responseCount ? `${call.responseCount} items` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <span className={`font-mono ${getCUColor(call.estimatedCUs || estimateCUs(call.endpoint, call.responseSize))}`}>
                        {call.estimatedCUs || estimateCUs(call.endpoint, call.responseSize)}
                      </span>
                      <span className="text-gray-500">CU</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <Database className="h-3 w-3 text-gray-400" />
              <span className="pulse-text-secondary">
                {apiCallHistory.length} Calls getrackt
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {totalCost === 0 && (
                <Badge variant="outline" className="text-green-400 border-green-400 text-xs">
                  💾 Cache Only
                </Badge>
              )}
              {totalCost > 0 && totalCost < 100 && (
                <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">
                  ✅ Optimal
                </Badge>
              )}
              {totalCost >= 100 && totalCost < 500 && (
                <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-xs">
                  ⚠️ Moderate
                </Badge>
              )}
              {totalCost >= 500 && (
                <Badge variant="outline" className="text-red-400 border-red-400 text-xs">
                  🔴 High Cost
                </Badge>
              )}
            </div>
          </div>

          {/* Cost Estimation */}
          {totalCost > 0 && (
            <div className="text-xs pulse-text-secondary pt-1 border-t border-white/10">
              💰 Geschätzte Kosten: {formatCurrency(totalCost * 0.001)} 
              <span className="text-gray-500"> (bei $0.001/CU)</span>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default CUMonitor; 