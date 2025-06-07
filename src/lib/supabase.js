console.log("Mock Supabase for DOM testing"); 

// Mock user data
const mockUser = {
  id: "mock-user-123",
  email: "test@pulsemanager.vip",
  user_metadata: {},
  raw_user_meta_data: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: "authenticated",
  role: "authenticated"
};

// Mock session data
const mockSession = {
  access_token: "mock-access-token-123456789",
  refresh_token: "mock-refresh-token-987654321",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: mockUser
};

export const supabase = { 
  auth: { 
    signInWithPassword: async (credentials) => {
      console.log("🔧 Mock signInWithPassword called with:", credentials?.email);
      return { 
        data: { 
          user: mockUser, 
          session: mockSession 
        }, 
        error: null 
      };
    },
    signUp: async (credentials) => {
      console.log("🔧 Mock signUp called with:", credentials?.email);
      return { 
        data: { 
          user: mockUser, 
          session: mockSession 
        }, 
        error: null 
      };
    },
    getSession: async () => {
      console.log("🔧 Mock getSession called");
      return { 
        data: { 
          session: mockSession 
        }, 
        error: null 
      };
    },
    getUser: async () => {
      console.log("🔧 Mock getUser called");
      return { 
        data: { 
          user: mockUser 
        }, 
        error: null 
      };
    },
    onAuthStateChange: (callback) => {
      console.log("🔧 Mock onAuthStateChange called");
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => console.log("🔧 Mock auth subscription unsubscribed") 
          } 
        } 
      };
    },
    signOut: async () => {
      console.log("🔧 Mock signOut called");
      return { error: null };
    }
  } 
};