-- 1) Roles enum and user_roles table
create type if not exists public.app_role as enum ('general', 'copiloto', 'admin');

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- Function to check roles (security definer to avoid recursion issues)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = _role
  );
$$;

-- RLS for user_roles
-- Users can see their own roles
create policy if not exists "Users can view their own roles" on public.user_roles
for select
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Only admins can assign/update/delete roles
create policy if not exists "Only admins can insert roles" on public.user_roles
for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy if not exists "Only admins can update roles" on public.user_roles
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy if not exists "Only admins can delete roles" on public.user_roles
for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 2) Events and Photos tables
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date,
  location text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- Trigger to auto-update updated_at
create trigger if not exists update_events_updated_at
before update on public.events
for each row execute function public.update_updated_at_column();

-- Photos table
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  caption text,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_photos_event_id on public.photos(event_id);
create index if not exists idx_photos_uploaded_by on public.photos(uploaded_by);

alter table public.photos enable row level security;

create trigger if not exists update_photos_updated_at
before update on public.photos
for each row execute function public.update_updated_at_column();

-- RLS for events
-- Anyone (even unauthenticated) can view events list
create policy if not exists "Public can view events" on public.events
for select using (true);

-- Copiloto and Admin can create events; must set created_by to themselves
create policy if not exists "Copiloto/Admin can create events" on public.events
for insert to authenticated
with check (
  created_by = auth.uid() and (
    public.has_role(auth.uid(), 'copiloto') or public.has_role(auth.uid(), 'admin')
  )
);

-- Only Admin can update/delete events (keep it strict)
create policy if not exists "Only Admin can update events" on public.events
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy if not exists "Only Admin can delete events" on public.events
for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- RLS for photos
-- Anyone can view photos metadata
create policy if not exists "Public can view photos" on public.photos
for select using (true);

-- Copiloto/Admin can upload photos; must set uploaded_by to themselves
create policy if not exists "Copiloto/Admin can upload photos" on public.photos
for insert to authenticated
with check (
  uploaded_by = auth.uid() and (
    public.has_role(auth.uid(), 'copiloto') or public.has_role(auth.uid(), 'admin')
  )
);

-- Copiloto can update/delete only their own photos; Admin can update/delete any
create policy if not exists "Admin can update any photo or Copiloto update own" on public.photos
for update to authenticated
using (
  public.has_role(auth.uid(), 'admin') or (
    uploaded_by = auth.uid() and public.has_role(auth.uid(), 'copiloto')
  )
)
with check (
  public.has_role(auth.uid(), 'admin') or (
    uploaded_by = auth.uid() and public.has_role(auth.uid(), 'copiloto')
  )
);

create policy if not exists "Admin can delete any photo or Copiloto delete own" on public.photos
for delete to authenticated
using (
  public.has_role(auth.uid(), 'admin') or (
    uploaded_by = auth.uid() and public.has_role(auth.uid(), 'copiloto')
  )
);

-- 3) Storage buckets and policies
-- Buckets: originals (private) and thumbnails (public)
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('gallery-thumbs', 'gallery-thumbs', true)
on conflict (id) do nothing;

-- Storage RLS policies on storage.objects
-- Public can view thumbnails
create policy if not exists "Public can view gallery thumbnails"
on storage.objects for select
using (bucket_id = 'gallery-thumbs');

-- Authenticated users with any role can view originals
create policy if not exists "Roles can view gallery originals"
on storage.objects for select to authenticated
using (
  bucket_id = 'gallery' and (
    public.has_role(auth.uid(), 'general') or
    public.has_role(auth.uid(), 'copiloto') or
    public.has_role(auth.uid(), 'admin')
  )
);

-- Upload originals: only Copiloto/Admin, and must upload under their own user folder
create policy if not exists "Copiloto/Admin can upload originals under own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'gallery' and (
    public.has_role(auth.uid(), 'copiloto') or public.has_role(auth.uid(), 'admin')
  ) and auth.uid()::text = (storage.foldername(name))[1]
);

-- Update/Delete originals: Admin or owner (by first folder = user id)
create policy if not exists "Admin or owner can update originals"
on storage.objects for update to authenticated
using (
  bucket_id = 'gallery' and (
    public.has_role(auth.uid(), 'admin') or auth.uid()::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'gallery' and (
    public.has_role(auth.uid(), 'admin') or auth.uid()::text = (storage.foldername(name))[1]
  )
);

create policy if not exists "Admin or owner can delete originals"
on storage.objects for delete to authenticated
using (
  bucket_id = 'gallery' and (
    public.has_role(auth.uid(), 'admin') or auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Thumbnails: allow uploads by Copiloto/Admin under their own folder; updates/deletes same
create policy if not exists "Copiloto/Admin can upload thumbnails under own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'gallery-thumbs' and (
    public.has_role(auth.uid(), 'copiloto') or public.has_role(auth.uid(), 'admin')
  ) and auth.uid()::text = (storage.foldername(name))[1]
);

create policy if not exists "Admin or owner can update thumbnails"
on storage.objects for update to authenticated
using (
  bucket_id = 'gallery-thumbs' and (
    public.has_role(auth.uid(), 'admin') or auth.uid()::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'gallery-thumbs' and (
    public.has_role(auth.uid(), 'admin') or auth.uid()::text = (storage.foldername(name))[1]
  )
);

create policy if not exists "Admin or owner can delete thumbnails"
on storage.objects for delete to authenticated
using (
  bucket_id = 'gallery-thumbs' and (
    public.has_role(auth.uid(), 'admin') or auth.uid()::text = (storage.foldername(name))[1]
  )
);
