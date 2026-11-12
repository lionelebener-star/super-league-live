-- Private fan cards. Access only through the authenticated game.fanCard action.
create table if not exists public.game_fan_cards(owner_name text primary key references public.game_players(name_key),card jsonb not null);
alter table public.game_fan_cards enable row level security;
revoke all on public.game_fan_cards from public,anon,authenticated;
grant select,insert,update,delete on public.game_fan_cards to service_role;
-- Do not place portraits in public assets or commit private card payloads.
-- The repository Edge Function uses SITE_APP_KEY_DIGEST and SITE_CRON_KEY_DIGEST.
-- Missing digests deny access. Configure them before deploying this source.
-- The running function retains its existing validated server-side digests.
