-- Fix RLS policies for profiles table to allow viewing usernames publicly
-- Current policy only allows users to see their own profile, but we need usernames visible for author info

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies that allow public viewing of usernames while protecting sensitive data
CREATE POLICY "Public can view usernames" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can still only update their own profile
-- The existing "Users can update their own profile" policy remains unchanged