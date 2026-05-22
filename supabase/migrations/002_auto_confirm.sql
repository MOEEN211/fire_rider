create or replace function public.auto_confirm_latest_draft_boards(target_date date default current_date)
returns table (
  board_id uuid,
  board_date date,
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
        and confirmed_board.status = 'Confirmed'
        and confirmed_board.id <> board.id
    )
  returning
    board.id,
    board.date,
    'Draft'::board_status,
    board.status,
    board.confirmation_source;
end;
$$;

create or replace function public.auto_confirm_yesterdays_draft_boards()
returns table (
  board_id uuid,
  board_date date,
  previous_status board_status,
  new_status board_status,
  applied_confirmation_source confirmation_source
)
language sql
security definer
set search_path = public
as $$
  select * from public.auto_confirm_latest_draft_boards(current_date - interval '1 day');
$$;
