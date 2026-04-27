-- ================================================================
-- CarGo — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- ── 1. PROFILES ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  full_name    text not null,
  phone        text,
  role         text not null default 'renter' check (role in ('renter', 'owner')),
  avatar_url   text,
  wilaya       text,
  is_verified  boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Drop old policies if they exist
drop policy if exists "Users can view all profiles" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;

-- Create updated policies
create policy "Users can view all profiles"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Add missing columns to profiles if they don't exist (for existing tables)
alter table public.profiles add column if not exists is_verified boolean not null default false;

-- ── 1.5. IDENTITY VERIFICATIONS (For owner onboarding) ─────────────
create table if not exists public.identity_verifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  full_name    text not null,
  id_number    text not null,
  phone        text not null,
  id_document  text not null,
  license_front text not null,
  license_back text not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by  uuid references auth.users(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.identity_verifications enable row level security;

-- Drop old policies if they exist
drop policy if exists "Users can view their own verifications" on identity_verifications;
drop policy if exists "Users can insert their own verifications" on identity_verifications;
drop policy if exists "Admins can view all verifications" on identity_verifications;
drop policy if exists "Admins can update verifications" on identity_verifications;

-- Create updated policies
create policy "Users can view their own verifications"
  on identity_verifications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own verifications"
  on identity_verifications for insert
  with check (auth.uid() = user_id);

-- Admin can read ALL verifications
create policy "Admins can view all verifications"
  on identity_verifications for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admin can update verification status (approve / reject)
create policy "Admins can update verifications"
  on identity_verifications for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── STORAGE: documents bucket ────────────────────────────────────
-- Run these after creating the 'documents' bucket in the dashboard.
-- Make sure the bucket is set to PRIVATE (not public).

-- Allow authenticated users to upload their own documents
drop policy if exists "Users can upload own documents" on storage.objects;
create policy "Users can upload own documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow admins to read all documents (needed for createSignedUrl)
drop policy if exists "Admins can read all documents" on storage.objects;
create policy "Admins can read all documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow users to read their own documents (file lives inside their user_id folder)
drop policy if exists "Users can read own documents" on storage.objects;
create policy "Users can read own documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role, wilaya)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'renter'),
    coalesce(new.raw_user_meta_data->>'wilaya', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. CARS ──────────────────────────────────────────────────────
create table if not exists public.cars (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid references public.profiles(id) on delete cascade not null,
  brand          text not null,
  model          text not null,
  year           int not null,
  price_per_day  numeric(10,2) not null,
  wilaya         text not null,
  description    text,
  images         text[] default '{}',
  category       text default 'economical' check (category in ('economical', 'manual', 'automatic')),
  with_driver    boolean default false,
  transmission   text default 'manual' check (transmission in ('manual', 'automatic')),
  fuel           text default 'essence' check (fuel in ('essence', 'diesel', 'electrique')),
  seats          int default 5,
  is_available   boolean not null default true,
  is_verified    boolean not null default false,
  verified_by_admin uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Add missing columns if they don't exist (for existing tables)
alter table public.cars add column if not exists with_driver boolean default false;
alter table public.cars add column if not exists is_verified boolean not null default false;
alter table public.cars add column if not exists verified_by_admin uuid references public.profiles(id) on delete set null;

-- Update category values from old 'economy' to 'economical' if any exist
update public.cars set category = 'economical' where category = 'economy';

alter table public.cars enable row level security;

-- Drop old policies if they exist
drop policy if exists "Anyone can view available cars" on cars;
drop policy if exists "Anyone can view verified cars" on cars;
drop policy if exists "Owners can view own cars" on cars;
drop policy if exists "Owners can insert their own cars" on cars;
drop policy if exists "Owners can update their own cars" on cars;
drop policy if exists "Owners can delete their own cars" on cars;

-- Create updated policies
create policy "Anyone can view verified cars"
  on cars for select using (is_verified = true);

create policy "Owners can view own cars"
  on cars for select using (auth.uid() = owner_id);

create policy "Owners can insert their own cars"
  on cars for insert with check (auth.uid() = owner_id);

create policy "Owners can update their own cars"
  on cars for update using (auth.uid() = owner_id);

create policy "Owners can delete their own cars"
  on cars for delete using (auth.uid() = owner_id);

-- ── 3. BOOKINGS ───────────────────────────────────────────────────
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid references public.cars(id) on delete cascade not null,
  renter_id    uuid references public.profiles(id) on delete cascade not null,
  owner_id     uuid references public.profiles(id) on delete cascade not null,
  start_date   date not null,
  end_date     date not null,
  total_price  numeric(12,2) not null,
  commission   numeric(12,2) default 0,
  status       text not null default 'pending'
                 check (status in ('pending','accepted','rejected','active','completed','cancelled')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Drop old policies if they exist
drop policy if exists "Renters and owners can view their own bookings" on bookings;
drop policy if exists "Renters can create bookings" on bookings;
drop policy if exists "Owners can update booking status" on bookings;

-- Create updated policies
create policy "Renters and owners can view their own bookings"
  on bookings for select
  using (auth.uid() = renter_id or auth.uid() = owner_id);

create policy "Renters can create bookings"
  on bookings for insert
  with check (auth.uid() = renter_id);

create policy "Owners can update booking status"
  on bookings for update
  using (auth.uid() = owner_id or auth.uid() = renter_id);

-- ── 3.5. BIDS (For rental bidding system) ─────────────────────────
create table if not exists public.bids (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid references public.cars(id) on delete cascade not null,
  renter_id    uuid references public.profiles(id) on delete cascade not null,
  start_date   date not null,
  end_date     date not null,
  offered_price numeric(12,2) not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'accepted', 'rejected', 'expired')),
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.bids enable row level security;

-- Drop old policies if they exist
drop policy if exists "Renters and owners can view relevant bids" on bids;
drop policy if exists "Renters can create bids" on bids;
drop policy if exists "Car owners can update bid status" on bids;

-- Create updated policies
create policy "Renters and owners can view relevant bids"
  on bids for select
  using (auth.uid() = renter_id or auth.uid() in (
    select owner_id from public.cars where id = bids.car_id
  ));

create policy "Renters can create bids"
  on bids for insert
  with check (auth.uid() = renter_id);

create policy "Car owners can update bid status"
  on bids for update
  using (auth.uid() in (
    select owner_id from public.cars where id = bids.car_id
  ));

-- ── 4. REVIEWS ────────────────────────────────────────────────────
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid references public.bookings(id) on delete cascade not null,
  reviewer_id  uuid references public.profiles(id) not null,
  reviewed_id  uuid references public.profiles(id) not null,
  car_id       uuid references public.cars(id),
  rating       int not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Drop old policies if they exist
drop policy if exists "Anyone can read reviews" on reviews;
drop policy if exists "Authenticated users can write reviews" on reviews;

-- Create updated policies
create policy "Anyone can read reviews"
  on reviews for select using (true);

create policy "Authenticated users can write reviews"
  on reviews for insert with check (auth.uid() = reviewer_id);

-- ── 5. STORAGE BUCKETS ────────────────────────────────────────────
-- Run this separately in the Supabase Storage dashboard
-- OR uncomment and run here:

insert into storage.buckets (id, name, public)
values ('car-images', 'car-images', true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict do nothing;

-- Drop old storage policies if they exist
drop policy if exists "Anyone can read car images" on storage.objects;
drop policy if exists "Authenticated users can upload car images" on storage.objects;

-- Create updated storage policies
create policy "Anyone can read car images"
  on storage.objects for select
  using (bucket_id = 'car-images');

create policy "Authenticated users can upload car images"
  on storage.objects for insert
  with check (bucket_id = 'car-images' and auth.role() = 'authenticated');

-- ── 6. SAMPLE DATA (optional for testing) ─────────────────────────
-- Uncomment to insert a sample car after registering a user

-- insert into public.cars (owner_id, brand, model, year, price_per_day, wilaya, description, seats, transmission, fuel, category)
-- values (
--   'YOUR_USER_UUID_HERE',
--   'Toyota', 'Corolla', 2021, 3500, 'Sétif',
--   'Voiture en excellent état, climatisée, bien entretenue.',
--   5, 'manual', 'essence', 'economy'
-- );

-- ================================================================
-- DONE! Your database is ready.
-- Next step: Copy your Project URL + anon key into src/services/supabase.ts
-- ================================================================
