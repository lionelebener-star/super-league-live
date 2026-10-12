-- Calendrier officiel SFL, journée 11, vérifié le 12 octobre 2026.
-- Le 25 octobre marque le retour à l'heure d'hiver en Suisse (UTC+1).
insert into public.game_fixtures(id,home,away,kickoff) values
('sfl-100126','Servette','Vaduz','2026-10-24T16:00:00Z'),
('sfl-100131','Zurich','Lucerne','2026-10-24T16:00:00Z'),
('sfl-100130','Young Boys','Saint-Gall','2026-10-24T18:30:00Z'),
('sfl-100129','Thoune','Lugano','2026-10-25T13:00:00Z'),
('sfl-100128','Sion','Lausanne-Sport','2026-10-25T15:30:00Z'),
('sfl-100127','Bâle','Grasshoppers','2026-10-25T15:30:00Z')
on conflict (id) do update set home=excluded.home,away=excluded.away,kickoff=excluded.kickoff;
