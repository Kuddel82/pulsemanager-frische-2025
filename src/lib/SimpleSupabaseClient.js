// =============================================================================
// 🔙 ORIGINAL SIMPLE SUPABASE - NUR API ENDPOINTS
// =============================================================================

// Zurück zu deinem ORIGINALEN System - keine SDKs!

// =============================================================================
// 🔗 SIMPLE SUPABASE API CLIENT
// =============================================================================

class SimpleSupabaseAPI {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`
    };
  }

  // Simple API Call (wie du es vorher hattest)
  async apiCall(endpoint, options = {}) {
    try {
      const url = `${this.url}/rest/v1${endpoint}`;
      
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          ...this.headers,
          ...(options.headers || {})
        },
        ...(options.body && { body: JSON.stringify(options.body) })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Supabase API Error:', error);
      throw error;
    }
  }

  // Simple Login (POST zu auth endpoint)
  async login(email, password) {
    try {
      const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.key
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || 'Login failed');
      }

      const data = await response.json();
      
      // Token speichern
      localStorage.setItem('supabase_token', data.access_token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      return {
        success: true,
        user: data.user,
        token: data.access_token
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Simple Logout
  async logout() {
    try {
      const token = localStorage.getItem('supabase_token');
      
      if (token) {
        await fetch(`${this.url}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': this.key
          }
        });
      }
      
      localStorage.removeItem('supabase_token');
      localStorage.removeItem('user_data');
      
      return { success: true };

    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get User Data
  async getUser() {
    try {
      const token = localStorage.getItem('supabase_token');
      if (!token) return null;

      const response = await fetch(`${this.url}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': this.key
        }
      });

      if (!response.ok) return null;

      return await response.json();

    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Database Queries (wie du sie vorher hattest)
  async select(table, query = '') {
    return await this.apiCall(`/${table}${query}`);
  }

  async insert(table, data) {
    return await this.apiCall(`/${table}`, {
      method: 'POST',
      body: data
    });
  }

  async update(table, data, query = '') {
    return await this.apiCall(`/${table}${query}`, {
      method: 'PATCH',
      body: data
    });
  }

  async delete(table, query = '') {
    return await this.apiCall(`/${table}${query}`, {
      method: 'DELETE'
    });
  }
}

// =============================================================================
// 🔧 ORIGINAL SETUP (wie du es hattest)
// =============================================================================

function setupOriginalSupabase() {
  console.log('🔙 Setting up ORIGINAL Supabase (API only)...');
  
  try {
    // Deine originalen Credentials
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lalgwvltirtqknlyuept.supabase.co';
    const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || window.supabaseKey;

    console.log('🔍 SUPABASE CONNECTION:');
    console.log('URL:', SUPABASE_URL ? '✅ Found' : '❌ Missing');
    console.log('Key:', SUPABASE_KEY ? '✅ Found' : '❌ Missing');
    console.log('🔗 Connecting to:', SUPABASE_URL);

    // Simple API Client (wie vorher)
    window.supabase = new SimpleSupabaseAPI(SUPABASE_URL, SUPABASE_KEY);
    
    // Original Helper Functions
    window.supabaseLogin = async (email, password) => {
      return await window.supabase.login(email, password);
    };
    
    window.supabaseLogout = async () => {
      return await window.supabase.logout();
    };
    
    window.getCurrentUser = async () => {
      return await window.supabase.getUser();
    };

    console.log('✅ Original Supabase setup complete');
    return true;

  } catch (error) {
    console.error('❌ Original setup failed:', error);
    return false;
  }
}

// =============================================================================
// 🗄️ ORIGINAL DATABASE FUNCTIONS
// =============================================================================

// Deine originalen Database Helper Functions
window.getUserProfile = async (userId) => {
  try {
    const data = await window.supabase.select('user_profiles', `?id=eq.${userId}`);
    return data[0] || null;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
};

window.getPortfolioCache = async (userId, walletAddress) => {
  try {
    const data = await window.supabase.select('portfolio_cache', 
      `?user_id=eq.${userId}&wallet_address=eq.${walletAddress}`
    );
    return data[0] || null;
  } catch (error) {
    console.error('Get portfolio cache error:', error);
    return null;
  }
};

window.savePortfolioCache = async (userId, walletAddress, portfolioData) => {
  try {
    const data = {
      user_id: userId,
      wallet_address: walletAddress,
      portfolio_data: portfolioData,
      total_value_usd: portfolioData.totalValue || 0,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
    };

    return await window.supabase.insert('portfolio_cache', data);
  } catch (error) {
    console.error('Save portfolio cache error:', error);
    return null;
  }
};

window.getROIEntries = async (userId) => {
  try {
    return await window.supabase.select('roi_entries', `?user_id=eq.${userId}`);
  } catch (error) {
    console.error('Get ROI entries error:', error);
    return [];
  }
};

window.saveROIEntry = async (userId, roiData) => {
  try {
    const data = {
      user_id: userId,
      ...roiData
    };
    
    return await window.supabase.insert('roi_entries', data);
  } catch (error) {
    console.error('Save ROI entry error:', error);
    return null;
  }
};

window.getTaxReports = async (userId) => {
  try {
    return await window.supabase.select('tax_reports', `?user_id=eq.${userId}&order=generated_at.desc`);
  } catch (error) {
    console.error('Get tax reports error:', error);
    return [];
  }
};

window.saveTaxReport = async (userId, reportData) => {
  try {
    const data = {
      user_id: userId,
      report_year: reportData.year || new Date().getFullYear(),
      report_data: reportData,
      fifo_calculations: reportData.fifoCalculations || {},
      total_gains_eur: reportData.totalGainsEUR || 0,
      generated_at: new Date().toISOString()
    };
    
    return await window.supabase.insert('tax_reports', data);
  } catch (error) {
    console.error('Save tax report error:', error);
    return null;
  }
};

// =============================================================================
// 🔄 AUTHENTICATION STATE MANAGEMENT
// =============================================================================

window.checkAuthState = async () => {
  try {
    const token = localStorage.getItem('supabase_token');
    const userData = localStorage.getItem('user_data');
    
    if (!token || !userData) {
      return { authenticated: false };
    }

    // Verify token is still valid
    const user = await window.getCurrentUser();
    
    if (user) {
      return {
        authenticated: true,
        user: user,
        token: token
      };
    } else {
      // Token expired, clear storage
      localStorage.removeItem('supabase_token');
      localStorage.removeItem('user_data');
      return { authenticated: false };
    }

  } catch (error) {
    console.error('Auth state check error:', error);
    return { authenticated: false };
  }
};

// =============================================================================
// 🚀 AUTO-SETUP
// =============================================================================

// Automatically setup original system
setupOriginalSupabase();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SimpleSupabaseAPI,
    setupOriginalSupabase
  };
}

console.log('🔙 ORIGINAL SIMPLE SUPABASE LOADED!');
console.log('✅ Available functions:');
console.log('   - window.supabaseLogin(email, password)');
console.log('   - window.supabaseLogout()');
console.log('   - window.getCurrentUser()');
console.log('   - window.checkAuthState()');
console.log('   - Database functions: getUserProfile, getPortfolioCache, etc.');

// =============================================================================
// 🧪 QUICK TEST
// =============================================================================

setTimeout(async () => {
  try {
    console.log('🧪 Testing original Supabase connection...');
    
    // Test basic connection
    const authState = await window.checkAuthState();
    console.log('Auth state:', authState.authenticated ? 'Logged in' : 'Not logged in');
    
    console.log('✅ Original Supabase test complete');
    
  } catch (error) {
    console.log('⚠️ Supabase test failed (normal if not logged in):', error.message);
  }
}, 1000); 