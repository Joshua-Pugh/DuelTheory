-- Five private game templates per account. Existing records are preserved.
begin;
create or replace function public.save_tracker_profile(profile_id uuid,profile_kind text,profile_name text,profile_data jsonb,expected_revision integer)
returns setof public.tracker_profiles language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); current_revision integer; current_kind text; current_name text;
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if profile_id is null or profile_kind not in ('game','player') or length(btrim(profile_name)) not between 1 and 50 or profile_name is null or profile_data is null or jsonb_typeof(profile_data)<>'object' or profile_data->>'schemaVersion' is distinct from '1' or octet_length(profile_data::text)>16384 or expected_revision is null or expected_revision<0 then raise exception 'Invalid setup'; end if;
 if profile_kind='player' and (jsonb_typeof(profile_data->'displayName') is distinct from 'string' or length(btrim(profile_data->>'displayName')) not between 1 and 32 or coalesce(profile_data->>'accent','')!~'^#[0-9a-fA-F]{6}$') then raise exception 'Invalid player setup'; end if;
 if profile_kind='game' and (jsonb_typeof(profile_data->'health') is distinct from 'object' or jsonb_typeof(profile_data->'counters') is distinct from 'array' or jsonb_typeof(profile_data->'sourceDamage') is distinct from 'object') then raise exception 'Invalid game setup'; end if;
 if profile_kind='game' and jsonb_array_length(profile_data->'counters')>8 then raise exception 'Too many counters'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,0));
 select revision,kind,name into current_revision,current_kind,current_name from public.tracker_profiles where id=profile_id and owner_id=uid;
 if profile_kind='game' and (current_revision is null or current_kind<>'game') and (select count(*) from public.tracker_profiles where owner_id=uid and kind='game')>=5 then raise exception 'Game template limit reached (5)'; end if;
 if profile_kind='game' and (current_revision is null or current_kind<>'game' or lower(btrim(profile_name))<>lower(current_name)) and exists(select 1 from public.tracker_profiles where owner_id=uid and kind='game' and id<>profile_id and lower(name)=lower(btrim(profile_name))) then raise exception 'Template name already exists'; end if;
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
