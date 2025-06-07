import React, { createContext, useContext, useState } from 'react';

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState('de');
  
  // Simple translation function for emergency fix
  const t = (key) => {
    // Return the key itself as fallback
    return key;
  };

  const value = {
    language,
    setLanguage,
    t
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

export { TranslationContext }; 