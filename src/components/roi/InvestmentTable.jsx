import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Info, Link as LinkIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { calculateROI, calculateProfitLoss, formatDisplayDate } from '@/lib/investmentUtils';
import { dbService } from '@/lib/dbService'; 
import { logger } from '@/lib/logger';

const InvestmentTable = ({ investments, onEdit, onDelete, isLoading }) => {
  const { t, user, incrementAppDataVersion } = useAppContext();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(null); 

  const handleDelete = async (id) => {
    if (!user?.id) return;
    
    setIsDeleting(id);
    try {
      logger.debug("InvestmentTable: Deleting investment with ID:", id);
      const { success, error } = await dbService.deleteEntries(user.id, 'roi', [id]);

      if (error || !success) {
        throw error || new Error(t.couldNotDeleteInvestment || "Could not delete investment.");
      }
      toast({
        title: t.success || "Success",
        description: t.investmentDeletedSuccess || "Investment deleted successfully.",
        variant: "success",
      });
      incrementAppDataVersion(); 
      onDelete(); 
    } catch (error) {
      logger.error("Error deleting investment via dbService:", error);
      toast({
        title: t.errorDeletingInvestment || "Error Deleting Investment",
        description: error.message || (t.couldNotDeleteInvestment || "Could not delete investment."),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const calculateROI = (purchasePrice, currentValue) => {
    if (!purchasePrice || purchasePrice === 0) return 0;
    return ((currentValue - purchasePrice) / purchasePrice) * 100;
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const tableVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={tableVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border border-border/20 bg-background/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-xl"
    >
      <CardHeader>
        <CardTitle>{t.myInvestments || "My Investments"}</CardTitle>
        <CardDescription>{t.investmentListDescription || "Overview of your current investments."}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.investment || "Investment"}</TableHead>
              <TableHead>{t.purchaseDate || "Purchase Date"}</TableHead>
              <TableHead className="text-right">{t.purchasePrice || "Purchase Price"}</TableHead>
              <TableHead className="text-right">{t.currentValue || "Current Value"}</TableHead>
              <TableHead className="text-right">{t.roi || "ROI"}</TableHead>
              <TableHead className="text-right">{t.profitLost || "Profit/Loss"}</TableHead>
              <TableHead className="text-center">{t.actions || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.map((inv) => {
              const profit = parseFloat(calculateProfitLoss(inv.purchase_price, inv.current_value));
              const profitColor = profit >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
              const roi = calculateROI(inv.purchase_price, inv.current_value);
              return (
                <motion.tr
                  key={inv.id}
                  variants={rowVariants}
                  className="hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
                >
                  <TableCell>
                    <div className="font-medium flex items-center">
                      {inv.name}
                      {inv.source === 'wallet' && inv.wallet_address && (
                        <LinkIcon className="h-3 w-3 ml-1.5 text-primary/70" title={`${t.syncedFromWalletPrefix || "Synced:"} ${inv.wallet_address.substring(0,6)}...`} />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {inv.quantity ? `${inv.quantity} ` : ''}{inv.symbol || ''}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(inv.purchase_date)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(inv.purchase_price)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(inv.current_value)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">
                      {roi >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={roi >= 0 ? "text-green-500" : "text-red-500"}>
                        {formatNumber(roi)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-mono ${profitColor}`}>
                    {formatCurrency(profit)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-1">
                      <Button variant="ghost" size="icon" className="hover:text-blue-500" onClick={() => onEdit(inv)} disabled={isLoading || isDeleting === inv.id}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDelete(inv.id)} disabled={isLoading || isDeleting === inv.id}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
        <div className="mt-4 p-3 bg-sky-100 dark:bg-sky-900/30 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 rounded-md flex items-start">
          <Info className="h-5 w-5 mr-2 mt-0.5 text-sky-500 flex-shrink-0" />
          <p className="text-sm">{t.roiTrackerInfoWalletSyncPulseX || "Assets from connected wallets are synced. For accurate historical ROI, initial purchase data (price & date) reflects current values at the time of sync. Please EDIT these entries with your actual purchase details from PulseX (or other sources)."}</p>
        </div>
      </CardContent>
    </motion.div>
  );
};

export default InvestmentTable;