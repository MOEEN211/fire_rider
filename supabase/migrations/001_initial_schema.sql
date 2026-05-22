create extension if not exists "pgcrypto";

create type board_status as enum ('Draft', 'Confirmed');
create type assignment_source as enum ('Auto', 'Manual');
create type confirmation_source as enum ('Manual', 'Auto');
create type rota_source_system as enum ('FireServiceRota', 'GRS', 'Totalmobile', 'CSV', 'Manual');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email text not null unique,
  azure_ad_id text unique,
  role text not null default 'viewer',
  created_at timestamptz not null default now()
);

create table public.stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location_code text unique,
  created_at timestamptz not null default now()
);

create table public.watch_groups (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  name text not null,
  unique(station_id, name)
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source_system rota_source_system not null default 'Manual',
  full_name text not null,
  rank text,
  staff_number text,
  station_id uuid references public.stations(id),
  watch_group_id uuid references public.watch_groups(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(source_system, external_id)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

create table public.person_skills (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  unique(person_id, skill_id)
);

create table public.roster_days (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  station_id uuid not null references public.stations(id),
  watch_group_id uuid references public.watch_groups(id),
  source_system rota_source_system not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique(date, station_id, watch_group_id, source_system)
);

create table public.roster_assignments (
  id uuid primary key default gen_random_uuid(),
  roster_day_id uuid not null references public.roster_days(id) on delete cascade,
  person_id uuid not null references public.people(id),
  duty_status text not null,
  available_for_seating boolean not null default false,
  notes text,
  unique(roster_day_id, person_id)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  name text not null,
  registration text,
  display_order int not null default 0,
  active boolean not null default true
);

create table public.seats (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  label text not null,
  display_order int not null default 0,
  required_rank text,
  active boolean not null default true,
  unique(vehicle_id, label)
);

create table public.seat_required_skills (
  id uuid primary key default gen_random_uuid(),
  seat_id uuid not null references public.seats(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  unique(seat_id, skill_id)
);

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  station_id uuid not null references public.stations(id),
  watch_group_id uuid references public.watch_groups(id),
  status board_status not null default 'Draft',
  confirmation_source confirmation_source,
  confirmed_by uuid references public.users(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(date, station_id, watch_group_id)
);

create table public.board_seat_assignments (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  seat_id uuid not null references public.seats(id),
  person_id uuid references public.people(id),
  assignment_source assignment_source not null default 'Auto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(board_id, seat_id)
);

create table public.duties (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  label text not null,
  display_order int not null default 0,
  active boolean not null default true
);

create table public.board_duty_assignments (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  duty_id uuid not null references public.duties(id),
  person_id uuid references public.people(id),
  assignment_source assignment_source not null default 'Manual',
  unique(board_id, duty_id)
);

create table public.standby_assignments (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  person_id uuid references public.people(id),
  position int not null,
  unique(board_id, position)
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references public.stations(id),
  date date not null,
  source_event_id text,
  title text not null,
  start_time timestamptz,
  end_time timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique(station_id, source_event_id)
);

create index idx_boards_date_station on public.boards(date, station_id);
create index idx_roster_days_date_station on public.roster_days(date, station_id);
create index idx_board_assignments_person on public.board_seat_assignments(person_id);
create index idx_board_assignments_seat on public.board_seat_assignments(seat_id);
create index idx_people_station_watch on public.people(station_id, watch_group_id);

alter table public.users enable row level security;
alter table public.stations enable row level security;
alter table public.watch_groups enable row level security;
alter table public.people enable row level security;
alter table public.skills enable row level security;
alter table public.person_skills enable row level security;
alter table public.roster_days enable row level security;
alter table public.roster_assignments enable row level security;
alter table public.vehicles enable row level security;
alter table public.seats enable row level security;
alter table public.seat_required_skills enable row level security;
alter table public.boards enable row level security;
alter table public.board_seat_assignments enable row level security;
alter table public.duties enable row level security;
alter table public.board_duty_assignments enable row level security;
alter table public.standby_assignments enable row level security;
alter table public.calendar_events enable row level security;

create policy "Allow authenticated read access to stations" on public.stations for select to authenticated using (true);
create policy "Allow authenticated read access to watch groups" on public.watch_groups for select to authenticated using (true);
create policy "Allow authenticated read access to people" on public.people for select to authenticated using (true);
create policy "Allow authenticated read access to skills" on public.skills for select to authenticated using (true);
create policy "Allow authenticated read access to person skills" on public.person_skills for select to authenticated using (true);
create policy "Allow authenticated read access to vehicles" on public.vehicles for select to authenticated using (true);
create policy "Allow authenticated read access to seats" on public.seats for select to authenticated using (true);
create policy "Allow authenticated read access to seat skills" on public.seat_required_skills for select to authenticated using (true);
create policy "Allow authenticated read access to boards" on public.boards for select to authenticated using (true);
create policy "Allow authenticated read access to board seat assignments" on public.board_seat_assignments for select to authenticated using (true);
create policy "Allow authenticated read access to duties" on public.duties for select to authenticated using (true);
create policy "Allow authenticated read access to duty assignments" on public.board_duty_assignments for select to authenticated using (true);
create policy "Allow authenticated read access to standby assignments" on public.standby_assignments for select to authenticated using (true);
create policy "Allow authenticated read access to calendar events" on public.calendar_events for select to authenticated using (true);

create policy "Allow authenticated board writes" on public.boards for all to authenticated using (true) with check (true);
create policy "Allow authenticated board assignment writes" on public.board_seat_assignments for all to authenticated using (true) with check (true);
create policy "Allow authenticated duty assignment writes" on public.board_duty_assignments for all to authenticated using (true) with check (true);
create policy "Allow authenticated standby writes" on public.standby_assignments for all to authenticated using (true) with check (true);
