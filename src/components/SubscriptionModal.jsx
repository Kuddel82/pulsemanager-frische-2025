
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const SubscriptionModal = ({ isOpen, onClose, onSubscribe }) => {
  const { t } = useAppContext();

  if (!isOpen) return null;

  const defaultTranslations = {
    subscriptionModalTitle: "Unlock Full Access!",
    subscriptionModalText1: "Your free trial has ended or you're trying to access a premium feature.",
    subscriptionModalText2: "Subscribe now to continue enjoying all PulseManager features, including advanced analytics, ROI tracking, tax reports, and more.",
    subscriptionModalText3: "Support the development and get the best tools for your PulseChain journey!",
    subscribeButton: "Subscribe Now"
  };

  const getTranslation = (key, fallback) => {
    return t?.[key] || fallback;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 pulse-card p-6 border border-green-400/20 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <Lock className="h-12 w-12 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-center pulse-text-gradient mb-2">
                  {getTranslation('subscriptionModalTitle', defaultTranslations.subscriptionModalTitle)}
                </h2>
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
              </div>
              
              {/* Content */}
              <div className="text-center space-y-3 mb-6">
                <p className="pulse-text">{getTranslation('subscriptionModalText1', defaultTranslations.subscriptionModalText1)}</p>
                <p className="pulse-text">{getTranslation('subscriptionModalText2', defaultTranslations.subscriptionModalText2)}</p>
                <p className="text-sm pulse-text-secondary">
                  {getTranslation('subscriptionModalText3', defaultTranslations.subscriptionModalText3)}
                </p>
              </div>
              
              {/* Footer */}
              <div>
                <button 
                  onClick={onSubscribe} 
                  className="w-full py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-bold rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all duration-200 text-lg"
                >
                  {getTranslation('subscribeButton', defaultTranslations.subscribeButton)}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;
