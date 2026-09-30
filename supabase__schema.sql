-- CodePair MVP schema for Supabase (PostgreSQL)
-- Run once in Supabase Dashboard → SQL Editor → New query → paste → Run.

-- ============ TABLES ============

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  bio text not null default '',
  university text not null default '',
  roles text[] not null default '{}',          -- e.g. {backend, ml}
  skills text[] not null default '{}',         -- e.g. {python, react}
  interests text[] not null default '{}',      -- e.g. {edtech, ai}
  level text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  hours_per_week int not null default 5 check (hours_per_week between 0 and 80),
  goals text not null default '',
  telegram text not null default '',
  github_username text not null default '',
  github_languages text[] not null default '{}',
  github_repos int not null default 0,
  github_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '',
  tech text[] not null default '{}',
  interests text[] not null default '{}',
  needed_roles text[] not null default '{}',
  deadline date,
  status text not null default 'open' check (status in ('open','in_progress','done')),
  chat_link text not null default '',   -- Telegram group link
  repo_url text not null default '',
  result_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default '',
  contribution text not null default '',
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- kind = 'invite'  : project owner invites a user   (from_user = owner, to_user = candidate)
-- kind = 'request' : user asks to join a project     (from_user = candidate, to_user = owner)
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('invite','request')),
  role text not null default '',
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- one pending invitation per (project, candidate)
create unique index if not exists invitations_one_pending
  on public.invitations (project_id, (case when kind = 'invite' then to_user else from_user end))
  where status = 'pending';

create index if not exists projects_status_idx on public.projects(status);
create index if not exists members_user_idx on public.project_members(user_id);
create index if not exists invitations_to_idx on public.invitations(to_user, status);

-- ============ HELPERS & TRIGGERS ============

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- create a profile row automatically after OAuth sign-up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, github_username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'user_name', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- owner becomes the first team member
create or replace function public.add_owner_as_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists projects_add_owner on public.projects;
create trigger projects_add_owner after insert on public.projects
  for each row execute function public.add_owner_as_member();

create or replace function public.is_project_owner(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.projects where id = p and owner_id = auth.uid())
$$;

create or replace function public.is_project_member(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.project_members where project_id = p and user_id = auth.uid())
$$;

-- accept / decline an invitation or join request (only the recipient may respond)
create or replace function public.respond_invitation(inv_id uuid, accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare inv public.invitations;
declare member uuid;
begin
  select * into inv from public.invitations where id = inv_id for update;
  if inv.id is null then raise exception 'invitation not found'; end if;
  if inv.to_user <> auth.uid() then raise exception 'not allowed'; end if;
  if inv.status <> 'pending' then raise exception 'already answered'; end if;

  update public.invitations
     set status = case when accept then 'accepted' else 'declined' end,
         responded_at = now()
   where id = inv_id;

  if accept then
    member := case when inv.kind = 'invite' then inv.to_user else inv.from_user end;
    insert into public.project_members (project_id, user_id, role)
    values (inv.project_id, member, inv.role)
    on conflict (project_id, user_id) do update set role = excluded.role;
  end if;
end $$;

-- leave a project (owner cannot leave)
create or replace function public.leave_project(p uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.is_project_owner(p) then raise exception 'owner cannot leave'; end if;
  delete from public.project_members where project_id = p and user_id = auth.uid();
end $$;

-- ============ ROW LEVEL SECURITY ============

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.invitations enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "projects read" on public.projects;
create policy "projects read" on public.projects for select to authenticated using (true);
drop policy if exists "projects insert own" on public.projects;
create policy "projects insert own" on public.projects for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists "projects update owner" on public.projects;
create policy "projects update owner" on public.projects for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "projects delete owner" on public.projects;
create policy "projects delete owner" on public.projects for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists "members read" on public.project_members;
create policy "members read" on public.project_members for select to authenticated using (true);
-- a member may edit their own contribution text
drop policy if exists "members update own" on public.project_members;
create policy "members update own" on public.project_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- owner may remove members (except themselves)
drop policy if exists "members delete by owner" on public.project_members;
create policy "members delete by owner" on public.project_members for delete to authenticated
  using (public.is_project_owner(project_id) and user_id <> auth.uid());

drop policy if exists "invitations read" on public.invitations;
create policy "invitations read" on public.invitations for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());
drop policy if exists "invitations insert" on public.invitations;
create policy "invitations insert" on public.invitations for insert to authenticated
  with check (
    from_user = auth.uid() and status = 'pending' and (
      -- owner invites someone who is not yet a member
      (kind = 'invite' and public.is_project_owner(project_id)
        and not exists (select 1 from public.project_members m
                        where m.project_id = invitations.project_id and m.user_id = invitations.to_user))
      or
      -- user asks the owner to join
      (kind = 'request'
        and to_user = (select owner_id from public.projects p where p.id = invitations.project_id)
        and not public.is_project_member(project_id))
    )
  );
-- sender may cancel a pending invitation
drop policy if exists "invitations delete own pending" on public.invitations;
create policy "invitations delete own pending" on public.invitations for delete to authenticated
  using (from_user = auth.uid() and status = 'pending');

grant execute on function public.respond_invitation(uuid, boolean) to authenticated;
grant execute on function public.leave_project(uuid) to authenticated;
