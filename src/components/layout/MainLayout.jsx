import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import FeedbackModal from '@/components/FeedbackModal';
import { logger } from '@/lib/logger';

const MainLayout = () => {
  const LayoutContent = () => {
    const { isSidebarOpen, theme, isFeedbackModalOpen, setIsFeedbackModalOpen } = useAppContext();
    logger.info(`MainLayout rendered. Sidebar open: ${isSidebarOpen}, Theme: ${theme}`);

    return (
      <div className={cn("flex flex-col min-h-screen bg-gradient-to-br", 
        theme === 'dark' ? 'from-slate-900 to-slate-800 text-slate-100' 
                        : 'from-slate-100 to-gray-200 text-slate-800'
      )}>
        <Header />
        <div className="flex flex-1 pt-16"> {/* Adjust pt-16 based on actual Header height */}
          <Sidebar />
          <main 
            className={cn(
              "flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 ease-in-out overflow-y-auto",
              isSidebarOpen ? "md:ml-64" : "md:ml-16" 
            )}
            id="main-content"
            role="main"
          >
            <Suspense fallback={<FullPageLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
        <Footer />
        {isFeedbackModalOpen && <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />}
      </div>
    );
  };

  return <LayoutContent />;
};

const Suspense = ({ fallback, children }) => {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient ? <React.Suspense fallback={fallback}>{children}</React.Suspense> : fallback;
}

const FullPageLoader = () => {
  const { t } = useAppContext();
  const safeT = (key, fallback) => (typeof t === 'function' ? t(key) || fallback : fallback);
  
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <svg className="animate-spin h-12 w-12 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-semibold text-primary">{safeT('common.loading', 'Loading...')}</p>
      </div>
    </div>
  );
};

export default MainLayout;