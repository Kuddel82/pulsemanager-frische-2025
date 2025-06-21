import React from 'react';

const PulseChainBridgeView = () => {
  return (
    <div className="min-h-screen pulse-text p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold pulse-title mb-6">PulseChain Bridge</h1>
        
        <div className="pulse-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded flex items-center justify-center text-white font-bold text-sm">
              BR
            </div>
            <h2 className="text-xl font-bold pulse-text">PulseChain Bridge</h2>
          </div>
          
          <p className="pulse-text-secondary mb-4">
            Hier kannst du Tokens z.B. von Ethereum zur PulseChain senden
          </p>
          
          <a 
            href="https://bridge.pulsechain.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            🌉 Bridge öffnen
          </a>
        </div>
      </div>
    </div>
  );
};

export default PulseChainBridgeView; 