-- Create or update test account profiles with CORRECT roles
-- Run this entire script in Supabase SQL Editor

-- 1. Create AGENT profile for Eagent_Admin@rainedrop.co.uk
INSERT INTO public.profiles (id, full_name, role, preferred_language)
SELECT 
  id,
  'Admin',
  'agent',  -- CRITICAL: Must be 'agent' to create transactions
  'en'
FROM auth.users 
WHERE email = 'Eagent_Admin@rainedrop.co.uk'
ON CONFLICT (id) DO UPDATE 
SET role = 'agent', full_name = 'Admin';

-- 2. Create BUYER profile for eagent_louise@rainedrop.co.uk  
INSERT INTO public.profiles (id, full_name, role, preferred_language)
SELECT 
  id,
  'Louise',
  'buyer',
  'en'
FROM auth.users 
WHERE email = 'eagent_louise@rainedrop.co.uk'
ON CONFLICT (id) DO UPDATE 
SET role = 'buyer', full_name = 'Louise';

-- 3. Verify both profiles were created correctly
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.preferred_language
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email IN ('Eagent_Admin@rainedrop.co.uk', 'eagent_louise@rainedrop.co.uk')
ORDER BY p.role DESC;

-- Expected output:
-- | id (uuid) | email | full_name | role | preferred_language |
-- | xxxxxxxxx | Eagent_Admin@rainedrop.co.uk | Admin | agent | en |
-- | yyyyyyyyy | eagent_louise@rainedrop.co.uk | Louise | buyer | en |
