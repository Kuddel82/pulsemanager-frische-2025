import { useRoiTracker } from './RoiTracker'

interface TaxReport {
  year: number
  realizedGains: number
  realizedLosses: number
  transactions: {
    symbol: string
    type: 'buy' | 'sell'
    amount: number
    price: number
    timestamp: number
    profit: number
  }[]
}

export function generateTaxReport(year: number): TaxReport {
  const roiTracker = useRoiTracker.getState()
  const transactions = roiTracker.transactions.filter(
    (t) => new Date(t.timestamp).getFullYear() === year
  )

  const report: TaxReport = {
    year,
    realizedGains: 0,
    realizedLosses: 0,
    transactions: [],
  }

  // Gruppiere Transaktionen nach Token
  const tokenTransactions = transactions.reduce((acc, t) => {
    if (!acc[t.symbol]) {
      acc[t.symbol] = []
    }
    acc[t.symbol].push(t)
    return acc
  }, {} as Record<string, typeof transactions>)

  // Berechne Gewinne/Verluste für jeden Token
  Object.entries(tokenTransactions).forEach(([symbol, txs]) => {
    let remainingAmount = 0
    let averageBuyPrice = 0

    txs.forEach((tx) => {
      if (tx.type === 'buy') {
        const totalValue = remainingAmount * averageBuyPrice + tx.amount * tx.price
        remainingAmount += tx.amount
        averageBuyPrice = totalValue / remainingAmount
      } else {
        // Verkauf
        const profit = tx.amount * (tx.price - averageBuyPrice)
        report.transactions.push({
          ...tx,
          profit,
        })

        if (profit > 0) {
          report.realizedGains += profit
        } else {
          report.realizedLosses += Math.abs(profit)
        }

        remainingAmount -= tx.amount
      }
    })
  })

  return report
}

export function exportTaxReport(report: TaxReport): string {
  const csvRows = [
    ['Jahr', 'Symbol', 'Typ', 'Menge', 'Preis', 'Datum', 'Gewinn/Verlust'],
    ...report.transactions.map((t) => [
      report.year,
      t.symbol,
      t.type,
      t.amount.toString(),
      t.price.toString(),
      new Date(t.timestamp).toISOString(),
      t.profit.toString(),
    ]),
  ]

  return csvRows.map((row) => row.join(',')).join('\n')
} 