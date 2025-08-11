-- 1) Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Timestamp trigger function (shared)
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach trigger to profiles
create or replace trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Profile policies
create policy if not exists "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy if not exists "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy if not exists "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Optional: allow public read of basic profile fields if needed later (commented out)
-- create policy "Public can view basic profile fields" on public.profiles for select using (true);

-- 2) Trigger to insert profile on new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''), new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3) Roles system
-- Enum for app roles
create type if not exists public.app_role as enum ('admin', 'moderator', 'user');

-- user_roles table
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Function to check role (SECURITY DEFINER to avoid recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- RLS policies for user_roles
-- Users can view their own roles
create policy if not exists "Users can view their roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- Only admins can manage roles (insert/update/delete)
create policy if not exists "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 4) Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies
-- Public can read avatar images
create policy if not exists "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can upload/update/delete their own avatar files under a folder with their user id
create policy if not exists "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );