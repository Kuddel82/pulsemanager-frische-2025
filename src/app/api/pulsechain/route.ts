import { NextResponse } from 'next/server';
import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';

// Moralis initialisieren
const moralisApiKey = process.env.MORALIS_API_KEY;

if (!moralisApiKey) {
  console.error('MORALIS_API_KEY ist nicht konfiguriert!');
}

// API Route Handler
export async function GET(request: Request) {
  try {
    // URL Parameter auslesen
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Adresse fehlt' },
        { status: 400 }
      );
    }

    // Moralis initialisieren falls noch nicht geschehen
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: moralisApiKey,
      });
    }

    // Token Balances abrufen
    const chain = EvmChain.PULSECHAIN;
    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      address,
      chain,
    });

    // Response formatieren
    const formattedResponse = {
      result: response.result.map(token => ({
        token_address: token.tokenAddress,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        balance: token.balance,
        possible_spam: token.possibleSpam,
        verified_contract: token.verifiedContract,
      })),
      total: response.result.length,
    };

    return NextResponse.json(formattedResponse);

  } catch (error) {
    console.error('Pulsechain API Fehler:', error);
    
    // Detaillierte Fehlerbehandlung
    if (error instanceof Error) {
      if (error.message.includes('No Moralis Enterprise access detected')) {
        return NextResponse.json(
          { error: 'Moralis Enterprise Zugriff fehlt. Bitte API-Key überprüfen.' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('Invalid address')) {
        return NextResponse.json(
          { error: 'Ungültige Wallet-Adresse' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Interner Server Fehler' },
      { status: 500 }
    );
  }
} 