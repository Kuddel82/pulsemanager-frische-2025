import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Send, Download, BarChart2, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from '@/contexts/AppContext';

const AssetTable = ({ assets, isLoading }) => {
  const { t } = useAppContext();
  const { toast } = useToast();

  if (isLoading && (!assets || assets.length === 0)) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">{t?.loadingAssets || "Loading assets..."}</p>
      </div>
    );
  }

  if (!isLoading && (!assets || assets.length === 0)) {
    return <p className="text-muted-foreground text-center py-10">{t?.noAssetsFound || "No assets found for this wallet or data could not be loaded."}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t?.asset || "Asset"}</TableHead>
            <TableHead className="text-right">{t?.balance || "Balance"}</TableHead>
            <TableHead className="text-right">{t?.valueUSD || "Value (USD)"}</TableHead>
            <TableHead className="text-center">{t?.actions || "Actions"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id || asset.symbol} className="hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors">
              <TableCell>
                <div className="flex items-center">
                  {asset.logoUrl ? (
                    <img src={asset.logoUrl} alt={`${asset.name} logo`} className="h-8 w-8 mr-3 rounded-full bg-slate-200 dark:bg-slate-700 object-cover"/>
                  ) : (
                    <div className="h-8 w-8 mr-3 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs text-muted-foreground">
                      {asset.symbol ? asset.symbol.substring(0,3).toUpperCase() : 'N/A'}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{asset.name || (t?.unknownAsset || 'Unknown Asset')}</div>
                    <div className="text-xs text-muted-foreground">{asset.symbol || 'N/A'}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {typeof asset.balance === 'number' 
                  ? asset.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                  : (typeof asset.balance === 'string' 
                      ? parseFloat(asset.balance.replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) 
                      : '0.00')
                }
              </TableCell>
              <TableCell className="text-right font-mono">
                $
                {typeof asset.valueUSD === 'number'
                  ? asset.valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : (typeof asset.valueUSD === 'string'
                      ? parseFloat(asset.valueUSD.replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '0.00')
                }
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center space-x-1 md:space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:text-primary h-8 w-8 md:h-auto md:w-auto" 
                    onClick={() => toast({ title: `${t?.send || "Send"} ${asset.symbol || 'Asset'}`, description: t?.comingSoon || "Coming Soon"})}
                    aria-label={`${t?.send || "Send"} ${asset.symbol || 'Asset'}`}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:text-primary h-8 w-8 md:h-auto md:w-auto" 
                    onClick={() => toast({ title: `${t?.receive || "Receive"} ${asset.symbol || 'Asset'}`, description: t?.comingSoon || "Coming Soon"})}
                    aria-label={`${t?.receive || "Receive"} ${asset.symbol || 'Asset'}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:text-primary h-8 w-8 md:h-auto md:w-auto" 
                    onClick={() => toast({ title: `${t?.trade || "Trade"} ${asset.symbol || 'Asset'}`, description: t?.comingSoon || "Coming Soon"})}
                    aria-label={`${t?.trade || "Trade"} ${asset.symbol || 'Asset'}`}
                  >
                    <BarChart2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AssetTable;