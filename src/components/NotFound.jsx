import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen pulse-bg flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* 🎯 PulseChain Header */}
        <div className="h-20 w-20 pulse-border-gradient flex items-center justify-center mx-auto mb-6">
          <div className="h-18 w-18 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
            <span className="text-3xl font-bold text-black">PM</span>
          </div>
        </div>

        <h1 className="text-6xl font-bold pulse-text mb-4">404</h1>
        <h2 className="text-2xl font-bold pulse-text mb-4">Seite nicht gefunden</h2>
        <p className="pulse-text-secondary mb-8">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Home className="h-5 w-5" />
            Zum Dashboard
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 px-6 bg-white/5 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Zurück
          </button>
        </div>

        <p className="text-sm pulse-text-secondary mt-6">
          Du wirst in 5 Sekunden automatisch weitergeleitet...
        </p>
        
        <div className="pulse-community-badge mt-4">
          🟢 PulseManager Community Edition
        </div>
      </div>
    </div>
  );
};

export default NotFound; 