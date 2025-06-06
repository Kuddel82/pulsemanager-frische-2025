import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TokenPrice {
  symbol: string
  price: number
  timestamp: number
}

interface TokenTransaction {
  symbol: string
  type: 'buy' | 'sell'
  amount: number
  price: number
  timestamp: number
}

interface RoiState {
  prices: TokenPrice[]
  transactions: TokenTransaction[]
  addPrice: (price: TokenPrice) => void
  addTransaction: (transaction: TokenTransaction) => void
  getTokenRoi: (symbol: string) => number
  getTokenValue: (symbol: string, amount: number) => number
  getTokenTransactions: (symbol: string) => TokenTransaction[]
}

export const useRoiTracker = create<RoiState>()(
  persist(
    (set, get) => ({
      prices: [],
      transactions: [],

      addPrice: (price) =>
        set((state) => ({
          prices: [...state.prices, price],
        })),

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [...state.transactions, transaction],
        })),

      getTokenRoi: (symbol) => {
        const state = get()
        const tokenPrices = state.prices.filter((p) => p.symbol === symbol)
        const tokenTransactions = state.transactions.filter((t) => t.symbol === symbol)

        if (tokenPrices.length < 2 || tokenTransactions.length === 0) return 0

        const latestPrice = tokenPrices[tokenPrices.length - 1].price
        const totalInvestment = tokenTransactions.reduce((sum, t) => {
          return sum + (t.type === 'buy' ? t.amount * t.price : -t.amount * t.price)
        }, 0)

        const currentValue = tokenTransactions.reduce((sum, t) => {
          return sum + (t.type === 'buy' ? t.amount : -t.amount) * latestPrice
        }, 0)

        return totalInvestment === 0 ? 0 : ((currentValue - totalInvestment) / totalInvestment) * 100
      },

      getTokenValue: (symbol, amount) => {
        const state = get()
        const latestPrice = state.prices
          .filter((p) => p.symbol === symbol)
          .sort((a, b) => b.timestamp - a.timestamp)[0]?.price

        return latestPrice ? amount * latestPrice : 0
      },

      getTokenTransactions: (symbol) => {
        const state = get()
        return state.transactions
          .filter((t) => t.symbol === symbol)
          .sort((a, b) => b.timestamp - a.timestamp)
      },
    }),
    {
      name: 'roi-tracker',
    }
  )
) 