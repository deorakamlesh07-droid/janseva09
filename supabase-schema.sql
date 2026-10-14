-- ==============================================================================
-- JanSeva 09 (जनसेवा 09) - Supabase Complete Database Setup
-- Run this ENTIRE script in your Supabase SQL Editor for your new Supabase project
-- ==============================================================================

-- 1. Complaints Table (शिकायतें)
create table if not exists shikayat (
  id bigserial primary key,
  code text unique not null,
  name text not null,
  phone text not null,
  email text,
  mohalla text not null,
  category text not null default 'गली की सफ़ाई',
  detail text not null,
  photo_url text,
  status text not null default 'दर्ज',
  deadline date,
  after_photo_url text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure all columns exist even if table was already created
alter table shikayat add column if not exists email text;
alter table shikayat add column if not exists photo_urls text[];
alter table shikayat add column if not exists updated_at timestamptz not null default now();

-- 2. Lost & Found Table (खोया-पाया)
create table if not exists khoya_paya (
  id bigserial primary key,
  kind text not null default 'खोया',
  area text,
  title text not null,
  detail text not null,
  photo_url text,
  name text,
  phone text not null,
  created_at timestamptz not null default now()
);

-- 3. Blood Donors Table (रक्तदाता)
create table if not exists blood_donors (
  id bigserial primary key,
  name text not null,
  blood_group text not null,
  mohalla text,
  phone text not null,
  created_at timestamptz not null default now()
);

-- 4. Blood Requests Table (रक्त की आवश्यकता)
create table if not exists blood_requests (
  id bigserial primary key,
  blood_group text not null,
  name text,
  phone text not null,
  detail text,
  created_at timestamptz not null default now()
);

-- 5. Citizens Directory Table (नागरिक डायरेक्टरी)
create table if not exists citizens (
  id bigserial primary key,
  name text not null,
  phone text unique not null,
  mohalla text,
  notes text,
  created_at timestamptz not null default now()
);

-- 6. Daily Activities Table (दैनिक कार्य / विकास कार्य)
create table if not exists dainik_karya (
  id bigserial primary key,
  title text not null,
  description text not null,
  work_date date not null default CURRENT_DATE,
  area text,
  category text not null default 'सफ़ाई कार्य',
  photo_url text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- Row Level Security (RLS) Setup
-- ==============================================================================
alter table shikayat enable row level security;
alter table khoya_paya enable row level security;
alter table blood_donors enable row level security;
alter table blood_requests enable row level security;
alter table citizens enable row level security;
alter table dainik_karya enable row level security;

-- Drop existing policies if re-running to avoid errors
drop policy if exists "public read shikayat" on shikayat;
drop policy if exists "public read khoya_paya" on khoya_paya;
drop policy if exists "public read blood_donors" on blood_donors;
drop policy if exists "public read citizens" on citizens;
drop policy if exists "public read dainik_karya" on dainik_karya;

-- Create Public Read Policies
create policy "public read shikayat" on shikayat
  for select using (status != 'हटाई');

create policy "public read khoya_paya" on khoya_paya
  for select using (true);

create policy "public read blood_donors" on blood_donors
  for select using (true);

create policy "public read citizens" on citizens
  for select using (true);

create policy "public read dainik_karya" on dainik_karya
  for select using (true);

-- ==============================================================================
-- Storage Bucket for Photos (फोटो स्टोरेज)
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public read photos" on storage.objects;
drop policy if exists "public upload photos" on storage.objects;

-- Public can view photos
create policy "public read photos" on storage.objects
  for select using (bucket_id = 'photos');

-- Service role bypasses RLS automatically. To allow client direct upload if needed:
create policy "public upload photos" on storage.objects
  for insert with check (bucket_id = 'photos');


