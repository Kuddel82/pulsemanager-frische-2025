import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const handlers = [
  // German Tax Report API
  rest.post('/api/german-tax-report', (req, res, ctx) => {
    const { walletAddress, startDate, endDate } = req.body;
    
    if (!walletAddress) {
      return res(ctx.status(400), ctx.json({ error: 'Wallet address required' }));
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          walletAddress,
          period: { startDate, endDate },
          transactions: [
            {
              hash: '0x123...abc',
              date: '2024-01-15',
              type: 'ROI',
              tokenSymbol: 'WGEP',
              amount: '1000',
              valueEUR: 50.00,
              taxType: '§22 EStG',
              fifoPosition: 1
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
    );
  }),

  // Export PDF API
  rest.post('/api/export-pdf', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'application/pdf'),
      ctx.body(new ArrayBuffer(1024))
    );
  }),

  // Moralis API Mocks
  rest.get('https://deep-index.moralis.io/api/v2/:address/erc20', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          token_address: '0x1234567890abcdef',
          symbol: 'WGEP',
          name: 'WGEP Token',
          balance: '1000000000000000000',
          decimals: 18
        }
      ])
    );
  }),

  rest.get('https://deep-index.moralis.io/api/v2/:address', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        transactions: [
          {
            hash: '0x123abc',
            block_timestamp: '2024-01-15T10:00:00Z',
            value: '1000000000000000000',
            from_address: '0xsender',
            to_address: req.params.address,
            gas_used: '21000',
            gas_price: '20000000000'
          }
        ]
      })
    );
  }),

  // Token Price API
  rest.get('/api/token-price/:symbol', (req, res, ctx) => {
    const { symbol } = req.params;
    
    const prices = {
      'WGEP': 0.05,
      'PLS': 0.0001,
      'PLSX': 0.0002,
      'ETH': 2400
    };
    
    return res(
      ctx.status(200),
      ctx.json({
        symbol,
        price: prices[symbol] || 0,
        currency: 'EUR'
      })
    );
  }),

  // Portfolio API
  rest.get('/api/portfolio/:address', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        totalValue: 5000.00,
        tokens: [
          {
            symbol: 'WGEP',
            balance: '1000',
            value: 50.00,
            priceEUR: 0.05
          },
          {
            symbol: 'PLS',
            balance: '10000000',
            value: 1000.00,
            priceEUR: 0.0001
          }
        ]
      })
    );
  }),

  // ROI Detection API
  rest.post('/api/roi-detection', (req, res, ctx) => {
    const { walletAddress } = req.body;
    
    return res(
      ctx.status(200),
      ctx.json({
        roiEntries: [
          {
            hash: '0x123abc',
            date: '2024-01-15',
            tokenSymbol: 'WGEP',
            amount: '1000',
            valueEUR: 50.00,
            source: 'DEX_SWAP'
          }
        ],
        totalROI: 50.00
      })
    );
  }),

  // Cache API
  rest.get('/api/cache/:key', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        key: req.params.key,
        data: { cached: true },
        timestamp: Date.now()
      })
    );
  }),

  rest.post('/api/cache/:key', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ success: true })
    );
  }),

  // Error scenarios
  rest.get('/api/error-test', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal server error' })
    );
  }),

  rest.get('/api/timeout-test', (req, res, ctx) => {
    return res(
      ctx.delay(10000), // 10 second delay
      ctx.status(200),
      ctx.json({ message: 'This should timeout' })
    );
  })
];

export const server = setupServer(...handlers); 