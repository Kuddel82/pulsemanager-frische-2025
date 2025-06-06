
import React from 'react';
import { motion } from 'framer-motion';
import { Percent, ExternalLink, Filter, ArrowUpDown, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppContext } from '@/contexts/AppContext';

const YieldOptimizerView = () => {
  const { language, translations } = useAppContext();
  const t = translations[language];

  const dummyOpportunities = [
    { id: 1, platform: "PulseX Farm", asset: "PLS/PLSX LP", apy: "150%", risk: "Medium", type: "Farming", link: "https://pulsex.com/farms" },
    { id: 2, platform: "LiquidLoans Stake", asset: "LOAN", apy: "Varies (Protocol Revenue)", risk: "Medium", type: "Staking", link: "#" },
    { id: 3, platform: "Phamous Pharms", asset: "PHM/PLS LP", apy: "250% (High Inflation)", risk: "High", type: "Farming", link: "#" },
    { id: 4, platform: "SomeProtocol Vault", asset: "DAI (bridged)", apy: "15%", risk: "Low-Medium", type: "Vault", link: "#" },
    { id: 5, platform: "New Yield Aggregator", asset: "Various", apy: "Up to 500%", risk: "Very High", type: "Aggregator", link: "#" },
  ];

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'very high': return 'bg-red-700 hover:bg-red-800 text-white';
      case 'high': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      case 'low-medium': return 'bg-yellow-400 hover:bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 hover:bg-green-600 text-white';
      default: return 'bg-gray-500 hover:bg-gray-600';
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
          <Percent className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold gradient-text">{t.yieldOptimizerViewTitle}</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> {t.nftFilter}
          </Button>
          <Button variant="outline">
            <ArrowUpDown className="mr-2 h-4 w-4" /> {t.nftSort}
          </Button>
        </div>
      </div>

      <p className="text-lg text-foreground/80 mb-6">
        {t.yieldOptimizerViewDescription}
      </p>

      <Alert variant="destructive" className="mb-6 bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-300">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <AlertTitle>{t.yieldOptimizerDisclaimerTitle}</AlertTitle>
        <AlertDescription>
          {t.yieldOptimizerDisclaimer}
        </AlertDescription>
      </Alert>

      <Card className="flex-grow shadow-xl bg-background/70 dark:bg-slate-800/70">
        <CardHeader>
          <CardTitle className="text-xl text-primary">{t.yieldOptimizerAvailableOpportunities}</CardTitle>
          <CardDescription>{language === 'de' ? 'Beispieldaten. Echte Daten und mehr Filteroptionen kommen bald.' : 'Example data. Real data and more filtering options coming soon.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.yieldOptimizerTablePlatform}</TableHead>
                <TableHead>{t.yieldOptimizerTableAsset}</TableHead>
                <TableHead className="text-right">{t.yieldOptimizerTableAPY}</TableHead>
                <TableHead>{t.yieldOptimizerTableType}</TableHead>
                <TableHead>{t.yieldOptimizerTableRisk}</TableHead>
                <TableHead>{t.yieldOptimizerTableAction}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyOpportunities.map((opp) => (
                <TableRow key={opp.id} className="hover:bg-primary/5 transition-colors">
                  <TableCell className="font-medium">{opp.platform}</TableCell>
                  <TableCell>{opp.asset}</TableCell>
                  <TableCell className="text-right font-semibold text-green-500">{opp.apy}</TableCell>
                  <TableCell><Badge variant="secondary">{opp.type}</Badge></TableCell>
                  <TableCell>
                    <Badge className={`${getRiskColor(opp.risk)} text-xs`}>
                      {opp.risk}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(opp.link, '_blank')}
                      disabled={opp.link === "#"}
                    >
                      {t.yieldOptimizerVisit} <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
       <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 rounded-md">
        <Info className="inline-block h-5 w-5 mr-2 align-text-bottom"/>
        <span className="font-semibold">{t.yieldOptimizerDemoDataTitle}</span>
        <p className="inline"> {t.yieldOptimizerDemoDataText}</p>
      </div>
    </motion.div>
  );
};

export default YieldOptimizerView;
