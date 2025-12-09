-- Debug script to test the current_user_is_agent() function
-- Run this while logged in as Eagent_Admin@rainedrop.co.uk

-- Test 1: Check auth.uid()
SELECT auth.uid() as current_user_id;

-- Test 2: Check if profile exists for current user
SELECT id, full_name, role 
FROM public.profiles 
WHERE id = auth.uid();

-- Test 3: Test the current_user_is_agent() function
SELECT public.current_user_is_agent() as is_agent;

-- Test 4: Manual check (same logic as the function)
SELECT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND role = 'agent'
) as manual_check;

-- All should return true/agent values if everything is working
