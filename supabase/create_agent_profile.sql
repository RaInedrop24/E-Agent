-- Create profile for Eagent_Admin@rainedrop.co.uk
-- Run this in Supabase SQL Editor

-- First, check if user exists in auth.users
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'Eagent_Admin@rainedrop.co.uk';

-- Copy the user ID from above, then create the profile
-- Replace 'PASTE_USER_ID_HERE' with the actual UUID from above
INSERT INTO public.profiles (id, full_name, role, preferred_language)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'Eagent_Admin@rainedrop.co.uk'),
  'Admin',
  'agent',  -- IMPORTANT: Must be 'agent' to create transactions
  'en'
)
ON CONFLICT (id) DO UPDATE 
SET role = 'agent';  -- Ensure role is correct

-- Verify it was created
SELECT id, full_name, role, preferred_language
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'Eagent_Admin@rainedrop.co.uk');
