describe('🔥 PulseManager Steuerreport E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/tax-report');
    
    // Mock externe APIs
    cy.mockMoralis('0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2', {
      fixture: 'moralis-response.json'
    });
  });

  describe('Grundfunktionalität', () => {
    it('lädt die Steuerreport-Seite korrekt', () => {
      cy.get('[data-testid="page-title"]').should('contain', '🔥 STEUERREPORT');
      cy.get('[data-testid="subtitle"]').should('contain', 'Deutsches Steuerrecht-konform');
      
      // Prüfe Eingabefelder
      cy.get('[data-testid="wallet-input"]').should('be.visible');
      cy.get('[data-testid="year-select"]').should('be.visible');
      cy.get('[data-testid="generate-button"]').should('be.visible');
    });

    it('zeigt deutsche Steuerrecht-Informationen an', () => {
      cy.get('[data-testid="tax-info"]').should('contain', '§22 EStG');
      cy.get('[data-testid="tax-info"]').should('contain', '§23 EStG');
      cy.get('[data-testid="tax-info"]').should('contain', '600€ Freigrenze');
      cy.get('[data-testid="tax-info"]').should('contain', 'FIFO-Methode');
    });
  });

  describe('Wallet-Validierung', () => {
    it('validiert leere Wallet-Adresse', () => {
      cy.get('[data-testid="generate-button"]').click();
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Bitte geben Sie eine Wallet-Adresse ein');
    });

    it('validiert ungültiges Wallet-Format', () => {
      cy.enterWalletAddress('invalid-wallet');
      cy.get('[data-testid="generate-button"]').click();
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Ungültiges Wallet-Adressformat');
    });

    it('akzeptiert gültige Ethereum-Adresse', () => {
      cy.enterWalletAddress('0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2');
      cy.get('[data-testid="error-message"]').should('not.exist');
      cy.get('[data-testid="wallet-input"]').should('have.class', 'valid');
    });
  });

  describe('WGEP Test-Button (Spezial-Wallet)', () => {
    it('führt WGEP-Test mit vordefinierten Daten durch', () => {
      cy.intercept('POST', '/api/german-tax-report', {
        fixture: 'tax-report.json'
      }).as('taxReportRequest');

      cy.get('[data-testid="wgep-test-button"]')
        .should('contain', '🚀 WGEP Test (0x308e77)')
        .click();

      cy.wait('@taxReportRequest').then((interception) => {
        expect(interception.request.body).to.deep.include({
          walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
          highlightWGEP: true,
          testMode: true
        });
      });

      cy.waitForTaxReport();
      cy.validateGermanTaxClassification();
    });
  });

  describe('Steuerreport-Generierung', () => {
    it('generiert vollständigen Steuerreport für 2024', () => {
      cy.intercept('POST', '/api/german-tax-report', {
        fixture: 'tax-report.json'
      }).as('taxReportRequest');

      cy.generateTaxReport('0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2', 2024);

      // Prüfe Request-Parameter
      cy.wait('@taxReportRequest').then((interception) => {
        expect(interception.request.body).to.deep.include({
          walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
          year: 2024,
          includeROI: true,
          includeTrades: true,
          useFIFO: true
        });
      });

      cy.waitForTaxReport();
      
      // Prüfe Ergebnisse
      cy.get('[data-testid="success-message"]')
        .should('contain', 'Steuerreport erfolgreich generiert');
    });

    it('zeigt Ladeindikator während Generierung', () => {
      cy.intercept('POST', '/api/german-tax-report', {
        delay: 2000,
        fixture: 'tax-report.json'
      });

      cy.generateTaxReport('0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2');

      // Prüfe Loading-Zustand
      cy.get('[data-testid="loading"]').should('be.visible');
      cy.get('[data-testid="loading-text"]').should('contain', 'Generiere Steuerreport');
      cy.get('[data-testid="generate-button"]').should('be.disabled');

      // Warte auf Completion
      cy.waitForTaxReport();
      cy.get('[data-testid="loading"]').should('not.exist');
      cy.get('[data-testid="generate-button"]').should('be.enabled');
    });
  });

  describe('Transaktionsanzeige', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/german-tax-report', {
        fixture: 'tax-report.json'
      });
      cy.generateTaxReport('0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2');
      cy.waitForTaxReport();
    });

    it('zeigt ROI-Transaktionen mit korrekter Klassifikation', () => {
      cy.get('[data-testid="transactions-tab"]').click();
      
      cy.get('[data-testid="transaction-row"]').first().within(() => {
        cy.get('[data-testid="token-symbol"]').should('contain', 'WGEP');
        cy.get('[data-testid="transaction-type"]').should('contain', 'ROI');
        cy.get('[data-testid="tax-type"]').should('contain', '§22 EStG');
        cy.get('[data-testid="value-eur"]').should('contain', '50,00 €');
      });
    });

    it('filtert Transaktionen nach Token', () => {
      cy.get('[data-testid="transactions-tab"]').click();
      
      // Alle Transaktionen anzeigen
      cy.get('[data-testid="transaction-row"]').should('have.length.greaterThan', 0);
      
      // Filter nach WGEP
      cy.get('[data-testid="token-filter"]').select('WGEP');
      cy.get('[data-testid="transaction-row"]').each(($row) => {
        cy.wrap($row).find('[data-testid="token-symbol"]').should('contain', 'WGEP');
      });
      
      // Filter zurücksetzen
      cy.get('[data-testid="token-filter"]').select('Alle');
      cy.get('[data-testid="transaction-row"]').should('have.length.greaterThan', 0);
    });

    it('sortiert Transaktionen nach Datum', () => {
      cy.get('[data-testid="transactions-tab"]').click();
      
      cy.get('[data-testid="sort-date"]').click();
      
      // Prüfe Sortierung (neueste zuerst)
      cy.get('[data-testid="transaction-date"]').then(($dates) => {
        const dates = $dates.toArray().map(el => new Date(el.textContent));
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1].getTime()).to.be.greaterThan(dates[i].getTime());
        }
      });
    });
  });

  describe('Steuerzusammenfassung', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/german-tax-report', {
        fixture: 'tax-report.json'
      });
      cy.generateTaxReport('0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2');
      cy.waitForTaxReport();
    });

    it('zeigt ROI-Einkommen nach §22 EStG', () => {
      cy.get('[data-testid="summary-section"]').within(() => {
        cy.get('[data-testid="roi-income"]').should('contain', '50,00 €');
        cy.get('[data-testid="roi-tax-type"]').should('contain', '§22 EStG');
        cy.get('[data-testid="roi-description"]').should('contain', 'Sonstige Einkünfte');
      });
    });

    it('zeigt Spekulationsgewinne nach §23 EStG', () => {
      cy.get('[data-testid="summary-section"]').within(() => {
        cy.get('[data-testid="speculation-gains"]').should('be.visible');
        cy.get('[data-testid="speculation-tax-type"]').should('contain', '§23 EStG');
        cy.get('[data-testid="exemption-info"]').should('contain', '600€ Freigrenze');
      });
    });

    it('berechnet geschätzte Steuer korrekt', () => {
      cy.get('[data-testid="summary-section"]').within(() => {
        cy.get('[data-testid="estimated-tax"]').should('contain', '12,50 €');
        cy.get('[data-testid="tax-calculation"]').should('contain', 'Progressiver Einkommensteuersatz');
      });
    });
  });

  describe('Export-Funktionen', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/german-tax-report', {
        fixture: 'tax-report.json'
      });
      cy.generateTaxReport('0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2');
      cy.waitForTaxReport();
      cy.get('[data-testid="export-tab"]').click();
    });

    it('exportiert PDF-Report', () => {
      cy.intercept('POST', '/api/export-pdf', {
        statusCode: 200,
        headers: { 'Content-Type': 'application/pdf' },
        body: 'PDF-Content'
      }).as('pdfExport');

      cy.exportReport('pdf');
      
      cy.wait('@pdfExport').then((interception) => {
        expect(interception.request.headers['content-type']).to.contain('application/json');
      });
      
      cy.get('[data-testid="download-started"]')
        .should('contain', 'PDF-Download gestartet');
    });

    it('exportiert CSV-Report', () => {
      cy.intercept('POST', '/api/export-csv', {
        statusCode: 200,
        headers: { 'Content-Type': 'text/csv' },
        body: 'CSV-Content'
      }).as('csvExport');

      cy.exportReport('csv');
      
      cy.wait('@csvExport');
      cy.get('[data-testid="download-started"]')
        .should('contain', 'CSV-Download gestartet');
    });

    it('exportiert ELSTER-Format', () => {
      cy.intercept('POST', '/api/export-elster', {
        statusCode: 200,
        headers: { 'Content-Type': 'application/xml' },
        body: 'ELSTER-XML-Content'
      }).as('elsterExport');

      cy.exportReport('elster');
      
      cy.wait('@elsterExport');
      cy.get('[data-testid="download-started"]')
        .should('contain', 'ELSTER-Export gestartet');
    });
  });

  describe('Fehlerbehandlung', () => {
    it('behandelt API-Fehler gracefully', () => {
      cy.intercept('POST', '/api/german-tax-report', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      });

      cy.generateTaxReport('0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Fehler beim Generieren des Steuerreports');
      
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('behandelt Netzwerk-Timeouts', () => {
      cy.intercept('POST', '/api/german-tax-report', {
        delay: 15000,
        forceNetworkError: true
      });

      cy.generateTaxReport('0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2');

      cy.get('[data-testid="timeout-error"]', { timeout: 20000 })
        .should('contain', 'Zeitüberschreitung');
    });

    it('behandelt leere Wallet gracefully', () => {
      cy.intercept('POST', '/api/german-tax-report', {
        fixture: 'empty-wallet.json'
      });

      cy.generateTaxReport('0x0000000000000000000000000000000000000000');
      cy.waitForTaxReport();

      cy.get('[data-testid="no-transactions"]')
        .should('contain', 'Keine Transaktionen gefunden');
      
      cy.get('[data-testid="summary-section"]').within(() => {
        cy.get('[data-testid="total-tax"]').should('contain', '0,00 €');
      });
    });
  });

  describe('Responsive Design', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 }
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`funktioniert korrekt auf ${name} (${width}x${height})`, () => {
        cy.viewport(width, height);
        
        // Grundfunktionalität prüfen
        cy.get('[data-testid="wallet-input"]').should('be.visible');
        cy.get('[data-testid="generate-button"]').should('be.visible');
        
        if (width < 768) {
          // Mobile: Prüfe Hamburger-Menü
          cy.get('[data-testid="mobile-menu"]').should('be.visible');
        } else {
          // Desktop/Tablet: Normale Navigation
          cy.get('[data-testid="desktop-nav"]').should('be.visible');
        }
      });
    });
  });

  describe('Accessibility (A11y)', () => {
    it('ist keyboard-navigierbar', () => {
      // Tab-Navigation testen
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'wallet-input');
      
      cy.tab();
      cy.focused().should('have.attr', 'data-testid', 'year-select');
      
      cy.tab();
      cy.focused().should('have.attr', 'data-testid', 'generate-button');
    });

    it('hat korrekte ARIA-Labels', () => {
      cy.get('[data-testid="wallet-input"]')
        .should('have.attr', 'aria-label', 'Wallet-Adresse eingeben');
      
      cy.get('[data-testid="year-select"]')
        .should('have.attr', 'aria-label', 'Steuerjahr auswählen');
      
      cy.get('[data-testid="generate-button"]')
        .should('have.attr', 'aria-label', 'Steuerreport generieren');
    });

    it('funktioniert mit Screen Readers', () => {
      cy.get('[role="main"]').should('exist');
      cy.get('[role="button"]').should('have.length.greaterThan', 0);
      cy.get('[role="textbox"]').should('exist');
    });
  });

  describe('Performance', () => {
    it('lädt die Seite in unter 3 Sekunden', () => {
      const startTime = Date.now();
      
      cy.visit('/tax-report').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it('rendert große Transaktionslisten performant', () => {
      // Mock große Transaktionsliste
      cy.intercept('POST', '/api/german-tax-report', {
        fixture: 'large-transaction-list.json'
      });

      const startTime = Date.now();
      cy.generateTaxReport('0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2');
      cy.waitForTaxReport().then(() => {
        const renderTime = Date.now() - startTime;
        expect(renderTime).to.be.lessThan(5000);
      });
      
      cy.get('[data-testid="transactions-tab"]').click();
      cy.get('[data-testid="transaction-row"]').should('have.length', 100);
    });
  });

  describe('Browser-Kompatibilität', () => {
    it('funktioniert in verschiedenen Browsern', () => {
      // Diese Tests würden normalerweise mit Cross-Browser-Testing Tools laufen
      cy.window().should('have.property', 'fetch');
      cy.window().should('have.property', 'localStorage');
      cy.window().should('have.property', 'sessionStorage');
    });
  });
}); 