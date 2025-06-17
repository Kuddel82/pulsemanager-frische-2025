const { GermanTaxService } = require('../../src/services/GermanTaxService');

describe('DSGVO-Compliance Tests für PulseManager', () => {
  let taxService;

  beforeEach(() => {
    taxService = new GermanTaxService();
  });

  describe('Datenschutz-Grundverordnung (DSGVO)', () => {
    test('sammelt keine unnötigen persönlichen Daten', () => {
      const walletData = {
        address: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        transactions: [
          { hash: '0x123', value: 100, timestamp: '2024-01-15' }
        ]
      };

      const processedData = taxService.processWalletData(walletData);

      // Nur öffentliche Blockchain-Daten erlaubt
      expect(processedData).toHaveProperty('address');
      expect(processedData).toHaveProperty('transactions');
      
      // Keine persönlichen Identifikatoren
      expect(processedData).not.toHaveProperty('userName');
      expect(processedData).not.toHaveProperty('email');
      expect(processedData).not.toHaveProperty('personalInfo');
      expect(processedData).not.toHaveProperty('ipAddress');
      expect(processedData).not.toHaveProperty('userAgent');
      expect(processedData).not.toHaveProperty('geolocation');
    });

    test('anonymisiert sensible Daten automatisch', () => {
      const sensitiveData = {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        userEmail: 'user@example.com', // Sollte entfernt werden
        ipAddress: '192.168.1.100', // Sollte entfernt werden
        sessionId: 'abc123', // Sollte entfernt werden
        transactions: []
      };

      const anonymized = taxService.anonymizeData(sensitiveData);

      expect(anonymized).toHaveProperty('walletAddress'); // Öffentlich, OK
      expect(anonymized).not.toHaveProperty('userEmail');
      expect(anonymized).not.toHaveProperty('ipAddress');
      expect(anonymized).not.toHaveProperty('sessionId');
    });

    test('implementiert Recht auf Vergessenwerden', async () => {
      const walletAddress = '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2';
      
      // Simuliere Cache-Daten
      await taxService.cacheTransactionData(walletAddress, { 
        transactions: [], 
        timestamp: Date.now() 
      });

      // Prüfe dass Daten gecacht sind
      const cachedData = await taxService.getCachedData(walletAddress);
      expect(cachedData).toBeDefined();

      // Lösche alle Daten (DSGVO Art. 17)
      await taxService.deleteAllUserData(walletAddress);

      // Prüfe dass alle Daten gelöscht sind
      const deletedData = await taxService.getCachedData(walletAddress);
      expect(deletedData).toBeNull();
    });

    test('minimiert Datensammlung nach Art. 5 DSGVO', () => {
      const fullBlockchainData = {
        address: '0x308e77',
        balance: '1000000',
        nonce: 42,
        code: '0x',
        storage: {},
        transactions: [],
        internalTransactions: [],
        tokenTransfers: [],
        nftTransfers: [],
        logs: [],
        traces: []
      };

      const minimizedData = taxService.minimizeDataCollection(fullBlockchainData);

      // Nur steuerlich relevante Daten behalten
      expect(minimizedData).toHaveProperty('address');
      expect(minimizedData).toHaveProperty('transactions');
      expect(minimizedData).toHaveProperty('tokenTransfers');

      // Nicht-relevante Daten entfernen
      expect(minimizedData).not.toHaveProperty('nonce');
      expect(minimizedData).not.toHaveProperty('code');
      expect(minimizedData).not.toHaveProperty('storage');
      expect(minimizedData).not.toHaveProperty('traces');
    });
  });

  describe('Datenspeicherung und -übertragung', () => {
    test('speichert keine Daten dauerhaft ohne Einwilligung', () => {
      const tempData = {
        walletAddress: '0x308e77',
        taxCalculation: { totalTax: 100 }
      };

      // Temporäre Verarbeitung OK
      const result = taxService.calculateTaxes(tempData);
      expect(result).toBeDefined();

      // Keine dauerhafte Speicherung ohne explizite Einwilligung
      const storedData = taxService.getPermanentStorage();
      expect(storedData).toBeNull();
    });

    test('verschlüsselt Cache-Daten wenn gespeichert', () => {
      const sensitiveData = {
        walletAddress: '0x308e77',
        taxData: { income: 5000, tax: 1250 }
      };

      const encrypted = taxService.encryptCacheData(sensitiveData);
      
      expect(encrypted).not.toContain('0x308e77'); // Adresse nicht im Klartext
      expect(encrypted).not.toContain('5000'); // Beträge nicht im Klartext
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    test('implementiert sicheren Datentransfer (TLS)', () => {
      const apiRequest = taxService.buildAPIRequest('0x308e77');
      
      expect(apiRequest.url).toMatch(/^https:/); // Nur HTTPS
      expect(apiRequest.headers).toHaveProperty('Content-Type');
      expect(apiRequest.headers).not.toHaveProperty('Authorization'); // Keine Auth-Token im Header
    });
  });

  describe('Benutzerrechte nach DSGVO', () => {
    test('implementiert Recht auf Auskunft (Art. 15)', async () => {
      const walletAddress = '0x308e77';
      
      const dataReport = await taxService.generateDataReport(walletAddress);
      
      expect(dataReport).toHaveProperty('dataCategories');
      expect(dataReport).toHaveProperty('processingPurpose');
      expect(dataReport).toHaveProperty('dataRetentionPeriod');
      expect(dataReport).toHaveProperty('dataProcessingLegalBasis');
      
      expect(dataReport.processingPurpose).toBe('Steuerberechnung nach deutschem Recht');
      expect(dataReport.dataRetentionPeriod).toBe('Temporär für Verarbeitung');
      expect(dataReport.dataProcessingLegalBasis).toBe('Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)');
    });

    test('implementiert Recht auf Datenübertragbarkeit (Art. 20)', async () => {
      const walletAddress = '0x308e77';
      const testData = { transactions: [], calculations: {} };
      
      await taxService.cacheTransactionData(walletAddress, testData);
      
      const exportedData = await taxService.exportUserData(walletAddress, 'json');
      
      expect(exportedData.format).toBe('json');
      expect(exportedData.data).toBeDefined();
      expect(typeof exportedData.data).toBe('object');
      expect(exportedData.data).toEqual(testData);
    });

    test('implementiert Recht auf Berichtigung (Art. 16)', async () => {
      const walletAddress = '0x308e77';
      const incorrectData = { 
        calculatedTax: 1000, 
        transactions: [{ value: 100, corrected: false }] 
      };
      
      await taxService.cacheTransactionData(walletAddress, incorrectData);
      
      const correctedData = { 
        calculatedTax: 750, 
        transactions: [{ value: 75, corrected: true }] 
      };
      
      await taxService.correctUserData(walletAddress, correctedData);
      
      const retrievedData = await taxService.getCachedData(walletAddress);
      expect(retrievedData.calculatedTax).toBe(750);
      expect(retrievedData.transactions[0].corrected).toBe(true);
    });
  });

  describe('Technische Sicherheitsmaßnahmen', () => {
    test('validiert alle Eingaben gegen Injection-Angriffe', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        '<script>alert("xss")</script>',
        '0x308e77\' OR 1=1',
        '../../../etc/passwd',
        '${process.env.SECRET_KEY}'
      ];

      maliciousInputs.forEach(maliciousInput => {
        expect(() => {
          taxService.validateWalletAddress(maliciousInput);
        }).toThrow('Ungültige Wallet-Adresse');
      });
    });

    test('implementiert Rate Limiting für API-Schutz', async () => {
      const walletAddress = '0x308e77';
      const requests = [];

      // Simuliere viele schnelle Anfragen
      for (let i = 0; i < 20; i++) {
        requests.push(taxService.processRequest(walletAddress));
      }

      const results = await Promise.allSettled(requests);
      const rejectedRequests = results.filter(r => r.status === 'rejected');
      
      expect(rejectedRequests.length).toBeGreaterThan(0);
      expect(rejectedRequests[0].reason.message).toContain('Rate limit exceeded');
    });

    test('loggt sicherheitsrelevante Ereignisse', async () => {
      const securityLog = [];
      
      // Mock security logger
      jest.spyOn(taxService, 'logSecurityEvent').mockImplementation((event) => {
        securityLog.push(event);
      });

      // Teste verschiedene sicherheitsrelevante Aktionen
      await taxService.validateWalletAddress('invalid-address');
      await taxService.processLargeDataSet([]);
      await taxService.exportUserData('0x308e77', 'json');

      expect(securityLog.length).toBeGreaterThan(0);
      expect(securityLog).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: 'validation_error',
            severity: 'medium'
          }),
          expect.objectContaining({ 
            type: 'data_export',
            severity: 'low'
          })
        ])
      );
    });
  });

  describe('Rechtskonformität Deutschland', () => {
    test('erfüllt deutsche Datenschutzbestimmungen', () => {
      const complianceCheck = taxService.checkGermanDataProtectionCompliance();
      
      expect(complianceCheck.bdsg).toBe(true); // Bundesdatenschutzgesetz
      expect(complianceCheck.dsgvo).toBe(true); // DSGVO
      expect(complianceCheck.ttdsg).toBe(true); // Telekommunikation-Telemedien-Datenschutz-Gesetz
      expect(complianceCheck.steuerrecht).toBe(true); // Steuerliche Compliance
    });

    test('implementiert erforderliche Cookie-Einstellungen', () => {
      const cookieSettings = taxService.getCookieSettings();
      
      expect(cookieSettings.necessary).toBe(true); // Technisch notwendig
      expect(cookieSettings.analytics).toBe(false); // Opt-in erforderlich
      expect(cookieSettings.marketing).toBe(false); // Opt-in erforderlich
      expect(cookieSettings.functional).toBe(false); // Opt-in erforderlich
    });

    test('bietet Datenschutzerklärung in deutscher Sprache', () => {
      const privacyPolicy = taxService.getPrivacyPolicy('de');
      
      expect(privacyPolicy.language).toBe('de');
      expect(privacyPolicy.content).toContain('Datenschutzerklärung');
      expect(privacyPolicy.content).toContain('Verantwortlicher');
      expect(privacyPolicy.content).toContain('Betroffenenrechte');
      expect(privacyPolicy.content).toContain('Rechtsgrundlage');
    });
  });

  describe('Incident Response', () => {
    test('hat Notfallplan für Datenschutzverletzungen', () => {
      const incidentResponse = taxService.getIncidentResponsePlan();
      
      expect(incidentResponse).toHaveProperty('detectionProcedures');
      expect(incidentResponse).toHaveProperty('notificationTimeline'); // 72h Regel
      expect(incidentResponse).toHaveProperty('affectedUsersNotification');
      expect(incidentResponse).toHaveProperty('datenschutzbeauftragter');
      
      expect(incidentResponse.notificationTimeline.maxHours).toBe(72);
    });

    test('kann betroffene Benutzer bei Breach benachrichtigen', async () => {
      const breach = {
        type: 'unauthorized_access',
        affectedWallets: ['0x308e77'],
        severity: 'high',
        timestamp: new Date()
      };

      const notifications = await taxService.handleDataBreach(breach);
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toHaveProperty('recipient');
      expect(notifications[0]).toHaveProperty('message');
      expect(notifications[0].message).toContain('Datenschutzverletzung');
      expect(notifications[0].message).toContain('sofortige Maßnahmen');
    });
  });
}); 