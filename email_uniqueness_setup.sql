-- ================================
-- 🔐 EMAIL UNIQUENESS ENFORCEMENT
-- ================================
-- Execute this in Supabase SQL Editor to prevent duplicate emails

-- Create function to prevent duplicate emails (case-insensitive)
CREATE OR REPLACE FUNCTION prevent_duplicate_emails()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if email already exists (case-insensitive)
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE LOWER(email) = LOWER(NEW.email) 
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'Email address already exists: %', NEW.email
            USING HINT = 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.';
    END IF;
    
    -- Normalize email to lowercase
    NEW.email = LOWER(TRIM(NEW.email));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce email uniqueness
DROP TRIGGER IF EXISTS enforce_unique_email ON auth.users;
CREATE TRIGGER enforce_unique_email
    BEFORE INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_emails();

-- Add unique constraint as backup (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_unique_lower'
    ) THEN
        ALTER TABLE auth.users 
        ADD CONSTRAINT users_email_unique_lower 
        UNIQUE (LOWER(email));
    END IF;
END $$;

-- Test function to check for existing email
CREATE OR REPLACE FUNCTION check_email_exists(input_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE LOWER(email) = LOWER(TRIM(input_email))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ Email uniqueness enforcement activated!';
RAISE NOTICE '🔐 Trigger and constraints added to prevent duplicate emails';
RAISE NOTICE '📧 All emails will be normalized to lowercase automatically'; 