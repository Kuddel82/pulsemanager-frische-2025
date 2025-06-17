import { GermanTaxService } from '../../src/services/GermanTaxService';

describe('GermanTaxService - Deutsches Steuerrecht Tests', () => {
  let taxService;

  beforeEach(() => {
    taxService = new GermanTaxService();
  });

  describe('§22 EStG - Sonstige Einkünfte (ROI)', () => {
    test('klassifiziert ROI-Einkommen korrekt nach §22 EStG', () => {
      const roiTransaction = {
        type: 'ROI',
        tokenSymbol: 'WGEP',
        amount: '1000',
        valueEUR: 50.00,
        date: '2024-01-15'
      };

      const classification = taxService.classifyTransaction(roiTransaction);

      expect(classification.taxType).toBe('§22 EStG');
      expect(classification.category).toBe('Sonstige Einkünfte');
      expect(classification.taxRate).toBe('14-45%');
      expect(classification.isTaxable).toBe(true);
    });

    test('berechnet ROI-Steuern mit progressivem Einkommensteuersatz', () => {
      const roiIncome = 5000; // 5000€ ROI
      const existingIncome = 30000; // 30k€ Jahreseinkommen

      const taxCalculation = taxService.calculateROITax(roiIncome, existingIncome);

      expect(taxCalculation.taxableAmount).toBe(5000);
      expect(taxCalculation.estimatedTaxRate).toBeGreaterThan(14);
      expect(taxCalculation.estimatedTaxRate).toBeLessThan(45);
      expect(taxCalculation.estimatedTax).toBeGreaterThan(0);
    });

    test('wendet KEINE Kapitalertragssteuer auf ROI an', () => {
      const roiTransaction = {
        type: 'ROI',
        valueEUR: 1000
      };

      const taxTreatment = taxService.getTaxTreatment(roiTransaction);

      expect(taxTreatment.isCapitalGainsTax).toBe(false);
      expect(taxTreatment.capitalGainsTaxRate).toBe(0);
      expect(taxTreatment.isIncomeTax).toBe(true);
    });
  });

  describe('§23 EStG - Spekulationsgeschäfte', () => {
    test('wendet 600€ Freigrenze korrekt an', () => {
      const transactions = [
        { type: 'TRADE', profit: 300, holdingPeriod: 200 },
        { type: 'TRADE', profit: 250, holdingPeriod: 180 }
      ];

      const taxResult = taxService.calculateSpeculationTax(transactions);

      expect(taxResult.totalProfit).toBe(550);
      expect(taxResult.exemptionApplied).toBe(true);
      expect(taxResult.taxableAmount).toBe(0); // Unter 600€ Freigrenze
    });

    test('versteuert Gewinne über 600€ Freigrenze vollständig', () => {
      const transactions = [
        { type: 'TRADE', profit: 700, holdingPeriod: 200 }
      ];

      const taxResult = taxService.calculateSpeculationTax(transactions);

      expect(taxResult.totalProfit).toBe(700);
      expect(taxResult.exemptionApplied).toBe(false);
      expect(taxResult.taxableAmount).toBe(700); // Kompletter Betrag steuerpflichtig
    });

    test('befreit Trades nach 365-Tage-Haltefrist', () => {
      const longTermTrade = {
        type: 'TRADE',
        profit: 1000,
        holdingPeriod: 400 // Über 365 Tage
      };

      const taxResult = taxService.calculateSpeculationTax([longTermTrade]);

      expect(taxResult.taxableAmount).toBe(0);
      expect(taxResult.exemptionReason).toBe('Haltefrist > 365 Tage');
    });
  });

  describe('FIFO-Berechnung für Krypto-Holdings', () => {
    test('berechnet FIFO-Reihenfolge korrekt', () => {
      const holdings = [
        { date: '2024-01-01', amount: 1000, price: 0.04 },
        { date: '2024-01-15', amount: 500, price: 0.06 },
        { date: '2024-02-01', amount: 800, price: 0.05 }
      ];

      const sale = { amount: 1200, price: 0.07, date: '2024-03-01' };

      const fifoResult = taxService.calculateFIFO(holdings, sale);

      expect(fifoResult.usedHoldings).toHaveLength(2);
      expect(fifoResult.usedHoldings[0].date).toBe('2024-01-01'); // Älteste zuerst
      expect(fifoResult.remainingAmount).toBe(200);
      expect(fifoResult.totalCost).toBe(70); // (1000*0.04) + (200*0.06)
    });

    test('berechnet Gewinn/Verlust mit FIFO-Methode', () => {
      const purchase = { amount: 1000, price: 0.05, date: '2024-01-01' };
      const sale = { amount: 500, price: 0.08, date: '2024-02-01' };

      const profitLoss = taxService.calculateProfitLoss([purchase], sale);

      expect(profitLoss.purchaseCost).toBe(25); // 500 * 0.05
      expect(profitLoss.saleValue).toBe(40); // 500 * 0.08
      expect(profitLoss.profit).toBe(15);
      expect(profitLoss.isProfit).toBe(true);
    });
  });

  describe('WGEP-Token spezifische Tests', () => {
    test('klassifiziert WGEP-ROI korrekt', () => {
      const wgepROI = {
        tokenSymbol: 'WGEP',
        type: 'ROI',
        amount: '2000',
        valueEUR: 100,
        source: 'DEX_SWAP'
      };

      const classification = taxService.classifyWGEPTransaction(wgepROI);

      expect(classification.isROI).toBe(true);
      expect(classification.taxType).toBe('§22 EStG');
      expect(classification.requiresReporting).toBe(true);
    });

    test('erkennt USDT→WGEP Swaps', () => {
      const swapTransaction = {
        fromToken: 'USDT',
        toToken: 'WGEP',
        fromAmount: '100',
        toAmount: '2000',
        valueEUR: 100
      };

      const analysis = taxService.analyzeUSDTtoWGEPSwap(swapTransaction);

      expect(analysis.isAcquisition).toBe(true);
      expect(analysis.taxEvent).toBe(false); // Tausch von Stable → ROI Token
      expect(analysis.costBasisEUR).toBe(100);
    });
  });

  describe('Jahresberechnung und Reporting', () => {
    test('generiert korrekten Jahressteuerreport', async () => {
      const walletAddress = '0x308e77123456789';
      const year = 2024;

      const mockTransactions = [
        { type: 'ROI', valueEUR: 500, date: '2024-03-15' },
        { type: 'TRADE', profit: 200, holdingPeriod: 200, date: '2024-06-10' },
        { type: 'ROI', valueEUR: 300, date: '2024-09-20' }
      ];

      // Mock the transaction fetching
      jest.spyOn(taxService, 'fetchTransactions').mockResolvedValue(mockTransactions);

      const yearlyReport = await taxService.generateYearlyReport(walletAddress, year);

      expect(yearlyReport.period).toBe(year);
      expect(yearlyReport.walletAddress).toBe(walletAddress);
      expect(yearlyReport.roiIncome.total).toBe(800);
      expect(yearlyReport.roiIncome.taxType).toBe('§22 EStG');
      expect(yearlyReport.speculationGains.total).toBe(200);
      expect(yearlyReport.speculationGains.taxType).toBe('§23 EStG');
    });

    test('wendet korrekte Steuersätze für verschiedene Einkommensklassen an', () => {
      const testCases = [
        { income: 10000, expectedRate: 14 }, // Eingangssteuersatz
        { income: 30000, expectedRateMin: 20, expectedRateMax: 30 },
        { income: 60000, expectedRateMin: 35, expectedRateMax: 42 }
      ];

      testCases.forEach(({ income, expectedRate, expectedRateMin, expectedRateMax }) => {
        const taxRate = taxService.getIncomeTaxRate(income);
        
        if (expectedRate) {
          expect(taxRate).toBeCloseTo(expectedRate, 1);
        } else {
          expect(taxRate).toBeGreaterThanOrEqual(expectedRateMin);
          expect(taxRate).toBeLessThanOrEqual(expectedRateMax);
        }
      });
    });
  });

  describe('Validierung und Fehlerbehandlung', () => {
    test('validiert Wallet-Adressen korrekt', () => {
      const validAddress = '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2';
      const invalidAddress = '0xinvalid';

      expect(taxService.validateWalletAddress(validAddress)).toBe(true);
      expect(taxService.validateWalletAddress(invalidAddress)).toBe(false);
    });

    test('behandelt fehlende Preisdaten gracefully', () => {
      const transactionWithoutPrice = {
        tokenSymbol: 'UNKNOWN_TOKEN',
        amount: '1000',
        date: '2024-01-15'
      };

      const result = taxService.processTransaction(transactionWithoutPrice);

      expect(result.valueEUR).toBe(0);
      expect(result.priceSource).toBe('Preis unbekannt');
      expect(result.needsManualReview).toBe(true);
    });

    test('behandelt ungültige Transaktionsdaten', () => {
      const invalidTransaction = {
        // Fehlende erforderliche Felder
        amount: 'invalid'
      };

      expect(() => {
        taxService.processTransaction(invalidTransaction);
      }).toThrow('Ungültige Transaktionsdaten');
    });
  });

  describe('Performance Tests', () => {
    test('verarbeitet große Transaktionsmengen effizient', async () => {
      const largeTransactionSet = Array.from({ length: 1000 }, (_, i) => ({
        hash: `0x${i.toString(16).padStart(64, '0')}`,
        type: 'ROI',
        valueEUR: Math.random() * 100,
        date: `2024-01-${(i % 30 + 1).toString().padStart(2, '0')}`
      }));

      const startTime = Date.now();
      const result = await taxService.processTransactionBatch(largeTransactionSet);
      const endTime = Date.now();

      expect(result.processedCount).toBe(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Unter 5 Sekunden
    });
  });

  describe('Compliance Tests', () => {
    test('stellt sicher dass alle ROI-Einkommen gemeldet werden', () => {
      const mixedTransactions = [
        { type: 'ROI', valueEUR: 50 },
        { type: 'TRADE', profit: 25 },
        { type: 'ROI', valueEUR: 30 },
        { type: 'TRANSFER', valueEUR: 100 } // Nicht steuerpflichtig
      ];

      const taxableTransactions = taxService.filterTaxableTransactions(mixedTransactions);
      const roiTransactions = taxableTransactions.filter(t => t.type === 'ROI');

      expect(roiTransactions).toHaveLength(2);
      expect(roiTransactions.every(t => t.requiresReporting)).toBe(true);
    });

    test('erstellt ELSTER-kompatible Datenstruktur', () => {
      const taxData = {
        roiIncome: 1000,
        speculationGains: 500,
        year: 2024
      };

      const elsterData = taxService.generateELSTERFormat(taxData);

      expect(elsterData).toHaveProperty('anlage_so'); // ROI in Anlage SO
      expect(elsterData.anlage_so.zeile_13).toBe(1000); // Sonstige Einkünfte
      expect(elsterData).toHaveProperty('anlage_kap'); // Falls Kap-Gewinne
    });
  });
}); 