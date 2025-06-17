// Custom Cypress Commands für PulseManager

// Wallet-Adresse eingeben
Cypress.Commands.add('enterWalletAddress', (address) => {
  cy.get('[data-testid="wallet-input"]').type(address);
});

// Steuerreport generieren
Cypress.Commands.add('generateTaxReport', (walletAddress, year = 2024) => {
  cy.enterWalletAddress(walletAddress);
  cy.get('[data-testid="year-select"]').select(year.toString());
  cy.get('[data-testid="generate-button"]').click();
});

// Auf Ladevorgang warten
Cypress.Commands.add('waitForTaxReport', () => {
  cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist');
  cy.get('[data-testid="tax-report-result"]').should('be.visible');
});

// Mock Moralis API
Cypress.Commands.add('mockMoralis', (walletAddress, response) => {
  cy.intercept('GET', `**/**/${walletAddress}/**`, response);
});

// Validiere deutsche Steuerklassifikation
Cypress.Commands.add('validateGermanTaxClassification', () => {
  cy.get('[data-testid="roi-section"]').should('contain', '§22 EStG');
  cy.get('[data-testid="speculation-section"]').should('contain', '§23 EStG');
});

// Export-Funktionen testen
Cypress.Commands.add('exportReport', (format) => {
  cy.get(`[data-testid="export-${format}"]`).click();
  cy.get('[data-testid="download-started"]').should('be.visible');
});