-- Keep existing hour codes for compatibility; code 0 denotes the five-minute reminder.
-- reminder_minutes is the unambiguous duration consumed by the dispatcher.
alter table public.push_deliveries drop constraint push_deliveries_reminder_hours_check;
alter table public.push_deliveries add constraint push_deliveries_reminder_hours_check check(reminder_hours in(24,2,0));
alter table public.push_deliveries add column reminder_minutes integer generated always as(case reminder_hours when 24 then 1440 when 2 then 120 when 0 then 5 end) stored;
create or replace function public.claim_push_reminders() returns setof jsonb language sql security invoker set search_path='' as $$
with eligible as materialized (
 select s.owner_hash,f.id as fixture_id,f.kickoff,r.hours as reminder_hours
 from public.push_subscriptions s join public.push_fixtures f on s.clubs && array[f.home_club,f.away_club]
 cross join (values(24,1440,24),(2,120,2),(0,5,5)) r(hours,minutes,preference)
 where not f.cancelled and exists(select 1 from unnest(s.clubs) c where c in(f.home_club,f.away_club) and coalesce(s.reminders->c::text,'[24,2]'::jsonb) @> jsonb_build_array(r.preference))
 and f.verified_at>now()-interval '48 hours' and f.kickoff>now()
 and f.kickoff-make_interval(mins=>r.minutes) between now()-interval '10 minutes' and now()
 and s.updated_at<=f.kickoff-make_interval(mins=>r.minutes)
 and not exists(select 1 from public.push_deliveries old where old.owner_hash=s.owner_hash and old.fixture_id=f.id and old.kickoff=f.kickoff and old.reminder_hours=r.hours)
), groups as (
 select owner_hash,kickoff,reminder_hours from eligible group by owner_hash,kickoff,reminder_hours order by kickoff,reminder_hours,owner_hash limit 100
), claimed as (
 insert into public.push_deliveries(owner_hash,fixture_id,kickoff,reminder_hours)
 select e.owner_hash,e.fixture_id,e.kickoff,e.reminder_hours from eligible e join groups g using(owner_hash,kickoff,reminder_hours)
 order by e.owner_hash,e.kickoff,e.reminder_hours,e.fixture_id
 on conflict do nothing returning *
)
select jsonb_build_object('id',d.id,'owner_hash',d.owner_hash,'subscription',s.subscription,'language',s.language,'fixture',to_jsonb(f),'reminder_hours',d.reminder_hours,'reminder_minutes',d.reminder_minutes)
from claimed d join public.push_subscriptions s using(owner_hash) join public.push_fixtures f on f.id=d.fixture_id;
$$;
revoke all on function public.claim_push_reminders() from public,anon,authenticated;
grant execute on function public.claim_push_reminders() to service_role;

select cron.schedule('sl-match-reminders','* * * * *',$job$
 select net.http_post(url:='https://sl.vamox.ch/api/push-send',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='sl_cron_secret')),body:='{}'::jsonb,timeout_milliseconds:=60000)
 where exists(select 1 from public.push_subscriptions s join public.push_fixtures f on s.clubs && array[f.home_club,f.away_club] cross join (values(24,1440,24),(2,120,2),(0,5,5)) r(hours,minutes,preference) where not f.cancelled and f.kickoff>now() and exists(select 1 from unnest(s.clubs) c where c in(f.home_club,f.away_club) and coalesce(s.reminders->c::text,'[24,2]'::jsonb) @> jsonb_build_array(r.preference)) and f.verified_at>now()-interval '48 hours' and f.kickoff-make_interval(mins=>r.minutes) between now()-interval '10 minutes' and now() and s.updated_at<=f.kickoff-make_interval(mins=>r.minutes) and not exists(select 1 from public.push_deliveries d where d.owner_hash=s.owner_hash and d.fixture_id=f.id and d.kickoff=f.kickoff and d.reminder_hours=r.hours));
$job$);
