const request = require('supertest');
const { createMocks } = require('node-mocks-http');
const germanTaxReportHandler = require('../../api/german-tax-report');

describe('/api/german-tax-report - Deutsche Steuerreport API', () => {
  test('generiert erfolgreichen Steuerreport für WGEP Wallet', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        includeROI: true,
        includeTrades: true
      }
    });

    await germanTaxReportHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(true);
    expect(responseData.data).toHaveProperty('walletAddress');
    expect(responseData.data).toHaveProperty('period');
    expect(responseData.data).toHaveProperty('transactions');
    expect(responseData.data).toHaveProperty('summary');
  });

  test('validiert erforderliche Wallet-Adresse', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    });

    await germanTaxReportHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Wallet-Adresse ist erforderlich'
    });
  });

  test('validiert Ethereum-Adressformat', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: 'invalid-address',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    });

    await germanTaxReportHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Ungültiges Wallet-Adressformat'
    });
  });

  test('klassifiziert ROI-Transaktionen nach §22 EStG', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        includeROI: true
      }
    });

    await germanTaxReportHandler(req, res);

    const responseData = JSON.parse(res._getData());
    const roiTransactions = responseData.data.transactions.filter(t => t.type === 'ROI');
    
    roiTransactions.forEach(transaction => {
      expect(transaction.taxType).toBe('§22 EStG');
      expect(transaction).toHaveProperty('valueEUR');
      expect(transaction.valueEUR).toBeGreaterThan(0);
    });
  });

  test('wendet FIFO-Berechnung für Trades an', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        includeTrades: true,
        fifoCalculation: true
      }
    });

    await germanTaxReportHandler(req, res);

    const responseData = JSON.parse(res._getData());
    const tradeTransactions = responseData.data.transactions.filter(t => t.type === 'TRADE');
    
    if (tradeTransactions.length > 0) {
      tradeTransactions.forEach(trade => {
        expect(trade).toHaveProperty('fifoPosition');
        expect(trade).toHaveProperty('costBasis');
        expect(trade).toHaveProperty('profitLoss');
      });
    }
  });

  test('berechnet korrekte Steuersummen', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    });

    await germanTaxReportHandler(req, res);

    const responseData = JSON.parse(res._getData());
    const summary = responseData.data.summary;
    
    expect(summary).toHaveProperty('totalROIIncome');
    expect(summary).toHaveProperty('totalCapitalGains');
    expect(summary).toHaveProperty('totalTaxableAmount');
    expect(summary).toHaveProperty('estimatedTax');
    
    // Validiere Berechnungslogik
    expect(summary.totalTaxableAmount).toBe(
      summary.totalROIIncome + summary.totalCapitalGains
    );
  });

  test('erkennt WGEP-spezifische ROI-Patterns', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        tokenFilter: 'WGEP'
      }
    });

    await germanTaxReportHandler(req, res);

    const responseData = JSON.parse(res._getData());
    const wgepTransactions = responseData.data.transactions.filter(
      t => t.tokenSymbol === 'WGEP'
    );
    
    wgepTransactions.forEach(transaction => {
      expect(['ROI', 'TRADE', 'TRANSFER']).toContain(transaction.type);
      if (transaction.type === 'ROI') {
        expect(transaction.source).toBeDefined();
        expect(['DEX_SWAP', 'POOL_REWARD', 'AIRDROP']).toContain(transaction.source);
      }
    });
  });

  test('behandelt leere Transaktionshistorie gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: '0x0000000000000000000000000000000000000000',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    });

    await germanTaxReportHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const responseData = JSON.parse(res._getData());
    expect(responseData.data.transactions).toHaveLength(0);
    expect(responseData.data.summary.totalROIIncome).toBe(0);
    expect(responseData.data.summary.totalCapitalGains).toBe(0);
  });

  test('unterstützt verschiedene Exportformate', async () => {
    const formats = ['pdf', 'csv', 'elster', 'json'];
    
    for (const format of formats) {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          exportFormat: format
        }
      });

      await germanTaxReportHandler(req, res);
      
      if (format === 'json') {
        expect(res._getStatusCode()).toBe(200);
        expect(res._getHeaders()['content-type']).toContain('application/json');
      } else {
        expect([200, 202]).toContain(res._getStatusCode()); // 202 für async Generierung
      }
    }
  });

  test('begrenzt Anfragen pro Benutzer (Rate Limiting)', async () => {
    const walletAddress = '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2';
    
    // Simuliere mehrere schnelle Anfragen
    const requests = Array.from({ length: 6 }, () => createMocks({
      method: 'POST',
      body: {
        walletAddress,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      headers: {
        'x-forwarded-for': '192.168.1.100'
      }
    }));

    let rateLimitedResponses = 0;
    
    for (const { req, res } of requests) {
      await germanTaxReportHandler(req, res);
      if (res._getStatusCode() === 429) {
        rateLimitedResponses++;
      }
    }
    
    expect(rateLimitedResponses).toBeGreaterThan(0);
  });

  test('validiert Zeitraumparameter', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        startDate: '2024-12-31',
        endDate: '2024-01-01' // End vor Start
      }
    });

    await germanTaxReportHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Enddatum muss nach Startdatum liegen'
    });
  });

  test('behandelt Moralis API-Fehler gracefully', async () => {
    // Mock Moralis API Fehler
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(
      new Error('Moralis API Unavailable')
    );

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    });

    await germanTaxReportHandler(req, res);

    expect(res._getStatusCode()).toBe(503);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Blockchain-Daten temporär nicht verfügbar'
    });
  });

  test('verwendet strukturierte Token-Preise für ROI-Berechnungen', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        useStructuredPricing: true
      }
    });

    await germanTaxReportHandler(req, res);

    const responseData = JSON.parse(res._getData());
    const roiTransactions = responseData.data.transactions.filter(t => t.type === 'ROI');
    
    roiTransactions.forEach(transaction => {
      expect(transaction.valueEUR).toBeGreaterThan(0);
      expect(transaction.priceSource).toBeDefined();
      expect(transaction.priceSource).not.toBe('Phantasie-Preis');
    });
  });

  test('erstellt DSGVO-konforme Berichte', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    });

    await germanTaxReportHandler(req, res);

    const responseData = JSON.parse(res._getData());
    
    // Überprüfe DSGVO-Konformität
    expect(responseData.data).not.toHaveProperty('userPersonalData');
    expect(responseData.data).not.toHaveProperty('ipAddress');
    expect(responseData.data).not.toHaveProperty('userAgent');
    
    // Wallet-Adresse ist öffentlich, daher OK
    expect(responseData.data.walletAddress).toBeDefined();
  });

  test('Performance-Test für große Transaktionshistorien', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        startDate: '2020-01-01', // Längerer Zeitraum
        endDate: '2024-12-31',
        includeAllTokens: true
      }
    });

    const startTime = Date.now();
    await germanTaxReportHandler(req, res);
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    expect(res._getStatusCode()).toBe(200);
    expect(processingTime).toBeLessThan(10000); // Unter 10 Sekunden
  });
}); 