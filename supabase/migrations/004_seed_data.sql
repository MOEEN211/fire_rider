-- Seed data for Green Watch Riders Board
-- Run this after 001_initial_schema.sql has been applied

-- Insert station
insert into public.stations (name, location_code)
values ('Green Watch Station', 'GREEN-WATCH')
on conflict (location_code) do nothing;

-- Insert watch group
with station as (select id from public.stations where location_code = 'GREEN-WATCH')
insert into public.watch_groups (station_id, name)
select station.id, 'Green Watch'
from station
on conflict do nothing;

-- Insert skills
insert into public.skills (code, name) values
  ('OIC', 'Officer In Charge'),
  ('BA', 'Breathing Apparatus'),
  ('LGVE', 'Large Goods Vehicle Emergency'),
  ('LGVETL', 'Large Goods Vehicle Turntable Ladder'),
  ('TTO', 'Turntable Operator')
on conflict (code) do nothing;

-- Insert people
insert into public.people (full_name, rank, staff_number, station_id, watch_group_id, active, source_system)
select t.full_name, t.rank, t.staff_number, s.id, wg.id, true, 'Manual'
from public.stations s
join public.watch_groups wg on wg.station_id = s.id
join (values
  ('SCOTT GOODMAN', 'WC', '5010'),
  ('JUSTIN DEEBLE', 'CC', '676'),
  ('GARY DUFFY-WILLIAMS', 'CC', '587'),
  ('SAMUEL BROOKS', 'FF', '5387'),
  ('JAKE CONNELL', 'FF', '3071'),
  ('NATHAN HOLT', 'FF', '2623'),
  ('BEN HARRIS', 'FF', '2684'),
  ('KYLE MCBRIDE', 'FF', '2689'),
  ('KRISTIAN BOWLES', 'FF', '2078'),
  ('NATASHA LAKE', 'FF', '2001'),
  ('CAMERON LAW', 'FF', '2010'),
  ('KIAN MACDONALD', 'FF', '2019')
) as t(full_name, rank, staff_number) on true
where s.location_code = 'GREEN-WATCH'
on conflict do nothing;

-- Insert person_skills
with skills_map as (
  select p.id as person_id, s.id as skill_id
  from public.people p
  join public.skills s on
    (p.full_name = 'SCOTT GOODMAN' and s.code = 'OIC')
    or (p.full_name = 'JUSTIN DEEBLE' and s.code in ('OIC', 'LGVE', 'LGVETL', 'TTO'))
    or (p.full_name = 'GARY DUFFY-WILLIAMS' and s.code in ('OIC', 'LGVE', 'LGVETL', 'TTO'))
    or (p.full_name = 'SAMUEL BROOKS' and s.code in ('LGVE', 'BA', 'TTO'))
    or (p.full_name = 'JAKE CONNELL' and s.code in ('LGVE', 'BA', 'TTO'))
    or (p.full_name = 'NATHAN HOLT' and s.code in ('LGVE', 'LGVETL', 'TTO', 'BA'))
    or (p.full_name = 'BEN HARRIS' and s.code in ('BA', 'TTO'))
    or (p.full_name = 'KYLE MCBRIDE' and s.code = 'BA')
    or (p.full_name = 'KRISTIAN BOWLES' and s.code = 'BA')
    or (p.full_name = 'NATASHA LAKE' and s.code = 'BA')
    or (p.full_name = 'CAMERON LAW' and s.code = 'BA')
)
insert into public.person_skills (person_id, skill_id)
select person_id, skill_id from skills_map
on conflict do nothing;

-- Vehicles
with station as (select id from public.stations where location_code = 'GREEN-WATCH')
insert into public.vehicles (id, station_id, name, registration, display_order, active)
select gen_random_uuid(), station.id, v.name, v.registration, v.display_order, true
from station
cross join (values
  ('41P1', 'Rescue Pump 1', 1),
  ('41P2', 'Rescue Pump 2', 2),
  ('41A8', 'Turn-table Ladder', 3)
) as v(name, registration, display_order)
on conflict do nothing;

-- Seats for 41P1
with v as (select id from public.vehicles where name = '41P1')
insert into public.seats (vehicle_id, label, display_order, active)
select v.id, t.label, t.display_order, true
from v
join (values
  ('OIC', 1),
  ('DRIVER', 2),
  ('BA 1', 3),
  ('BA 2', 4),
  ('ECO', 5)
) as t(label, display_order) on true
on conflict (vehicle_id, label) do nothing;

-- Seats for 41P2
with v as (select id from public.vehicles where name = '41P2')
insert into public.seats (vehicle_id, label, display_order, active)
select v.id, t.label, t.display_order, true
from v
join (values
  ('OIC', 1),
  ('DRIVER', 2),
  ('BA 1', 3),
  ('BA 2', 4),
  ('ECO', 5)
) as t(label, display_order) on true
on conflict (vehicle_id, label) do nothing;

-- Seats for 41A8
with v as (select id from public.vehicles where name = '41A8')
insert into public.seats (vehicle_id, label, display_order, active)
select v.id, t.label, t.display_order, true
from v
join (values
  ('OIC', 1),
  ('DRIVER', 2)
) as t(label, display_order) on true
on conflict (vehicle_id, label) do nothing;

-- Duties
with station as (select id from public.stations where location_code = 'GREEN-WATCH')
insert into public.duties (id, station_id, label, display_order, active)
select gen_random_uuid(), station.id, d.label, d.display_order, true
from station
cross join (values
  ('Mess / Tea', 1),
  ('Watchroom', 2),
  ('Boilers', 3)
) as d(label, display_order)
on conflict do nothing;
