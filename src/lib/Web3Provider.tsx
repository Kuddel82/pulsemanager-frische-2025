// TEMPORARY STUB: React Query disabled for DOM conflict testing
// import { WagmiProvider } from 'wagmi'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { wagmiConfig } from './walletConnect.js'
import React from 'react'

// STUB: Ersetzt Web3Provider durch einfachen Wrapper
export function Web3Provider({ children }: { children: React.ReactNode }) {
  console.log('🔧 Web3Provider STUB - React Query und Wagmi deaktiviert für DOM-Stabilität');
  
  return (
    <div data-web3-stub="true">
      {children}
    </div>
  )
} 