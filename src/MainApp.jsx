import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';

// 🔍 STEP 1: Testing Router (known working minimal + Router)

const DebugPage = () => (
  <div className="min-h-screen bg-slate-900 text-white p-8">
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4 text-green-400">
        🔍 STEP 1: ROUTER TEST
      </h1>
      <p className="text-xl mb-8">
        Testing if Router causes runtime errors
      </p>
      
      <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl mb-4">✅ Status Check</h2>
        <ul className="text-left space-y-2">
          <li>✅ ErrorBoundary: Working</li>
          <li>✅ Basic JSX: Working</li>
          <li>✅ CSS Classes: Working</li>
          <li>⏳ Router: Testing...</li>
          <li>⏳ Runtime Errors: Testing...</li>
        </ul>
      </div>
      
      <div className="mt-8 text-sm text-slate-400">
        <p>Testing Router system for runtime errors.</p>
        <p>Build: ROUTER-TEST - {new Date().toISOString()}</p>
      </div>
    </div>
  </div>
);

export default function MainApp() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="*" element={<DebugPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
} 