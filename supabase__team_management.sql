-- CodePair: управление командой (роль участника, передача авторства, уведомления)
-- Выполнить в Supabase → SQL Editor после schema.sql (и telegram.sql, если бот подключён).
-- Можно запускать повторно.

-- автор меняет роль участника
create or replace function public.set_member_role(p uuid, member uuid, new_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_project_owner(p) then raise exception 'only the owner can change roles'; end if;
  if new_role = 'owner' or length(new_role) > 40 then raise exception 'bad role'; end if;
  if member = auth.uid() then raise exception 'owner role is fixed'; end if;
  update public.project_members set role = coalesce(new_role, '')
   where project_id = p and user_id = member;
  if not found then raise exception 'not a member'; end if;
end $$;

-- автор передаёт проект другому участнику (сам остаётся в команде)
create or replace function public.transfer_ownership(p uuid, new_owner uuid) returns void
language plpgsql security definer set search_path = public as $$
declare old_owner uuid := auth.uid();
begin
  if not public.is_project_owner(p) then raise exception 'only the owner can transfer'; end if;
  if new_owner = old_owner then return; end if;
  if not exists (select 1 from public.project_members where project_id = p and user_id = new_owner) then
    raise exception 'new owner must be a team member';
  end if;

  update public.projects set owner_id = new_owner where id = p;
  update public.project_members set role = 'owner' where project_id = p and user_id = new_owner;
  -- бывший автор остаётся в команде со своими ролями из профиля
  update public.project_members set role = '' where project_id = p and user_id = old_owner;
  -- заявки в команду теперь получает новый автор
  update public.invitations set to_user = new_owner
   where project_id = p and kind = 'request' and status = 'pending' and to_user = old_owner;
end $$;

grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.transfer_ownership(uuid, uuid) to authenticated;

-- участник может менять в своей строке только «вклад», но не роль
drop policy if exists "members update own" on public.project_members;
create policy "members update own" on public.project_members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
revoke update on public.project_members from authenticated;
grant update (contribution) on public.project_members to authenticated;

-- ============ уведомления в Telegram ============
-- работают, только если выполнен telegram.sql; иначе тихо пропускаются

create or replace function public.tg_on_member() returns trigger
language plpgsql security definer set search_path = public as $$
declare proj record; who text;
begin
  if to_regprocedure('public.tg_notify(uuid,text,jsonb)') is null then return null; end if;

  if tg_op = 'DELETE' then
    select id, title, owner_id into proj from public.projects where id = old.project_id;
    if proj.id is null then return null; end if;              -- проект удалён целиком
    if old.user_id = auth.uid() then                           -- сам вышел → пишем автору
      select full_name into who from public.profiles where id = old.user_id;
      perform public.tg_notify(proj.owner_id, 'member_left',
        jsonb_build_object('project_id', proj.id, 'project', proj.title, 'by', who, 'role', old.role));
    else                                                        -- исключили
      select full_name into who from public.profiles where id = proj.owner_id;
      perform public.tg_notify(old.user_id, 'member_removed',
        jsonb_build_object('project_id', proj.id, 'project', proj.title, 'by', who));
    end if;
    return null;
  end if;

  -- UPDATE роли
  if new.role is not distinct from old.role or new.user_id = auth.uid() then return null; end if;
  select id, title, owner_id into proj from public.projects where id = new.project_id;
  select full_name into who from public.profiles where id = auth.uid();
  if new.role = 'owner' then
    perform public.tg_notify(new.user_id, 'ownership_received',
      jsonb_build_object('project_id', proj.id, 'project', proj.title, 'by', who));
  elsif old.role <> '' or new.role <> '' then
    perform public.tg_notify(new.user_id, 'role_changed',
      jsonb_build_object('project_id', proj.id, 'project', proj.title, 'by', who, 'role', new.role));
  end if;
  return null;
end $$;

drop trigger if exists tg_members on public.project_members;
create trigger tg_members after delete or update of role on public.project_members
  for each row execute function public.tg_on_member();
