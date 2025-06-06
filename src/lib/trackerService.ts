import { ethers } from 'ethers';
import { supabase } from '@/lib/supabase';
import { walletService } from './walletService';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  tokenSymbol?: string;
  tokenName?: string;
  tokenAddress?: string;
}

export interface PortfolioValue {
  timestamp: number;
  totalValue: number;
  tokenValues: Record<string, number>;
}

export interface TaxReport {
  year: number;
  realizedGains: number;
  realizedLosses: number;
  unrealizedGains: number;
  unrealizedLosses: number;
  transactions: Transaction[];
}

class TrackerService {
  private static instance: TrackerService;
  private isTracking: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Event-Listener für Wallet-Änderungen
    walletService.addListener(this.handleWalletChange);
  }

  static getInstance(): TrackerService {
    if (!TrackerService.instance) {
      TrackerService.instance = new TrackerService();
    }
    return TrackerService.instance;
  }

  private handleWalletChange = async (wallet: any) => {
    if (wallet) {
      await this.startTracking(wallet.address);
    } else {
      this.stopTracking();
    }
  };

  async startTracking(address: string): Promise<void> {
    if (this.isTracking) return;

    this.isTracking = true;
    await this.updateHistoricalData(address);
    
    // Regelmäßige Updates
    this.updateInterval = setInterval(async () => {
      await this.updatePortfolioValue(address);
    }, 5 * 60 * 1000); // Alle 5 Minuten
  }

  stopTracking(): void {
    this.isTracking = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private async updateHistoricalData(address: string): Promise<void> {
    try {
      const wallet = walletService.getCurrentWallet();
      if (!wallet) return;

      // Hole alle Transaktionen
      const transactions = await this.fetchAllTransactions(address, wallet.provider);
      
      // Speichere Transaktionen in der Datenbank
      await this.saveTransactions(address, transactions);

      // Berechne historische Portfolio-Werte
      await this.calculateHistoricalValues(address, transactions);

      // Generiere Steuerberichte
      await this.generateTaxReports(address);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der historischen Daten:', error);
      throw error;
    }
  }

  private async fetchAllTransactions(
    address: string,
    provider: ethers.Provider
  ): Promise<Transaction[]> {
    try {
      // Hole alle Transaktionen über den eigenen API-Proxy
      let currentBlock = 99999999;
      try {
        currentBlock = await provider.getBlockNumber();
      } catch (e) {
        // Fallback auf 99999999
      }
      const params = new URLSearchParams({
        address,
        action: 'txlist',
        startblock: '0',
        endblock: String(currentBlock),
        sort: 'asc',
      });
      const txUrl = `/api/pulsechain-tx?${params.toString()}`;
      const response = await fetch(txUrl);
      const data = await response.json();
      if (data.status === '1' && Array.isArray(data.result)) {
        return data.result.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: ethers.formatEther(tx.value),
          timestamp: parseInt(tx.timeStamp),
          blockNumber: parseInt(tx.blockNumber),
          tokenSymbol: tx.tokenSymbol,
          tokenName: tx.tokenName,
          tokenAddress: tx.contractAddress,
        }));
      }
      return [];
    } catch (error) {
      console.error('Fehler beim Abrufen der Transaktionen (PulseChain):', error);
      throw error;
    }
  }

  private async saveTransactions(
    address: string,
    transactions: Transaction[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .upsert(
          transactions.map(tx => ({
            user_address: address,
            ...tx,
          })),
          { onConflict: 'hash' }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Fehler beim Speichern der Transaktionen:', error);
      throw error;
    }
  }

  private async calculateHistoricalValues(
    address: string,
    transactions: Transaction[]
  ): Promise<void> {
    try {
      const portfolioValues: PortfolioValue[] = [];
      let currentValue = 0;
      const tokenValues: Record<string, number> = {};

      // Sortiere Transaktionen nach Zeitstempel
      transactions.sort((a, b) => a.timestamp - b.timestamp);

      // Berechne Portfolio-Werte für jeden Zeitpunkt
      for (const tx of transactions) {
        // Hier würde die Logik zur Berechnung der Token-Werte implementiert
        // Dies ist ein vereinfachtes Beispiel
        const value = parseFloat(tx.value);
        currentValue += value;

        portfolioValues.push({
          timestamp: tx.timestamp,
          totalValue: currentValue,
          tokenValues: { ...tokenValues },
        });
      }

      // Speichere Portfolio-Werte
      const { error } = await supabase
        .from('portfolio_values')
        .upsert(
          portfolioValues.map(pv => ({
            user_address: address,
            ...pv,
          })),
          { onConflict: 'timestamp,user_address' }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Fehler beim Berechnen der historischen Werte:', error);
      throw error;
    }
  }

  private async generateTaxReports(address: string): Promise<void> {
    try {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_address', address)
        .order('timestamp', { ascending: true });

      if (!transactions) return;

      // Gruppiere Transaktionen nach Jahr
      const transactionsByYear = transactions.reduce((acc, tx) => {
        const year = new Date(tx.timestamp * 1000).getFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(tx);
        return acc;
      }, {} as Record<number, Transaction[]>);

      // Generiere Steuerberichte für jedes Jahr
      for (const [year, txs] of Object.entries(transactionsByYear)) {
        const report = this.calculateTaxReport(parseInt(year), txs);
        
        const { error } = await supabase
          .from('tax_reports')
          .upsert({
            user_address: address,
            year: parseInt(year),
            ...report,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Fehler beim Generieren der Steuerberichte:', error);
      throw error;
    }
  }

  private calculateTaxReport(year: number, transactions: Transaction[]): TaxReport {
    let realizedGains = 0;
    let realizedLosses = 0;
    let unrealizedGains = 0;
    let unrealizedLosses = 0;

    // Hier würde die Logik zur Berechnung der Gewinne und Verluste implementiert
    // Dies ist ein vereinfachtes Beispiel
    for (const tx of transactions) {
      const value = parseFloat(tx.value);
      if (value > 0) {
        realizedGains += value;
      } else {
        realizedLosses += Math.abs(value);
      }
    }

    return {
      year,
      realizedGains,
      realizedLosses,
      unrealizedGains,
      unrealizedLosses,
      transactions,
    };
  }

  private async updatePortfolioValue(address: string): Promise<void> {
    try {
      const wallet = walletService.getCurrentWallet();
      if (!wallet) return;

      // Hole aktuelle Token-Balances
      const balances = await this.getTokenBalances(address, wallet.provider);
      
      // Berechne aktuelle Werte
      const totalValue = Object.values(balances).reduce((sum, value) => sum + value, 0);

      // Speichere aktuellen Portfolio-Wert
      const { error } = await supabase
        .from('portfolio_values')
        .insert({
          user_address: address,
          timestamp: Math.floor(Date.now() / 1000),
          total_value: totalValue,
          token_values: balances,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Portfolio-Werts:', error);
      throw error;
    }
  }

  private async getTokenBalances(
    address: string,
    provider: ethers.Provider
  ): Promise<Record<string, number>> {
    try {
      const balances: Record<string, number> = {};
      // Token-Balances via BlockScout-API
      // Import dynamisch, um Zirkularität zu vermeiden
      const { getAllPulsechainTokensFromBlockscout } = await import('./walletService');
      const { fetchTokenPrices } = await import('./priceService');
      const tokens = await getAllPulsechainTokensFromBlockscout(address);
      // Preis-Map vorbereiten
      const addressMap: { [symbol: string]: string } = {};
      tokens.forEach(token => {
        if (token.address) addressMap[token.symbol] = token.address;
      });
      addressMap['PLS'] = '0xA1077a294dC1f4cFB0b86530fc3D182038FD36D8';
      const prices = await fetchTokenPrices(addressMap, '369');
      // Balances als USD-Wert pro Token
      tokens.forEach(token => {
        const price = prices[token.symbol] || 0;
        balances[token.symbol] = Number(token.balance) * price;
      });
      return balances;
    } catch (error) {
      console.error('Fehler beim Abrufen der Token-Balances:', error);
      throw error;
    }
  }
}

export const trackerService = TrackerService.getInstance(); 