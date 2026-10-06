-- CodePair: уведомления на сайте (колокольчик) + Telegram из одного места.
-- Выполнить в Supabase → SQL Editor ПОСЛЕДНИМ (после schema, telegram, telegram_webhook, team_management).
-- Можно запускать повторно. Если бот не подключён, уведомления всё равно появятся на сайте.

create table if not exists public.site_notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists site_notifications_user_idx on public.site_notifications(user_id, created_at desc);
create index if not exists site_notifications_unread_idx on public.site_notifications(user_id) where read_at is null;

alter table public.site_notifications enable row level security;
drop policy if exists "site notif read own" on public.site_notifications;
create policy "site notif read own" on public.site_notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "site notif update own" on public.site_notifications;
create policy "site notif update own" on public.site_notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "site notif delete own" on public.site_notifications;
create policy "site notif delete own" on public.site_notifications for delete to authenticated using (user_id = auth.uid());
revoke all on public.site_notifications from anon, authenticated;
grant select, delete on public.site_notifications to authenticated;
grant update (read_at) on public.site_notifications to authenticated;

-- одно уведомление: всегда на сайт, и в Telegram, если он подключён и не выключен
create or replace function public.notify(uid uuid, k text, data jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if uid is null then return; end if;
  insert into public.site_notifications (user_id, kind, payload) values (uid, k, data);
  if to_regclass('public.telegram_links') is not null then
    insert into public.notifications (user_id, kind, payload)
    select user_id, k, data from public.telegram_links
     where user_id = uid and chat_id is not null and enabled;
  end if;
end $$;
revoke execute on function public.notify(uuid, text, jsonb) from public, anon, authenticated;

-- ---------- приглашения и заявки ----------
create or replace function public.tg_on_invitation() returns trigger
language plpgsql security definer set search_path = public as $$
declare proj text; who text;
begin
  select title into proj from public.projects where id = new.project_id;
  if tg_op = 'INSERT' then
    select full_name into who from public.profiles where id = new.from_user;
    perform public.notify(
      new.to_user,
      case when new.kind = 'invite' then 'invite_received' else 'request_received' end,
      jsonb_build_object('invitation_id', new.id, 'project_id', new.project_id, 'project', proj,
                         'from', who, 'from_id', new.from_user, 'role', new.role, 'message', new.message));
  elsif new.status is distinct from old.status and new.status in ('accepted', 'declined') then
    select full_name into who from public.profiles where id = new.to_user;
    perform public.notify(
      new.from_user, 'invitation_answered',
      jsonb_build_object('project_id', new.project_id, 'project', proj, 'by', who, 'by_id', new.to_user,
                         'role', new.role, 'kind', new.kind, 'status', new.status));
  end if;
  return new;
end $$;

drop trigger if exists tg_invitations on public.invitations;
create trigger tg_invitations after insert or update of status on public.invitations
  for each row execute function public.tg_on_invitation();

-- ---------- проекты ----------
create or replace function public.tg_on_project() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner_name text;
begin
  if tg_op = 'INSERT' then
    -- «новый проект под вашу роль» — только в Telegram, на сайте это видно в рекомендациях
    if new.status = 'open' and cardinality(new.needed_roles) > 0
       and to_regclass('public.telegram_links') is not null then
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
    perform public.notify(m.user_id, 'project_done',
             jsonb_build_object('project_id', new.id, 'project', new.title, 'role', m.role))
      from public.project_members m
     where m.project_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists tg_projects on public.projects;
create trigger tg_projects after insert or update of status on public.projects
  for each row execute function public.tg_on_project();

-- ---------- команда: исключили / вышел / новая роль / передали проект ----------
create or replace function public.tg_on_member() returns trigger
language plpgsql security definer set search_path = public as $$
declare proj record; who text;
begin
  if tg_op = 'DELETE' then
    select id, title, owner_id into proj from public.projects where id = old.project_id;
    if proj.id is null then return null; end if;              -- проект удалён целиком
    if old.user_id = auth.uid() then                           -- сам вышел → пишем автору
      select full_name into who from public.profiles where id = old.user_id;
      perform public.notify(proj.owner_id, 'member_left',
        jsonb_build_object('project_id', proj.id, 'project', proj.title, 'by', who, 'role', old.role));
    else                                                        -- исключили
      select full_name into who from public.profiles where id = proj.owner_id;
      perform public.notify(old.user_id, 'member_removed',
        jsonb_build_object('project_id', proj.id, 'project', proj.title, 'by', who));
    end if;
    return null;
  end if;

  if new.role is not distinct from old.role or new.user_id = auth.uid() then return null; end if;
  select id, title, owner_id into proj from public.projects where id = new.project_id;
  select full_name into who from public.profiles where id = auth.uid();
  if new.role = 'owner' then
    perform public.notify(new.user_id, 'ownership_received',
      jsonb_build_object('project_id', proj.id, 'project', proj.title, 'by', who));
  else
    perform public.notify(new.user_id, 'role_changed',
      jsonb_build_object('project_id', proj.id, 'project', proj.title, 'by', who, 'role', new.role));
  end if;
  return null;
end $$;

drop trigger if exists tg_members on public.project_members;
create trigger tg_members after delete or update of role on public.project_members
  for each row execute function public.tg_on_member();

-- новый участник (приняли приглашение/заявку) → автору и команде на сайт
create or replace function public.on_member_joined() returns trigger
language plpgsql security definer set search_path = public as $$
declare proj record; who text;
begin
  if new.role = 'owner' then return null; end if;              -- автор при создании проекта
  select id, title, owner_id into proj from public.projects where id = new.project_id;
  select full_name into who from public.profiles where id = new.user_id;
  insert into public.site_notifications (user_id, kind, payload)
  select m.user_id, 'member_joined',
         jsonb_build_object('project_id', proj.id, 'project', proj.title, 'by', who, 'by_id', new.user_id, 'role', new.role)
    from public.project_members m
   where m.project_id = new.project_id and m.user_id <> new.user_id and m.user_id <> proj.owner_id;
  return null;
end $$;

drop trigger if exists members_joined on public.project_members;
create trigger members_joined after insert on public.project_members
  for each row execute function public.on_member_joined();

-- старые уведомления (старше 90 дней) можно чистить вручную:
-- delete from public.site_notifications where created_at < now() - interval '90 days';
