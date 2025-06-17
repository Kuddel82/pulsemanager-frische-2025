// Cypress Support Commands für PulseManager

import './commands';

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignoriere spezifische Fehler die durch externe Services verursacht werden
  if (err.message.includes('Moralis') || err.message.includes('ResizeObserver')) {
    return false;
  }
  
  return true;
});

// Setup für jeden Test
beforeEach(() => {
  // Mock externe APIs
  cy.intercept('GET', '**/moralis.io/**', { fixture: 'moralis-response.json' });
  cy.intercept('POST', '/api/german-tax-report', { fixture: 'tax-report.json' });
  
  // Setze Viewport
  cy.viewport(1280, 720);
});