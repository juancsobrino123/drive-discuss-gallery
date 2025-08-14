-- Add parent_reply_id to track which message is being replied to
ALTER TABLE public.forum_replies 
ADD COLUMN parent_reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE;

-- Add likes_count to forum_replies for performance
ALTER TABLE public.forum_replies 
ADD COLUMN likes_count integer NOT NULL DEFAULT 0;

-- Create likes table to track who liked what
CREATE TABLE public.forum_reply_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id uuid NOT NULL REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

-- Enable RLS on forum_reply_likes
ALTER TABLE public.forum_reply_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for forum_reply_likes
CREATE POLICY "Authenticated users can view likes" 
ON public.forum_reply_likes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can like replies" 
ON public.forum_reply_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" 
ON public.forum_reply_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to automatically update likes count
CREATE TRIGGER update_forum_reply_likes_count
  AFTER INSERT OR DELETE ON public.forum_reply_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_likes_count();

-- Create index for better performance
CREATE INDEX idx_forum_replies_parent_reply_id ON public.forum_replies(parent_reply_id);
CREATE INDEX idx_forum_replies_likes_count ON public.forum_replies(likes_count DESC);
CREATE INDEX idx_forum_reply_likes_reply_id ON public.forum_reply_likes(reply_id);
CREATE INDEX idx_forum_reply_likes_user_id ON public.forum_reply_likes(user_id);