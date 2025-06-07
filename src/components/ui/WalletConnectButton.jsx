// TEMPORARY STUB: Wagmi hooks disabled for DOM conflict testing  
// import { useConnect, useDisconnect, useAccount } from 'wagmi'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Wallet, LogOut, CheckCircle } from 'lucide-react'

// STUB: Wagmi hooks ersetzt durch statische Daten
const stubWalletData = {
  connectors: [],
  connect: () => console.log('STUB: connect disabled'),
  isPending: false,
  address: null,
  isConnected: false,
  disconnect: () => console.log('STUB: disconnect disabled')
};

const WalletConnectButton = () => {
  console.log('🔧 WalletConnectButton mit STUB Wagmi hooks - DOM-Stabilität Test');
  
  // STUB: Ersetzt echte Wagmi hooks
  const { connectors, connect, isPending } = stubWalletData;
  const { disconnect } = stubWalletData;
  const { address, isConnected } = stubWalletData;

  const [isOpen, setIsOpen] = useState(false)

  const handleConnect = (connector) => {
    connect({ connector })
    setIsOpen(false)
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {formatAddress(address)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
      >
        <Wallet className="h-4 w-4 mr-2" />
        Wallet verbinden
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet verbinden
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {connectors.map((connector) => (
              <Card key={connector.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleConnect(connector)}
                    disabled={isPending}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{connector.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {connector.id === 'metaMask' ? 'Browser Extension' : 'Mobile App'}
                        </div>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              🔒 Sichere Verbindung ohne externe API-Calls
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default WalletConnectButton 