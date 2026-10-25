# Match push notifications

The production shared database, server API and VAPID credentials are configured. See `PRONOSTICS.md` for architecture, authentication and scheduling. Browser activation and a real-phone test are still performed by the user using the visible controls.

For a fresh deployment, use Supabase Free, apply the SQL schemas, deploy `supabase/functions/site-api/index.ts` with JWT verification enabled and replace its server-key digest placeholder during deployment. Generate a new server-only SITE_API_KEY and VAPID pair; store keys only in encrypted Vercel environment variables. Required configuration: SUPABASE_SITE_API, SUPABASE_EDGE_JWT, SITE_API_KEY, CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT and PUSH_ENABLED=true. Never place private keys in public assets or Git. Enable pg_cron/pg_net and configure the authenticated jobs documented in `database/scheduler.sql`.


### Plusieurs équipes
Dans « Détails », cocher les équipes à suivre. Le même appareil conserve une seule inscription push avec une liste de clubs. Le rappel 24 h et celui à 2 h sont envoyés une seule fois par match, même si les deux équipes sont suivies. Décocher une équipe conserve les autres ; décocher la dernière désinscrit l’appareil. Les anciennes inscriptions sont conservées par `database/multiple_club_alerts.sql`.


### Centre de notifications
La clochette à gauche de FR/DE ouvre le volet de gestion. Chaque équipe possède deux interrupteurs indépendants (24 h et 2 h). Les modifications sont enregistrées ensemble via le bouton de validation ; fermer le volet annule les modifications non enregistrées. Les inscriptions existantes conservent les deux rappels. Migration : `database/club_reminder_preferences.sql`.


### Rappels groupés
Les matchs ayant le même coup d’envoi sont regroupés en une notification par appareil et par rappel (24 h ou 2 h). Tous les matchs du groupe sont marqués comme traités. La collecte réserve des groupes complets pour éviter de les couper à la limite du lot. Migration : `database/grouped_push_claims.sql`.
