-- Add shift column to boards table for Day/Night separate records
alter table public.boards add column if not exists shift text not null default 'Day';

-- Drop old unique constraint and add new one including shift
alter table public.boards drop constraint if exists boards_date_station_id_watch_group_id_key;
alter table public.boards add constraint boards_date_station_watch_shift_unique unique (date, station_id, watch_group_id, shift);

-- Recreate index with shift
 drop index if exists idx_boards_date_station;
 create index idx_boards_date_station_shift on public.boards(date, station_id, shift);

-- Update auto_confirm function to consider shift independently
 create or replace function public.auto_confirm_latest_draft_boards(target_date date default current_date)
 returns table (
   board_id uuid,
   board_date date,
   board_shift text,
   previous_status board_status,
   new_status board_status,
   applied_confirmation_source confirmation_source
 )
 language plpgsql
 security definer
 set search_path = public
 as $$
 begin
   return query
   update public.boards board
   set
     status = 'Confirmed',
     confirmation_source = 'Auto',
     confirmed_at = now(),
     updated_at = now()
   where board.date = target_date
     and board.status = 'Draft'
     and not exists (
       select 1
       from public.boards confirmed_board
       where confirmed_board.date = board.date
         and confirmed_board.station_id = board.station_id
         and confirmed_board.watch_group_id is not distinct from board.watch_group_id
         and confirmed_board.shift = board.shift
         and confirmed_board.status = 'Confirmed'
         and confirmed_board.id <> board.id
     )
   returning
     board.id,
     board.date,
     board.shift,
     'Draft'::board_status,
     board.status,
     board.confirmation_source;
 end;
 $$;
