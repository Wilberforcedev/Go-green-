create type public.user_role as enum ('participant', 'organizer', 'admin');
create type public.activity_status as enum ('draft', 'published', 'cancelled', 'completed');
create type public.signup_status as enum ('registered', 'attended', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.user_role not null default 'participant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 5 and 120),
  category text not null check (category in ('Tree planting', 'Clean-ups', 'Learning', 'Clean energy')),
  place text not null check (char_length(place) between 2 and 160),
  starts_at timestamptz not null,
  capacity integer not null check (capacity between 1 and 5000),
  points integer not null check (points between 0 and 10000),
  description text not null check (char_length(description) between 20 and 2000),
  image_url text check (image_url is null or image_url ~ '^https://'),
  impact_measure text not null check (char_length(impact_measure) between 3 and 240),
  impact_source_url text check (impact_source_url is null or impact_source_url ~ '^https://'),
  status public.activity_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_signups (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  status public.signup_status not null default 'registered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, participant_id)
);

create table public.point_ledger (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id),
  signup_id uuid not null unique references public.activity_signups(id),
  points integer not null check (points >= 0),
  reason text not null default 'Organizer verified attendance',
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index activities_public_date_idx on public.activities (starts_at) where status = 'published';
create index activity_signups_participant_idx on public.activity_signups (participant_id, created_at desc);
create index activity_signups_activity_idx on public.activity_signups (activity_id, created_at);
create index point_ledger_participant_idx on public.point_ledger (participant_id, created_at desc);
create index audit_log_record_idx on public.audit_log (table_name, record_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger activities_set_updated_at before update on public.activities
for each row execute function public.set_updated_at();
create trigger activity_signups_set_updated_at before update on public.activity_signups
for each row execute function public.set_updated_at();

create or replace function public.prevent_capacity_below_signups()
returns trigger language plpgsql set search_path = '' as $$
declare
  active_signups integer;
begin
  select count(*)::integer into active_signups
    from public.activity_signups
   where activity_id = new.id and status in ('registered', 'attended');
  if new.capacity < active_signups then
    raise exception 'Capacity cannot be lower than the current number of registered or attended participants';
  end if;
  return new;
end;
$$;

create trigger activities_capacity_guard before update of capacity on public.activities
for each row execute function public.prevent_capacity_below_signups();

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_profile after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.can_manage_activity(activity_uuid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.activities a
    where a.id = activity_uuid and (a.organizer_id = auth.uid() or public.is_admin())
  );
$$;

create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  before_row jsonb;
  after_row jsonb;
  target_id text;
begin
  if tg_op <> 'INSERT' then before_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then after_row := to_jsonb(new); end if;
  target_id := coalesce(after_row ->> 'id', before_row ->> 'id');
  insert into public.audit_log (actor_id, table_name, record_id, action, before_data, after_data)
  values (auth.uid(), tg_table_name, target_id, tg_op, before_row, after_row);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger activities_audit after insert or update or delete on public.activities
for each row execute function public.write_audit_log();
create trigger profiles_audit after insert or update or delete on public.profiles
for each row execute function public.write_audit_log();
create trigger activity_signups_audit after insert or update or delete on public.activity_signups
for each row execute function public.write_audit_log();
create trigger point_ledger_audit after insert or update or delete on public.point_ledger
for each row execute function public.write_audit_log();

create view public.activity_listing as
select a.id, a.title, a.category, a.place, a.starts_at, a.points, a.capacity,
       greatest(a.capacity - count(s.id)::integer, 0) as spots_remaining,
       a.description, a.image_url, a.impact_measure, a.impact_source_url, a.organizer_id
from public.activities a
left join public.activity_signups s on s.activity_id = a.id and s.status in ('registered', 'attended')
where a.status = 'published'
group by a.id;

create or replace function public.join_activity(activity_uuid uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target public.activities%rowtype;
  new_signup uuid;
  booked integer;
begin
  if auth.uid() is null then raise exception 'Sign in is required to join an activity'; end if;
  select * into target from public.activities where id = activity_uuid and status = 'published' for update;
  if not found then raise exception 'This activity is not available'; end if;
  if target.starts_at <= now() then raise exception 'Registration for this activity is closed'; end if;
  select count(*) into booked from public.activity_signups
   where activity_id = activity_uuid and status in ('registered', 'attended');
  if booked >= target.capacity then raise exception 'This activity is full'; end if;
  insert into public.activity_signups (activity_id, participant_id)
  values (activity_uuid, auth.uid()) returning id into new_signup;
  return new_signup;
exception when unique_violation then
  raise exception 'You have already joined this activity';
end;
$$;

create or replace function public.verify_attendance(signup_uuid uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  signup public.activity_signups%rowtype;
  target public.activities%rowtype;
begin
  select * into signup from public.activity_signups where id = signup_uuid for update;
  if not found then raise exception 'Sign-up not found'; end if;
  select * into target from public.activities where id = signup.activity_id;
  if target.organizer_id <> auth.uid() and not public.is_admin() then
    raise exception 'Only the activity organizer can verify attendance';
  end if;
  if target.starts_at > now() then raise exception 'Attendance can only be confirmed after the activity starts'; end if;
  if signup.status = 'cancelled' then raise exception 'Cancelled sign-ups cannot be verified'; end if;
  if signup.status = 'attended' then
    return coalesce((select points from public.point_ledger where signup_id = signup.id), 0);
  end if;
  update public.activity_signups set status = 'attended' where id = signup.id;
  insert into public.point_ledger (participant_id, activity_id, signup_id, points)
  values (signup.participant_id, target.id, signup.id, target.points)
  on conflict (signup_id) do nothing;
  return target.points;
end;
$$;

create or replace function public.cancel_activity_signup(signup_uuid uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.activity_signups
     set status = 'cancelled'
   where id = signup_uuid and participant_id = auth.uid() and status = 'registered';
  if not found then raise exception 'This sign-up cannot be cancelled'; end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.activity_signups enable row level security;
alter table public.point_ledger enable row level security;
alter table public.audit_log enable row level security;

create policy "Profiles can read themselves" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "Organizers can read participant names on their roster" on public.profiles
for select to authenticated using (
  exists (
    select 1 from public.activity_signups s
    where s.participant_id = profiles.id and public.can_manage_activity(s.activity_id)
  )
);
create policy "Published activities are public" on public.activities
for select using (status = 'published' or organizer_id = auth.uid() or public.is_admin());
create policy "Organizers create their activities" on public.activities
for insert to authenticated with check (
  organizer_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('organizer', 'admin'))
);
create policy "Organizers update their activities" on public.activities
for update to authenticated using (organizer_id = auth.uid() or public.is_admin())
with check (organizer_id = auth.uid() or public.is_admin());
create policy "Organizers delete drafts only" on public.activities
for delete to authenticated using ((organizer_id = auth.uid() and status = 'draft') or public.is_admin());

create policy "Participants see own sign-ups and organizers see their roster" on public.activity_signups
for select to authenticated using (participant_id = auth.uid() or public.can_manage_activity(activity_id));
create policy "Participants can read their own point ledger" on public.point_ledger
for select to authenticated using (participant_id = auth.uid() or public.is_admin());
create policy "Admins can read audit history" on public.audit_log
for select to authenticated using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.activity_listing to anon, authenticated;
grant select on public.profiles, public.activities, public.activity_signups, public.point_ledger, public.audit_log to authenticated;
grant insert, update, delete on public.activities to authenticated;
revoke update, delete, insert on public.activity_signups from authenticated;
revoke insert, update, delete on public.point_ledger from authenticated;
revoke insert, update, delete on public.audit_log from anon, authenticated;
grant execute on function public.join_activity(uuid) to authenticated;
grant execute on function public.verify_attendance(uuid) to authenticated;
grant execute on function public.cancel_activity_signup(uuid) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.can_manage_activity(uuid) to authenticated;
revoke all on function public.join_activity(uuid) from public, anon;
revoke all on function public.verify_attendance(uuid) from public, anon;
revoke all on function public.cancel_activity_signup(uuid) from public, anon;
revoke all on function public.can_manage_activity(uuid) from public, anon;

-- Bootstrap the first administrator after creating an account in Supabase Auth:
-- update public.profiles set role = 'admin' where id = '<auth.users.id>';
