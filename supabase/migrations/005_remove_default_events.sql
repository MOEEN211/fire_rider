-- Delete default calendar events
delete from public.calendar_events
where title in ('BA drill', 'Watch meeting', 'School visit');
