# 🔐 SUPABASE ENVIRONMENT VARIABLES SETUP

## Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## How to get these values:

1. **Go to your Supabase Dashboard:** https://supabase.com/dashboard
2. **Select your project** or create a new one
3. **Go to Settings → API**
4. **Copy the values:**
   - **URL**: Copy the "Project URL"
   - **ANON KEY**: Copy the "anon public" key

## Example .env file:

```bash
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Notes:

- ✅ The **anon key** is safe to use in frontend (public)
- ❌ Never use the **service_role** key in frontend
- ✅ Environment variables starting with `VITE_` are exposed to frontend
- 🔒 Add `.env` to `.gitignore` (already configured)

## Verification:

Once configured, the app will:
- ✅ Connect to your Supabase database
- ✅ Enable real user authentication
- ✅ Store user data securely
- ❌ Show error if variables are missing/incorrect 