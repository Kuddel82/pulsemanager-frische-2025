export const courseContent = {
  '1-1': {
    title: 'Einführung in Kryptowährungen',
    type: 'video',
    duration: '15:00',
    videoId: '1YyAzVmP9xQ',
    content: `
# Einführung in Kryptowährungen

## Was sind Kryptowährungen?
Kryptowährungen sind digitale oder virtuelle Währungen, die Kryptographie für Sicherheit verwenden. Sie sind dezentralisiert und basieren auf Blockchain-Technologie.

## Hauptmerkmale:
- Dezentralisierung
- Sicherheit durch Kryptographie
- Transparenz
- Unveränderlichkeit
- Programmierung durch Smart Contracts

## Bekannte Kryptowährungen:
- Bitcoin (BTC)
- Ethereum (ETH)
- Binance Coin (BNB)
- Solana (SOL)
- Cardano (ADA)

## Warum Kryptowährungen?
- Finanzielle Freiheit
- Niedrige Transaktionsgebühren
- Schnelle internationale Überweisungen
- Schutz vor Inflation
- Zugang zu DeFi-Diensten
    `
  },
  '1-2': {
    title: 'Was ist Blockchain?',
    type: 'text',
    content: `
# Blockchain-Technologie

## Definition
Eine Blockchain ist eine verteilte Datenbank, die eine wachsende Liste von Datensätzen (Blöcken) enthält, die durch Kryptographie miteinander verbunden sind.

## Wie funktioniert eine Blockchain?
1. Transaktionen werden in Blöcken gesammelt
2. Blöcke werden kryptographisch verknüpft
3. Jeder Block enthält einen Hash des vorherigen Blocks
4. Die Kette ist unveränderlich
5. Alle Teilnehmer haben eine Kopie der Blockchain

## Vorteile der Blockchain:
- Dezentralisierung
- Transparenz
- Sicherheit
- Unveränderlichkeit
- Effizienz

## Anwendungsfälle:
- Kryptowährungen
- Smart Contracts
- Supply Chain Management
- Digitale Identität
- Dezentralisierte Finanzen (DeFi)
    `
  },
  '1-3': {
    title: 'Grundlegende Konzepte',
    type: 'quiz',
    questions: [
      {
        question: 'Was ist der Hauptunterschied zwischen Bitcoin und traditionellen Währungen?',
        options: [
          'Bitcoin ist zentralisiert',
          'Bitcoin ist dezentralisiert',
          'Bitcoin kann nur online verwendet werden',
          'Bitcoin hat keine Wertstabilität'
        ],
        correctAnswer: 1
      },
      {
        question: 'Was ist ein Block in der Blockchain?',
        options: [
          'Ein physischer Speicherblock',
          'Eine Sammlung von Transaktionen',
          'Ein Computerprogramm',
          'Eine Kryptowährung'
        ],
        correctAnswer: 1
      },
      {
        question: 'Was ist Mining?',
        options: [
          'Das Kaufen von Kryptowährungen',
          'Der Prozess der Validierung von Transaktionen',
          'Das Speichern von Kryptowährungen',
          'Das Verkaufen von Kryptowährungen'
        ],
        correctAnswer: 1
      }
    ]
  },
  '1-4': {
    title: 'Wallets und Sicherheit',
    type: 'video',
    duration: '20:00',
    videoId: 'Gc2en3nHxA4',
    content: `
# Krypto-Wallets und Sicherheit

## Arten von Wallets:
1. Hot Wallets
   - Online Wallets
   - Mobile Wallets
   - Desktop Wallets

2. Cold Wallets
   - Hardware Wallets
   - Paper Wallets

## Sicherheitsmaßnahmen:
- Private Keys sicher aufbewahren
- Zwei-Faktor-Authentifizierung
- Regelmäßige Backups
- Offline-Speicherung
- Multi-Signature Wallets

## Best Practices:
- Niemals Private Keys teilen
- Regelmäßige Updates
- Sichere Passwörter
- Vorsicht bei Drittanbieter-Diensten
- Regelmäßige Sicherheitsüberprüfungen
    `
  },
  '2-1': {
    title: 'DeFi Protokolle verstehen',
    type: 'video',
    duration: '20:00',
    videoId: '17QRFl8CS8U',
    content: `
# DeFi Protokolle

## Was ist DeFi?
Dezentralisierte Finanzen (DeFi) sind Finanzdienstleistungen, die auf Blockchain-Technologie basieren und ohne zentrale Vermittler funktionieren.

## Hauptprotokolle:
1. Lending/Borrowing
   - Aave
   - Compound
   - MakerDAO

2. DEX (Decentralized Exchanges)
   - Uniswap
   - SushiSwap
   - PancakeSwap

3. Yield Farming
   - Yearn Finance
   - Curve
   - Balancer

## Vorteile von DeFi:
- Keine Zwischenhändler
- Transparenz
- Programmierung
- Zugänglichkeit
- Innovation
    `
  },
  '2-2': {
    title: 'Liquidität und Yield Farming',
    type: 'text',
    content: `
# Liquidität und Yield Farming

## Was ist Liquidität?
Liquidität bezieht sich auf die Fähigkeit, ein Asset schnell zu kaufen oder zu verkaufen, ohne den Preis signifikant zu beeinflussen.

## Yield Farming:
- Bereitstellung von Liquidität
- Earning Rewards
- Staking
- Lending
- Liquidity Mining

## Risiken:
- Smart Contract Risiken
- Impermanent Loss
- Marktvolatilität
- Liquiditätsrisiken
- Technische Risiken

## Strategien:
- Diversifikation
- Risikomanagement
- Automatisierung
- Monitoring
- Regelmäßige Anpassung
    `
  },
  '2-3': {
    title: 'Risikomanagement',
    type: 'quiz',
    questions: [
      {
        question: 'Was ist Impermanent Loss?',
        options: [
          'Ein dauerhafter Verlust',
          'Ein temporärer Verlust durch Preisänderungen',
          'Ein Verlust durch Hacking',
          'Ein Verlust durch Falschberechnung'
        ],
        correctAnswer: 1
      },
      {
        question: 'Was ist der Hauptvorteil von DeFi?',
        options: [
          'Schnellere Transaktionen',
          'Niedrigere Gebühren',
          'Keine Zwischenhändler',
          'Bessere Rendite'
        ],
        correctAnswer: 2
      },
      {
        question: 'Was ist Yield Farming?',
        options: [
          'Das Mining von Kryptowährungen',
          'Das Staking von Coins',
          'Das Bereitstellen von Liquidität für Rewards',
          'Das Trading von Futures'
        ],
        correctAnswer: 2
      }
    ]
  },
  '2-4': {
    title: 'Advanced Trading Strategien',
    type: 'video',
    duration: '25:00',
    videoId: 'Gm0I9jxYRvA',
    content: `
# Advanced Trading Strategien

## Trading-Strategien:
1. Swing Trading
   - Mittelfristige Positionen
   - Technische Analyse
   - Markttrends

2. Day Trading
   - Kurzfristige Positionen
   - Volatilität nutzen
   - Schnelle Entscheidungen

3. Position Trading
   - Langfristige Positionen
   - Fundamentale Analyse
   - Marktzyklus

## Tools:
- Technische Indikatoren
- Chartanalyse
- Order Types
- Risk Management
- Portfolio Tracking
    `
  },
  '3-1': {
    title: 'NFTs erklärt',
    type: 'video',
    duration: '18:00',
    videoId: 'FkUn86bH34M',
    content: `
# NFTs (Non-Fungible Tokens)

## Was sind NFTs?
NFTs sind einzigartige digitale Vermögenswerte, die auf der Blockchain gespeichert sind und nicht austauschbar sind.

## Eigenschaften:
- Einzigartigkeit
- Nachweisbare Seltenheit
- Unveränderlichkeit
- Programmierung
- Eigentumsnachweis

## Anwendungsfälle:
- Digitale Kunst
- Sammelkarten
- Virtuelle Immobilien
- Gaming Items
- Musik und Medien
    `
  },
  '3-2': {
    title: 'Digitale Kunst verstehen',
    type: 'text',
    content: `
# Digitale Kunst und NFTs

## Arten digitaler Kunst:
1. Generative Kunst
   - Algorithmisch erstellt
   - Einzigartige Eigenschaften
   - Programmierte Variationen

2. Digitale Illustrationen
   - Handgezeichnet
   - Digital erstellt
   - Animiert

3. Fotografie
   - Digitale Fotos
   - Bearbeitete Bilder
   - Kollagen

## Marktplätze:
- OpenSea
- Rarible
- Foundation
- Nifty Gateway
- SuperRare

## Investment-Aspekte:
- Künstlerreputation
- Seltenheit
- Community
- Utility
- Markttrends
    `
  },
  '3-3': {
    title: 'NFT Marktplätze',
    type: 'quiz',
    questions: [
      {
        question: 'Was macht ein NFT einzigartig?',
        options: [
          'Sein Preis',
          'Seine Blockchain',
          'Seine nicht-austauschbare Natur',
          'Seine Dateigröße'
        ],
        correctAnswer: 2
      },
      {
        question: 'Was ist der größte NFT-Marktplatz?',
        options: [
          'Rarible',
          'OpenSea',
          'Foundation',
          'Nifty Gateway'
        ],
        correctAnswer: 1
      },
      {
        question: 'Was ist Generative Art?',
        options: [
          'Handgemalte digitale Kunst',
          'Algorithmisch erstellte Kunst',
          'Fotografierte Kunst',
          'Gescannete Kunst'
        ],
        correctAnswer: 1
      }
    ]
  },
  '3-4': {
    title: 'NFT Investment Strategien',
    type: 'video',
    duration: '22:00',
    videoId: '4dkl5O9LOKg',
    content: `
# NFT Investment Strategien

## Investment-Strategien:
1. Künstler-Fokus
   - Aufstrebende Künstler
   - Etablierte Künstler
   - Künstler-Community

2. Projekt-Fokus
   - Utility
   - Community
   - Roadmap
   - Team

3. Markt-Fokus
   - Trends
   - Volumen
   - Liquidität
   - Floor Price

## Risikomanagement:
- Diversifikation
- Due Diligence
- Exit-Strategie
- Budget-Management
- Marktanalyse
    `
  },
  '4-1': {
    title: 'Einführung in Pulsechain',
    type: 'video',
    duration: '20:00',
    videoId: 'YwqZqXgQJYk',
    content: `
# Pulsechain: Die Zukunft des DeFi

## Was ist Pulsechain?
Pulsechain ist eine neue Blockchain-Plattform, die als Fork von Ethereum entstanden ist und sich auf DeFi-Anwendungen spezialisiert.

## Hauptmerkmale:
- Schnellere Transaktionen
- Niedrigere Gebühren
- Ethereum-Kompatibilität
- DeFi-Fokus
- Community-getrieben

## Vorteile:
- Skalierbarkeit
- Kosteneffizienz
- Innovation
- Wachsende Ökosystem
- Starke Community
    `
  },
  '4-2': {
    title: 'Top Pulsechain Coins',
    type: 'text',
    content: `
# Top Pulsechain Coins

## Native Token:
- PLS (Pulse)
  - Hauptwährung
  - Staking
  - Governance

## DeFi Tokens:
- HEX
  - Staking
  - Yield Generation
  - Community

## DEX Tokens:
- PULSEX
  - Liquidität
  - Trading
  - Rewards

## Utility Tokens:
- Various Projects
  - Gaming
  - NFTs
  - DeFi

## Investment-Aspekte:
- Tokenomics
- Team
- Community
- Utility
- Marktpotential
    `
  },
  '4-3': {
    title: 'ROI-Drucker verstehen',
    type: 'video',
    duration: '25:00',
    videoId: 'XwqZqXgQJYk',
    content: `
# ROI-Drucker auf Pulsechain

## Was sind ROI-Drucker?
ROI-Drucker sind DeFi-Protokolle, die automatisch Renditen für Token-Inhaber generieren.

## Funktionsweise:
1. Token-Kauf
2. Automatische Rewards
3. Compounding
4. Staking
5. Liquidity Providing

## Top ROI-Drucker:
- HEX
- PULSEX
- Various DeFi Projects

## Strategien:
- Diversifikation
- Timing
- Risk Management
- Monitoring
- Exit-Strategie
    `
  },
  '4-4': {
    title: 'Pulsechain DeFi Protokolle',
    type: 'text',
    content: `
# Pulsechain DeFi Protokolle

## Hauptprotokolle:
1. DEX
   - PULSEX
   - Andere DEXs

2. Lending
   - Pulse Lending
   - Pulse Finance

3. Yield Farming
   - Pulse Farms
   - Yield Aggregators

## Vorteile:
- Niedrige Gebühren
- Schnelle Transaktionen
- Innovation
- Wachsende Ökosystem
- Community-Support

## Risiken:
- Smart Contract Risiken
- Marktvolatilität
- Liquiditätsrisiken
- Technische Risiken
- Regulatorische Risiken
    `
  },
  '4-5': {
    title: 'Investment Strategien',
    type: 'video',
    duration: '30:00',
    videoId: 'ZwqZqXgQJYk',
    content: `
# Investment Strategien für Pulsechain

## Strategien:
1. Long-Term Holding
   - Staking
   - Compounding
   - Dollar-Cost-Averaging

2. Active Trading
   - DEX Trading
   - Arbitrage
   - Market Making

3. Yield Farming
   - Liquidity Providing
   - Staking
   - Lending

## Portfolio-Management:
- Diversifikation
- Risk Management
- Monitoring
- Rebalancing
- Exit-Strategien
    `
  },
  '4-6': {
    title: 'Risikomanagement und Sicherheit',
    type: 'quiz',
    questions: [
      {
        question: 'Was ist der Hauptvorteil von Pulsechain?',
        options: [
          'Höhere Gebühren',
          'Langsamere Transaktionen',
          'Niedrigere Gebühren und schnellere Transaktionen',
          'Zentralisierte Kontrolle'
        ],
        correctAnswer: 2
      },
      {
        question: 'Was ist ein ROI-Drucker?',
        options: [
          'Ein Drucker für Dokumente',
          'Ein DeFi-Protokoll für automatische Renditen',
          'Ein Mining-Gerät',
          'Ein Trading-Bot'
        ],
        correctAnswer: 1
      },
      {
        question: 'Was ist wichtig beim Investment in Pulsechain?',
        options: [
          'Nur in einen Token investieren',
          'Diversifikation und Risikomanagement',
          'Alles in einen ROI-Drucker investieren',
          'Nur kurzfristig investieren'
        ],
        correctAnswer: 1
      }
    ]
  }
}; 