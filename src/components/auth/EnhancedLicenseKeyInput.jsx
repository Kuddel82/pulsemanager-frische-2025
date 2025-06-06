import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DeviceFingerprintService } from '@/lib/deviceFingerprint';
import { Shield, CheckCircle, XCircle, AlertTriangle, Smartphone } from 'lucide-react';
import { logger } from '@/lib/logger';

const EnhancedLicenseKeyInput = ({ onValid, onClose }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [status, setStatus] = useState('idle'); // idle, checking, valid, invalid, device_conflict
  const [deviceId, setDeviceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Generiere Device ID beim Laden der Komponente
    const currentDeviceId = DeviceFingerprintService.getDeviceId();
    setDeviceId(currentDeviceId);
    logger.info('Device ID initialized for license input');
  }, []);

  const handleValidation = async () => {
    if (!licenseKey.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Lizenz-Key ein.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Fehler", 
        description: "Sie müssen angemeldet sein, um eine Lizenz zu aktivieren.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setStatus('checking');

    try {
      // Prüfe ob Lizenz bereits für dieses Gerät gültig ist
      const isValidForDevice = await DeviceFingerprintService.validateLicenseForDevice(
        licenseKey, 
        deviceId
      );

      if (isValidForDevice) {
        // Lizenz ist bereits für dieses Gerät aktiviert
        setStatus('valid');
        localStorage.setItem('pulsemanager_license_key', licenseKey);
        localStorage.setItem('pulsemanager_license_validated', 'true');
        
        toast({
          title: "Lizenz aktiv",
          description: "Ihre Lizenz ist auf diesem Gerät bereits aktiv.",
          variant: "success"
        });

        onValid && onValid(licenseKey, deviceId);
        return;
      }

      // Versuche Lizenz für dieses Gerät zu registrieren
      const registrationSuccess = await DeviceFingerprintService.registerLicenseForDevice(
        licenseKey,
        user.id
      );

      if (registrationSuccess) {
        setStatus('valid');
        localStorage.setItem('pulsemanager_license_key', licenseKey);
        localStorage.setItem('pulsemanager_license_validated', 'true');
        
        toast({
          title: "Lizenz erfolgreich aktiviert",
          description: "Ihre Lizenz wurde für dieses Gerät erfolgreich aktiviert.",
          variant: "success"
        });

        onValid && onValid(licenseKey, deviceId);
      } else {
        setStatus('device_conflict');
        toast({
          title: "Geräte-Konflikt",
          description: "Diese Lizenz ist bereits auf einem anderen Gerät aktiv. Pro Lizenz ist nur ein Gerät erlaubt.",
          variant: "destructive"
        });
      }

    } catch (error) {
      logger.error('Error in license validation:', error);
      setStatus('invalid');
      toast({
        title: "Validierungsfehler",
        description: "Fehler bei der Lizenz-Validierung. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>;
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'device_conflict':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Lizenz wird validiert...';
      case 'valid':
        return 'Lizenz erfolgreich aktiviert für dieses Gerät';
      case 'invalid':
        return 'Ungültiger Lizenz-Key';
      case 'device_conflict':
        return 'Lizenz bereits auf anderem Gerät aktiv (1-Lizenz-pro-Gerät-Regel)';
      default:
        return 'Geben Sie Ihren Lizenz-Key ein';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="h-6 w-6" />
          Lizenz-Aktivierung
        </CardTitle>
        <CardDescription>
          Aktivieren Sie Ihre PulseManager Premium-Lizenz
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="license-key" className="text-sm font-medium">
            Lizenz-Key
          </label>
          <Input
            id="license-key"
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
            className="font-mono"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <div className="font-medium">Ihr Gerät</div>
            <div className="text-muted-foreground">
              ID: {deviceId.substring(0, 8)}...
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg border">
          {getStatusIcon()}
          <span className="text-sm">{getStatusMessage()}</span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleValidation}
            disabled={isLoading || !licenseKey.trim()}
            className="flex-1"
          >
            {isLoading ? 'Validiere...' : 'Lizenz aktivieren'}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Eine Lizenz kann nur auf einem Gerät aktiv sein</p>
          <p>• Die Geräteerkennung basiert auf Hardware-Merkmalen</p>
          <p>• Für Geräte-Wechsel kontaktieren Sie den Support</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedLicenseKeyInput; 