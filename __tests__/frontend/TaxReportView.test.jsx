import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaxReportView from '../../src/components/views/TaxReportView';

// Mock für fetch bereits in setupTests.js definiert

describe('TaxReportView - Deutsche Steuerreport UI', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('rendert Hauptüberschrift und Eingabefelder', () => {
    render(<TaxReportView />);
    
    expect(screen.getByText('🔥 STEUERREPORT')).toBeInTheDocument();
    expect(screen.getByText('Deutsches Steuerrecht-konform')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/0x.../)).toBeInTheDocument();
    expect(screen.getByText('Steuerreport generieren')).toBeInTheDocument();
  });

  test('validiert Wallet-Adresse bei Eingabe', async () => {
    const user = userEvent.setup();
    render(<TaxReportView />);

    const walletInput = screen.getByPlaceholderText(/0x.../);
    const generateButton = screen.getByText('Steuerreport generieren');

    // Leere Eingabe
    await user.click(generateButton);
    expect(screen.getByText('Bitte geben Sie eine Wallet-Adresse ein')).toBeInTheDocument();

    // Ungültige Adresse
    await user.type(walletInput, 'invalid-address');
    await user.click(generateButton);
    expect(screen.getByText('Ungültiges Wallet-Adressformat')).toBeInTheDocument();

    // Gültige Adresse
    await user.clear(walletInput);
    await user.type(walletInput, '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2');
    await user.click(generateButton);
    expect(screen.queryByText('Ungültiges Wallet-Adressformat')).not.toBeInTheDocument();
  });

  test('wählt Steuerjahr korrekt aus', async () => {
    const user = userEvent.setup();
    render(<TaxReportView />);

    const yearSelect = screen.getByLabelText('Steuerjahr');
    
    // Prüfe verfügbare Jahre
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('2022')).toBeInTheDocument();

    // Wähle anderes Jahr
    await user.selectOptions(yearSelect, '2023');
    expect(yearSelect.value).toBe('2023');
  });

  test('zeigt WGEP-spezifische Optionen an', () => {
    render(<TaxReportView />);

    expect(screen.getByLabelText('ROI-Einkommen einbeziehen (§22 EStG)')).toBeInTheDocument();
    expect(screen.getByLabelText('Spekulationsgeschäfte einbeziehen (§23 EStG)')).toBeInTheDocument();
    expect(screen.getByLabelText('FIFO-Berechnung verwenden')).toBeInTheDocument();
    expect(screen.getByLabelText('WGEP-Token hervorheben')).toBeInTheDocument();
  });

  test('generiert erfolgreichen Steuerreport', async () => {
    const user = userEvent.setup();
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
          period: { year: 2024 },
          transactions: [
            {
              hash: '0x123abc',
              date: '2024-01-15',
              type: 'ROI',
              tokenSymbol: 'WGEP',
              amount: '1000',
              valueEUR: 50.00,
              taxType: '§22 EStG'
            }
          ],
          summary: {
            totalROIIncome: 50.00,
            totalCapitalGains: 0,
            totalTaxableAmount: 50.00,
            estimatedTax: 12.50
          }
        }
      })
    });

    render(<TaxReportView />);

    const walletInput = screen.getByPlaceholderText(/0x.../);
    const generateButton = screen.getByText('Steuerreport generieren');

    await user.type(walletInput, '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2');
    await user.click(generateButton);

    expect(fetch).toHaveBeenCalledWith('/api/german-tax-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        year: 2024,
        includeROI: true,
        includeTrades: true,
        useFIFO: true,
        highlightWGEP: false
      })
    });

    await waitFor(() => {
      expect(screen.getByText('Steuerreport erfolgreich generiert!')).toBeInTheDocument();
    });
  });

  test('zeigt Transaktionsliste korrekt an', async () => {
    const user = userEvent.setup();
    
    const mockData = {
      success: true,
      data: {
        transactions: [
          {
            hash: '0x123abc',
            date: '2024-01-15',
            type: 'ROI',
            tokenSymbol: 'WGEP',
            amount: '1000',
            valueEUR: 50.00,
            taxType: '§22 EStG'
          },
          {
            hash: '0x456def',
            date: '2024-02-20',
            type: 'TRADE',
            tokenSymbol: 'PLS',
            profit: 25.00,
            taxType: '§23 EStG'
          }
        ],
        summary: {
          totalROIIncome: 50.00,
          totalCapitalGains: 25.00,
          totalTaxableAmount: 75.00
        }
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    render(<TaxReportView />);

    const walletInput = screen.getByPlaceholderText(/0x.../);
    const generateButton = screen.getByText('Steuerreport generieren');

    await user.type(walletInput, '0x308e77');
    await user.click(generateButton);

    await waitFor(() => {
      // Überprüfe Transaktionsanzeige
      expect(screen.getByText('WGEP')).toBeInTheDocument();
      expect(screen.getByText('50,00 €')).toBeInTheDocument();
      expect(screen.getByText('§22 EStG')).toBeInTheDocument();
      
      expect(screen.getByText('PLS')).toBeInTheDocument();
      expect(screen.getByText('25,00 €')).toBeInTheDocument();
      expect(screen.getByText('§23 EStG')).toBeInTheDocument();
    });
  });

  test('zeigt Steuerzusammenfassung korrekt an', async () => {
    const user = userEvent.setup();
    
    const mockData = {
      success: true,
      data: {
        transactions: [],
        summary: {
          totalROIIncome: 1500.00,
          totalCapitalGains: 500.00,
          totalTaxableAmount: 2000.00,
          estimatedTax: 600.00,
          effectiveTaxRate: 30.0
        }
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    render(<TaxReportView />);

    const walletInput = screen.getByPlaceholderText(/0x.../);
    const generateButton = screen.getByText('Steuerreport generieren');

    await user.type(walletInput, '0x308e77');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('ROI-Einkommen (§22 EStG)')).toBeInTheDocument();
      expect(screen.getByText('1.500,00 €')).toBeInTheDocument();
      
      expect(screen.getByText('Spekulationsgewinne (§23 EStG)')).toBeInTheDocument();
      expect(screen.getByText('500,00 €')).toBeInTheDocument();
      
      expect(screen.getByText('Geschätzte Steuer')).toBeInTheDocument();
      expect(screen.getByText('600,00 €')).toBeInTheDocument();
      
      expect(screen.getByText('30,0%')).toBeInTheDocument();
    });
  });

  test('filtert Transaktionen nach Token', async () => {
    const user = userEvent.setup();
    
    const mockData = {
      success: true,
      data: {
        transactions: [
          { tokenSymbol: 'WGEP', valueEUR: 50.00, type: 'ROI' },
          { tokenSymbol: 'PLS', valueEUR: 25.00, type: 'TRADE' },
          { tokenSymbol: 'WGEP', valueEUR: 30.00, type: 'ROI' }
        ]
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    render(<TaxReportView />);

    // Generiere Report
    const walletInput = screen.getByPlaceholderText(/0x.../);
    await user.type(walletInput, '0x308e77');
    await user.click(screen.getByText('Steuerreport generieren'));

    await waitFor(() => {
      expect(screen.getAllByText('WGEP')).toHaveLength(2);
      expect(screen.getAllByText('PLS')).toHaveLength(1);
    });

    // Filter nach WGEP
    const tokenFilter = screen.getByLabelText('Token-Filter');
    await user.selectOptions(tokenFilter, 'WGEP');

    // Nur WGEP-Transaktionen sichtbar
    expect(screen.getAllByText('WGEP')).toHaveLength(2);
    expect(screen.queryByText('PLS')).not.toBeInTheDocument();
  });

  test('exportiert PDF-Report', async () => {
    const user = userEvent.setup();
    
    // Mock successful report generation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { transactions: [], summary: {} }
      })
    });

    // Mock PDF export
    fetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(new Blob(['pdf content'], { type: 'application/pdf' }))
    });

    render(<TaxReportView />);

    // Generiere Report
    const walletInput = screen.getByPlaceholderText(/0x.../);
    await user.type(walletInput, '0x308e77');
    await user.click(screen.getByText('Steuerreport generieren'));

    await waitFor(() => {
      expect(screen.getByText('PDF exportieren')).toBeInTheDocument();
    });

    // Export PDF
    await user.click(screen.getByText('PDF exportieren'));

    expect(fetch).toHaveBeenLastCalledWith('/api/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('walletAddress')
    });
  });

  test('behandelt WGEP Test-Button für spezielle Wallet', async () => {
    const user = userEvent.setup();
    render(<TaxReportView />);

    // WGEP Test Button sollte sichtbar sein
    expect(screen.getByText('🚀 WGEP Test (0x308e77)')).toBeInTheDocument();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
          transactions: [
            {
              tokenSymbol: 'WGEP',
              type: 'ROI',
              valueEUR: 100.00,
              source: 'DEX_SWAP'
            }
          ]
        }
      })
    });

    await user.click(screen.getByText('🚀 WGEP Test (0x308e77)'));

    expect(fetch).toHaveBeenCalledWith('/api/german-tax-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        year: 2024,
        includeROI: true,
        includeTrades: true,
        useFIFO: true,
        highlightWGEP: true,
        testMode: true
      })
    });
  });

  test('zeigt Ladeindikator während Report-Generierung', async () => {
    const user = userEvent.setup();
    
    // Mock delayed response
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} })
        }), 100)
      )
    );

    render(<TaxReportView />);

    const walletInput = screen.getByPlaceholderText(/0x.../);
    const generateButton = screen.getByText('Steuerreport generieren');

    await user.type(walletInput, '0x308e77');
    await user.click(generateButton);

    // Loading-Zustand prüfen
    expect(screen.getByText('Generiere Steuerreport...')).toBeInTheDocument();
    expect(generateButton).toBeDisabled();

    // Warte auf Completion
    await waitFor(() => {
      expect(screen.getByText('Steuerreport generieren')).toBeInTheDocument();
      expect(generateButton).toBeEnabled();
    });
  });

  test('behandelt API-Fehler gracefully', async () => {
    const user = userEvent.setup();
    
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<TaxReportView />);

    const walletInput = screen.getByPlaceholderText(/0x.../);
    const generateButton = screen.getByText('Steuerreport generieren');

    await user.type(walletInput, '0x308e77');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Fehler beim Generieren des Steuerreports/)).toBeInTheDocument();
    });
  });

  test('zeigt Hinweise zum deutschen Steuerrecht', () => {
    render(<TaxReportView />);

    expect(screen.getByText(/ROI-Einkommen werden nach §22 EStG/)).toBeInTheDocument();
    expect(screen.getByText(/Spekulationsgewinne nach §23 EStG/)).toBeInTheDocument();
    expect(screen.getByText(/600€ Freigrenze/)).toBeInTheDocument();
    expect(screen.getByText(/FIFO-Methode/)).toBeInTheDocument();
  });

  test('wechselt zwischen verschiedenen Ansichten', async () => {
    const user = userEvent.setup();
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { transactions: [], summary: {} }
      })
    });

    render(<TaxReportView />);

    // Generiere Report
    const walletInput = screen.getByPlaceholderText(/0x.../);
    await user.type(walletInput, '0x308e77');
    await user.click(screen.getByText('Steuerreport generieren'));

    await waitFor(() => {
      expect(screen.getByText('Übersicht')).toBeInTheDocument();
      expect(screen.getByText('Transaktionen')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    // Wechsle zu Transaktionen-Tab
    await user.click(screen.getByText('Transaktionen'));
    expect(screen.getByText('Alle Transaktionen')).toBeInTheDocument();

    // Wechsle zu Export-Tab
    await user.click(screen.getByText('Export'));
    expect(screen.getByText('PDF exportieren')).toBeInTheDocument();
    expect(screen.getByText('CSV exportieren')).toBeInTheDocument();
    expect(screen.getByText('ELSTER-Format')).toBeInTheDocument();
  });

  test('validiert Zeitraum-Eingaben', async () => {
    const user = userEvent.setup();
    render(<TaxReportView />);

    // Erweiterte Optionen anzeigen
    await user.click(screen.getByText('Erweiterte Optionen'));

    const startDateInput = screen.getByLabelText('Startdatum');
    const endDateInput = screen.getByLabelText('Enddatum');

    // Ungültiger Zeitraum (End vor Start)
    await user.type(startDateInput, '2024-12-31');
    await user.type(endDateInput, '2024-01-01');

    const generateButton = screen.getByText('Steuerreport generieren');
    await user.click(generateButton);

    expect(screen.getByText('Enddatum muss nach Startdatum liegen')).toBeInTheDocument();
  });
}); 