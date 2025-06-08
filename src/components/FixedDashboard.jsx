import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // ✅ RICHTIG: useAuth Hook verwenden
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Crown, Shield, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

// ✅ RICHTIG: Funktionale Komponente mit korrekten Hooks
const FixedDashboard = () => {
  // ✅ RICHTIG: useAuth Hook statt direkter useContext
  const { user, loading: authLoading } = useAuth();
  const { t, subscriptionStatus, daysRemaining } = useAppContext();
  
  // ✅ RICHTIG: Separate loading states
  const [walletData, setWalletData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ RICHTIG: useRef für stabile Referenzen
  const fetchExecutedRef = useRef(false);
  const mountedRef = useRef(true);

  // ✅ RICHTIG: useCallback für stabile Funktionen
  const fetchWalletData = useCallback(async () => {
    // Verhindere multiple Calls
    if (!user || fetchExecutedRef.current || dataLoading) return;
    
    fetchExecutedRef.current = true;
    setDataLoading(true);
    setError(null);

    try {
      logger.info('Dashboard: Fetching wallet data for user:', user.id);
      
      // ✅ RICHTIG: Reale API-Endpoints oder Mock-Daten
      const mockWalletData = {
        balance: '0.00',
        address: 'Not connected',
        transactions: [],
        tokens: []
      };
      
      // Simuliere API-Call mit Delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ✅ RICHTIG: Prüfe ob Component noch mounted ist
      if (mountedRef.current) {
        setWalletData(mockWalletData);
        logger.info('Dashboard: Wallet data loaded successfully');
      }
    } catch (err) {
      logger.error('Dashboard: Error fetching wallet data:', err);
      if (mountedRef.current) {
        setError('Failed to load wallet data');
      }
    } finally {
      if (mountedRef.current) {
        setDataLoading(false);
      }
    }
  }, [user, dataLoading]); // ✅ RICHTIG: Minimal dependencies

  // ✅ RICHTIG: useEffect mit korrekten Dependencies
  useEffect(() => {
    mountedRef.current = true;
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      fetchExecutedRef.current = false;
    };
  }, []);

  // ✅ RICHTIG: Separater Effect für Data Fetching
  useEffect(() => {
    if (user && !authLoading) {
      fetchWalletData();
    }
  }, [user, authLoading, fetchWalletData]);

  // ✅ RICHTIG: Loading State Handling
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
          <p className="text-xl">Loading PulseManager...</p>
        </div>
      </div>
    );
  }

  // ✅ RICHTIG: User Check ohne Navigation
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to access the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold pulse-title mb-2">
          Welcome back, {user.email}!
        </h1>
        <p className="text-muted-foreground">
          Manage your PulseChain assets with ease
        </p>
      </div>

      {/* Premium Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className={`h-6 w-6 ${subscriptionStatus === 'active' ? 'text-yellow-500' : 'text-gray-400'}`} />
            Premium Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionStatus === 'active' ? (
            <div className="flex items-center gap-2 text-green-600">
              <Shield className="h-5 w-5" />
              <span>Premium Active ({daysRemaining} days remaining)</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-red-600">No premium access</p>
              <Button className="w-full">
                Upgrade to Premium
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Wallet Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Loading wallet data...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => {
                fetchExecutedRef.current = false;
                fetchWalletData();
              }}>
                Retry
              </Button>
            </div>
          ) : walletData ? (
            <div className="space-y-2">
              <p><strong>Balance:</strong> {walletData.balance} PLS</p>
              <p><strong>Address:</strong> {walletData.address}</p>
              <p><strong>Transactions:</strong> {walletData.transactions.length}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No wallet data available</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          className="h-20 text-lg"
          disabled={subscriptionStatus !== 'active'}
        >
          <Wallet className="h-6 w-6 mr-2" />
          Connect Wallet
        </Button>
        <Button 
          variant="outline" 
          className="h-20 text-lg"
          disabled={subscriptionStatus !== 'active'}
        >
          View Transactions
        </Button>
      </div>
    </div>
  );
};

export default FixedDashboard; 