# Match reminders: setup still required

The UI and Web Push sender are implemented. Nothing is enabled until these steps are complete. No paid plan is required by this implementation; monitor the selected providers' free limits.

1. Create/select a Supabase **Free** project; run `database/push.sql`.
2. Generate VAPID credentials locally using `npx web-push generate-vapid-keys`. Keep the private key out of Git and chat.
3. Set Vercel production variables directly in the dashboard: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (a valid owner contact mailto URL), `CRON_SECRET` (random 32+ bytes). Enable only after verification with `PUSH_ENABLED=true`.
4. Populate `push_fixtures` from a verified calendar. Club indices follow `teams` in public/app.js. Use timezone-aware kickoff timestamps; update cancellations/time changes and `verified_at` from the real source. **Do not copy the existing October snapshot as fresh data.** Sender refuses calendar data older than 48 hours.
5. Enable Supabase Cron and pg_net. Store CRON_SECRET using Supabase Vault, named `sl_push_cron_secret`. In Cron, schedule an HTTP POST every minute to `https://sl.vamox.ch/api/push-send` with `Authorization: Bearer <vault secret>`. Use Vault lookup in SQL; never put the secret in committed SQL. See https://supabase.com/docs/guides/functions/schedule-functions . Vercel Hobby's daily cron with hourly precision is unsuitable.
6. Redeploy Vercel. Verify `/api/push` with a browser token returns `available:true` and verify Cron monitoring before enabling users.
7. In a real browser, activate from a user click. Test on Android and on an installed iPhone/iPad web app. Insert a clearly labelled test fixture 24 hours + 2 minutes ahead and wait for one real scheduled push. Verify disabling, expiry (404/410), FR/DE, DST and no duplicates.

The schedule targets 24h before kickoff, with minute-level polling and up to 10 minutes catch-up. Device delivery may be delayed. An atomic delivery claim prevents duplicate sends on overlapping polls. Failed/ambiguous sends are not automatically retried to avoid duplicate alerts; inspect server logs and delivery status. Repeated cron failure requires operational attention. A changed kickoff gets a new reminder key. Subscriptions created after the reminder time do not receive a late notification. This first version follows one club per browser/device; changing the favorite requires explicitly activating the new club. Browser tokens and subscription endpoints stay server-side and are not publicly queryable.
