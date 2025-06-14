// ✏️ ROI OVERRIDE MODAL - Manuelle ROI-Klassifikation für User
// Löst das Problem: "ROI kommt teils über Dritt-Coins (z.B. FLEX → MISSER)"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Textarea
} from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Coins,
  TrendingUp,
  Banknote,
  Zap,
  Info
} from 'lucide-react';

const ROIOverrideModal = ({ 
  isOpen, 
  onClose, 
  transaction, 
  currentClassification,
  onSaveOverride,
  loading = false 
}) => {
  const [isROI, setIsROI] = useState(currentClassification?.isROI || false);
  const [roiType, setROIType] = useState(currentClassification?.roiType || '');
  const [sourceToken, setSourceToken] = useState(currentClassification?.sourceToken || '');
  const [taxCategory, setTaxCategory] = useState(currentClassification?.taxCategory || '');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // ROI Type Options
  const ROI_TYPES = [
    { value: 'HEX_STAKING', label: 'HEX Staking', icon: TrendingUp, color: 'text-blue-600' },
    { value: 'INC_REWARDS', label: 'INC Rewards', icon: Coins, color: 'text-green-600' },
    { value: 'PLSX_REWARDS', label: 'PLSX Rewards', icon: Zap, color: 'text-purple-600' },
    { value: 'FARMING_REWARDS', label: 'Farming Rewards', icon: TrendingUp, color: 'text-orange-600' },
    { value: 'TREASURY_REWARDS', label: 'Treasury Rewards', icon: Banknote, color: 'text-indigo-600' },
    { value: 'STAKING_REWARDS', label: 'Staking Rewards', icon: TrendingUp, color: 'text-emerald-600' },
    { value: 'YIELD_FARMING', label: 'Yield Farming', icon: TrendingUp, color: 'text-yellow-600' },
    { value: 'OTHER_REWARDS', label: 'Other Rewards', icon: Coins, color: 'text-gray-600' }
  ];

  // Tax Category Options
  const TAX_CATEGORIES = [
    { value: 'staking_income', label: 'Staking Income (§ 22 EStG)', description: 'Belohnung für Staking' },
    { value: 'farming_income', label: 'Farming Income (§ 22 EStG)', description: 'Yield Farming Erträge' },
    { value: 'dividend_income', label: 'Dividend Income (§ 20 EStG)', description: 'Treasury/Dividenden' },
    { value: 'minting_rewards', label: 'Minting Rewards (§ 22 EStG)', description: 'Direct Minting' },
    { value: 'other_income', label: 'Other Income (§ 22 EStG)', description: 'Sonstige Einkünfte' },
    { value: 'regular_transfer', label: 'Regular Transfer', description: 'Normaler Transfer (nicht steuerpflichtig)' }
  ];

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const override = {
        isROI,
        roiType: isROI ? roiType : null,
        sourceToken: isROI ? sourceToken : null,
        taxCategory: isROI ? taxCategory : 'regular_transfer',
        description: description || `Manual override: ${isROI ? 'ROI' : 'No ROI'}`,
        confidence: 100,
        source: 'user_override'
      };

      await onSaveOverride(transaction.transaction_hash, override);
      onClose();
    } catch (error) {
      console.error('💥 Save Override Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatTransactionValue = () => {
    if (!transaction) return '';
    
    const decimals = parseInt(transaction.token_decimals) || 18;
    const amount = parseFloat(transaction.value) / Math.pow(10, decimals);
    
    return `${amount.toLocaleString('de-DE', { maximumFractionDigits: 4 })} ${transaction.token_symbol || 'Token'}`;
  };

  const getConfidenceBadge = () => {
    if (!currentClassification) return null;
    
    const confidence = currentClassification.confidence;
    const color = confidence >= 90 ? 'bg-green-100 text-green-800' :
                  confidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800';
    
    return (
      <Badge className={`${color} text-xs`}>
        {confidence}% Confidence
      </Badge>
    );
  };

  if (!isOpen || !transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-blue-600" />
            <span>ROI-Klassifikation bearbeiten</span>
          </DialogTitle>
          <DialogDescription>
            Klassifiziere diese Transaktion manuell für korrekte Steuerberechnung
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          
          {/* Transaction Info */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Transaktion</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Token:</span>
                <span className="ml-2 font-medium">{transaction.token_symbol || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-500">Betrag:</span>
                <span className="ml-2 font-medium">{formatTransactionValue()}</span>
              </div>
              <div>
                <span className="text-gray-500">Von:</span>
                <span className="ml-2 font-mono text-xs">{transaction.from_address?.slice(0, 10)}...</span>
              </div>
              <div>
                <span className="text-gray-500">Datum:</span>
                <span className="ml-2">{new Date(transaction.block_timestamp).toLocaleDateString('de-DE')}</span>
              </div>
            </div>
          </div>

          {/* Current Classification */}
          {currentClassification && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span>Aktuelle Klassifikation</span>
                </h3>
                {getConfidenceBadge()}
              </div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-500">ROI:</span>
                  <span className="ml-2">{currentClassification.isROI ? 'Ja' : 'Nein'}</span>
                </div>
                {currentClassification.isROI && (
                  <>
                    <div>
                      <span className="text-gray-500">Typ:</span>
                      <span className="ml-2">{currentClassification.roiType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Quelle:</span>
                      <span className="ml-2">{currentClassification.source}</span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-gray-500">Beschreibung:</span>
                  <span className="ml-2 text-xs">{currentClassification.description}</span>
                </div>
              </div>
            </div>
          )}

          {/* Manual Override Form */}
          <div className="space-y-4">
            
            {/* Is ROI Toggle */}
            <div>
              <label className="block text-sm font-medium mb-2">ROI-Status</label>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={isROI ? "default" : "outline"}
                  onClick={() => setIsROI(true)}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ist ROI</span>
                </Button>
                <Button
                  type="button"
                  variant={!isROI ? "default" : "outline"}
                  onClick={() => setIsROI(false)}
                  className="flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Kein ROI</span>
                </Button>
              </div>
            </div>

            {/* ROI Type Selection (only if ROI) */}
            {isROI && (
              <div>
                <label className="block text-sm font-medium mb-2">ROI Typ</label>
                <Select value={roiType} onValueChange={setROIType}>
                  <SelectTrigger>
                    <SelectValue placeholder="ROI Typ auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROI_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className={`h-4 w-4 ${type.color}`} />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Source Token (only if ROI) */}
            {isROI && (
              <div>
                <label className="block text-sm font-medium mb-2">Quelle Token</label>
                <input
                  type="text"
                  value={sourceToken}
                  onChange={(e) => setSourceToken(e.target.value)}
                  placeholder="z.B. FLEX, HEX, PLSX..."
                  className="w-full p-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Von welchem Token stammt diese ROI? (Optional)
                </p>
              </div>
            )}

            {/* Tax Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Steuerliche Kategorie</label>
              <Select value={taxCategory} onValueChange={setTaxCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Steuerliche Einordnung..." />
                </SelectTrigger>
                <SelectContent>
                  {TAX_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      <div>
                        <div className="font-medium">{category.label}</div>
                        <div className="text-xs text-gray-500">{category.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Notiz (Optional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Zusätzliche Informationen zu dieser Klassifikation..."
                rows={3}
              />
            </div>

          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || (isROI && (!roiType || !taxCategory))}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Speichere...' : 'Override speichern'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default ROIOverrideModal; 