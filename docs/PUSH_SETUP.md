# Match push notifications

The production shared database, server API and VAPID credentials are configured. See `PRONOSTICS.md` for architecture, authentication and scheduling. Browser activation and a real-phone test are still performed by the user using the visible controls.

For a fresh deployment, use Supabase Free, apply the SQL schemas, deploy `supabase/functions/site-api/index.ts` with JWT verification enabled and replace its server-key digest placeholder during deployment. Generate a new server-only SITE_API_KEY and VAPID pair; store keys only in encrypted Vercel environment variables. Required configuration: SUPABASE_SITE_API, SUPABASE_EDGE_JWT, SITE_API_KEY, CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT and PUSH_ENABLED=true. Never place private keys in public assets or Git. Enable pg_cron/pg_net and configure the authenticated jobs documented in `database/scheduler.sql`.
