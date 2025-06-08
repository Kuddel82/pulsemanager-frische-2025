import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      isDOMError: false
    };
  }

  static getDerivedStateFromError(error) {
    // DOM-spezifische Fehler erkennen
    const isDOMError = error.message.includes('insertBefore') || 
                      error.message.includes('removeChild') ||
                      error.message.includes('Node') ||
                      error.name === 'NotFoundError';

    return { 
      hasError: true,
      isDOMError
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    console.error('🚨 RUNTIME ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    if (errorInfo.componentStack) {
      const failingComponent = errorInfo.componentStack.split('\n')[1]?.trim();
      console.error('🎯 FAILING COMPONENT:', failingComponent);
    }

    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isDOMError: false 
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, isDOMError } = this.state;

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <div className="max-w-lg w-full pulse-card p-8 text-center">
            {/* Icon */}
            <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold pulse-text mb-3">
              {isDOMError ? '🔧 DOM-Konflikt erkannt' : '💥 Unerwarteter Fehler'}
            </h1>

            {/* Error Message */}
            <div className="pulse-text-secondary text-sm mb-6">
              {isDOMError ? (
                <>
                  <p className="mb-3">
                    <strong>DOM-Rendering-Problem:</strong> React konnte ein UI-Element nicht korrekt rendern.
                  </p>
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-left">
                    <p className="text-xs font-mono text-red-300 break-all">
                      {error?.message || 'DOM Manipulation Error'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-3">Es ist ein unerwarteter Fehler aufgetreten.</p>
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-left">
                    <p className="text-xs font-mono text-red-300 break-all">
                      {error?.message || 'Unknown Error'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Fix Suggestions */}
            {isDOMError && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-blue-300 mb-2">🔧 Mögliche Lösungen:</h3>
                <ul className="text-xs text-blue-200/80 space-y-1">
                  <li>• Datenbank-Migration in Supabase ausführen</li>
                  <li>• Browser-Cache leeren (Ctrl+F5)</li>
                  <li>• Andere Browser-Tab/Fenster schließen</li>
                  <li>• Seite neu laden</li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-green-300 font-medium">Erneut versuchen</span>
              </button>

              <button
                onClick={this.handleRefresh}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-blue-300 font-medium">Seite neu laden</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="text-purple-300 font-medium">Zur Startseite</span>
              </button>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                  🐛 Debug-Informationen
                </summary>
                <div className="mt-2 p-3 bg-gray-800/50 rounded text-xs font-mono text-gray-300 max-h-32 overflow-auto">
                  <pre>{error.stack}</pre>
                </div>
              </details>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-white/10">
              <p className="text-xs pulse-text-secondary">
                PulseManager.vip • DOM-sicher & DSGVO-konform
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

export { ErrorBoundary };