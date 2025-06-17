/**
 * 🇩🇪 TAX EXPORT VIEW
 * 
 * Dedizierte Seite für deutsche Steuer-Exports
 * Integration des TaxExportInterface Components
 */

import React from 'react';
import TaxExportInterface from '../components/tax/TaxExportInterface.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const TaxExportView = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <TaxExportInterface 
        walletAddress=""
        taxData={null}
      />
    </div>
  );
};

export default TaxExportView; 