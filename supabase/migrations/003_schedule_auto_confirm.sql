create extension if not exists pg_cron with schema extensions;

select cron.unschedule(jobname)
from cron.job
where jobname = 'auto-confirm-yesterdays-riders-boards';

select cron.schedule(
  'auto-confirm-yesterdays-riders-boards',
  '55 23 * * *',
  $$select * from public.auto_confirm_yesterdays_draft_boards();$$
);
