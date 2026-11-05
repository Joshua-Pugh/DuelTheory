# Public and private builds

First pass: November 5, 2026.

## Ownership

- `src/app`: the public AT-first web shell and its routes. `src/App.tsx` is now only its entry adapter.
- `src/games/ashen` and existing root AT components: the preserved rules and presentation. Broad arena/file migration is the next milestone, not part of this pass.
- `src/table`, `src/account`, `src/mobile`: existing public tracker/account/native systems.
- `src/private-dev/LegacyApp.tsx`: the former mixed-game web shell, retained for private GOAT development.
- `src/event`: the retained private event pilot; `CreatorArena`/`CreatorProjectEditor`: retained Studio implementation. These have private entry ownership but have not been mechanically moved while AT still shares their storage/tabletop dependencies.
- `tools/private-dev/maintenance`: old GOAT catalog backup and repair report. These never ship as static site assets.
- `services/private-dev`: protected static assets and same-origin private API proxy.

Public builds use `vite.config.ts` with a module-graph guard and an asset copy allowlist. `publicDir` copying is disabled so a private catalog cannot silently enter a public release. `build:pages` checks the resulting output. The GOAT SEO page has become the AT deck-builder page. Private builds have their own entry and output and must never be uploaded to GitHub Pages. Do not serve `dist-private` directly from an unprotected static host.

## Access

Cloudflare Access protects the private portal. The gateway validates signed RS256 assertions against the configured team issuer and application audience, verifies expiry and requires an explicitly invited email. The same verifier runs at the original backend endpoints: Event Hub requests require private access, and GOAT rooms require it for creation, info, joins, reads and actions. AT friend matches and ordinary Companion rooms do not require development enrollment. Device seat credentials remain separate from private identity.

The proxy forwards the validated Access assertion server-side using service bindings; browser code never receives a shared backend secret. The gateway executes before every static asset. Missing identity configuration fails closed. The original mixed-game match service remains one Worker in this pass, with game-aware authorization inside the Durable Object; separate game-specific backend deployments remain future work.

Settings: `PRIVATE_ACCESS_TEAM` is the exact `https://TEAM.cloudflareaccess.com` issuer, `PRIVATE_ACCESS_AUD` is the private application's audience, and `PRIVATE_ACCESS_EMAILS` is a server-only comma-separated allowlist stored as a Worker secret. Keep the same values on the gateway and both backends. Identity/session duration is enforced by Access. To revoke a tester, remove their email from the policy and backend allowlist and revoke their Access session. Never put assertion tokens or personal tester lists in a frontend environment variable or Git.

An invitation is the protected portal URL plus identity enrollment, not a transferable secret URL. For this first pass, Event Hub participants must also be enrolled private testers: its QR grants a table destination, not private-portal enrollment. Anonymous store-guest admission can be added later as a distinct, narrowly scoped capability. Existing event/GOAT browser saves and seat credentials are still retained on the original origin; they do not automatically migrate to a different origin. Public AT, artwork and Companion storage keys remain unchanged.

## Builds and tests

```text
npm run test:public          shared + AT + Companion/account/mobile
npm run test:ashen           AT regressions only
npm run test:companion       tracker/account/mobile regressions
npm run test:private:goat    retained GOAT suite
npm run test:private:events  retained event suite
npm run test:private:studio  reserved suite (no dedicated files yet)
npm run test:all             every owned suite once
npm run check:test-ownership every test has exactly one owner
npm run build:pages          public output + artifact checks
npm run build:mobile         existing original-game Android web bundle
npm run build:private        protected private output
```

`tests/ownership.json` is explicit. Add new meaningful tests there; the ownership check fails if a test is unassigned or assigned twice. Existing shared CreatorTabletop tests remain public/shared because AT uses that state layer. There is no quota of tests per component. Public Pages CI runs the public package. The separate manual private workflow runs private suites and their build without publishing them publicly. Shared-boundary changes warrant checking all consumers once.

`scripts/check-production-boundaries.mjs` checks denial of anonymous private requests plus public AT two-seat setup, opening hands, hidden information, reconnect reads, request idempotency and public Companion joining. It accepts `MATCH_TEST_API` and `TABLE_TEST_API`; use local services first. It creates disposable test sessions but never prints seat credentials. Once Access is configured, separately verify a real invited browser session and denied uninvited identity.

## Deliberate cleanup

The unused quiz UI `AshenWalkthrough.tsx` was removed after checking references; the lesson content and tests remain. The prior platform roadmap was preserved under `docs/history`. GOAT backup/report files were moved with their generating script updated. No engine, artwork, card identifiers, local save keys or unique design references were removed. The outer DT workspace's patch scripts and screenshots are not release source and were not swept into this repository.
