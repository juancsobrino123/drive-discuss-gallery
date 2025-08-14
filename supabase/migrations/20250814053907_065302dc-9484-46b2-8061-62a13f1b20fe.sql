-- Fix security issue: Set search_path for the function
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_replies 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.reply_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_replies 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.reply_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;