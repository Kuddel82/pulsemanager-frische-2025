import { supabase } from './supabase';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const taxService = {
  // Transaktionen importieren
  async importTransactions(walletAddress, userId) {
    try {
      const { data: transactions, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('user_id', userId);

      if (error) throw error;
      return transactions;
    } catch (error) {
      console.error('Fehler beim Importieren der Transaktionen:', error);
      throw error;
    }
  },

  // Haltefristen berechnen
  async calculateHoldingPeriods(userId) {
    try {
      const { data: holdings, error } = await supabase
        .from('token_holdings')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return holdings.map(holding => ({
        ...holding,
        holding_period: this.calculateDaysBetween(
          holding.first_purchase_date,
          holding.last_update_date
        )
      }));
    } catch (error) {
      console.error('Fehler beim Berechnen der Haltefristen:', error);
      throw error;
    }
  },

  // Täglichen ROI tracken
  async trackDailyROI(userId, tokenAddress, date) {
    try {
      const { data: priceData, error: priceError } = await supabase
        .from('daily_roi_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('token_address', tokenAddress)
        .eq('date', date)
        .single();

      if (priceError && priceError.code !== 'PGRST116') throw priceError;

      if (!priceData) {
        // Neue ROI-Berechnung erstellen
        const { data: newROI, error: insertError } = await supabase
          .from('daily_roi_tracking')
          .insert({
            user_id: userId,
            token_address: tokenAddress,
            date: date,
            opening_price: 0, // Wird durch Price Service aktualisiert
            closing_price: 0, // Wird durch Price Service aktualisiert
            daily_roi: 0,
            amount_held: 0,
            value_in_eur: 0
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newROI;
      }

      return priceData;
    } catch (error) {
      console.error('Fehler beim Tracking des täglichen ROI:', error);
      throw error;
    }
  },

  // Steuerbericht generieren
  async generateTaxReport(userId, year) {
    try {
      // Transaktionen des Jahres abrufen
      const { data: transactions, error: transError } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('transaction_date', `${year}-01-01`)
        .lte('transaction_date', `${year}-12-31`);

      if (transError) throw transError;

      // Haltefristen abrufen
      const { data: holdings, error: holdingsError } = await supabase
        .from('token_holdings')
        .select('*')
        .eq('user_id', userId);

      if (holdingsError) throw holdingsError;

      // ROI-Daten abrufen
      const { data: roiData, error: roiError } = await supabase
        .from('daily_roi_tracking')
        .select('*')
        .eq('user_id', userId)
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);

      if (roiError) throw roiError;

      // Steuerbericht erstellen
      const reportData = {
        year,
        transactions: this.processTransactions(transactions),
        holdings: this.processHoldings(holdings),
        roi: this.processROIData(roiData),
        summary: this.generateSummary(transactions, holdings, roiData)
      };

      // Bericht in der Datenbank speichern
      const { data: savedReport, error: saveError } = await supabase
        .from('tax_reports')
        .insert({
          user_id: userId,
          year,
          report_type: 'annual',
          report_data: reportData
        })
        .select()
        .single();

      if (saveError) throw saveError;

      return savedReport;
    } catch (error) {
      console.error('Fehler beim Generieren des Steuerberichts:', error);
      throw error;
    }
  },

  // PDF-Export generieren
  async generatePDFExport(reportId) {
    try {
      const { data: report, error } = await supabase
        .from('tax_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;

      const doc = new jsPDF();
      const reportData = report.report_data;

      // Titel
      doc.setFontSize(20);
      doc.text(`Steuerbericht ${reportData.year}`, 20, 20);

      // Zusammenfassung
      doc.setFontSize(16);
      doc.text('Zusammenfassung', 20, 40);
      doc.setFontSize(12);
      doc.text(`Gesamtumsatz: ${reportData.summary.total_volume} EUR`, 20, 50);
      doc.text(`Gewinn/Verlust: ${reportData.summary.total_profit_loss} EUR`, 20, 60);
      doc.text(`Anzahl Transaktionen: ${reportData.summary.total_transactions}`, 20, 70);

      // Transaktionen
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Transaktionen', 20, 20);
      
      const transactionsTable = reportData.transactions.map(t => [
        format(new Date(t.transaction_date), 'dd.MM.yyyy', { locale: de }),
        t.token_symbol,
        t.transaction_type,
        `${t.amount} ${t.token_symbol}`,
        `${t.price_in_eur} EUR`
      ]);

      doc.autoTable({
        startY: 30,
        head: [['Datum', 'Token', 'Typ', 'Menge', 'Preis in EUR']],
        body: transactionsTable
      });

      // Haltefristen
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Haltefristen', 20, 20);

      const holdingsTable = reportData.holdings.map(h => [
        h.token_symbol,
        h.amount,
        format(new Date(h.first_purchase_date), 'dd.MM.yyyy', { locale: de }),
        `${h.holding_period} Tage`,
        `${h.average_purchase_price} EUR`
      ]);

      doc.autoTable({
        startY: 30,
        head: [['Token', 'Menge', 'Erster Kauf', 'Haltefrist', 'Durchschnittspreis']],
        body: holdingsTable
      });

      return doc;
    } catch (error) {
      console.error('Fehler beim Generieren des PDF-Exports:', error);
      throw error;
    }
  },

  // Hilfsfunktionen
  calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  },

  processTransactions(transactions) {
    return transactions.map(t => ({
      ...t,
      transaction_date: new Date(t.transaction_date).toISOString()
    }));
  },

  processHoldings(holdings) {
    return holdings.map(h => ({
      ...h,
      first_purchase_date: new Date(h.first_purchase_date).toISOString(),
      last_update_date: new Date(h.last_update_date).toISOString(),
      holding_period: this.calculateDaysBetween(h.first_purchase_date, h.last_update_date)
    }));
  },

  processROIData(roiData) {
    return roiData.map(r => ({
      ...r,
      date: new Date(r.date).toISOString()
    }));
  },

  generateSummary(transactions, holdings, roiData) {
    const totalVolume = transactions.reduce((sum, t) => sum + t.price_in_eur, 0);
    const totalProfitLoss = roiData.reduce((sum, r) => sum + r.daily_roi, 0);
    const totalTransactions = transactions.length;

    return {
      total_volume: totalVolume,
      total_profit_loss: totalProfitLoss,
      total_transactions: totalTransactions
    };
  }
}; 