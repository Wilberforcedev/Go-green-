begin;
select plan(13);

insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'participant@test.invalid', '', '{}', '{"display_name":"Participant One"}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'organizer@test.invalid', '', '{}', '{"display_name":"Organizer One"}', now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'participant2@test.invalid', '', '{}', '{"display_name":"Participant Two"}', now(), now()),
  ('10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'participant3@test.invalid', '', '{}', '{"display_name":"Participant Three"}', now(), now());

update public.profiles set role = 'organizer' where id = '10000000-0000-0000-0000-000000000002';

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$insert into public.activities (id, organizer_id, title, category, place, starts_at, capacity, points, description, impact_measure, status)
    values ('20000000-0000-0000-0000-000000000001', auth.uid(), 'Community tree planting', 'Tree planting', 'Kampala, Uganda', now() + interval '2 days', 2, 120, 'Plant native seedlings with local volunteers and learn how to care for them.', 'Native seedlings planted', 'published')$$,
  'an authorized organizer can publish an activity'
);

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select lives_ok($$select public.join_activity('20000000-0000-0000-0000-000000000001')$$, 'a participant can join a published activity');
reset role;
select is((select count(*)::integer from public.activity_signups where activity_id = '20000000-0000-0000-0000-000000000001'), 1, 'joining creates one shared sign-up');
select set_config('test.signup_id', (select id::text from public.activity_signups where activity_id = '20000000-0000-0000-0000-000000000001' limit 1), true);
set local role authenticated;
select throws_ok($$select public.join_activity('20000000-0000-0000-0000-000000000001')$$, 'P0001', 'You have already joined this activity', 'a participant cannot register twice');
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select lives_ok($$select public.join_activity('20000000-0000-0000-0000-000000000001')$$, 'a second participant can join while places remain');
reset role;

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$update public.activities set capacity = 1 where id = '20000000-0000-0000-0000-000000000001'$$,
  'P0001', 'Capacity cannot be lower than the current number of registered or attended participants',
  'an organizer cannot lower capacity below existing sign-ups'
);
reset role;
set local role authenticated;
select throws_ok(
  format('select public.verify_attendance(%L::uuid)', current_setting('test.signup_id')),
  'P0001', 'Attendance can only be confirmed after the activity starts',
  'attendance cannot be verified before the activity starts'
);
reset role;
update public.activities set starts_at = now() - interval '1 hour' where id = '20000000-0000-0000-0000-000000000001';
set local role authenticated;
select is(public.verify_attendance(current_setting('test.signup_id')::uuid), 120, 'the activity organizer verifies attendance and awards the configured points');
reset role;
select is((select sum(points)::integer from public.point_ledger where signup_id = current_setting('test.signup_id')::uuid), 120, 'the points ledger records the award');

set local role authenticated;
select is(public.verify_attendance(current_setting('test.signup_id')::uuid), 120, 'repeating verification returns the existing award');
reset role;
select is((select count(*)::integer from public.point_ledger where signup_id = current_setting('test.signup_id')::uuid), 1, 'repeated verification cannot award points twice');

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  format('select public.verify_attendance(%L::uuid)', current_setting('test.signup_id')),
  'P0001', 'Only the activity organizer can verify attendance',
  'another participant cannot verify attendance'
);
select throws_ok(
  $$select public.join_activity('20000000-0000-0000-0000-000000000001')$$,
  'P0001', 'This activity is full',
  'the database rejects sign-ups after capacity is reached'
);

select * from finish();
rollback;
