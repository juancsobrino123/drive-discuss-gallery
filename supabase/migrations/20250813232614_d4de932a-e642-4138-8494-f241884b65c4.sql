-- Security Fixes Migration
-- Fix critical role escalation and data privacy issues

-- 1. Create a secure bootstrap function for the first admin user
-- This function can only be called once and requires a specific email
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(admin_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count integer;
  target_user_id uuid;
BEGIN
  -- Check if any admin already exists
  SELECT count(*) INTO admin_count 
  FROM public.user_roles 
  WHERE role = 'admin'::app_role;
  
  -- Only allow if no admins exist
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Admin user already exists. Bootstrap can only be used once.';
  END IF;
  
  -- Find user by email
  SELECT au.id INTO target_user_id
  FROM auth.users au
  WHERE au.email = admin_email;
  
  -- Check if user exists
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  -- Create admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::app_role);
  
  RETURN true;
END;
$$;

-- 2. Update profiles table RLS to require authentication for viewing
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Update forum threads to require authentication
DROP POLICY IF EXISTS "Anyone can view forum threads with privacy protection" ON public.forum_threads;
CREATE POLICY "Authenticated users can view forum threads" 
ON public.forum_threads 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 4. Update forum replies to require authentication  
DROP POLICY IF EXISTS "Anyone can view forum replies with privacy protection" ON public.forum_replies;
CREATE POLICY "Authenticated users can view forum replies" 
ON public.forum_replies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 5. Update photos table to require authentication for viewing
DROP POLICY IF EXISTS "Public can view photos with privacy protection" ON public.photos;
CREATE POLICY "Authenticated users can view photos" 
ON public.photos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 6. Keep events public for marketing/promotional purposes
-- Events remain public as they serve as promotional content

-- 7. Keep blog posts public for SEO and marketing
-- Blog posts remain public for content marketing

-- 8. Add audit logging for role changes
CREATE TABLE IF NOT EXISTS public.role_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  action text NOT NULL, -- 'granted' or 'revoked'
  performed_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.role_change_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view role change logs
CREATE POLICY "Admins can view role change logs" 
ON public.role_change_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. Create audit trigger for role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_change_log (user_id, role, action, performed_by)
    VALUES (NEW.user_id, NEW.role, 'granted', auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_change_log (user_id, role, action, performed_by)
    VALUES (OLD.user_id, OLD.role, 'revoked', auth.uid());
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_role_changes ON public.user_roles;
CREATE TRIGGER audit_role_changes
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes();

-- 10. Add input validation for profiles
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate username length and characters
  IF NEW.username IS NOT NULL THEN
    IF length(NEW.username) < 2 OR length(NEW.username) > 50 THEN
      RAISE EXCEPTION 'Username must be between 2 and 50 characters';
    END IF;
    
    IF NEW.username !~ '^[a-zA-Z0-9_-]+$' THEN
      RAISE EXCEPTION 'Username can only contain letters, numbers, underscores, and hyphens';
    END IF;
  END IF;
  
  -- Validate avatar URL format
  IF NEW.avatar_url IS NOT NULL AND NEW.avatar_url != '' THEN
    IF NOT (NEW.avatar_url ~ '^https?://') THEN
      RAISE EXCEPTION 'Avatar URL must be a valid HTTP/HTTPS URL';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create validation trigger for profiles
DROP TRIGGER IF EXISTS validate_profile_data_trigger ON public.profiles;
CREATE TRIGGER validate_profile_data_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_data();