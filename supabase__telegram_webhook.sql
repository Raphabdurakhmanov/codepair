-- CodePair: instant Telegram delivery.
-- After new notifications are queued, the database calls the site
-- (POST /api/telegram/deliver), and the site sends them to Telegram.
-- Run once in Supabase → SQL Editor (after telegram.sql). Safe to run again.

create extension if not exists pg_net;

create or replace function public.tg_kick_delivery() returns trigger
language plpgsql security definer set search_path = public as $$
declare secret text; site text;
begin
  select value into secret from public.bot_state where key = 'deliver_secret';
  select value into site from public.bot_state where key = 'site_url';
  if secret is null or site is null then
    return null; -- not configured yet: the bot will pick notifications up on its next call
  end if;
  perform net.http_post(
    url := rtrim(site, '/') || '/api/telegram/deliver',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-codepair-secret', secret)
  );
  return null;
end $$;

drop trigger if exists tg_kick on public.notifications;
create trigger tg_kick after insert on public.notifications
  for each statement execute function public.tg_kick_delivery();
