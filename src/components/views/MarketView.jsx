import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus, Search, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.jsx";

const initialDummyTokens = [
  { id: 'pls', name: 'PulseCoin', symbol: 'PLS', price: 0.000048, change24h: 2.5, volume24h: 1200000, marketCap: 650000000, logoUrl: 'https://via.placeholder.com/32/FF00FF/FFFFFF?text=PLS' },
  { id: 'plsx', name: 'PulseX', symbol: 'PLSX', price: 0.000015, change24h: -1.2, volume24h: 850000, marketCap: 200000000, logoUrl: 'https://via.placeholder.com/32/00FF00/FFFFFF?text=PLSX' },
  { id: 'hex', name: 'HEX (PulseChain)', symbol: 'HEX', price: 0.0055, change24h: 0.5, volume24h: 500000, marketCap: 950000000, logoUrl: 'https://via.placeholder.com/32/0000FF/FFFFFF?text=HEX' },
  { id: 'inc', name: 'Incentive', symbol: 'INC', price: 0.012, change24h: 10.8, volume24h: 300000, marketCap: 12000000, logoUrl: 'https://via.placeholder.com/32/FFFF00/000000?text=INC' },
  { id: 'usdl', name: 'LUSD Stablecoin', symbol: 'USDL', price: 0.998, change24h: 0.0, volume24h: 450000, marketCap: 50000000, logoUrl: 'https://via.placeholder.com/32/00FFFF/000000?text=USDL' },
];

