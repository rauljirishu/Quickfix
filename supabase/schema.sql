-- Supabase schema for QuickFix

-- Profiles table linked to auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age integer,
  gender text,
  phone text,
  role text not null default 'customer',
  avatar_url text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now()
);

create index if not exists idx_profiles_role on profiles (role);
create index if not exists idx_profiles_location on profiles (latitude, longitude);

-- Service categories
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique,
  description text,
  created_at timestamptz default now()
);

-- Services offered by workers or vendors
create table if not exists services (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category_id uuid references categories(id) on delete set null,
  price numeric,
  duration_minutes integer,
  vendor_id uuid,
  created_at timestamptz default now()
);

-- Service packages (customizable)
create table if not exists packages (
  id uuid default gen_random_uuid() primary key,
  service_id uuid references services(id) on delete cascade,
  title text,
  details jsonb,
  price numeric,
  created_at timestamptz default now()
);

-- Pricing rules to enforce min/max per category or per service
create table if not exists pricing_rules (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  min_price numeric not null default 0,
  max_price numeric not null default 9999999,
  created_at timestamptz default now()
);


-- Bookings
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references profiles(id) on delete set null,
  worker_id uuid references profiles(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  package_id uuid references packages(id) on delete set null,
  scheduled_at timestamptz,
  status text default 'requested',
  total_amount numeric,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Booking status event timeline (for real-time tracking history)
create table if not exists booking_status_events (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references bookings(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_booking_status_events_booking_id on booking_status_events (booking_id, created_at);

-- Chat messages
create table if not exists chat_conversations (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references bookings(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists chat_participants (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references chat_conversations(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create unique index if not exists idx_chat_participants_unique on chat_participants (conversation_id, profile_id);

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid,
  sender_id uuid references profiles(id) on delete set null,
  recipient_id uuid references profiles(id) on delete set null,
  body text,
  attachments jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_messages_conversation_created on messages (conversation_id, created_at);

-- Reviews and ratings
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references bookings(id) on delete set null,
  reviewer_id uuid references profiles(id) on delete set null,
  reviewee_id uuid references profiles(id) on delete set null,
  rating integer check (rating >=1 and rating <=5),
  comment text,
  status text default 'approved',
  moderation_note text,
  moderated_by uuid references profiles(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz default now()
);

create unique index if not exists idx_reviews_booking_reviewer_unique on reviews (booking_id, reviewer_id);
create index if not exists idx_reviews_reviewee_status on reviews (reviewee_id, status);

-- Wallets and transactions
create table if not exists wallets (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  balance numeric default 0,
  currency text default 'INR',
  updated_at timestamptz default now()
);

create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  wallet_id uuid references wallets(id) on delete cascade,
  amount numeric,
  type text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Notifications storage
create table if not exists notifications_tokens (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  token text,
  platform text,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  title text,
  body text,
  data jsonb,
  sent boolean default false,
  created_at timestamptz default now()
);

-- Admins, vendors and terms
create table if not exists admins (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  role text,
  created_at timestamptz default now()
);

create table if not exists vendors (
  id uuid default gen_random_uuid() primary key,
  name text,
  profile_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists vendor_members (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now()
);

create unique index if not exists idx_vendor_members_unique on vendor_members (vendor_id, profile_id);

create table if not exists vendor_services (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  created_at timestamptz default now()
);

create unique index if not exists idx_vendor_services_unique on vendor_services (vendor_id, service_id);

create table if not exists terms_and_conditions (
  id uuid default gen_random_uuid() primary key,
  lang text default 'en',
  content text,
  updated_at timestamptz default now()
);

-- Cookie consent storage
create table if not exists cookie_consents (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete set null,
  consent jsonb,
  user_agent text,
  ip text,
  created_at timestamptz default now()
);

-- Haversine function for server-side distance calculations
create or replace function haversine_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
returns double precision as $$
declare
  R constant double precision := 6371; -- earth radius km
  dLat double precision := radians(lat2 - lat1);
  dLon double precision := radians(lon2 - lon1);
  a double precision;
begin
  a := sin(dLat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2)^2;
  return R * 2 * atan2(sqrt(a), sqrt(1 - a));
end;
$$ language plpgsql immutable;

-- RPC: search_nearby(lat, lng, radius_km, category, lim)
create or replace function search_nearby(_lat double precision, _lng double precision, _radius_km double precision default 10, _category uuid default null, _lim integer default 20)
returns table(id uuid, full_name text, latitude double precision, longitude double precision, role text, distance double precision) as $$
begin
  return query
  select p.id, p.full_name, p.latitude, p.longitude, p.role,
    haversine_km(_lat, _lng, p.latitude, p.longitude) as distance
  from profiles p
  where p.role = 'worker'
    and p.latitude is not null and p.longitude is not null
    and (_category is null or exists (
      select 1 from services s where s.vendor_id = p.id and s.category_id = _category
    ))
    and haversine_km(_lat, _lng, p.latitude, p.longitude) <= _radius_km
  order by distance
  limit _lim;
end;
$$ language plpgsql stable;


