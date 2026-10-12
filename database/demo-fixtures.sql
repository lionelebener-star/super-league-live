-- Exemples uniquement, pas le calendrier réel. Exécuter après schema.sql si une démonstration est souhaitée.
insert into public.game_fixtures(id,home,away,kickoff) values
('demo-2026-10-24-sio-sfc','Sion','Servette','2026-10-24T16:00:00Z'),
('demo-2026-10-25-ls-yb','Lausanne-Sport','Young Boys','2026-10-25T15:30:00Z'),
('demo-2026-10-25-fcz-lug','Zurich','Lugano','2026-10-25T13:15:00Z') on conflict do nothing;
