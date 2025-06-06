
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[425px] bg-background/90 backdrop-blur-md border-primary/30 shadow-2xl rounded-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader className="mb-4">
                <div className="flex items-center justify-center mb-4">
                  <Lock className="h-12 w-12 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-bold text-center gradient-text">
                  {getTranslation('subscriptionModalTitle', defaultTranslations.subscriptionModalTitle)}
                </DialogTitle>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </DialogHeader>
              <DialogDescription className="text-center text-foreground/80 space-y-3 mb-6">
                <p>{getTranslation('subscriptionModalText1', defaultTranslations.subscriptionModalText1)}</p>
                <p>{getTranslation('subscriptionModalText2', defaultTranslations.subscriptionModalText2)}</p>
                <p className="text-sm text-muted-foreground">
                  {getTranslation('subscriptionModalText3', defaultTranslations.subscriptionModalText3)}
                </p>
              </DialogDescription>
              <DialogFooter>
                <Button 
                  onClick={onSubscribe} 
                  className="w-full text-lg py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                >
                  {getTranslation('subscribeButton', defaultTranslations.subscribeButton)}
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;
