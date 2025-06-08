// STUB: WalletConnect deaktiviert für DOM-Stabilität
// REMOVED: Wagmi imports to prevent DOM conflicts

console.log('🔧 WalletConnect STUB - Wagmi deaktiviert für DOM-Stabilität');

// STUB: PulseChain Konfiguration ohne Wagmi
const pulsechainConfig = {
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

// STUB: Wagmi Config ersetzt durch sicheres Objekt
const wagmiConfig = {
  chains: [pulsechainConfig],
  // Alle Wagmi-spezifischen Eigenschaften entfernt
  _isStub: true
}

console.log('🔧 WalletConnect Config ist jetzt ein STUB für DOM-Stabilität');

export { wagmiConfig, pulsechainConfig }
export default wagmiConfig 