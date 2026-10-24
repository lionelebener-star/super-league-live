
alter table public.push_deliveries add column reminder_hours integer not null default 24 check(reminder_hours in(24,2));
alter table public.push_deliveries drop constraint push_deliveries_owner_hash_fixture_id_kickoff_key;
alter table public.push_deliveries add constraint push_delivery_reminder_unique unique(owner_hash,fixture_id,kickoff,reminder_hours);
create or replace function public.claim_push_reminders() returns setof jsonb language sql security invoker set search_path='' as $$
with claimed as (
 insert into public.push_deliveries(owner_hash,fixture_id,kickoff,reminder_hours)
 select s.owner_hash,f.id,f.kickoff,r.hours
 from public.push_subscriptions s join public.push_fixtures f on s.club in(f.home_club,f.away_club)
 cross join (values(24),(2)) r(hours)
 where not f.cancelled and f.verified_at>now()-interval '48 hours'
 and f.kickoff-make_interval(hours=>r.hours) between now()-interval '10 minutes' and now()
 and s.updated_at<=f.kickoff-make_interval(hours=>r.hours)
 and not exists(select 1 from public.push_deliveries old where old.owner_hash=s.owner_hash and old.fixture_id=f.id and old.kickoff=f.kickoff and old.reminder_hours=r.hours)
 order by f.kickoff,r.hours limit 100
 on conflict do nothing returning *
)
select jsonb_build_object('id',d.id,'owner_hash',d.owner_hash,'subscription',s.subscription,'language',s.language,'fixture',to_jsonb(f),'reminder_hours',d.reminder_hours)
from claimed d join public.push_subscriptions s using(owner_hash) join public.push_fixtures f on f.id=d.fixture_id;
$$;
revoke all on function public.claim_push_reminders() from public,anon,authenticated;
grant execute on function public.claim_push_reminders() to service_role;
