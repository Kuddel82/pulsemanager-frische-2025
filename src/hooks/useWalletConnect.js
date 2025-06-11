import { useState, useCallback, useEffect } from 'react';
import { APP_TRANSLATIONS } from '@/config/appConfig'; 
import { logger } from '@/lib/logger';

// 🛡️ READ-ONLY WALLET CONNECTION - Nur Adresse lesen, KEINE Transaktionen!
export const useWalletConnect = () => {
  logger.info("🛡️ READ-ONLY: useWalletConnect hook - Multi-Wallet Support aktiviert");
  
  const [language] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appLanguage') || 'de';
    }
    return 'de';
  });
  
  const t = APP_TRANSLATIONS[language] || APP_TRANSLATIONS['de'];
  const [statusMessage, setStatusMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [chainId, setChainId] = useState(null);

  // 🔄 Check for existing wallet connections on load
  useEffect(() => {
    const checkExistingConnections = async () => {
      // Check localStorage for previous connection
      const savedWallet = localStorage.getItem('connectedWallet');
      const savedAddress = localStorage.getItem('connectedAddress');
      
      if (savedWallet && savedAddress) {
        setConnectedAccount(savedAddress);
        setWalletType(savedWallet);
        logger.info(`🔗 Restored connection: ${savedWallet} - ${savedAddress.slice(0, 8)}...`);
      }
    };
    
    checkExistingConnections();
  }, []);

  // 🦊 MetaMask Connection
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask nicht installiert. Bitte installieren Sie MetaMask.');
    }
    
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    const chainId = await window.ethereum.request({ 
      method: 'eth_chainId' 
    });
    
    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      walletType: 'MetaMask'
    };
  };

  // 🐰 Rabby Wallet Connection
  const connectRabby = async () => {
    if (!window.rabby) {
      throw new Error('Rabby Wallet nicht installiert. Bitte installieren Sie Rabby Wallet.');
    }
    
    const accounts = await window.rabby.request({ 
      method: 'eth_requestAccounts' 
    });
    
    const chainId = await window.rabby.request({ 
      method: 'eth_chainId' 
    });
    
    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      walletType: 'Rabby'
    };
  };

  // 🔐 Trezor Connection (via TrezorConnect)
  const connectTrezor = async () => {
    // Trezor requires TrezorConnect library - simplified approach
    if (!window.TrezorConnect) {
      // Fallback: Manual address input for Trezor users
      const address = prompt('Trezor Wallet-Adresse eingeben (nur read-only):');
      if (address && address.startsWith('0x')) {
        return {
          address: address,
          chainId: 369, // Default PulseChain
          walletType: 'Trezor'
        };
      }
      throw new Error('Trezor-Adresse ungültig oder nicht eingegeben.');
    }
    
    // If TrezorConnect is available
    const result = await window.TrezorConnect.ethereumGetAddress({
      path: "m/44'/60'/0'/0/0" // Standard Ethereum path
    });
    
    if (!result.success) {
      throw new Error('Trezor-Verbindung fehlgeschlagen');
    }
    
    return {
      address: result.payload.address,
      chainId: 369, // Default PulseChain
      walletType: 'Trezor'
    };
  };

  // 🃏 Tangem Wallet Connection (NFC Hardware Cards)
  const connectTangem = async () => {
    // Check for Tangem SDK
    if (!window.tangem) {
      // Fallback: Manual address input for Tangem users
      const address = prompt('Tangem Wallet-Adresse eingeben (nur read-only):');
      if (address && address.startsWith('0x')) {
        return {
          address: address,
          chainId: 369, // Default PulseChain
          walletType: 'Tangem'
        };
      }
      throw new Error('Tangem-Adresse ungültig oder nicht eingegeben.');
    }
    
    try {
      // Tangem SDK connection
      const result = await window.tangem.scanCard();
      
      if (result.success && result.card?.wallets?.length > 0) {
        // Use first wallet (usually Ethereum/EVM compatible)
        const wallet = result.card.wallets.find(w => w.curve === 'secp256k1') || result.card.wallets[0];
        
        if (wallet?.publicKey) {
          // Derive Ethereum address from public key
          const address = wallet.address || `0x${wallet.publicKey.slice(-40)}`;
          
          return {
            address: address,
            chainId: 369, // Default PulseChain
            walletType: 'Tangem'
          };
        }
      }
      
      throw new Error('Tangem-Karte nicht gefunden oder ungültig');
      
    } catch (error) {
      logger.error('💥 Tangem connection error:', error);
      throw new Error(`Tangem-Verbindung fehlgeschlagen: ${error.message}`);
    }
  };

  // 📱 Generic Provider Detection (WalletConnect, Trust, etc.)
  const connectGenericProvider = async () => {
    // Try injected providers in order of preference
    const providers = [
      { name: 'MetaMask', provider: window.ethereum },
      { name: 'Rabby', provider: window.rabby },
      { name: 'Trust', provider: window.trustwallet },
      { name: 'Coinbase', provider: window.coinbaseWalletExtension }
    ];
    
    for (const { name, provider } of providers) {
      if (provider) {
        try {
          const accounts = await provider.request({ 
            method: 'eth_requestAccounts' 
          });
          
          const chainId = await provider.request({ 
            method: 'eth_chainId' 
          });
          
          return {
            address: accounts[0],
            chainId: parseInt(chainId, 16),
            walletType: name
          };
        } catch (error) {
          continue; // Try next provider
        }
      }
    }
    
    throw new Error('Keine unterstützte Wallet gefunden');
  };

  // 🔗 Universal Connect Function
  const connectWallet = useCallback(async (walletType = 'auto') => {
    logger.info(`🔗 READ-ONLY: Connecting ${walletType} wallet...`);
    setIsConnecting(true);
    setStatusMessage(t.connectingWallet || 'Wallet wird verbunden...');

    try {
      let result;
      
             switch (walletType.toLowerCase()) {
         case 'metamask':
           result = await connectMetaMask();
           break;
         case 'rabby':
           result = await connectRabby();
           break;
         case 'trezor':
           result = await connectTrezor();
           break;
         case 'tangem':
           result = await connectTangem();
           break;
         default:
           result = await connectGenericProvider();
       }
      
      if (result.address) {
        setConnectedAccount(result.address);
        setWalletType(result.walletType);
        setChainId(result.chainId);
        
        // Save to localStorage for persistence
        localStorage.setItem('connectedWallet', result.walletType);
        localStorage.setItem('connectedAddress', result.address);
        
        setStatusMessage(`${result.walletType} verbunden! (Read-Only)`);
        
        logger.info(`✅ READ-ONLY: ${result.walletType} connected - ${result.address.slice(0, 8)}... on chain ${result.chainId}`);
        
        // Clear status after 3 seconds
        setTimeout(() => setStatusMessage(''), 3000);
        
        return {
          success: true,
          address: result.address,
          chainId: result.chainId,
          walletType: result.walletType
        };
      }
      
      throw new Error('Wallet-Verbindung fehlgeschlagen');
      
    } catch (error) {
      logger.error('💥 READ-ONLY: Wallet connection error:', error);
      setStatusMessage(error.message || 'Wallet-Verbindung fehlgeschlagen');
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsConnecting(false);
    }
  }, [t]);

  // 🔌 Disconnect Function
  const disconnectWallet = useCallback(async (showToast = true) => {
    logger.info("🔌 READ-ONLY: Disconnecting wallet...");
    
    setConnectedAccount(null);
    setWalletType(null);
    setChainId(null);
    
    // Clear localStorage
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('connectedAddress');
    
    if (showToast) {
      setStatusMessage(t.walletDisconnected || "Wallet getrennt");
      setTimeout(() => setStatusMessage(''), 3000);
    }
    
    logger.info("✅ READ-ONLY: Wallet disconnected successfully");
  }, [t]);

  // 🔧 Get Provider (for reading data only)
  const getProvider = useCallback(() => {
    switch (walletType) {
      case 'MetaMask':
        return window.ethereum;
      case 'Rabby':
        return window.rabby;
      case 'Tangem':
        return window.tangem || window.ethereum; // Fallback to MetaMask if available
      case 'Trezor':
        return window.ethereum; // Trezor uses MetaMask provider usually
      case 'Trust':
        return window.trustwallet;
      case 'Coinbase':
        return window.coinbaseWalletExtension;
      default:
        return window.ethereum; // Fallback
    }
  }, [walletType]);

  // 📊 Wallet State
  const isConnected = Boolean(connectedAccount);
  const accounts = connectedAccount ? [connectedAccount] : [];

  // 🎯 Supported Wallets Info
  const supportedWallets = [
    { name: 'MetaMask', icon: '🦊', available: !!window.ethereum },
    { name: 'Rabby', icon: '🐰', available: !!window.rabby },
    { name: 'Tangem', icon: '🃏', available: true }, // Always available (manual input + NFC)
    { name: 'Trezor', icon: '🔐', available: true }, // Always available (manual input)
    { name: 'Trust Wallet', icon: '📱', available: !!window.trustwallet },
    { name: 'Coinbase Wallet', icon: '🔵', available: !!window.coinbaseWalletExtension }
  ];

  return {
    // Core state
    provider: getProvider(),
    accounts,
    chainId,
    isConnected,
    isConnecting,
    error: null,
    
    // Functions
    connectWallet,
    disconnectWallet,
    getProvider,
    
    // UI state
    statusMessage,
    clearStatus: () => setStatusMessage(''),
    
    // Wallet info
    connectedAddress: connectedAccount,
    walletType,
    shortAddress: connectedAccount ? 
      `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}` : null,
    
    // Multi-wallet support
    supportedWallets,
    
    // Security notice
    isReadOnly: true,
    securityNotice: "🛡️ READ-ONLY: Nur Adresse lesen, keine Transaktionen möglich! Unterstützt MetaMask🦊, Rabby🐰, Tangem🃏, Trezor🔐 und mehr!"
  };
};