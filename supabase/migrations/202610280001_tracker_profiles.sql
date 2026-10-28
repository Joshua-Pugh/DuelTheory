-- Private, bounded profile storage. Run in the Supabase SQL editor before enabling accounts.
begin;
create table if not exists public.tracker_profiles (
 id uuid primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('game','player')),
 name text not null check(length(btrim(name)) between 1 and 50),
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=16384 and data->>'schemaVersion'='1'),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now()
);
create index if not exists tracker_profiles_owner_idx on public.tracker_profiles(owner_id);
alter table public.tracker_profiles enable row level security;
revoke all on public.tracker_profiles from anon,authenticated;
grant select,delete on public.tracker_profiles to authenticated;
drop policy if exists profiles_read_own on public.tracker_profiles;
drop policy if exists profiles_delete_own on public.tracker_profiles;
create policy profiles_read_own on public.tracker_profiles for select to authenticated using(owner_id=(select auth.uid()));
create policy profiles_delete_own on public.tracker_profiles for delete to authenticated using(owner_id=(select auth.uid()));

-- Serialize a user's writes, enforce a quota, and reject stale revisions atomically.
-- No caller-supplied owner id and no direct client insert/update permission.
create or replace function public.save_tracker_profile(profile_id uuid,profile_kind text,profile_name text,profile_data jsonb,expected_revision integer)
returns setof public.tracker_profiles language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); current_revision integer;
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if profile_id is null or profile_kind not in ('game','player') or length(btrim(profile_name)) not between 1 and 50 or profile_name is null or profile_data is null or jsonb_typeof(profile_data)<>'object' or profile_data->>'schemaVersion' is distinct from '1' or octet_length(profile_data::text)>16384 or expected_revision is null or expected_revision<0 then raise exception 'Invalid setup'; end if;
 if profile_kind='player' and (jsonb_typeof(profile_data->'displayName') is distinct from 'string' or length(btrim(profile_data->>'displayName')) not between 1 and 32 or coalesce(profile_data->>'accent','')!~'^#[0-9a-fA-F]{6}$') then raise exception 'Invalid player setup'; end if;
 if profile_kind='game' and (jsonb_typeof(profile_data->'health') is distinct from 'object' or jsonb_typeof(profile_data->'counters') is distinct from 'array' or jsonb_typeof(profile_data->'sourceDamage') is distinct from 'object') then raise exception 'Invalid game setup'; end if;
 if profile_kind='game' and jsonb_array_length(profile_data->'counters')>8 then raise exception 'Too many counters'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,0));
 select revision into current_revision from public.tracker_profiles where id=profile_id and owner_id=uid;
 if current_revision is null then
  if expected_revision<>0 then raise exception 'Setup changed' using errcode='40001'; end if;
  if (select count(*) from public.tracker_profiles where owner_id=uid)>=40 then raise exception 'Saved setup limit reached'; end if;
  return query insert into public.tracker_profiles(id,owner_id,kind,name,data) values(profile_id,uid,profile_kind,btrim(profile_name),profile_data) returning *;
 else
  if expected_revision<>current_revision then raise exception 'Setup changed' using errcode='40001'; end if;
  return query update public.tracker_profiles set kind=profile_kind,name=btrim(profile_name),data=profile_data,revision=current_revision+1,updated_at=now() where id=profile_id and owner_id=uid returning *;
 end if;
end; $$;
revoke all on function public.save_tracker_profile(uuid,text,text,jsonb,integer) from public,anon;
grant execute on function public.save_tracker_profile(uuid,text,text,jsonb,integer) to authenticated;
commit;
