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

set local role authenticated;
select set_config('request.jwt.claim.sub','98710000-0000-4000-8000-000000000002',true);
do $$
declare i integer; game_data jsonb:='{"schemaVersion":1,"name":"Template","health":{"label":"Life","start":20,"defeatAt":0},"counters":[],"sourceDamage":{"enabled":false,"label":"Source damage","defeatAt":null}}'; game_id uuid;
begin
 for i in 1..5 loop
  game_id:=('98730000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid;
  perform public.save_tracker_profile(game_id,'game','Template '||i,game_data,0);
 end loop;
 begin
  perform public.save_tracker_profile('98730000-0000-4000-8000-000000000006','game','Sixth',game_data,0);
  raise exception 'Quota was not enforced';
 exception when sqlstate 'P0001' then if sqlerrm not like 'Game template limit%' then raise; end if; end;
 -- Editing remains possible at quota, including records grandfathered over the cap.
 perform public.save_tracker_profile('98730000-0000-4000-8000-000000000001','game','Template 1 edited',game_data,1);
 if (select revision from public.tracker_profiles where id='98730000-0000-4000-8000-000000000001')<>2 then raise exception 'Update at quota failed'; end if;
 begin
  perform public.save_tracker_profile('98730000-0000-4000-8000-000000000001','game','template 2',game_data,2);
  raise exception 'Duplicate name was allowed';
 exception when sqlstate 'P0001' then if sqlerrm not like 'Template name already%' then raise; end if; end;
 begin
  perform public.save_tracker_profile('98720000-0000-4000-8000-000000000002','game','Kind conversion',game_data,1);
  raise exception 'Kind conversion bypassed quota';
 exception when sqlstate 'P0001' then if sqlerrm not like 'Game template limit%' then raise; end if; end;
 delete from public.tracker_profiles where id='98730000-0000-4000-8000-000000000005';
 perform public.save_tracker_profile('98730000-0000-4000-8000-000000000006','game','Replacement',game_data,0);
end $$;
reset role;
select 'PASS: quota, update-at-limit, duplicate names, kind conversion and freed slot' as template_result;

rollback;
