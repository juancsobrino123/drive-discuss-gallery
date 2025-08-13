-- Fix security linter warnings for function search paths

-- Fix bootstrap_first_admin function
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(admin_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix log_role_changes function
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix validate_profile_data function
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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