import { logger } from './logger';

/**
 * Device Fingerprint Service für 1-Lizenz-pro-Gerät System
 * Erstellt einen eindeutigen, aber anonymen Device Identifier
 */
export class DeviceFingerprintService {
  
  /**
   * Generiert einen eindeutigen Device Fingerprint
   * @returns {string} Unique device identifier
   */
  static generateFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('PulseManager Device ID', 2, 2);
      const canvasFingerprint = canvas.toDataURL();

      const fingerprint = {
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        canvas: this.hashCode(canvasFingerprint),
        userAgent: this.hashCode(navigator.userAgent),
        timestamp: Date.now()
      };

      const fingerprintString = JSON.stringify(fingerprint);
      const deviceId = this.hashCode(fingerprintString);
      
      logger.info('Device fingerprint generated:', { deviceId: deviceId.substring(0, 8) + '...' });
      return deviceId;
    } catch (error) {
      logger.error('Error generating device fingerprint:', error);
      // Fallback zu zufälliger ID wenn Fingerprinting fehlschlägt
      return 'fallback_' + Math.random().toString(36).substring(2, 15);
    }
  }

  /**
   * Hash-Funktion für Strings
   * @param {string} str 
   * @returns {string} Hash
   */
  static hashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Speichert Device ID persistent
   * @param {string} deviceId 
   */
  static storeDeviceId(deviceId) {
    try {
      localStorage.setItem('pulsemanager_device_id', deviceId);
      sessionStorage.setItem('pulsemanager_device_id', deviceId);
      logger.info('Device ID stored successfully');
    } catch (error) {
      logger.error('Error storing device ID:', error);
    }
  }

  /**
   * Lädt gespeicherte Device ID oder generiert neue
   * @returns {string} Device ID
   */
  static getDeviceId() {
    try {
      let deviceId = localStorage.getItem('pulsemanager_device_id');
      
      if (!deviceId) {
        deviceId = this.generateFingerprint();
        this.storeDeviceId(deviceId);
      }
      
      return deviceId;
    } catch (error) {
      logger.error('Error getting device ID:', error);
      return this.generateFingerprint();
    }
  }

  /**
   * Validiert Lizenz für aktuelles Gerät
   * @param {string} licenseKey 
   * @param {string} deviceId 
   * @returns {boolean} Lizenz gültig für dieses Gerät
   */
  static async validateLicenseForDevice(licenseKey, deviceId) {
    try {
      const { supabase } = await import('./supabaseClient');
      
      const { data, error } = await supabase
        .from('device_licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error validating license:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error('Error in license validation:', error);
      return false;
    }
  }

  /**
   * Registriert Lizenz für aktuelles Gerät
   * @param {string} licenseKey 
   * @param {string} userId 
   * @returns {boolean} Registrierung erfolgreich
   */
  static async registerLicenseForDevice(licenseKey, userId) {
    try {
      const deviceId = this.getDeviceId();
      const { supabase } = await import('./supabaseClient');

      // Prüfe ob Lizenz bereits auf anderem Gerät verwendet wird
      const { data: existingLicense, error: checkError } = await supabase
        .from('device_licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .eq('is_active', true);

      if (checkError) {
        logger.error('Error checking existing license:', checkError);
        return false;
      }

      // Wenn Lizenz bereits auf anderem Gerät aktiv
      if (existingLicense && existingLicense.length > 0) {
        const existingDevice = existingLicense[0];
        if (existingDevice.device_id !== deviceId) {
          logger.warn('License already active on different device');
          return false;
        } else {
          // Bereits auf diesem Gerät registriert
          return true;
        }
      }

      // Registriere Lizenz für dieses Gerät
      const { data: newLicense, error: insertError } = await supabase
        .from('device_licenses')
        .insert({
          license_key: licenseKey,
          device_id: deviceId,
          user_id: userId,
          activated_at: new Date().toISOString(),
          is_active: true,
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          }
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Error registering license:', insertError);
        return false;
      }

      logger.info('License registered for device successfully');
      return true;
    } catch (error) {
      logger.error('Error in license registration:', error);
      return false;
    }
  }
}

export default DeviceFingerprintService; 