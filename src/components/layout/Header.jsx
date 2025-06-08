import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Menu, X, Wallet, Bell, LogOut, UserCircle, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { 
    theme, 
    toggleTheme, 
    isSidebarOpen, 
    setIsSidebarOpen, 
    toggleSidebar, 
    t,
    language,
    setLanguage,
    wcConnectWallet: handleWalletConnect, 
    wcDisconnectWallet: handleWalletDisconnect,
    wcAccounts, 
    wcIsConnected, 
    wcIsConnecting: isWalletConnecting, 
    setShowFeedbackModal,
    user, 
    signOut: handleLogout // Corrected: use signOut from AppContext
  } = useAppContext();

  const userLogoUrl = "/photo_2025-06-03_09-55-04.jpg";
  const connectedWalletAddress = wcAccounts && wcAccounts.length > 0 ? wcAccounts[0] : null;
  const navigate = useNavigate();

  const onWalletConnectClick = () => {
    if (connectedWalletAddress) {
      handleWalletDisconnect();
    } else {
      handleWalletConnect();
    }
  };

  const getWalletButtonText = () => {
    if (isWalletConnecting) {
      return t?.connectingWallet || "Wallet wird verbunden...";
    }
    if (connectedWalletAddress) {
      return `${t?.disconnectWallet || "Wallet trennen"} (${connectedWalletAddress.substring(0, 6)}...${connectedWalletAddress.substring(connectedWalletAddress.length - 4)})`;
    }
    return t?.connectWallet || "Wallet verbinden";
  };

  const handleMenuButtonClick = () => {
    if (setIsSidebarOpen) {
      setIsSidebarOpen(!isSidebarOpen);
    } else if (toggleSidebar) {
      toggleSidebar();
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 50, delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 bg-background/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg"
    >
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMenuButtonClick}
          className="mr-2 md:hidden text-foreground hover:text-primary transition-colors"
          aria-label={isSidebarOpen ? (t?.closeSidebar || "Close sidebar") : (t?.openSidebar || "Open sidebar")}
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <div className="flex items-center">
          <img src={userLogoUrl} alt={t?.logoAlt || "PulseManager Logo"} className="h-8 w-auto mr-2 hidden sm:block filter dark:brightness-0 dark:invert-[0.8]" />
          <h1 className="text-xl sm:text-2xl font-bold pulse-title hidden sm:block">{t?.appTitle || "PulseManager"}</h1>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {user && ( 
          <Button 
            onClick={onWalletConnectClick} 
            variant="default" 
            size="sm" 
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            disabled={isWalletConnecting}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {getWalletButtonText()}
          </Button>
        )}

        {!user && (
          <Button
            onClick={() => navigate('/auth')}
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            {t?.loginRegister || 'Login / Registrieren'}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground hover:text-primary transition-colors" aria-label={t?.changeLanguage || "Change language"}>
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glassmorphic-dropdown">
            <DropdownMenuLabel>{t?.selectLanguage || "Select Language"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={language} onValueChange={setLanguage}>
              <DropdownMenuRadioItem value="de">{t?.languageGerman || "Deutsch"}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="en">{t?.languageEnglish || "English"}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme} 
          className="text-foreground hover:text-primary transition-colors"
          aria-label={theme === 'dark' ? (t?.switchToLightMode || "Switch to light mode") : (t?.switchToDarkMode || "Switch to dark mode")}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {user && ( 
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:text-primary transition-colors">
                  <Bell className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 glassmorphic-dropdown">
                <DropdownMenuLabel>{t?.notifications || "Notifications"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-blue-500" />
                  <span>{t?.notificationWelcome || "Welcome to PulseManager!"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center">
                  <Wallet className="mr-2 h-4 w-4 text-green-500" />
                  <span>{wcIsConnected ? (t?.notificationWalletConnected || "Wallet is connected.") : (t?.notificationWalletTip || "Connect your wallet to get started.")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:text-primary transition-colors">
                  <UserCircle className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glassmorphic-dropdown">
                <DropdownMenuLabel>{user.email || (t?.myAccount || "My Account")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => alert(t?.featureComingSoon || "Feature coming soon!")}>
                  {t?.profile || "Profile"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowFeedbackModal(true)}> 
                  <Mail className="mr-2 h-4 w-4" />
                  {t?.contactUs || "Contact Us"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t?.logout || "Logout"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </motion.header>
  );
};

export default Header;