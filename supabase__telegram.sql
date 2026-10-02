-- CodePair: Telegram notifications.
-- Run once in Supabase → SQL Editor (after schema.sql). Safe to run again.

-- ============ TABLES ============

-- Link between a CodePair profile and a Telegram chat. Users cannot write here directly:
-- tokens are created by a SQL function, chat_id is set only by the bot (service key).
create table if not exists public.telegram_links (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  chat_id bigint,
  link_token text unique,
  lang text not null default 'ru',
  enabled boolean not null default true,
  linked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Outgoing notifications queue, filled by triggers, drained by the bot.
create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references public.telegram_links(user_id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  error text
);
create index if not exists notifications_unsent_idx on public.notifications (id) where sent_at is null;

-- Small key/value store for the bot (Telegram update offset).
create table if not exists public.bot_state (
  key text primary key,
  value text not null
);

alter table public.telegram_links enable row level security;
alter table public.notifications enable row level security;
alter table public.bot_state enable row level security;

drop policy if exists "telegram read own" on public.telegram_links;
create policy "telegram read own" on public.telegram_links for select to authenticated
  using (user_id = auth.uid());
-- notifications and bot_state: no policies → only the service key (the bot) can access them.

-- ============ FUNCTIONS CALLED BY THE SITE ============

-- New one-time token for the deep link t.me/<bot>?start=<token>
create or replace function public.telegram_create_link_token() returns text
language plpgsql security definer set search_path = public as $$
declare tok text := replace(gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into public.telegram_links (user_id, link_token) values (auth.uid(), tok)
  on conflict (user_id) do update set link_token = excluded.link_token;
  return tok;
end $$;

create or replace function public.telegram_disconnect() returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.telegram_links set chat_id = null, link_token = null, linked_at = null where user_id = auth.uid();
end $$;

grant execute on function public.telegram_create_link_token() to authenticated;
grant execute on function public.telegram_disconnect() to authenticated;

-- ============ NOTIFICATION TRIGGERS ============

-- queue a notification only for users who linked Telegram and did not mute it
create or replace function public.tg_notify(uid uuid, k text, data jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, payload)
  select user_id, k, data from public.telegram_links
  where user_id = uid and chat_id is not null and enabled;
$$;

-- invitations: new invite / join request, and answers to them
create or replace function public.tg_on_invitation() returns trigger
language plpgsql security definer set search_path = public as $$
declare proj text; who text;
begin
  select title into proj from public.projects where id = new.project_id;
  if tg_op = 'INSERT' then
    select full_name into who from public.profiles where id = new.from_user;
    perform public.tg_notify(
      new.to_user,
      case when new.kind = 'invite' then 'invite_received' else 'request_received' end,
      jsonb_build_object('project_id', new.project_id, 'project', proj, 'from', who,
                         'role', new.role, 'message', new.message));
  elsif new.status is distinct from old.status and new.status in ('accepted', 'declined') then
    select full_name into who from public.profiles where id = new.to_user;
    perform public.tg_notify(
      new.from_user, 'invitation_answered',
      jsonb_build_object('project_id', new.project_id, 'project', proj, 'by', who,
                         'role', new.role, 'kind', new.kind, 'status', new.status));
  end if;
  return new;
end $$;

drop trigger if exists tg_invitations on public.invitations;
create trigger tg_invitations after insert or update of status on public.invitations
  for each row execute function public.tg_on_invitation();

-- projects: a new open project needs your role; a project you are in is completed
create or replace function public.tg_on_project() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner_name text;
begin
  if tg_op = 'INSERT' then
    if new.status = 'open' and cardinality(new.needed_roles) > 0 then
      select full_name into owner_name from public.profiles where id = new.owner_id;
      insert into public.notifications (user_id, kind, payload)
      select l.user_id, 'new_project',
             jsonb_build_object(
               'project_id', new.id, 'project', new.title, 'owner', owner_name,
               'needed_roles', to_jsonb(new.needed_roles),
               'your_roles', to_jsonb(array(select unnest(p.roles) intersect select unnest(new.needed_roles))))
      from public.telegram_links l
      join public.profiles p on p.id = l.user_id
      where l.chat_id is not null and l.enabled
        and l.user_id <> new.owner_id
        and p.roles && new.needed_roles
      limit 500;
    end if;
  elsif new.status = 'done' and old.status is distinct from 'done' then
    insert into public.notifications (user_id, kind, payload)
    select l.user_id, 'project_done',
           jsonb_build_object('project_id', new.id, 'project', new.title, 'role', m.role)
    from public.project_members m
    join public.telegram_links l on l.user_id = m.user_id
    where m.project_id = new.id and l.chat_id is not null and l.enabled;
  end if;
  return new;
end $$;

drop trigger if exists tg_projects on public.projects;
create trigger tg_projects after insert or update of status on public.projects
  for each row execute function public.tg_on_project();
