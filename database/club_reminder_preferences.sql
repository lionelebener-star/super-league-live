alter table public.push_subscriptions add column reminders jsonb not null default '{}'::jsonb check(jsonb_typeof(reminders)='object');
create or replace function public.claim_push_reminders() returns setof jsonb language sql security invoker set search_path='' as $$
with claimed as (
 insert into public.push_deliveries(owner_hash,fixture_id,kickoff,reminder_hours)
 select s.owner_hash,f.id,f.kickoff,r.hours
 from public.push_subscriptions s join public.push_fixtures f on s.clubs && array[f.home_club,f.away_club]
 cross join (values(24),(2)) r(hours)
 where not f.cancelled and exists(select 1 from unnest(s.clubs) c where c in(f.home_club,f.away_club) and coalesce(s.reminders->c::text,'[24,2]'::jsonb) @> jsonb_build_array(r.hours)) and f.verified_at>now()-interval '48 hours'
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

select cron.schedule('sl-match-reminders','* * * * *',$job$
 select net.http_post(url:='https://sl.vamox.ch/api/push-send',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='sl_cron_secret')),body:='{}'::jsonb,timeout_milliseconds:=60000)
 where exists(select 1 from public.push_subscriptions s join public.push_fixtures f on s.clubs && array[f.home_club,f.away_club] cross join (values(24),(2)) r(hours) where not f.cancelled and exists(select 1 from unnest(s.clubs) c where c in(f.home_club,f.away_club) and coalesce(s.reminders->c::text,'[24,2]'::jsonb) @> jsonb_build_array(r.hours)) and f.verified_at>now()-interval '48 hours' and f.kickoff-make_interval(hours=>r.hours) between now()-interval '10 minutes' and now() and s.updated_at<=f.kickoff-make_interval(hours=>r.hours) and not exists(select 1 from public.push_deliveries d where d.owner_hash=s.owner_hash and d.fixture_id=f.id and d.kickoff=f.kickoff and d.reminder_hours=r.hours));
$job$);
