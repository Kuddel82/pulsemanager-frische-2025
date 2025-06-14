import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

// 💰 FORMATTING UTILITIES für PulseManager
// Datum: 2025-01-08 - BUILD-FIX

/**
 * Formatiert einen Wert als Währung (USD)
 * @param {number} value - Der zu formatierende Wert
 * @param {number} decimals - Anzahl der Dezimalstellen (default: 2)
 * @returns {string} Formatierter Währungswert
 */
export function formatCurrency(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }
  
  const num = parseFloat(value);
  
  // Für sehr kleine Werte, mehr Dezimalstellen anzeigen
  if (num > 0 && num < 0.01 && decimals === 2) {
    decimals = 6;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * Formatiert eine Zahl mit Tausendertrennzeichen
 * @param {number} value - Der zu formatierende Wert
 * @param {number} decimals - Anzahl der Dezimalstellen (default: 2)
 * @returns {string} Formatierte Zahl
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  const num = parseFloat(value);
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * Formatiert einen Wert als Prozentsatz
 * @param {number} value - Der zu formatierende Wert (z.B. 15.5 für 15.5%)
 * @param {number} decimals - Anzahl der Dezimalstellen (default: 2)
 * @returns {string} Formatierter Prozentsatz
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  
  const num = parseFloat(value);
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num) + '%';
}

/**
 * Formatiert einen großen Wert in kompakter Form (K, M, B)
 * @param {number} value - Der zu formatierende Wert
 * @param {number} decimals - Anzahl der Dezimalstellen (default: 1)
 * @returns {string} Kompakt formatierter Wert
 */
export function formatCompact(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  const num = parseFloat(value);
  
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * Formatiert ein Datum in deutschem Format
 * @param {Date|string} date - Das zu formatierende Datum
 * @returns {string} Formatiertes Datum
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formatiert ein Datum mit Zeit in deutschem Format
 * @param {Date|string} date - Das zu formatierende Datum
 * @returns {string} Formatiertes Datum mit Zeit
 */
export function formatDateTime(date) {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 🔧 SICHERE Zeit-Formatierung (verhindert toLocaleTimeString Crashes)
 * @param {Date|string|number} date - Das zu formatierende Datum
 * @returns {string} Formatierte Zeit
 */
export function formatTime(date) {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return dateObj.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.warn('formatTime error:', error, 'Input:', date);
    return 'Format Error';
  }
}

/**
 * Kürzt eine Adresse für die Anzeige
 * @param {string} address - Die zu kürzende Adresse
 * @param {number} startChars - Anzahl der Zeichen am Anfang (default: 6)
 * @param {number} endChars - Anzahl der Zeichen am Ende (default: 4)
 * @returns {string} Gekürzte Adresse
 */
export function shortenAddress(address, startChars = 6, endChars = 4) {
  if (!address || address.length <= startChars + endChars) {
    return address || '';
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validiert eine Ethereum-Adresse
 * @param {string} address - Die zu validierende Adresse
 * @returns {boolean} True wenn gültig
 */
export function isValidAddress(address) {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Berechnet die Zeitdifferenz in einem lesbaren Format
 * @param {Date|string} date - Das Datum
 * @returns {string} Zeitdifferenz (z.B. "vor 2 Stunden")
 */
export function timeAgo(date) {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'vor wenigen Sekunden';
  if (diffMin < 60) return `vor ${diffMin} Minute${diffMin !== 1 ? 'n' : ''}`;
  if (diffHour < 24) return `vor ${diffHour} Stunde${diffHour !== 1 ? 'n' : ''}`;
  if (diffDay < 30) return `vor ${diffDay} Tag${diffDay !== 1 ? 'en' : ''}`;
  
  return formatDate(dateObj);
}
