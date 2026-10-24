-- Additional schema after schema.sql and push.sql; already applied in production.
alter table public.game_players add column pin_salt text,add column pin_hash text;
alter table public.game_fixtures add column cancelled boolean not null default false;
create table public.game_sessions(token_hash text primary key,key_hash text not null references public.game_players(key_hash) on delete cascade,expires_at timestamptz not null);
create table public.game_auth_attempts(bucket text primary key,attempts integer not null default 0,window_start timestamptz not null default now());
alter table public.game_sessions enable row level security;
alter table public.game_auth_attempts enable row level security;
revoke all on public.game_sessions,public.game_auth_attempts from anon,authenticated;
grant all on public.game_sessions,public.game_auth_attempts to service_role;
create index game_sessions_player_idx on public.game_sessions(key_hash);
create index game_predictions_fixture_idx on public.game_predictions(fixture_id);
create index game_fixtures_kickoff_idx on public.game_fixtures(kickoff);
create index push_fixtures_due_idx on public.push_fixtures(kickoff) where not cancelled;
create index push_deliveries_fixture_idx on public.push_deliveries(fixture_id);
create function public.consume_game_attempt(p_bucket text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin insert into public.game_auth_attempts(bucket,attempts,window_start) values(p_bucket,1,now()) on conflict(bucket) do update set attempts=case when game_auth_attempts.window_start<now()-interval '15 minutes' then 1 else game_auth_attempts.attempts+1 end,window_start=case when game_auth_attempts.window_start<now()-interval '15 minutes' then now() else game_auth_attempts.window_start end returning attempts into n;return n<=8;end;$$;
revoke all on function public.consume_game_attempt(text) from public,anon,authenticated;
grant execute on function public.consume_game_attempt(text) to service_role;
create or replace function public.lock_game_prediction() returns trigger language plpgsql set search_path='' as $$
begin if not exists(select 1 from public.game_fixtures where id=new.fixture_id and kickoff>clock_timestamp() and not cancelled) then raise exception 'Match verrouillé';end if;new.updated_at=clock_timestamp();return new;end;$$;
revoke all on function public.lock_game_prediction() from public,anon,authenticated;
