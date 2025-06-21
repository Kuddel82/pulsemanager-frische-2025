import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { Crown } from 'lucide-react';
import { logger } from '@/lib/logger';
import WalletReader from '@/components/WalletReader';
import WalletManualInput from '@/components/WalletManualInput';
import PrivacyPolicyView from './PrivacyPolicyView';
import TermsOfServiceView from './TermsOfServiceView';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  FileText, 
  Calculator, 
  Info, 
  ExternalLink,
  Shield,
  Scale
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { t, language } = useAppContext();
  
  // 🔥 DIREKTE PREMIUM-ERKENNUNG OHNE PROVIDER
  const [isPremium, setIsPremium] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  
  useEffect(() => {
    if (user?.email === 'dkuddel@web.de' || user?.email === 'phi_bel@yahoo.de') {
      console.log('🌟 DIRECT PREMIUM DETECTION:', user.email);
      setIsPremium(true);
    } else {
      setIsPremium(false);
    }
  }, [user]);
  
  const getAccessMessage = () => {
    if (isPremium) {
      return '🎯 Premium-Zugang: Alle Features verfügbar';
    }
    return '⚡ Basic-Zugang: Basis-Features verfügbar';
  };

  const safeT = (key, fallback) => {
    if (typeof t === 'function') {
      return t(key) || fallback;
    }
    return fallback;
  };
  
  const handleLogout = async () => {
    logger.info('Home: Attempting logout.');
    try {
      await signOut();
      logger.info('Home: Logout successful, navigating to /auth.');
      navigate('/auth');
    } catch (error) {
      logger.error('Home: Error during logout:', error);
      
    }
  };

  // ESC-Taste-Funktionalität für Modals
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsPrivacyModalOpen(false);
        setIsTermsModalOpen(false);
      }
    };

    if (isPrivacyModalOpen || isTermsModalOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Verhindere Scroll auf dem Hintergrund
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isPrivacyModalOpen, isTermsModalOpen]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
        <div className="animate-pulse text-center">
          <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-2xl font-semibold">
            {safeT('common.loadingApp', 'Loading Application...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pulse-text">
      {/* 🎯 PulseChain Welcome Header */}
      <div className="pulse-card p-8 mb-8" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="pulse-title mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'PulseChainer'}
            </h1>
            <p className="pulse-subtitle">
              Ready to track your PulseChain portfolio? 🚀
            </p>
            <div className="pulse-community-badge mt-4">
              🔥 Community Member
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm pulse-text-secondary">Status</div>
              <div className={`font-semibold ${isPremium ? 'text-green-400' : 'text-yellow-400'}`}>
                {isPremium ? '✅ Premium' : '⚡ Basic'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔌 WalletReader - DOM-sichere Wallet-Verbindung */}
      <div className="mb-8">
        <WalletReader />
      </div>

      {/* 📝 Manual Wallet Input - Tangem/Mobile Support */}
      <div className="mb-8">
        <WalletManualInput />
      </div>

      {/* 📋 RECHTLICHE HINWEISE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Datenschutzbestimmungen */}
        <div className="pulse-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded flex items-center justify-center text-white font-bold text-sm">
              DS
            </div>
            <h2 className="text-xl font-bold pulse-text">Datenschutzbestimmungen</h2>
          </div>
          
          <p className="pulse-text-secondary mb-4">
            DSGVO-konforme Datenschutzerklärung für PulseManager
          </p>
          
          <button 
            onClick={() => setIsPrivacyModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            📄 Datenschutz lesen
          </button>
        </div>

        {/* AGBs */}
        <div className="pulse-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded flex items-center justify-center text-white font-bold text-sm">
              AG
            </div>
            <h2 className="text-xl font-bold pulse-text">Allgemeine Geschäftsbedingungen</h2>
          </div>
          
          <p className="pulse-text-secondary mb-4">
            Nutzungsbedingungen und rechtliche Hinweise
          </p>
          
          <button 
            onClick={() => setIsTermsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            📋 AGBs lesen
          </button>
        </div>
        
      </div>

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsPrivacyModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-lg shadow-2xl border border-white/10">
              <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-purple-900 px-6 py-4 rounded-t-lg border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-blue-400" />
                    <h2 className="text-2xl font-bold text-white">Datenschutzbestimmungen</h2>
                  </div>
                  <button 
                    onClick={() => setIsPrivacyModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-2xl text-gray-400 hover:text-white">×</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <PrivacyPolicyView />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {isTermsModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsTermsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-lg shadow-2xl border border-white/10">
              <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-purple-900 px-6 py-4 rounded-t-lg border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scale className="h-6 w-6 text-green-400" />
                    <h2 className="text-2xl font-bold text-white">Allgemeine Geschäftsbedingungen</h2>
                  </div>
                  <button 
                    onClick={() => setIsTermsModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-2xl text-gray-400 hover:text-white">×</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <TermsOfServiceView />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
  
export { Home };
export default Home;