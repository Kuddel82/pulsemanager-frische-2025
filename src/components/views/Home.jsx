import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Wallet, LogOut } from 'lucide-react';
import { logger } from '@/lib/logger';

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { t, language, subscriptionStatus } = useAppContext();

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

  const premiumUntilDate = user?.premium_until 
    ? new Date(user.premium_until).toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' })
    : safeT('home.premiumNotActive', 'Not active');

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 min-h-screen text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-12 p-6 bg-white dark:bg-slate-850/50 shadow-xl rounded-xl border border-slate-200 dark:border-slate-700/50">
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-4 sm:mb-0">
          {safeT('home.welcome', 'Welcome')}, <span className="font-mono">{user?.email || safeT('home.guest', 'Guest')}</span>
        </h1>
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          className="group text-slate-600 dark:text-slate-300 hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 rounded-lg px-6 py-3"
        >
          <LogOut className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
          {safeT('home.logoutButton', 'Logout')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-white dark:bg-slate-850/50 shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-xl border border-slate-200 dark:border-slate-700/50 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-700 dark:text-slate-100">
              <Crown className="h-7 w-7 text-yellow-500 dark:text-yellow-400" />
              {safeT('home.premiumStatusTitle', 'Premium Status')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {subscriptionStatus === 'active' ? (
              <p className="text-lg text-green-600 dark:text-green-400 font-medium flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2" /> {safeT('home.premiumActive', 'Premium Active until:')} {premiumUntilDate}
              </p>
            ) : (
              <p className="text-lg text-red-600 dark:text-red-400 font-medium flex items-center">
                 <XCircleIcon className="h-5 w-5 mr-2" /> {safeT('home.premiumNotActiveFull', 'No Premium access.')}
              </p>
            )}
             {subscriptionStatus !== 'active' && (
                <Button 
                    onClick={() => navigate('/subscription')} 
                    className="mt-4 w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                    {safeT('home.upgradeToPremium', 'Upgrade to Premium')}
                </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-850/50 shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-xl border border-slate-200 dark:border-slate-700/50 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-700 dark:text-slate-100">
              <Wallet className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              {safeT('home.walletTitle', 'Wallet Access')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {subscriptionStatus === 'active' ? (
              <>
                <p className="text-slate-600 dark:text-slate-300 mb-4">{safeT('home.walletAccessGranted', 'Your premium access grants you entry to the wallet features.')}</p>
                <Button 
                  onClick={() => navigate('/wallet')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {safeT('home.openWalletButton', 'Open Wallet')}
                </Button>
              </>
            ) : (
              <p className="text-red-600 dark:text-red-400 text-lg font-medium">
                {safeT('home.walletPremiumRequired', 'Premium required for Wallet access.')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Example of using other app context features */}
      <div className="mt-12 p-6 bg-white dark:bg-slate-850/50 shadow-xl rounded-xl border border-slate-200 dark:border-slate-700/50">
        <h2 className="text-2xl font-semibold mb-4 gradient-text">{safeT('home.appContextFeaturesTitle', 'App Context Features')}</h2>
        <p className="text-slate-600 dark:text-slate-300">{safeT('home.currentLanguage', 'Current Language:')} <span className="font-semibold text-primary dark:text-primary-light">{language}</span></p>
        {/* Add more examples as needed */}
      </div>

    </div>
  );
};

// Helper components for icons, if not already globally available or to ensure styling consistency
const ShieldCheckIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const XCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

export { Home };
export default Home;