
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Mail, Send, X } from 'lucide-react';
import { FEEDBACK_EMAIL_ADDRESS } from '@/config/appConfig';

const FeedbackModal = ({ isOpen, onClose }) => {
  const { t } = useAppContext();

  const handleSendEmail = () => {
    window.location.href = `mailto:${FEEDBACK_EMAIL_ADDRESS}?subject=${encodeURIComponent(t.emailSubjectDefault || 'Feedback for PulseManager')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 pulse-card p-6 border border-green-400/20 shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Mail className="h-6 w-6 text-green-400" />
            <h2 className="text-2xl font-semibold pulse-text-gradient">
              {t.contactUs || "Contact Us"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>
          <p className="pulse-text-secondary">
            {t.contactUsDescription || "Have questions or feedback? Send us an email!"}
          </p>
        </div>
        
        {/* Content */}
        <div className="my-6 p-4 bg-white/5 rounded-lg text-center">
          <p className="text-sm pulse-text mb-1">{t.sendEmailTo || "You can reach us at:"}</p>
          <a 
            href={`mailto:${FEEDBACK_EMAIL_ADDRESS}`} 
            className="text-lg font-medium text-green-400 hover:underline"
          >
            {FEEDBACK_EMAIL_ADDRESS}
          </a>
        </div>

        {/* Footer */}
        <div className="flex gap-2">
          <button 
            onClick={onClose} 
            className="flex-1 py-2 px-4 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            {t.closeButton || "Close"}
          </button>
          <button 
            onClick={handleSendEmail}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            {t.sendEmailButton || "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
