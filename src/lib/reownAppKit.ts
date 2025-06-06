import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { createConfig } from 'wagmi'
import { pulsechain } from 'viem/chains'

// PulseChain Konfiguration
const pulsechainConfig = {
  id: 369,
  name: 'PulseChain',
  network: 'pulsechain',
  nativeCurrency: {
    name: 'Pulse',
    symbol: 'PLS',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.pulsechain.com']
    },
    public: {
      http: ['https://rpc.pulsechain.com']
    }
  },
  blockExplorers: {
    default: {
      name: 'PulseScan',
      url: 'https://scan.pulsechain.com'
    }
  },
  testnet: false
}

declare global {
  interface ImportMeta {
    env: {
      VITE_WALLETCONNECT_PROJECT_ID: string
      VITE_APP_NAME: string
      VITE_APP_URL: string
    }
  }
}

// WalletConnect Konfiguration
const projectId = '4d25dbd7b101943c49d3cef3f42ee776'

// Wagmi Adapter Konfiguration
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [pulsechainConfig],
  metadata: {
    name: 'PulseManager',
    description: 'PulseChain Portfolio Manager',
    url: 'https://www.pulsemanager.vip',
    icons: ['https://www.pulsemanager.vip/icon.png']
  },
  options: {
    qrModal: {
      themeMode: 'dark'
    },
    analytics: {
      disabled: true
    },
    walletConnect: {
      showQrModal: true,
      projectId
    },
    defaultChain: pulsechainConfig,
    defaultWallet: 'metaMask',
    allWallets: 'SHOW',
    includeWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efacf2c6e7da3a55d7', // Rabby
      'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // WalletConnect
    ],
    enableNetworkView: true,
    enableAccountView: true,
    enableExplorer: true
  }
})

// AppKit Modal erstellen
export const modal = createAppKit({
  adapter: wagmiAdapter,
  theme: {
    variables: {
      '--w3m-font-family': 'Inter, system-ui, sans-serif',
      '--w3m-accent-color': '#00ff00',
      '--w3m-background-color': '#1a1a1a',
      '--w3m-text-color': '#ffffff',
      '--w3m-button-border-radius': '8px',
      '--w3m-button-height': '48px'
    }
  }
}) 