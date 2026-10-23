-- Run in the selected free Supabase project's SQL editor. No public access.
create table if not exists public.push_subscriptions (
 owner_hash text primary key check(owner_hash ~ '^[a-f0-9]{64}$'),
 club integer not null check(club between 0 and 11), language text not null check(language in ('fr','de')),
 subscription jsonb not null, updated_at timestamptz not null default now()
);
create table if not exists public.push_fixtures (
 id text primary key, home text not null, away text not null,
 home_club integer not null check(home_club between 0 and 11), away_club integer not null check(away_club between 0 and 11),
 kickoff timestamptz not null, verified_at timestamptz not null,
 cancelled boolean not null default false
);
create table if not exists public.push_deliveries (
 id bigint generated always as identity primary key,
 owner_hash text not null references public.push_subscriptions on delete cascade,
 fixture_id text not null references public.push_fixtures on delete cascade,
 kickoff timestamptz not null,status text not null default 'processing' check(status in ('processing','sent','failed')),
 unique(owner_hash,fixture_id,kickoff)
);
alter table public.push_subscriptions enable row level security;
alter table public.push_fixtures enable row level security;
alter table public.push_deliveries enable row level security;
revoke all on public.push_subscriptions,public.push_fixtures,public.push_deliveries from anon,authenticated;
grant all on public.push_subscriptions,public.push_fixtures,public.push_deliveries to service_role;
grant usage,select on sequence public.push_deliveries_id_seq to service_role;
create or replace function public.claim_push_reminders() returns setof jsonb language sql security invoker set search_path='' as $$
 with claimed as (
 insert into public.push_deliveries(owner_hash,fixture_id,kickoff)
 select s.owner_hash,f.id,f.kickoff from public.push_subscriptions s join public.push_fixtures f on s.club in (f.home_club,f.away_club)
 where not f.cancelled and f.verified_at>now()-interval '48 hours'
 and f.kickoff-interval '24 hours' between now()-interval '10 minutes' and now()
 and s.updated_at<=f.kickoff-interval '24 hours'
 and not exists(select 1 from public.push_deliveries old where old.owner_hash=s.owner_hash and old.fixture_id=f.id and old.kickoff=f.kickoff)
 order by f.kickoff limit 100
 on conflict do nothing returning *
 ) select jsonb_build_object('id',d.id,'owner_hash',d.owner_hash,'subscription',s.subscription,'language',s.language,'fixture',to_jsonb(f))
 from claimed d join public.push_subscriptions s using(owner_hash) join public.push_fixtures f on f.id=d.fixture_id;
$$;
revoke all on function public.claim_push_reminders() from public,anon,authenticated;
grant execute on function public.claim_push_reminders() to service_role;
