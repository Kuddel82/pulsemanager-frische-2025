import React from 'react';

const GermanTaxDisplay = ({ taxData }) => {
  if (!taxData?.deutschesSteuerrecht) return null;
  
  const { gekaufteCoins, roiEvents, summary } = taxData.deutschesSteuerrecht;
  
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-black">🇩🇪 Deutsches Steuerrecht - Automatische Kategorisierung</h3>
      
      {/* GEKAUFTE COINS */}
      <div className="mb-6">
        <h4 className="font-semibold text-black mb-2">💰 Gekaufte Coins (mit Haltefrist)</h4>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-black">{summary.gekaufteCoins.anzahl}</div>
            <div className="text-sm text-black">Käufe</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black">{summary.gekaufteCoins.steuerfreiAnzahl}</div>
            <div className="text-sm text-black">Steuerfrei (>1 Jahr)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black">€{summary.gekaufteCoins.gesamtwert.toFixed(2)}</div>
            <div className="text-sm text-black">Gesamtwert</div>
          </div>
        </div>
        
        <div className="max-h-48 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-100">
                <th className="p-2 text-left text-black">Token</th>
                <th className="p-2 text-left text-black">Kaufpreis</th>
                <th className="p-2 text-left text-black">Kaufdatum</th>
                <th className="p-2 text-left text-black">Haltefrist</th>
                <th className="p-2 text-left text-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {gekaufteCoins.slice(0, 10).map((coin, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 text-black">{coin.token_symbol}</td>
                  <td className="p-2 text-black">€{coin.kaufpreis?.toFixed(2)}</td>
                  <td className="p-2 text-black">{new Date(coin.kaufdatum).toLocaleDateString('de-DE')}</td>
                  <td className="p-2 text-black">{coin.haltefristTage} Tage</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      coin.haltefristTage >= 365 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {coin.haltefristTage >= 365 ? 'Steuerfrei' : 'Steuerpflichtig'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ROI EVENTS */}
      <div className="mb-6">
        <h4 className="font-semibold text-black mb-2">🎯 ROI Events (immer steuerpflichtig)</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-black">{summary.roiEvents.anzahl}</div>
            <div className="text-sm text-black">ROI Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black">€{summary.roiEvents.steuerpflichtigerWert.toFixed(2)}</div>
            <div className="text-sm text-black">Steuerpflichtiger Wert</div>
          </div>
        </div>
        
        <div className="max-h-48 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-100">
                <th className="p-2 text-left text-black">Token</th>
                <th className="p-2 text-left text-black">ROI Wert</th>
                <th className="p-2 text-left text-black">Datum</th>
                <th className="p-2 text-left text-black">Contract</th>
                <th className="p-2 text-left text-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {roiEvents.slice(0, 10).map((roi, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 text-black">{roi.token_symbol}</td>
                  <td className="p-2 text-black">€{roi.roiWert?.toFixed(2)}</td>
                  <td className="p-2 text-black">{new Date(roi.roiDatum).toLocaleDateString('de-DE')}</td>
                  <td className="p-2 text-xs text-black">{roi.printerContract?.substring(0, 10)}...</td>
                  <td className="p-2">
                    <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                      Steuerpflichtig
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mt-4">
        <p className="text-sm text-black">
          <strong>⚠️ Automatische Kategorisierung:</strong> Basiert auf Moralis Contract Detection. 
          Für finale Steuerberechnung wenden Sie sich an einen qualifizierten Steuerberater.
        </p>
      </div>
    </div>
  );
};

export default GermanTaxDisplay; 