# Pronostics and match reminders

Production database: Supabase project `super-league-live`, region Zurich (`eu-central-2`).

Participants use a unique name and four-digit PIN, without email. PINs use PBKDF2-SHA256 (210,000 iterations), unique random salts and a server-held pepper. Eight attempts per name/IP per 15 minutes. Random session tokens expire after 30 days; only token digests are stored. A lost code currently requires the owner to arrange a reset or the player to choose a different name. This is a small friends' game without money.

Vercel server routes call the Supabase `site-api` Edge Function. JWT verification is enabled. The additional SITE_API_KEY is held only in encrypted Vercel production configuration, never in browser JavaScript or Git. Its digest is inserted into the deployed function from deployment-time configuration (`__APP_KEY_DIGEST__` in the source template). Scheduler-only business actions additionally validate CRON_SECRET. There is no general-purpose database proxy. All public tables have RLS enabled and public grants revoked. Server operations are explicitly coded in the function.

Prediction changes are blocked by a database trigger at kickoff, including cancelled games. Other players' predictions are hidden by the business API until kickoff. Exact score = 3 points; correct outcome = 1 point. Results use the official SFL source; the schedule synchronizer adds the next round and upserts changed kickoffs/results. The UI selects the current Swiss calendar week and falls back to upcoming games if needed.

Supabase Cron invokes `/api/game-sync` every 15 minutes and checks due push reminders every minute. Only actual due reminders cause a call to `/api/push-send`. Subscriptions are per device/browser and one favorite club. Users can opt out or send a test push using the visible button. VAPID_PRIVATE_KEY and CRON_SECRET remain encrypted server settings; the cron key is also stored in Supabase Vault. Expired subscriptions are deleted. Delivery claims prevent overlapping schedules from sending twice. Device delivery may be delayed. Ambiguous failed sends are not retried automatically, to avoid duplicate alerts.

A real device must authorize notifications. iOS/iPadOS requires launching the home-screen web app. Nothing in the server can grant permission on the user's behalf. The test button verifies reception on the actual phone.

Known limits: no money, password recovery or strong identity verification; a free Supabase project may pause for inactivity. Check provider free-tier limits and cron health if the site becomes larger. Refresh the season source when the league changes seasons; the SFL adapter intentionally refuses out-of-date season projections.
