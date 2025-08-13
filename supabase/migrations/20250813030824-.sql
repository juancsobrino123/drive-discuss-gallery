-- Create enum for roles (guarded)
DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('general', 'copiloto', 'admin');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END$$;

-- user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role),
  created_at timestamptz not null default now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Role check function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  );
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles" ON public.user_roles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date,
  location text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  caption text,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_photos_event_id ON public.photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON public.photos(uploaded_by);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_photos_updated_at
BEFORE UPDATE ON public.photos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for events
CREATE POLICY "Public can view events" ON public.events
FOR SELECT USING (true);

CREATE POLICY "Copiloto/Admin can create events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid() AND (
    public.has_role(auth.uid(), 'copiloto') OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Only Admin can update events" ON public.events
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only Admin can delete events" ON public.events
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for photos
CREATE POLICY "Public can view photos" ON public.photos
FOR SELECT USING (true);

CREATE POLICY "Copiloto/Admin can upload photos" ON public.photos
FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid() AND (
    public.has_role(auth.uid(), 'copiloto') OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Admin can update any photo or Copiloto update own" ON public.photos
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR (
    uploaded_by = auth.uid() AND public.has_role(auth.uid(), 'copiloto')
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR (
    uploaded_by = auth.uid() AND public.has_role(auth.uid(), 'copiloto')
  )
);

CREATE POLICY "Admin can delete any photo or Copiloto delete own" ON public.photos
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR (
    uploaded_by = auth.uid() AND public.has_role(auth.uid(), 'copiloto')
  )
);

-- storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-thumbs', 'gallery-thumbs', true)
ON CONFLICT (id) DO NOTHING;

-- storage policies
CREATE POLICY "Public can view gallery thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-thumbs');

CREATE POLICY "Roles can view gallery originals"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'gallery' AND (
    public.has_role(auth.uid(), 'general') OR
    public.has_role(auth.uid(), 'copiloto') OR
    public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Copiloto/Admin can upload originals under own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gallery' AND (
    public.has_role(auth.uid(), 'copiloto') OR public.has_role(auth.uid(), 'admin')
  ) AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admin or owner can update originals"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'gallery' AND (
    public.has_role(auth.uid(), 'admin') OR auth.uid()::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'gallery' AND (
    public.has_role(auth.uid(), 'admin') OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Admin or owner can delete originals"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'gallery' AND (
    public.has_role(auth.uid(), 'admin') OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Copiloto/Admin can upload thumbnails under own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gallery-thumbs' AND (
    public.has_role(auth.uid(), 'copiloto') OR public.has_role(auth.uid(), 'admin')
  ) AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admin or owner can update thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'gallery-thumbs' AND (
    public.has_role(auth.uid(), 'admin') OR auth.uid()::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'gallery-thumbs' AND (
    public.has_role(auth.uid(), 'admin') OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Admin or owner can delete thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'gallery-thumbs' AND (
    public.has_role(auth.uid(), 'admin') OR auth.uid()::text = (storage.foldername(name))[1]
  )
);