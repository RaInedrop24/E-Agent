-- Create profile for eagent_louise@rainedrop.co.uk (buyer account)
-- Run this in Supabase SQL Editor

-- First, check if user exists in auth.users
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'eagent_louise@rainedrop.co.uk';

-- Create the profile with 'buyer' role
INSERT INTO public.profiles (id, full_name, role, preferred_language)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'eagent_louise@rainedrop.co.uk'),
  'Louise',
  'buyer',  -- Buyer role for the invited user
  'en'
)
ON CONFLICT (id) DO UPDATE 
SET role = 'buyer';  -- Ensure role is correct

-- Verify it was created
SELECT id, full_name, role, preferred_language
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'eagent_louise@rainedrop.co.uk');
