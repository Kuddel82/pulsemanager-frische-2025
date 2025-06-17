// 🔙 ORIGINAL KOMPATIBILITÄT - SimpleSupabaseClient für alle bestehenden Imports
// Alle bestehenden `import { supabase } from '@/lib/supabaseClient'` funktionieren!

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lalgwvltirtqknlyuept.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 SUPABASE CONNECTION (SIMPLE API):");
console.log("URL:", supabaseUrl ? "✅ Found" : "❌ Missing");
console.log("Key:", supabaseAnonKey ? "✅ Found" : "❌ Missing");
console.log("🔗 Connecting to:", supabaseUrl);

// Simple API Client (ohne SDK!)
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

  // Kompatible auth Methoden für bestehenden Code
  auth = {
    signInWithPassword: async ({ email, password }) => {
      try {
        const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.key
          },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const error = await response.json();
          return { data: null, error: { message: error.error_description || 'Login failed' } };
        }

        const data = await response.json();
        localStorage.setItem('supabase_token', data.access_token);
        localStorage.setItem('supabase_refresh_token', data.refresh_token); // 🔥 REFRESH TOKEN SPEICHERN
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        console.log('✅ Login successful with refresh token saved');
        
        return { 
          data: { user: data.user, session: { user: data.user, access_token: data.access_token } },
          error: null 
        };
      } catch (error) {
        return { data: null, error: { message: error.message } };
      }
    },

    signOut: async () => {
      try {
        const token = localStorage.getItem('supabase_token');
        if (token) {
          await fetch(`${this.url}/auth/v1/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'apikey': this.key }
          });
        }
        localStorage.removeItem('supabase_token');
        localStorage.removeItem('supabase_refresh_token'); // 🔥 REFRESH TOKEN AUCH LÖSCHEN
        localStorage.removeItem('user_data');
        return { error: null };
      } catch (error) {
        return { error: { message: error.message } };
      }
    },

    getSession: async () => {
      const token = localStorage.getItem('supabase_token');
      const userData = localStorage.getItem('user_data');
      if (token && userData) {
        return { data: { session: { user: JSON.parse(userData), access_token: token } } };
      }
      return { data: { session: null } };
    },

    onAuthStateChange: (callback) => {
      // Mock für bestehenden Code
      setTimeout(() => {
        const userData = localStorage.getItem('user_data');
        callback(userData ? 'SIGNED_IN' : 'SIGNED_OUT', userData ? JSON.parse(userData) : null);
      }, 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  };

  // 🔥 EINFACHE DATABASE METHODEN mit Auth-Headers
  from(table) {
    // Helper für Auth-Headers mit TOKEN VALIDATION & REFRESH
    const getAuthHeaders = async () => {
      const token = localStorage.getItem('supabase_token');
      const userData = localStorage.getItem('user_data');
      
      // 🔥 TOKEN VALIDATION: Check if token is still valid
      if (token) {
        try {
          // Test token with a simple request
          const testResponse = await fetch(`${this.url}/rest/v1/user_profiles?select=id&limit=1`, {
            headers: {
              'apikey': this.key,
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (testResponse.status === 401) {
            console.warn('🔄 Token expired, attempting refresh...');
            
            // Try to refresh token using refresh_token if available
            const refreshToken = localStorage.getItem('supabase_refresh_token');
            if (refreshToken) {
              const refreshResponse = await fetch(`${this.url}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': this.key
                },
                body: JSON.stringify({ refresh_token: refreshToken })
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('supabase_token', refreshData.access_token);
                localStorage.setItem('supabase_refresh_token', refreshData.refresh_token);
                localStorage.setItem('user_data', JSON.stringify(refreshData.user));
                
                console.log('✅ Token refreshed successfully');
                return {
                  'Content-Type': 'application/json',
                  'apikey': this.key,
                  'Authorization': `Bearer ${refreshData.access_token}`,
                  'Prefer': 'return=minimal'
                };
              }
            } else {
              // 🔥 KEIN REFRESH TOKEN = ALTE SESSION = FORCE LOGOUT
              console.error('❌ No refresh token found - old session detected, forcing logout');
              localStorage.removeItem('supabase_token');
              localStorage.removeItem('supabase_refresh_token');
              localStorage.removeItem('user_data');
              
              // Redirect to login page
              if (window.location.pathname !== '/login') {
                alert('Deine Session ist abgelaufen. Bitte logge dich neu ein.');
                window.location.href = '/login';
                return;
              }
            }
            
            // If refresh fails, clear invalid tokens
            console.error('❌ Token refresh failed, clearing auth data');
            localStorage.removeItem('supabase_token');
            localStorage.removeItem('supabase_refresh_token');
            localStorage.removeItem('user_data');
            
            // Use service key as fallback
            return {
              'Content-Type': 'application/json',
              'apikey': this.key,
              'Authorization': `Bearer ${this.key}`,
              'Prefer': 'return=minimal'
            };
          }
        } catch (error) {
          console.warn('🔄 Token validation failed:', error.message);
        }
      }
      
      // Debug-Info für Auth-Status
      console.log(`🔐 Auth Headers for ${table}:`, {
        hasToken: !!token,
        hasUserData: !!userData,
        tokenLength: token?.length || 0
      });
      
      return {
        'Content-Type': 'application/json',
        'apikey': this.key,
        'Authorization': token ? `Bearer ${token}` : `Bearer ${this.key}`,
        // Zusätzliche Headers für bessere Kompatibilität
        'Prefer': 'return=minimal'
      };
    };

    return {
      select: (columns = '*') => {
        const filters = [];
        
        const builder = {
          eq: (column, value) => {
            filters.push(`${column}=eq.${encodeURIComponent(value)}`);
            return builder; // Return builder for chaining
          },
          
          order: (column, options = {}) => {
            const { ascending = true } = options;
            const direction = ascending ? 'asc' : 'desc';
            filters.push(`order=${column}.${direction}`);
            return builder; // Return builder for chaining
          },
          
          single: async () => {
            try {
              const filterQuery = filters.length > 0 ? `&${filters.join('&')}` : '';
              const headers = await getAuthHeaders();
              
              console.log(`🔍 Single select from ${table}:`, {
                url: `${this.url}/rest/v1/${table}?select=${columns}${filterQuery}&limit=1`,
                headers: { ...headers, Authorization: headers.Authorization?.substring(0, 20) + '...' }
              });
              
              const response = await fetch(`${this.url}/rest/v1/${table}?select=${columns}${filterQuery}&limit=1`, {
                headers
              });
              
              if (!response.ok) {
                console.error(`❌ Single select failed: ${response.status} ${response.statusText}`);
                throw new Error(`Database error: ${response.status}`);
              }
              
              const data = await response.json();
              return { data: data[0] || null, error: null };
            } catch (error) {
              console.error('❌ Single select error:', error);
              return { data: null, error: { message: error.message } };
            }
          },
          
          // For direct await without .single()
          then: (resolve, reject) => {
            const execute = async () => {
              try {
                const filterQuery = filters.length > 0 ? `&${filters.join('&')}` : '';
                const headers = await getAuthHeaders();
                
                console.log(`🔍 Select from ${table}:`, {
                  url: `${this.url}/rest/v1/${table}?select=${columns}${filterQuery}`,
                  headers: { ...headers, Authorization: headers.Authorization?.substring(0, 20) + '...' }
                });
                
                const response = await fetch(`${this.url}/rest/v1/${table}?select=${columns}${filterQuery}`, {
                  headers
                });
                
                if (!response.ok) {
                  console.error(`❌ Select failed: ${response.status} ${response.statusText}`);
                  throw new Error(`Database error: ${response.status}`);
                }
                
                const data = await response.json();
                return { data, error: null };
              } catch (error) {
                console.error('❌ Select error:', error);
                return { data: null, error: { message: error.message } };
              }
            };
            return execute().then(resolve, reject);
          }
        };
        
        return builder;
      },

      // 🔥 UPSERT METHOD - FEHLTE KOMPLETT!
      upsert: (values, options = {}) => {
        const upsertBuilder = {
          select: (columns = '*') => {
            const selectBuilder = {
              single: async () => {
                try {
                  const headers = {
                    ...await getAuthHeaders(),
                    'Prefer': 'return=representation,resolution=merge-duplicates'
                  };
                  
                  console.log(`🔄 Upsert to ${table}:`, {
                    values,
                    headers: { ...headers, Authorization: headers.Authorization?.substring(0, 20) + '...' }
                  });
                  
                  const response = await fetch(`${this.url}/rest/v1/${table}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(values)
                  });
                  
                  if (!response.ok) {
                    console.error(`❌ Upsert failed: ${response.status} ${response.statusText}`);
                    const errorText = await response.text();
                    console.error('❌ Error details:', errorText);
                    throw new Error(`Database error: ${response.status} - ${errorText}`);
                  }
                  
                  const data = await response.json();
                  return { data: data[0] || data, error: null };
                } catch (error) {
                  console.error('❌ Upsert error:', error);
                  return { data: null, error: { message: error.message } };
                }
              },
              
              // For direct await without .single()
              then: (resolve, reject) => {
                return selectBuilder.single().then(resolve, reject);
              }
            };
            return selectBuilder;
          },
          
          // Direct upsert without select
          then: (resolve, reject) => {
            const execute = async () => {
              try {
                const headers = {
                  ...await getAuthHeaders(),
                  'Prefer': 'return=minimal,resolution=merge-duplicates'
                };
                
                const response = await fetch(`${this.url}/rest/v1/${table}`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(values)
                });
                
                if (!response.ok) {
                  throw new Error(`Database error: ${response.status}`);
                }
                
                return { data: null, error: null };
              } catch (error) {
                console.error('❌ Upsert error:', error);
                return { data: null, error: { message: error.message } };
              }
            };
            return execute().then(resolve, reject);
          }
        };
        return upsertBuilder;
      },

      insert: (values) => {
        const insertBuilder = {
          select: (columns = '*') => {
            const selectBuilder = {
              single: async () => {
                try {
                  // UPSERT Logic: INSERT mit ON CONFLICT DO UPDATE
                  const headers = {
                    ...await getAuthHeaders(),
                    'Prefer': 'return=representation,resolution=merge-duplicates'
                  };
                  
                  const response = await fetch(`${this.url}/rest/v1/${table}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(values)
                  });
                  
                  if (!response.ok && response.status !== 409) {
                    console.error(`❌ Insert error: ${response.status} ${response.statusText}`);
                    throw new Error(`Database error: ${response.status}`);
                  }
                  
                  let data;
                  if (response.status === 409) {
                    // Conflict - Update existing entry instead
                    console.log('📝 Wallet exists - updating instead of inserting');
                    console.log('🔍 Values for update:', values);
                    
                    // Validierung: wallet_address ODER address muss definiert sein
                    const walletAddress = values.wallet_address || values.address;
                    if (!walletAddress || walletAddress === 'undefined') {
                      console.error('❌ CRITICAL: wallet_address/address is undefined!', values);
                      throw new Error('Wallet address is required but undefined');
                    }
                    
                    // Bestimme den richtigen Schlüssel für das Update
                    const updateKey = table === 'wallets' ? 'address' : 'wallet_address';
                    const updateResponse = await fetch(`${this.url}/rest/v1/${table}?${updateKey}=eq.${encodeURIComponent(walletAddress)}`, {
                      method: 'PATCH',
                      headers: {
                        ...await getAuthHeaders(),
                        'Prefer': 'return=representation'
                      },
                      body: JSON.stringify(values)
                    });
                    
                    if (!updateResponse.ok) {
                      const errorText = await updateResponse.text();
                      console.error('❌ Update failed:', updateResponse.status, errorText);
                      throw new Error(`Update error: ${updateResponse.status} - ${errorText}`);
                    }
                    data = await updateResponse.json();
                  } else {
                    data = await response.json();
                  }
                  
                  return { data: data[0] || data, error: null };
                } catch (error) {
                  console.error('❌ Insert/Update error:', error);
                  return { data: null, error: { message: error.message } };
                }
              },
              
              // For direct await without .single()
              then: (resolve, reject) => {
                return selectBuilder.single().then(resolve, reject);
              }
            };
            return selectBuilder;
          }
        };
        return insertBuilder;
      },

      update: (values) => ({
        eq: async (column, value) => {
          try {
            const response = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}`, {
              method: 'PATCH',
              headers: await getAuthHeaders(),
              body: JSON.stringify(values)
            });
            
            if (!response.ok) throw new Error(`Database error: ${response.status}`);
            const data = await response.json();
            return { data, error: null };
          } catch (error) {
            return { data: null, error: { message: error.message } };
          }
        }
      }),

      delete: () => ({
        eq: async (column, value) => {
          try {
            const response = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}`, {
              method: 'DELETE',
              headers: await getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`Database error: ${response.status}`);
            return { error: null };
          } catch (error) {
            return { error: { message: error.message } };
          }
        }
      })
    };
  }
}

// Erstelle den kompatiblen Client
export const supabase = new SimpleSupabaseAPI(supabaseUrl, supabaseAnonKey);

// Export für Kompatibilität mit bestehenden Imports
export default supabase; 

console.log("✅ Simple Supabase Client loaded (SDK-compatible)"); 