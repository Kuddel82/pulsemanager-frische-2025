import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '@/components/layout/Footer';
import { AppProvider, useAppContext } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import FeedbackModal from '@/components/FeedbackModal';
import { logger } from '@/lib/logger';

const MinimalLayout = () => {
  const LayoutContent = () => {
    const { theme, isFeedbackModalOpen, setIsFeedbackModalOpen } = useAppContext();
    logger.info(`MinimalLayout rendered. Theme: ${theme}`);
    
    return (
      <div className={cn("flex flex-col min-h-screen bg-gradient-to-br",
        theme === 'dark' ? 'from-slate-900 to-slate-800 text-slate-100' 
                        : 'from-slate-100 to-gray-200 text-slate-800'
      )}>
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8" role="main">
          <Suspense fallback={<PageLoader />}>
             <Outlet />
          </Suspense>
        </main>
        <Footer />
        {isFeedbackModalOpen && <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />}
      </div>
    );
  };

  return (
    <AuthProvider>
      <AppProvider>
        <LayoutContent />
      </AppProvider>
    </AuthProvider>
  );
};

const Suspense = ({ fallback, children }) => {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient ? <React.Suspense fallback={fallback}>{children}</React.Suspense> : fallback;
}

const PageLoader = () => {
  const { t } = useAppContext();
  const safeT = (key, fallback) => (typeof t === 'function' ? t(key) || fallback : fallback);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-md font-medium text-primary">{safeT('common.loadingPage', 'Loading page...')}</p>
      </div>
    </div>
  )
}

export default MinimalLayout;