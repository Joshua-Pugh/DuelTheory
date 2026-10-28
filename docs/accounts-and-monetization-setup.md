# Accounts and initial ad-removal rollout

Status: implementation scaffold, not a live authentication/ad/billing deployment. The owner reports Supabase setup is done; its public project configuration has been supplied and Auth settings accepted it. The tracker_profiles table was not found during a read-only API check. Mail delivery, migration/function deployment and AdMob setup are still unverified. No ad SDK or Play Billing SDK has been installed and no purchase UI or live ad requests are enabled.

## Decisions

- First monetization candidate: Android banner on Home/Settings only. Never on table screens, join screens, score controls, or during a game. No forced interstitials or rewarded requirements for basic tracking. Reserve ad space before loading rather than shifting controls. An unavailable/denied ad must never block the tool.
- One-time, non-consumable Remove Ads product (`dueltheory_remove_ads`), with purchase restoration. This is ad removal, not all future premium features. Price remains a test decision; it is not configured in Play Console.
- A verified ad-free entitlement belongs to the account and must be checked server-side. Ads stay hidden while entitlement is unknown, checking consent, offline or backgrounded. Log out must clear entitlement caches. Do not share room credentials with an ad service.
- Android purchases use the applicable Play Billing flow. Verify purchase/package/product/state on the server; acknowledge successful delivery; handle restore, pending purchases, cancellations, refunds and revocations. Never implement this as a local premium boolean. Confirm current requirements before integrating.
- Real usage determines revenue. No forecast is assumed. Menu-only ads prioritize table usability over impression volume.

## Owner setup: Supabase

1. Create a free Supabase project for DuelTheory. Store its database password privately; do not send it or put it in the app.
2. The frontend needs only the Project URL and **publishable key** (`sb_publishable_...`). Never use a service-role/secret key in `VITE_` values.
3. Apply `supabase/migrations/202610280001_tracker_profiles.sql`. It creates private profiles with owner-scoped RLS, no anonymous access, no direct client insert/update, max 40 cloud profiles per account, bounded documents and atomic revision checks.
4. Enable email authentication. Change the Magic Link email template to include `{{ .Token }}` so the UI can verify an email code. Set the site URL to `https://dueltheory.com/`. Configure expiry/rate limits appropriately. Before public signup, configure supported CAPTCHA/bot protection and perform sign-in abuse testing.
5. Configure production SMTP and verify the sender domain. Supabase's built-in mail is restricted to project-team addresses and is not a production email service. Send codes through a transactional mail service; do not add all testers as project administrators to work around this restriction.
6. Deploy `supabase/functions/delete-account` with its supplied config. It verifies the bearer token with Auth.getUser and deletes only that user, with profile cascade deletion. Its server-side service-role environment value never enters the web/mobile build. No user id is accepted from the request.
7. Set public values locally in `.env.local` and as GitHub repository **variables** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then rebuild both releases. Keep `VITE_ACCOUNTS_ENABLED=false` until the hosted checks below pass; set it to true locally and in repository variables only when activation is verified. Mobile CSP adds only the validated project origin, not a wildcard.
8. Update the privacy notice/Data safety for account email, cloud profiles, retention, SMTP provider and deletion BEFORE making accounts public. Current notice correctly describes the still-unconfigured build.

## Required hosted security checks (not yet run)

- Run migration in a disposable development project first. With two ordinary users, verify A cannot read/delete/update B's profile even by directly calling the REST API or RPC with B's UUID. An anonymous client must see no private data and cannot call the save function.
- Verify quota, oversized/malformed data, concurrent stale saves and same-UUID collisions. The client validates full game/player schemas; server provides auth, ownership, bounds and revision checks. Treat stored/imported documents as untrusted data.
- Verify sign-in, refresh, sign-out, device-switch behavior and deletion end-to-end on website and Android. Clearing local state is not server account deletion.
- Cloud downloads are explicit imports; a same-name local profile requires confirmation. No active-room values or host rules are changed when logging in. Saved player appearance currently stores name/accent only; backgrounds and shared seat identity remain subsequent work. No automatic room takeover or cross-device live editing is implemented in this pass.
- Verify account deletion removes auth user/profiles, fails with an invalid bearer, and cannot target another account. Test failure recovery; do not offer this publicly until function deployment works.
- Browser visual QA remains blocked by local browser-use settings; perform physical-device and accessibility checks.

## Owner setup: AdMob and Play

1. Create AdMob separately from Play Console. Add an **Android, unpublished** app named DuelTheory; Android package is `com.dueltheory`.
2. Collect AdMob app ID (`ca-app-pub-...~...`), banner unit ID (`ca-app-pub-.../...`) and publisher ID. These identifiers are not passwords. Do not share Google login or payment details.
3. We still need to integrate a Capacitor-compatible native ads adapter, UMP privacy flow, test ad IDs and Privacy options action. Current app uses Capacitor 8.4.3; do not blindly install a plugin release requiring 8.5+ without a coordinated upgrade and native tests.
4. Serve the exact app-ads.txt line from your AdMob account at `https://dueltheory.com/app-ads.txt`; do not invent a publisher ID. Use dueltheory.com as the developer website. Link the actual store listing when available. AdMob has a separate app-readiness review and full serving is not assumed during closed testing.
5. Create the Remove Ads one-time product in Play Console after app setup, link the payments profile, configure license testers, then implement/verify billing with test purchases. No live ad clicking during development/testing.
6. Update privacy notice/Data safety for the actual ad SDK and consent behavior before shipping it. Test paid restoration/refund behavior and account switching. Publish neither purchase nor ad controls until fully connected.

## What is implemented now

Shared web/mobile AccountPanel (under Preferences / Settings & support), official Supabase JS client loaded on demand, email-code flow, local sign-out, explicit cloud copies of game profiles and player name/accent, cloud refresh/import/delete, account-deletion call, public-key validation, SQL/deletion-function deployment sources, CSP preparation and fail-closed ad-placement policy.

No production Supabase calls occur without valid public configuration AND the explicit activation flag. Guest tables remain usable. No advertisements or payments are active. SQL/RLS and the deletion function require hosted integration tests; passing UI/unit tests does not establish that the deployment is secured.

References checked October 28, 2026:
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/auth-smtp
- https://support.google.com/admob/answer/9989980
- https://developers.google.com/admob/android/privacy
- https://developer.android.com/google/play/billing/lifecycle/one-time
