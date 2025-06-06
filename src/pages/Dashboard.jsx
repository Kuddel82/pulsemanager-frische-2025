import React from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { LogOut, Wallet, BookOpen, Calculator, CreditCard, Info } from 'lucide-react';
import WalletView from '@/components/views/WalletView';
import AcademyView from '@/components/views/AcademyView';
import TaxReportView from '@/components/views/TaxReportView';
import SubscriptionView from '@/components/subscription/SubscriptionView';
import PulseChainInfoView from '@/components/views/PulseChainInfoView';
import { logger } from '@/lib/logger';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Abgemeldet",
        description: "Sie wurden erfolgreich abgemeldet.",
        variant: "success"
      });
      navigate('/login');
    } catch (error) {
      logger.error('Logout error:', error);
      toast({
        title: "Fehler",
        description: "Abmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    }
  };

  const navigation = [
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Akademie', href: '/dashboard/academy', icon: BookOpen },
    { name: 'Steuerbericht', href: '/dashboard/tax', icon: Calculator },
    { name: 'Abonnement', href: '/dashboard/subscription', icon: CreditCard },
    { name: 'PulseChain', href: '/dashboard/pulsechain', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PulseManager</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 dark:text-gray-300">{user?.email}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white dark:bg-gray-800 shadow h-screen">
          <div className="px-4 py-6">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/wallet" element={<WalletView />} />
            <Route path="/academy" element={<AcademyView />} />
            <Route path="/tax" element={<TaxReportView />} />
            <Route path="/subscription" element={<SubscriptionView />} />
            <Route path="/pulsechain" element={<PulseChainInfoView />} />
            <Route path="/" element={<Navigate to="/dashboard/wallet" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 