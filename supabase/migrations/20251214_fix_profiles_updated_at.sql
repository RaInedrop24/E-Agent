-- Fix profiles table updated_at column and trigger
-- Date: 2025-12-14
-- Issue: Trigger expects updated_at column but it may not exist in all deployments

-- Step 1: Check and add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
    
    RAISE NOTICE 'Added updated_at column to profiles table';
  ELSE
    RAISE NOTICE 'updated_at column already exists in profiles table';
  END IF;
END $$;

-- Step 2: Ensure the trigger function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update updated_at if the column exists
  IF TG_TABLE_NAME = 'profiles' THEN
    NEW.updated_at = now();
  ELSIF TG_TABLE_NAME = 'transactions' THEN
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at() IS 
  'Automatically updates the updated_at timestamp on row update';

-- Step 3: Drop and recreate the trigger to ensure it's properly configured
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TRIGGER set_updated_at ON public.profiles IS 
  'Automatically updates updated_at timestamp when profile is modified';

-- Step 4: Verify the setup
DO $$
DECLARE
  col_exists boolean;
  trigger_exists boolean;
BEGIN
  -- Check column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) INTO col_exists;
  
  -- Check trigger exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'set_updated_at' 
    AND tgrelid = 'public.profiles'::regclass
  ) INTO trigger_exists;
  
  IF col_exists AND trigger_exists THEN
    RAISE NOTICE '✅ profiles.updated_at column and trigger are properly configured';
  ELSE
    RAISE WARNING '⚠️  Configuration incomplete - col_exists: %, trigger_exists: %', 
      col_exists, trigger_exists;
  END IF;
END $$;

-- Step 5: Set existing rows' updated_at to created_at if they're null or old
UPDATE public.profiles 
SET updated_at = created_at 
WHERE updated_at IS NULL 
   OR updated_at < created_at;

RAISE NOTICE 'Migration 20251214_fix_profiles_updated_at completed successfully';

