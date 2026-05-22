# Supabase Schema Plan

This schema supports normalized roster data, vehicle seating rules, confirmed board history, drag-and-drop manual overrides, and future rota providers.

## Important Notes

- Use UUID primary keys.
- Enable Row Level Security on production tables.
- Store external API secrets only in Supabase secrets, never in frontend code.
- Confirm Supabase region/compliance before storing real firefighter data.

## Enums

```sql
create type board_status as enum ('Draft', 'Confirmed');
create type assignment_source as enum ('Auto', 'Manual');
create type rota_source_system as enum ('FireServiceRota', 'GRS', 'Totalmobile', 'CSV', 'Manual');
```

## users

Stores authenticated app users.

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email text not null unique,
  azure_ad_id text unique,
  role text not null default 'viewer',
  created_at timestamptz not null default now()
);
```

## stations

Stores fire station information.

```sql
create table stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location_code text unique,
  created_at timestamptz not null default now()
);
```

## watch_groups

Stores watch colour/groups.

```sql
create table watch_groups (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id) on delete cascade,
  name text not null,
  unique(station_id, name)
);
```

## people

Stores firefighters/personnel from any rota source.

```sql
create table people (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source_system rota_source_system not null default 'Manual',
  full_name text not null,
  rank text,
  staff_number text,
  station_id uuid references stations(id),
  watch_group_id uuid references watch_groups(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(source_system, external_id)
);
```

## skills

Stores skills/qualifications.

```sql
create table skills (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);
```

Example skills:

- BA
- OIC
- TTL
- Driver
- ECO

## person_skills

Many-to-many link between people and skills.

```sql
create table person_skills (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  unique(person_id, skill_id)
);
```

## roster_days

Represents an imported roster for one station/date/watch.

```sql
create table roster_days (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  station_id uuid not null references stations(id),
  watch_group_id uuid references watch_groups(id),
  source_system rota_source_system not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique(date, station_id, watch_group_id, source_system)
);
```

## roster_assignments

Stores each person's duty state for a roster day.

```sql
create table roster_assignments (
  id uuid primary key default gen_random_uuid(),
  roster_day_id uuid not null references roster_days(id) on delete cascade,
  person_id uuid not null references people(id),
  duty_status text not null,
  available_for_seating boolean not null default false,
  notes text,
  unique(roster_day_id, person_id)
);
```

## vehicles

Stores station vehicles.

```sql
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id) on delete cascade,
  name text not null,
  registration text,
  display_order int not null default 0,
  active boolean not null default true
);
```

## seats

Stores specific seat positions per vehicle.

```sql
create table seats (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  label text not null,
  display_order int not null default 0,
  required_rank text,
  active boolean not null default true,
  unique(vehicle_id, label)
);
```

Example labels:

- OIC
- Driver
- BA 1
- BA 2
- ECO

## seat_required_skills

Many-to-many skills required for a seat.

```sql
create table seat_required_skills (
  id uuid primary key default gen_random_uuid(),
  seat_id uuid not null references seats(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  unique(seat_id, skill_id)
);
```

## boards

Represents a Riders Board for a selected date.

```sql
create table boards (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  station_id uuid not null references stations(id),
  watch_group_id uuid references watch_groups(id),
  status board_status not null default 'Draft',
  confirmed_by uuid references users(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(date, station_id, watch_group_id)
);
```

## board_seat_assignments

Stores draft and confirmed seat assignments. Confirmed rows are the history used by the rotation algorithm.

```sql
create table board_seat_assignments (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  seat_id uuid not null references seats(id),
  person_id uuid references people(id),
  assignment_source assignment_source not null default 'Auto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(board_id, seat_id)
);
```

## duties

Defines duty rows such as Mess, Watchroom, and Bollies.

```sql
create table duties (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id) on delete cascade,
  label text not null,
  display_order int not null default 0,
  active boolean not null default true
);
```

## board_duty_assignments

Stores duty assignments for a board.

```sql
create table board_duty_assignments (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  duty_id uuid not null references duties(id),
  person_id uuid references people(id),
  assignment_source assignment_source not null default 'Manual',
  unique(board_id, duty_id)
);
```

## standby_assignments

Stores standby list entries.

```sql
create table standby_assignments (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  person_id uuid references people(id),
  position int not null,
  unique(board_id, position)
);
```

## calendar_events

Optional cache for Outlook events.

```sql
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references stations(id),
  date date not null,
  source_event_id text,
  title text not null,
  start_time timestamptz,
  end_time timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique(station_id, source_event_id)
);
```

## Useful Indexes

```sql
create index idx_boards_date_station on boards(date, station_id);
create index idx_roster_days_date_station on roster_days(date, station_id);
create index idx_board_assignments_person on board_seat_assignments(person_id);
create index idx_board_assignments_seat on board_seat_assignments(seat_id);
create index idx_people_station_watch on people(station_id, watch_group_id);
```

## Seat History Query Concept

To find the last time a person sat in a specific seat:

```sql
select
  bsa.person_id,
  max(b.date) as last_sat_date
from board_seat_assignments bsa
join boards b on b.id = bsa.board_id
where
  b.status = 'Confirmed'
  and bsa.seat_id = :seat_id
  and bsa.person_id = any(:eligible_person_ids)
group by bsa.person_id;
```

People with no history for a seat should be treated as highest priority for that seat.

## RLS Policy Direction

Production RLS should:

- Allow authenticated users to read station board data.
- Allow only officer/admin roles to generate, edit, and confirm boards.
- Prevent unauthenticated access.
- Optionally restrict by station if multiple stations are supported.

Exact policies should be written after the authentication approach is finalized.
