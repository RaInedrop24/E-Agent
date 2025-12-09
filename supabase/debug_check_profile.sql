-- Debug script to check if the agent profile exists and has the correct role

-- Check if logged-in user has a profile
SELECT 
    auth.uid() as current_user_id,
    p.id,
    p.full_name,
    p.role,
    p.preferred_language
FROM public.profiles p
WHERE p.id = auth.uid();

-- If no results, the profile doesn't exist
-- If results show role != 'agent', the role is wrong

-- To manually create/fix the profile, run:
-- INSERT INTO public.profiles (id, full_name, role, preferred_language)
-- VALUES (auth.uid(), 'Admin', 'agent', 'en')
-- ON CONFLICT (id) DO UPDATE SET role = 'agent';
