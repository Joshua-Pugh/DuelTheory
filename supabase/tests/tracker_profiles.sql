-- Hosted transactional authorization test. All test users and profiles roll back.
begin;
insert into auth.users(id) values ('98710000-0000-4000-8000-000000000001'),('98710000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','98710000-0000-4000-8000-000000000001',true);
select * from public.save_tracker_profile('98720000-0000-4000-8000-000000000001','player','A','{"schemaVersion":1,"displayName":"A","accent":"#123456"}',0);
select set_config('request.jwt.claim.sub','98710000-0000-4000-8000-000000000002',true);
select * from public.save_tracker_profile('98720000-0000-4000-8000-000000000002','player','B','{"schemaVersion":1,"displayName":"B","accent":"#654321"}',0);
do $$
declare affected integer;
begin
 if (select count(*) from public.tracker_profiles)<>1 then raise exception 'RLS read isolation failed'; end if;
 delete from public.tracker_profiles where id='98720000-0000-4000-8000-000000000001';
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-user deletion allowed'; end if;
 begin
  perform public.save_tracker_profile('98720000-0000-4000-8000-000000000001','player','Attack','{"schemaVersion":1,"displayName":"B","accent":"#654321"}',1);
  raise exception 'Cross-user save allowed';
 exception when serialization_failure then null; end;
 begin
  update public.tracker_profiles set name='Attack';
  raise exception 'Direct update allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.save_tracker_profile('98720000-0000-4000-8000-000000000002','player','B','{"schemaVersion":1,"displayName":"B","accent":"#654321"}',0);
  raise exception 'Stale revision allowed';
 exception when serialization_failure then null; end;
end $$;
set local role anon;
do $$ begin
 begin
  perform id from public.tracker_profiles;
  raise exception 'Anonymous read allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.save_tracker_profile('98720000-0000-4000-8000-000000000003','player','Anon','{}',0);
  raise exception 'Anonymous save allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: owner isolation, cross-user deletion/save denial, direct update denial, stale revision and anonymous denial' as security_result;
rollback;
