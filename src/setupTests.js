import '@testing-library/jest-dom';
import { server } from './mocks/server';

// MSW Mock-Server für API-Tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock für Browser APIs
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock für fetch - falls nicht durch MSW abgedeckt
global.fetch = jest.fn();

// Mock für Moralis SDK
jest.mock('moralis', () => ({
  EvmApi: {
    token: {
      getTokenPrice: jest.fn(),
      getWalletTokenBalances: jest.fn()
    },
    transaction: {
      getWalletTransactions: jest.fn()
    }
  },
  start: jest.fn(),
  isStarted: jest.fn().mockReturnValue(true)
}));

// Mock für Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnValue({ data: null, error: null })
    })),
    auth: {
      getSession: jest.fn().mockReturnValue({ data: { session: null } }),
      signIn: jest.fn(),
      signOut: jest.fn()
    }
  }))
}));

// Mock für localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock für sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock für window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  hostname: 'localhost',
  pathname: '/',
  search: '',
  hash: '',
  reload: jest.fn(),
  assign: jest.fn()
};

// Mock für environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_MORALIS_API_KEY = 'test-moralis-key';

// Console cleanup für Tests
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  document.body.innerHTML = '';
  if (window.localStorage) window.localStorage.clear();
  if (window.sessionStorage) window.sessionStorage.clear();
});

// Global error handling für Tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock für IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock für ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})); 