begin;
create table public.game_players(key_hash text primary key check(key_hash ~ '^[a-f0-9]{64}$'),name text not null check(length(name) between 2 and 30),name_key text not null unique,created_at timestamptz not null default now());
create table public.game_fixtures(id text primary key,home text not null,away text not null,kickoff timestamptz not null,home_score integer,away_score integer,final boolean not null default false,check((home_score is null or home_score>=0) and (away_score is null or away_score>=0)));
create table public.game_predictions(key_hash text references public.game_players(key_hash) not null,fixture_id text references public.game_fixtures(id) not null,home integer not null check(home between 0 and 30),away integer not null check(away between 0 and 30),updated_at timestamptz not null default now(),primary key(key_hash,fixture_id));
alter table public.game_players enable row level security;
alter table public.game_fixtures enable row level security;
alter table public.game_predictions enable row level security;
revoke all on public.game_players,public.game_fixtures,public.game_predictions from anon,authenticated;
grant all on public.game_players,public.game_fixtures,public.game_predictions to service_role;
create function public.lock_game_prediction() returns trigger language plpgsql set search_path=public as $$
begin
 if not exists(select 1 from public.game_fixtures where id=new.fixture_id and kickoff>clock_timestamp()) then raise exception 'Match verrouillé';end if;
 new.updated_at=clock_timestamp();return new;
end;$$;
create trigger game_prediction_cutoff before insert or update on public.game_predictions for each row execute function public.lock_game_prediction();
commit;
