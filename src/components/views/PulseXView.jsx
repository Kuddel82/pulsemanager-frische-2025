import React from 'react';

const PulseXView = () => {
  return (
    <div className="min-h-screen pulse-text p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold pulse-title mb-6">PulseX</h1>
        
        <div className="pulse-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded flex items-center justify-center text-white font-bold text-sm">
              PX
            </div>
            <h2 className="text-xl font-bold pulse-text">PulseX</h2>
          </div>
          
          <p className="pulse-text-secondary mb-4">
            Hier kannst du Token kaufen & tauschen
          </p>
          
          <a 
            href="https://app.pulsex.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            🚀 PulseX öffnen
          </a>
        </div>
      </div>
    </div>
  );
};

export default PulseXView; 