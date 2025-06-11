// 🎯 SMART LOAD BUTTON - Schöner Button mit Rate Limiting
// Verhindert API-Spam und zeigt Status visuell an

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Clock, 
  Zap, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Database
} from 'lucide-react';

const SmartLoadButton = ({ 
  onLoad, 
  loading = false, 
  canRefresh = true, 
  remainingTime = 0,
  lastUpdate = null,
  stats = {},
  variant = 'default',
  size = 'default',
  className = '',
  showStats = true,
  buttonText = 'Daten laden'
}) => {
  const [countdown, setCountdown] = useState(remainingTime);

  // Update countdown every second when rate limited
  useEffect(() => {
    if (remainingTime > 0) {
      setCountdown(remainingTime);
      
      const interval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [remainingTime]);

  // Determine button state and styling
  const getButtonState = () => {
    if (loading) {
      return {
        disabled: true,
        variant: 'default',
        icon: RefreshCw,
        text: 'Lädt...',
        className: 'bg-blue-500 hover:bg-blue-600 text-white',
        iconClass: 'animate-spin'
      };
    }
    
    if (!canRefresh && countdown > 0) {
      return {
        disabled: true,
        variant: 'outline',
        icon: Clock,
        text: `${countdown}s`,
        className: 'border-orange-400 text-orange-400 bg-orange-50 dark:bg-orange-900/20',
        iconClass: ''
      };
    }
    
    if (lastUpdate && stats?.isStale) {
      return {
        disabled: false,
        variant: 'default',
        icon: AlertCircle,
        text: 'Aktualisieren',
        className: 'bg-yellow-500 hover:bg-yellow-600 text-white pulse',
        iconClass: ''
      };
    }
    
    return {
      disabled: false,
      variant: 'default',
      icon: RefreshCw,
      text: buttonText,
      className: 'bg-green-500 hover:bg-green-600 text-white',
      iconClass: ''
    };
  };

  const buttonState = getButtonState();
  const Icon = buttonState.icon;

  return (
    <div className={`flex flex-col items-end space-y-2 ${className}`}>
      
      {/* Main Load Button */}
      <Button
        onClick={onLoad}
        disabled={buttonState.disabled}
        variant={buttonState.variant}
        size={size}
        className={`${buttonState.className} transition-all duration-300 shadow-lg`}
      >
        <Icon className={`h-4 w-4 mr-2 ${buttonState.iconClass}`} />
        {buttonState.text}
      </Button>

      {/* Status Information */}
      {showStats && (
        <div className="flex flex-col items-end space-y-1 text-xs">
          
          {/* Last Update */}
          {lastUpdate && (
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>Zuletzt: {lastUpdate.toLocaleTimeString('de-DE')}</span>
            </div>
          )}
          
          {/* Rate Limit Status */}
          {!canRefresh && countdown > 0 && (
            <Badge variant="outline" className="border-orange-400 text-orange-600">
              <Clock className="h-3 w-3 mr-1" />
              Rate Limit: {countdown}s
            </Badge>
          )}
          
          {/* Loading Stats */}
          {stats && stats.totalLoads > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                {stats.totalLoads} Loads
              </Badge>
              
              {stats.lastLoadDuration && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  {(stats.lastLoadDuration / 1000).toFixed(1)}s
                </Badge>
              )}
            </div>
          )}
          
          {/* Data Freshness */}
          {lastUpdate && (
            <div className="text-xs text-gray-500">
              {stats?.isStale ? (
                <span className="text-yellow-600 font-medium">
                  ⚠️ Daten älter als 10 Min
                </span>
              ) : (
                <span className="text-green-600">
                  ✅ Daten aktuell
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Rate Limiting Explanation */}
      {!canRefresh && countdown > 0 && (
        <div className="text-xs text-gray-500 max-w-xs text-right bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800">
          <div className="flex items-start space-x-1">
            <AlertCircle className="h-3 w-3 mt-0.5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-orange-700 dark:text-orange-400">Rate Limit aktiv</p>
              <p className="text-orange-600 dark:text-orange-500">
                Spart Moralis CUs und verhindert Serverüberlastung
              </p>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default SmartLoadButton; 