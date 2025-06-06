import React from 'react';
import { motion } from 'framer-motion';
import { FileImage as ImageIcon, Filter, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from '@/contexts/AppContext';

const NftPortfolioView = () => {
  const { language, translations, connectedWalletAddress } = useAppContext();
  const t = translations[language] || translations['en'];

  const dummyNfts = [
    {
      id: 1,
      name: "Pulse Ape #123",
      collection: "Pulse Apes Yacht Club",
      imgKey: "pulseApe1",
      altTextKey: "pulseApe1Alt",
      estimatedValue: "1500 PLS",
      rarity: "Rare",
      attributes: ["Gold Fur", "Laser Eyes"],
      marketUrl: "#",
      imgDesc: "Pixelated ape with golden fur and red laser eyes"
    },
    {
      id: 2,
      name: "CryptoPulse Punk #456",
      collection: "CryptoPulse Punks",
      imgKey: "cryptoPunk2",
      altTextKey: "cryptoPunk2Alt",
      estimatedValue: "5000 PLS",
      rarity: "Epic",
      attributes: ["3D Glasses", "Beanie"],
      marketUrl: "#",
      imgDesc: "Pixelated punk character with 3D glasses and a beanie"
    },
    {
      id: 3,
      name: "PulseChain Rock #789",
      collection: "PulseChain Rocks",
      imgKey: "pulseRock3",
      altTextKey: "pulseRock3Alt",
      estimatedValue: "800 PLS",
      rarity: "Common",
      attributes: ["Mossy", "Smooth"],
      marketUrl: "#",
      imgDesc: "A simple digital rock with moss texture"
    },
     {
      id: 4,
      name: "Hexican Warrior #007",
      collection: "Hexican Warriors",
      imgKey: "hexicanWarrior4",
      altTextKey: "hexicanWarrior4Alt",
      estimatedValue: "12000 PLS",
      rarity: "Legendary",
      attributes: ["Diamond Armor", "Pulse Sword"],
      marketUrl: "#",
      imgDesc: "Pixelated warrior with diamond armor holding a glowing pulse sword"
    },
  ];

  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'bg-purple-600 hover:bg-purple-700 text-white';
      case 'epic': return 'bg-indigo-600 hover:bg-indigo-700 text-white';
      case 'rare': return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'common':
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <ImageIcon className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold gradient-text">{t.nftPortfolioViewTitle || "My NFT Portfolio"}</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => alert(t.featureComingSoon || "Feature coming soon!")}>
            <Filter className="mr-2 h-4 w-4" /> {t.nftFilter || "Filter"}
          </Button>
          <Button variant="outline" onClick={() => alert(t.featureComingSoon || "Feature coming soon!")}>
            <ArrowUpDown className="mr-2 h-4 w-4" /> {t.nftSort || "Sort"}
          </Button>
        </div>
      </div>

      <p className="text-lg text-foreground/80 mb-8">
        {connectedWalletAddress ? t.nftPortfolioViewDescription : t.connectWalletPromptNFTs || "Connect your wallet to view your NFT portfolio."}
      </p>

      {!connectedWalletAddress && (
        <Card className="text-center py-10 bg-background/70 dark:bg-slate-800/70">
            <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t.connectWalletPromptNFTs || "Connect your wallet to view your NFT portfolio."}</p>
        </Card>
      )}

      {connectedWalletAddress && dummyNfts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dummyNfts.map((nft, index) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 bg-background/70 dark:bg-slate-800/70 flex flex-col h-full group">
                <CardHeader className="p-0 relative">
                  <img    
                    alt={t[nft.altTextKey] || `NFT image for ${nft.name}`}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://images.unsplash.com/photo-1664022617645-cf71791942e4" />
                  <Badge className={`absolute top-2 right-2 text-xs ${getRarityColor(nft.rarity)}`}>
                    {nft.rarity}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <CardTitle className="text-lg font-semibold mb-1 truncate text-primary group-hover:text-accent transition-colors">
                    {nft.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mb-2 truncate">{nft.collection}</CardDescription>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-foreground/90">{t.nftEstimatedValue || "Est. Value"}</p>
                    <p className="text-lg font-bold text-green-500">{nft.estimatedValue}</p>
                  </div>

                  {nft.attributes && nft.attributes.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t.nftAttributes || "Attributes"}</p>
                      <div className="flex flex-wrap gap-1">
                        {nft.attributes.map(attr => (
                          <Badge key={attr} variant="secondary" className="text-xs">{attr}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 border-t border-border/20">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(nft.marketUrl, '_blank')}
                    disabled={nft.marketUrl === "#"}
                  >
                    {t.nftViewOnMarketplace || "View on Marketplace"}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {connectedWalletAddress && dummyNfts.length === 0 && (
         <div className="text-center py-10">
            <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t.nftNoNftsFoundInWallet || "No NFTs found in the connected wallet."}</p>
            <p className="text-sm text-muted-foreground">{t.nftDemoDataDisclaimer || "Real NFT data loading coming soon."}</p>
        </div>
      )}

       <div className="mt-8 p-4 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 rounded-md">
        <p className="font-semibold">{t.nftImportantNoteTitle || "Important Note"}</p>
        <p>{connectedWalletAddress ? t.nftLiveSoon : t.nftImportantNoteText}</p>
      </div>
    </motion.div>
  );
};

export default NftPortfolioView;
