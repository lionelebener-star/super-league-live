-- Requires pg_cron and pg_net. Put CRON_SECRET into Vault as sl_cron_secret first.
-- No secret values belong in this file.
select cron.schedule('sl-fixtures-sync','*/15 * * * *',$job$
 select net.http_post(url:='https://sl.vamox.ch/api/game-sync',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='sl_cron_secret')),body:='{}'::jsonb,timeout_milliseconds:=60000);
$job$);
select cron.schedule('sl-match-reminders','* * * * *',$job$
 select net.http_post(url:='https://sl.vamox.ch/api/push-send',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='sl_cron_secret')),body:='{}'::jsonb,timeout_milliseconds:=60000)
 where exists(select 1 from public.push_subscriptions s join public.push_fixtures f on s.clubs && array[f.home_club,f.away_club] cross join (values(24),(2)) r(hours) where not f.cancelled and f.verified_at>now()-interval '48 hours' and f.kickoff-make_interval(hours=>r.hours) between now()-interval '10 minutes' and now() and s.updated_at<=f.kickoff-make_interval(hours=>r.hours) and not exists(select 1 from public.push_deliveries d where d.owner_hash=s.owner_hash and d.fixture_id=f.id and d.kickoff=f.kickoff and d.reminder_hours=r.hours));
$job$);
select cron.schedule('sl-private-cleanup','17 3 * * *',$job$
 delete from public.game_sessions where expires_at<now();
 delete from public.game_auth_attempts where window_start<now()-interval '1 day';
 delete from cron.job_run_details where end_time<now()-interval '7 days';
$job$);
