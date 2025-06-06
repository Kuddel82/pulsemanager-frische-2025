
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppContext } from '@/contexts/AppContext';
import { Mail, Send } from 'lucide-react';
import { FEEDBACK_EMAIL_ADDRESS } from '@/config/appConfig';

const FeedbackModal = ({ isOpen, onClose }) => {
  const { t } = useAppContext();

  const handleSendEmail = () => {
    window.location.href = `mailto:${FEEDBACK_EMAIL_ADDRESS}?subject=${encodeURIComponent(t.emailSubjectDefault || 'Feedback for PulseManager')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-gradient-to-br from-background via-slate-50 dark:via-slate-900 to-background border-border/20 shadow-2xl rounded-xl">
        <DialogHeader>
          <div className="flex items-center space-x-2 mb-3">
            <Mail className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl font-semibold gradient-text">
              {t.contactUs || "Contact Us"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {t.contactUsDescription || "Have questions or feedback? Send us an email!"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-6 p-4 bg-muted/50 dark:bg-muted/20 rounded-lg text-center">
          <p className="text-sm text-foreground mb-1">{t.sendEmailTo || "You can reach us at:"}</p>
          <a 
            href={`mailto:${FEEDBACK_EMAIL_ADDRESS}`} 
            className="text-lg font-medium text-primary hover:underline"
          >
            {FEEDBACK_EMAIL_ADDRESS}
          </a>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} className="mr-2">
            {t.closeButton || "Close"}
          </Button>
          <Button 
            onClick={handleSendEmail}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <Send className="mr-2 h-4 w-4" />
            {t.sendEmailButton || "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
