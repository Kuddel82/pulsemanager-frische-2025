import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { walletService } from '../lib/walletService';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ui/use-toast';
import { logger } from '../lib/logger';

export function useWalletData(walletAddress) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [walletData, setWalletData] = useState({
    balances: [],
    transactions: [],
    lastUpdate: null
  });

  // Use useRef to store the latest values without causing re-renders
  const latestValues = useRef({ walletAddress, user, showToast });
  latestValues.current = { walletAddress, user, showToast };

  const fetchWalletData = useCallback(async () => {
    const { walletAddress: currentAddress, user: currentUser, showToast: currentShowToast } = latestValues.current;
    
    if (!currentAddress || !currentUser) return;

    try {
      setIsLoading(true);
      logger.info('Fetching wallet data for address:', currentAddress);

      // Parallele API-Aufrufe für bessere Performance
      const [balances, transactions] = await Promise.all([
        walletService.getAllTokenBalances(currentAddress),
        walletService.getWalletTransactions(currentAddress)
      ]);

      const newData = {
        balances,
        transactions,
        lastUpdate: new Date().toISOString()
      };

      setWalletData(newData);

      // Speichere Daten in Supabase für Premium-Nutzer
      if (currentUser.is_premium) {
        try {
          const { error } = await supabase
            .from('wallet_data')
            .upsert({
              user_id: currentUser.id,
              wallet_address: currentAddress,
              balances: balances,
              transactions: transactions,
              last_update: new Date().toISOString()
            });

          if (error) {
            logger.error('Error saving wallet data to Supabase:', error);
            currentShowToast('Fehler beim Speichern der Wallet-Daten', 'error');
          }
        } catch (supabaseError) {
          logger.error('Supabase upsert error:', supabaseError);
        }
      }

      return newData;
    } catch (error) {
      logger.error('Error fetching wallet data:', error);
      latestValues.current.showToast('Fehler beim Laden der Wallet-Daten', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array - stable reference

  // Automatische Aktualisierung alle 5 Minuten - FIXED: Remove fetchWalletData from dependencies
  useEffect(() => {
    if (!walletAddress || !user) return;

    // Initial load
    fetchWalletData();

    // Set up interval
    const interval = setInterval(() => {
      fetchWalletData();
    }, 5 * 60 * 1000); // 5 Minuten

    return () => clearInterval(interval);
  }, [walletAddress, user?.id]); // Removed fetchWalletData, use user.id instead of user object

  // Lade historische Daten für Premium-Nutzer - FIXED: Separate effect
  useEffect(() => {
    const loadHistoricalData = async () => {
      if (!walletAddress || !user?.is_premium) return;

      try {
        const { data, error } = await supabase
          .from('wallet_data')
          .select('*')
          .eq('user_id', user.id)
          .eq('wallet_address', walletAddress)
          .single();

        if (error) {
          // Don't log error if no data exists yet
          if (error.code !== 'PGRST116') {
            logger.error('Error loading historical wallet data:', error);
          }
          return;
        }

        if (data && data.last_update) {
          // Only load if data is not too old (less than 1 hour)
          const lastUpdate = new Date(data.last_update);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (lastUpdate > oneHourAgo) {
            setWalletData({
              balances: data.balances || [],
              transactions: data.transactions || [],
              lastUpdate: data.last_update
            });
          }
        }
      } catch (error) {
        logger.error('Error in loadHistoricalData:', error);
      }
    };

    loadHistoricalData();
  }, [walletAddress, user?.id, user?.is_premium]); // Use primitive values instead of objects

  return {
    walletData,
    isLoading,
    refreshData: fetchWalletData
  };
} 