import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { dbService } from '@/lib/dbService';
import { useAppContext } from '@/contexts/AppContext';
import { logger } from '@/lib/logger';

const InvestmentForm = ({ isOpen, onClose, investment, onSave }) => {
  const { t } = useAppContext();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    quantity: '',
    purchase_date: '',
    purchase_price: '',
    current_value: '',
    wallet_address: '',
    source: 'manual'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (investment) {
      setFormData({
        name: investment.name || '',
        symbol: investment.symbol || '',
        quantity: investment.quantity || '',
        purchase_date: investment.purchase_date || '',
        purchase_price: investment.purchase_price || '',
        current_value: investment.current_value || '',
        wallet_address: investment.wallet_address || '',
        source: investment.source || 'manual'
      });
    } else {
      setFormData({
        name: '',
        symbol: '',
        quantity: '',
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_price: '',
        current_value: '',
        wallet_address: '',
        source: 'manual'
      });
    }
  }, [investment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price),
        current_value: parseFloat(formData.current_value)
      };

      if (investment?.id) {
        await dbService.updateRoiEntry(investment.id, payload);
        toast({
          title: t.success || "Success",
          description: t.investmentUpdated || "Investment updated successfully.",
          variant: "success",
        });
      } else {
        await dbService.addRoiEntry(payload);
        toast({
          title: t.success || "Success",
          description: t.investmentAdded || "Investment added successfully.",
          variant: "success",
        });
      }

      onSave();
    } catch (error) {
      toast({
        title: t.error || "Error",
        description: error.message || (investment?.id ? t.couldNotUpdateInvestment : t.couldNotAddInvestment),
        variant: "destructive",
      });
      logger.error("Error saving investment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {investment?.id ? t.editInvestment || "Edit Investment" : t.addInvestment || "Add Investment"}
          </DialogTitle>
          <DialogDescription>
            {investment?.id ? t.editInvestmentDesc || "Update your investment details below." : t.addInvestmentDesc || "Fill in the details of your new investment below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name || "Name"}</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t.investmentNamePlaceholder || "e.g., Bitcoin"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">{t.symbol || "Symbol"}</Label>
              <Input
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                required
                placeholder={t.investmentSymbolPlaceholder || "e.g., BTC"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">{t.quantity || "Quantity"}</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="any"
              value={formData.quantity}
              onChange={handleChange}
              required
              placeholder={t.investmentQuantityPlaceholder || "e.g., 1.5"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_date">{t.purchaseDate || "Purchase Date"}</Label>
            <Input
              id="purchase_date"
              name="purchase_date"
              type="date"
              value={formData.purchase_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">{t.purchasePrice || "Purchase Price"}</Label>
              <Input
                id="purchase_price"
                name="purchase_price"
                type="number"
                step="any"
                value={formData.purchase_price}
                onChange={handleChange}
                required
                placeholder={t.investmentPricePlaceholder || "e.g., 1000.00"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_value">{t.currentValue || "Current Value"}</Label>
              <Input
                id="current_value"
                name="current_value"
                type="number"
                step="any"
                value={formData.current_value}
                onChange={handleChange}
                required
                placeholder={t.investmentCurrentValuePlaceholder || "e.g., 1500.00"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet_address">{t.walletAddress || "Wallet Address"}</Label>
            <Input
              id="wallet_address"
              name="wallet_address"
              value={formData.wallet_address}
              onChange={handleChange}
              placeholder={t.walletAddressPlaceholder || "e.g., 0x..."}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {t.cancel || "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white"
            >
              {isLoading ? t.saving || "Saving..." : (investment?.id ? t.update || "Update" : t.add || "Add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentForm;