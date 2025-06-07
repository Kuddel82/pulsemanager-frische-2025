import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

// 🔍 ULTRA-MINIMAL APP: Systematische Component-Elimination
// Lädt nur das absolute Minimum um den problematischen Component zu identifizieren

export default function MainApp() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4 text-green-400">
            🔍 MINIMAL APP - DEBUG MODE
          </h1>
          <p className="text-xl mb-8">
            Testing if runtime errors persist with minimal component setup
          </p>
          
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl mb-4">✅ Status Check</h2>
            <ul className="text-left space-y-2">
              <li>✅ ErrorBoundary: Working</li>
              <li>✅ Basic JSX: Working</li>
              <li>✅ CSS Classes: Working</li>
              <li>⏳ Runtime Errors: Testing...</li>
            </ul>
          </div>
          
          <div className="mt-8 text-sm text-slate-400">
            <p>If this loads without errors, the problem is in a specific component.</p>
            <p>Build: MINIMAL - {new Date().toISOString()}</p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 