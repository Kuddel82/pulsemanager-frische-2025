// 🌐 MULTI-CHAIN WALLET SERVICE
// Verwendet Tangem Wallet-Adressen für beide Chains (PulseChain + Ethereum)

export class MultiChainWalletService {
  
  /**
   * 🔄 Erweitert Wallet-Liste um Multi-Chain Support
   * Tangem-Wallets funktionieren auf beiden Chains mit derselben Adresse
   */
  static expandWalletsForMultiChain(wallets) {
    const expandedWallets = [...wallets];
    
    // Für jede PulseChain-Wallet, füge auch Ethereum-Version hinzu
    wallets.forEach(wallet => {
      if (wallet.chain === 'pulsechain' || wallet.chain_id === 369) {
        // Prüfe ob Ethereum-Version bereits existiert
        const ethVersionExists = wallets.some(w => 
          w.address.toLowerCase() === wallet.address.toLowerCase() && 
          (w.chain === 'ethereum' || w.chain_id === 1)
        );
        
        if (!ethVersionExists) {
          console.log(`🔄 Adding Ethereum version of wallet: ${wallet.address.slice(0, 8)}...`);
          
          expandedWallets.push({
            ...wallet,
            id: `${wallet.id}_eth`, // Unique ID
            chain: 'ethereum',
            chain_id: 1,
            nickname: `${wallet.nickname} (ETH)`,
            isVirtualExpansion: true, // Mark as virtual
            originalWallet: wallet.id
          });
        }
      }
    });
    
    return expandedWallets;
  }
  
  /**
   * 🎯 Findet beste Wallet für DeFi-Tests
   * Bevorzugt echte Ethereum-Wallets, fallback auf erweiterte PulseChain-Wallets
   */
  static findBestWalletForDeFi(wallets) {
    const expanded = this.expandWalletsForMultiChain(wallets);
    
    // 1. Echte Ethereum-Wallet
    let ethWallet = expanded.find(w => 
      (w.chain === 'ethereum' || w.chain_id === 1) && !w.isVirtualExpansion
    );
    
    if (ethWallet) {
      console.log(`✅ Using real Ethereum wallet: ${ethWallet.address.slice(0, 8)}...`);
      return { wallet: ethWallet, isVirtual: false };
    }
    
    // 2. Erweiterte PulseChain-Wallet (als Ethereum getestet)
    ethWallet = expanded.find(w => 
      (w.chain === 'ethereum' || w.chain_id === 1) && w.isVirtualExpansion
    );
    
    if (ethWallet) {
      console.log(`🔄 Using PulseChain wallet as Ethereum: ${ethWallet.address.slice(0, 8)}...`);
      return { wallet: ethWallet, isVirtual: true };
    }
    
    // 3. Fallback: Erste verfügbare Wallet
    if (wallets.length > 0) {
      console.log(`⚠️ Fallback: Using ${wallets[0].chain} wallet for DeFi test`);
      return { 
        wallet: { ...wallets[0], chain: 'ethereum', chain_id: 1 }, 
        isVirtual: true 
      };
    }
    
    return { wallet: null, isVirtual: false };
  }
  
  /**
   * 🔍 Debug: Zeige alle verfügbaren Wallets
   */
  static debugWallets(wallets) {
            // Debug log removed for production
    console.log('Original wallets:', wallets.map(w => ({
      address: w.address?.slice(0, 8) + '...',
      chain: w.chain,
      chain_id: w.chain_id,
      nickname: w.nickname
    })));
    
    const expanded = this.expandWalletsForMultiChain(wallets);
    console.log('Expanded wallets:', expanded.map(w => ({
      address: w.address?.slice(0, 8) + '...',
      chain: w.chain,
      chain_id: w.chain_id,
      nickname: w.nickname,
      isVirtual: w.isVirtualExpansion || false
    })));
    
    const best = this.findBestWalletForDeFi(wallets);
    console.log('Best DeFi wallet:', {
      address: best.wallet?.address?.slice(0, 8) + '...',
      chain: best.wallet?.chain,
      isVirtual: best.isVirtual
    });
    
    return expanded;
  }
}

export default MultiChainWalletService; 