const MarketView = () => {
  const { t, setActiveView } = useAppContext();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTokens, setFilteredTokens] = useState(initialDummyTokens);
  const [watchlistItems, setWatchlistItems] = useState(new Set());
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [selectedTokenForTrade, setSelectedTokenForTrade] = useState(null);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const newFilteredTokens = initialDummyTokens.filter(token => {
      return (
        token.name.toLowerCase().includes(lowercasedFilter) ||
        token.symbol.toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredTokens(newFilteredTokens);
  }, [searchTerm]);

  const toggleWatchlistItem = useCallback((tokenId, tokenSymbol) => {
    setWatchlistItems(prevWatchlist => {
      const newWatchlist = new Set(prevWatchlist);
      if (newWatchlist.has(tokenId)) {
        newWatchlist.delete(tokenId);
        toast({
          title: t?.watchlistRemovedTitle || "Watchlist",
          description: `${tokenSymbol} ${t?.watchlistRemovedText || "removed from watchlist."}`,
        });
      } else {
        newWatchlist.add(tokenId);
        toast({
          title: t?.watchlistAddedTitle || "Watchlist",
          description: `${tokenSymbol} ${t?.watchlistAddedText || "added to watchlist."}`,
        });
      }
      return newWatchlist;
    });
  }, []); // FIXED: Remove changing dependencies
  
  const handleGlobalWatchlistClick = () => {
    toast({
      title: t?.comingSoon || "Coming Soon",
      description: t?.watchlistPageFeatureComingSoon || "A dedicated watchlist page/filter is coming soon!",
      variant: "default",
    });
    console.log("Current watchlist items:", Array.from(watchlistItems));
  };
  
  const handleTradeClick = (token) => {
    setSelectedTokenForTrade(token);
    setShowTradeDialog(true);
  };

  const confirmTradeNavigation = () => {
    setShowTradeDialog(false);
    setActiveView('tokenTrade'); 
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  const formatPrice = (price) => {
    if (price < 0.0001 && price > 0) {
      return `${price.toPrecision(2)}`;
    }
    return `${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })}`;
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1000000000) {
      return `${(marketCap / 1000000000).toFixed(2)}B`;
    }
    if (marketCap >= 1000000) {
      return `${(marketCap / 1000000).toFixed(2)}M`;
    }
    if (marketCap >= 1000) {
      return `${(marketCap / 1000).toFixed(2)}K`;
    }
    return `${marketCap.toFixed(2)}`;
  };
  
  const formatVolume = (volume) => {
     if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`;
    }
    return `${volume.toFixed(2)}`;
  }

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">{t?.marketViewTitle || "Market Overview"}</h1>
        <p className="text-muted-foreground text-lg">{t?.marketViewSubtitle || "Explore PulseChain token prices, charts, and market data."}</p>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t?.searchTokens || "Search tokens..."}
            className="pl-10 w-full glassmorphic-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="glassmorphic-button w-full sm:w-auto" onClick={handleGlobalWatchlistClick}>
          <Star className="mr-2 h-4 w-4" /> {t?.watchlist || "Watchlist"} ({watchlistItems.size})
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 border-border/20 bg-background/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t?.pulseChainTokens || "PulseChain Tokens"}</CardTitle>
            <CardDescription>{t?.marketViewTableDescription || "Live prices and market data for tokens on PulseChain."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] hidden sm:table-cell">#</TableHead>
                  <TableHead className="w-[40px] text-center"></TableHead>
                  <TableHead>{t?.token || "Token"}</TableHead>
                  <TableHead className="text-right">{t?.price || "Price"}</TableHead>
                  <TableHead className="text-right hidden md:table-cell">{t?.change24h || "24h %"}</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">{t?.volume24h || "Volume (24h)"}</TableHead>
                  <TableHead className="text-right hidden xl:table-cell">{t?.marketCap || "Market Cap"}</TableHead>
                  <TableHead className="text-center">{t?.actions || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTokens.length > 0 ? (
                  filteredTokens.map((token, index) => (
                    <TableRow key={token.id} className={`hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors ${watchlistItems.has(token.id) ? 'bg-primary/10 dark:bg-primary/20' : ''}`}>
                      <TableCell className="font-medium hidden sm:table-cell">{index + 1}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => toggleWatchlistItem(token.id, token.symbol)} className="h-8 w-8">
                          <Star className={`h-5 w-5 ${watchlistItems.has(token.id) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {token.logoUrl ? (
                            <img-replace src={token.logoUrl} alt={`${token.name} logo`} className="h-8 w-8 mr-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                          ) : (
                            <div className="h-8 w-8 mr-3 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs text-muted-foreground">
                              {token.symbol.substring(0,3)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{token.name}</div>
                            <div className="text-xs text-muted-foreground">{token.symbol}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatPrice(token.price)}</TableCell>
                      <TableCell className={`text-right font-mono hidden md:table-cell ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <div className="flex items-center justify-end">
                          {token.change24h > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : token.change24h < 0 ? <TrendingDown className="h-4 w-4 mr-1" /> : <Minus className="h-4 w-4 mr-1" />}
                          {token.change24h.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono hidden lg:table-cell">{formatVolume(token.volume24h)}</TableCell>
                      <TableCell className="text-right font-mono hidden xl:table-cell">{formatMarketCap(token.marketCap)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="hover:text-primary" onClick={() => handleTradeClick(token)}>
                          {t?.trade || "Trade"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {t?.noTokensFound || "No tokens found matching your search."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
      <motion.p variants={itemVariants} className="text-xs text-center text-muted-foreground">
        {t?.marketDataSourceDisclaimer || "Market data is for informational purposes only. Data might be delayed or simulated."}
      </motion.p>

      {selectedTokenForTrade && (
        <AlertDialog open={showTradeDialog} onOpenChange={setShowTradeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t?.tradeTokenTitle || "Trade Token"}</AlertDialogTitle>
              <AlertDialogDescription>
                {t?.tradeTokenDescription1 || "You are about to navigate to the token swap/trade section for"} {selectedTokenForTrade.symbol}.
                <br />
                {t?.tradeTokenDescription2 || "Would you like to proceed?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowTradeDialog(false)}>{t?.cancel || "Cancel"}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmTradeNavigation}>
                <ExternalLink className="mr-2 h-4 w-4" />
                {t?.proceedToSwap || "Proceed to Swap"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </motion.div>
  );
};

export default MarketView;