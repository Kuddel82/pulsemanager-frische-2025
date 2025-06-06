import { createConfig, http } from 'wagmi'
import { pulsechain } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// WalletConnect Projekt-ID (32 Zeichen)
const projectId = 'c1b926ad641917ed9cfa52d3dfbd1a68'

// PulseChain Konfiguration
const pulsechainConfig = {
  ...pulsechain,
  id: 369,
  name: 'PulseChain',
  nativeCurrency: {
    name: 'Pulse',
    symbol: 'PLS',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.pulsechain.com'] },
    public: { http: ['https://rpc.pulsechain.com'] },
  },
  blockExplorers: {
    default: { name: 'PulseScan', url: 'https://scan.pulsechain.com' },
  },
}

// Sichere Wagmi Konfiguration - OHNE Web3Modal
const wagmiConfig = createConfig({
  chains: [pulsechainConfig],
  connectors: [
    injected({
      target: {
        id: 'metaMask',
        name: 'MetaMask',
        provider: window?.ethereum,
      },
    }),
    walletConnect({
      projectId,
      metadata: {
        name: 'PulseManager',
        description: 'PulseChain Wallet Manager',
        url: 'https://www.pulsemanager.vip',
        icons: ['https://www.pulsemanager.vip/icon.png']
      },
      showQrModal: false, // Verhindert API-Calls
    }),
  ],
  transports: {
    [pulsechainConfig.id]: http('https://rpc.pulsechain.com'),
  },
})

// KEINE Web3Modal - verhindert alle problematischen API-Calls
// Eigene sichere Wallet-UI kommt später

export { wagmiConfig, pulsechainConfig }
export default wagmiConfig 