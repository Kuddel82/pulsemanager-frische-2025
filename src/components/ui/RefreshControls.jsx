import { useState } from 'react';

/**
 * 🔄 REFRESH-CONTROL BUTTONS FÜR:
 * - Portfolio
 * - ROI-Tracker
 * - Steuerreport
 *
 * ✅ Kein automatischer Reload!
 * ✅ Nur manuell durch Benutzerklick!
 *
 * ⚠️ Hinweis an Entwickler / Cursor:
 * ❗ Bitte prüfen, ob sich im Code noch automatische Fetches bei
 * - Seitenwechsel
 * - Component-Mount
 * - Login/Logout
 * - Navigation
 * befinden.
 * 
 * Diese müssen vollständig entfernt oder deaktiviert werden!
 * Nur der Button soll den Refresh triggern.
 */

export default function RefreshControls({ userId, wallet }) {
  const [loading, setLoading] = useState({
    portfolio: false,
    roi: false,
    tax: false
  });

  const handleRefresh = async (type) => {
    setLoading((prev) => ({ ...prev, [type]: true }));

    let endpoint = '';
    if (type === 'portfolio') endpoint = '/api/refresh-portfolio';
    if (type === 'roi') endpoint = '/api/refresh-roi';
    if (type === 'tax') endpoint = '/api/refresh-tax';

    const url = `${endpoint}?userId=${userId}&wallet=${wallet}`;
    const res = await fetch(url);
    const data = await res.json();

    console.log(`🔄 ${type} Refresh Ergebnis:`, data);

    setLoading((prev) => ({ ...prev, [type]: false }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
      <button onClick={() => handleRefresh('portfolio')} disabled={loading.portfolio}>
        {loading.portfolio ? '⏳ Portfolio lädt...' : '🔄 Portfolio aktualisieren'}
      </button>

      <button onClick={() => handleRefresh('roi')} disabled={loading.roi}>
        {loading.roi ? '⏳ ROI lädt...' : '🔄 Einnahmen (ROI) aktualisieren'}
      </button>

      <button onClick={() => handleRefresh('tax')} disabled={loading.tax}>
        {loading.tax ? '⏳ Steuerdaten laden...' : '🔄 Steuerreport aktualisieren'}
      </button>
    </div>
  );
} 