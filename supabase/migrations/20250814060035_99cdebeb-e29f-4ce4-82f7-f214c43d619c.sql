-- Add featured_image column to blog_posts table
ALTER TABLE public.blog_posts ADD COLUMN featured_image TEXT;

-- Update the RLS policies to account for the new column
-- (The existing policies should still work, but let's ensure they're comprehensive)

-- Create storage bucket for blog images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for blog images
CREATE POLICY "Blog images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can upload blog images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'blog-images' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update blog images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'blog-images' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete blog images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'blog-images' AND 
  has_role(auth.uid(), 'admin'::app_role)
);