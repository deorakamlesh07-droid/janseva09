-- Run this SQL in your Supabase SQL editor to set up all tables

-- Complaints table
create table if not exists shikayat (
  id bigserial primary key,
  code text unique not null,
  name text not null,
  phone text not null,
  mohalla text not null,
  category text not null default 'गली की सफ़ाई',
  detail text not null,
  photo_url text,
  status text not null default 'दर्ज',
  deadline date,
  after_photo_url text,
  admin_note text,
  created_at timestamptz not null default now()
);

-- Lost and found table
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

-- Blood donors table
create table if not exists blood_donors (
  id bigserial primary key,
  name text not null,
  blood_group text not null,
  mohalla text,
  phone text not null,
  created_at timestamptz not null default now()
);

-- Blood requests table
create table if not exists blood_requests (
  id bigserial primary key,
  blood_group text not null,
  name text,
  phone text not null,
  detail text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (read-only public access)
alter table shikayat enable row level security;
alter table khoya_paya enable row level security;
alter table blood_donors enable row level security;
alter table blood_requests enable row level security;

-- Public can read non-removed complaints
create policy "public read shikayat" on shikayat
  for select using (status != 'हटाई');

-- Public can read khoya_paya
create policy "public read khoya_paya" on khoya_paya
  for select using (true);

-- Public can read blood donor counts (not phone numbers)
create policy "public read blood_donors" on blood_donors
  for select using (true);

-- Service role (server-side API) can do everything (bypasses RLS automatically)

-- Storage bucket for photos
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Public read access to photos bucket
create policy "public read photos" on storage.objects
  for select using (bucket_id = 'photos');

-- Citizens Directory table
create table if not exists citizens (
  id bigserial primary key,
  name text not null,
  phone text unique not null,
  mohalla text,
  notes text,
  created_at timestamptz not null default now()
);

alter table citizens enable row level security;
create policy "public read citizens" on citizens for select using (true);

-- Ensure email column exists on complaints (shikayat)
alter table shikayat add column if not exists email text;

-- Daily Activities / Dainik Karya table
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

alter table dainik_karya enable row level security;
create policy "public read dainik_karya" on dainik_karya for select using (true);

