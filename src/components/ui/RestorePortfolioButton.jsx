// 💾 RESTORE PORTFOLIO BUTTON - Wiederherstellen ohne API-Calls
// Löst das Problem: "Nach Login ist Portfolio leer"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  Clock, 
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

const RestorePortfolioButton = ({ 
  onRestore, 
  loading = false,
  lastCacheInfo = null,
  disabled = false,
  className = ''
}) => {
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    if (loading || isRestoring || disabled) return;
    
    setIsRestoring(true);
    try {
      await onRestore();
    } finally {
      setIsRestoring(false);
    }
  };

  // Determine button state
  const getButtonState = () => {
    if (isRestoring || loading) {
      return {
        variant: 'default',
        className: 'bg-blue-500 hover:bg-blue-600 text-white',
        icon: Loader2,
        iconClass: 'animate-spin',
        text: 'Lade...',
        disabled: true
      };
    }

    if (disabled) {
      return {
        variant: 'outline',
        className: 'opacity-50 cursor-not-allowed',
        icon: Database,
        iconClass: '',
        text: 'Kein Cache',
        disabled: true
      };
    }

    return {
      variant: 'outline',
      className: 'border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20',
      icon: RotateCcw,
      iconClass: '',
      text: 'Letztes Portfolio',
      disabled: false
    };
  };

  const buttonState = getButtonState();
  const Icon = buttonState.icon;

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      
      {/* Restore Button */}
      <Button
        onClick={handleRestore}
        disabled={buttonState.disabled}
        variant={buttonState.variant}
        className={`${buttonState.className} transition-all duration-300`}
      >
        <Icon className={`h-4 w-4 mr-2 ${buttonState.iconClass}`} />
        {buttonState.text}
      </Button>

      {/* Cache Info */}
      {lastCacheInfo && (
        <div className="flex flex-col items-center space-y-1 text-xs">
          
          {/* Last Update Time */}
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>
              {lastCacheInfo.lastUpdate ? 
                `Gespeichert: ${new Date(lastCacheInfo.lastUpdate).toLocaleString('de-DE')}` :
                'Noch nicht gespeichert'
              }
            </span>
          </div>

          {/* Cache Age Badge */}
          {lastCacheInfo.ageMinutes !== undefined && (
            <Badge 
              variant="outline" 
              className={`text-xs ${
                lastCacheInfo.ageMinutes < 60 ? 
                  'border-green-400 text-green-600' : 
                  'border-yellow-400 text-yellow-600'
              }`}
            >
              {lastCacheInfo.ageMinutes < 60 ? 
                `${lastCacheInfo.ageMinutes} Min alt` :
                `${Math.round(lastCacheInfo.ageMinutes / 60)} Std alt`
              }
            </Badge>
          )}

          {/* Token Count */}
          {lastCacheInfo.tokenCount && (
            <Badge variant="secondary" className="text-xs">
              <Database className="h-3 w-3 mr-1" />
              {lastCacheInfo.tokenCount} Tokens
            </Badge>
          )}
        </div>
      )}

      {/* Info Text */}
      <div className="text-xs text-center text-gray-500 max-w-xs">
        <div className="flex items-start space-x-1">
          <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-700 dark:text-green-400">Keine API-Kosten</p>
            <p className="text-green-600 dark:text-green-500">
              Lädt dein letztes Portfolio aus dem Cache
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default RestorePortfolioButton; 