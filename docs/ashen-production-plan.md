# Ashen Throne production direction: audit and build plan

Recorded November 5, 2026. This is an audit and proposed implementation plan, not a claim that access isolation, file migration or the new arena has shipped. The supplied development brief explicitly requests audit and plan before runtime implementation.

## Product decision

DuelTheory becomes the digital home of Ashen Throne, by Ashen Forge Games. Ashen Throne is the primary public experience; Table Companion remains the secondary free tool. GOAT, Event Hub and Creator Studio stay maintained in source as private development projects. Their expansion, a marketplace, subscriptions and new game projects are deferred. The six-table Event Hub pilot is sufficient for now; its scaling document is a future design, not a build priority.

Public navigation: Home, Play Ashen Throne, Deck Builder, Card Library, Table Companion, About. Account/settings remains a utility entry. Deck Builder and Card Library must open Ashen Throne directly. Public AT friend-match invitations remain distinct from permission to enter the private development tools.

## Findings from the current repository

| Area | Observed implementation | Consequence |
| --- | --- | --- |
| Web composition | `src/App.tsx` imports both games, holds GOAT deck/catalog UI and fetches `/catalog.json` on mount | Public AT navigation alone will still load GOAT code and data. Extract the GOAT application from the public entry graph. |
| Routing | `src/platformRoutes.ts` advertises GOAT, AI practice and Event Hub. `publicPage` redirects unfinished studio/lab destinations but does not enforce authorization | A hidden menu, a hash route or a feature flag is not private access. |
| Multiplayer | `services/matches/worker.ts` imports the GOAT catalog; `src/matches/model.ts` imports both AT and GOAT rules/services | Split game-specific command validation and views before claiming an AT-only service. Preserve fixed seats, hidden hands, revisions and duplicate-request protection. |
| Event backend | `services/commander/worker.ts` exposes event create/read/action/history alongside public shared-table endpoints | Protect event endpoints without requiring invitations for ordinary Table Companion guests. Existing organizer/seat credentials are not private-pilot enrollment. |
| AT rules | `src/games/ashen/duel.ts`, adapter, effect packs and Brute/Noble effects already exist and use `src/framework` | Refactor the existing engine behind a stable interface; do not rewrite it or create separate tutorial/AI rules. |
| State dependency | `src/ashenBattlefieldState.ts` uses `src/services/CreatorTabletop.ts` | Despite the name, this tabletop state layer is an AT dependency. It cannot simply be moved into a private studio folder. |
| AT presentation | `AshenBattlefield.tsx` combines local/remote state, persistence, selections, gameplay controls and rendering; dense JSX and several overlapping CSS files carry the layout | Extract explicit controllers and arena components before adding elaborate effects. A short line count does not mean a small responsibility. |
| Viewport | `ashenDuelRoom.css` already uses a `100dvh` shell, while `ashenPhone.css` allows workspace scrolling and contains compression/overflow rules | Fullscreen CSS already exists. The task is usable sizing and layout, not adding another `overflow:hidden` patch that hides decisions or shrinks cards. |
| Practice | `AshenPractice.tsx` runs four prepared scenarios through `AshenBattlefield`; `ashenPracticeScenarios.ts` uses the real duel and effect paths | Preserve these as regression fixtures. They are not yet the proposed five-part campaign with an opponent controller. |
| Existing motion | `ashenVisualEvents.ts`, `AshenCardAnimations.tsx`, `duelUi/CardMotionLayer.tsx` and audio utilities exist | Reuse the rendering/audio infrastructure after checking game assumptions. GOAT timings and rules must remain in its adapter. |
| Cards | `ashenCatalog.json`, `ashenPrintData.json`, artwork mapping, layered card frames and `public/ashen/layers` are active dependencies | Preserve IDs, image paths, print text, layer geometry and existing local artwork overrides. `AshenCardFrame` imports artwork storage from `cardStudio`; separate storage from editor UI before moving the editor. |
| Android | `src/mobile/MobileApp.tsx` already lazy-loads original-game screens. `vite.mobile.config.ts` rejects GOAT engine imports and copies selected assets | Extend this boundary instead of creating a second engine. Do not expose private development screens in the consumer APK. |
| Release tests | `npm test` runs the whole repository; the Pages workflow invokes it for every release | Create explicit public and private suites. Existing rules regressions remain valuable; they need ownership and scope, not deletion to meet a test-count target. |
| Public pages | `scripts/build-public-pages.mjs` generates a public GOAT deck-builder page and sitemap entry; Vite copies public assets | Update SEO pages, sitemap and asset-copy manifests as part of public/private separation, not only React navigation. |
| Documentation | The old platform roadmap prioritizes community/creator publishing, and README includes historical claims about public Studio navigation | Establish one current roadmap; retain dated records as history. |

The inventory contains 160 tracked test files. A filename-only classification identifies 24 AT-named files, 30 Companion/account/mobile files, 53 clearly private-domain files, three framework files and 50 requiring manual ownership review. These are audit buckets, not an executable test selection or proof of coverage. Match tests and root-level shared tests require import/behavior review.

## Private access design

Recommended first release: a separate private web build on an authenticated origin, such as a private-development subdomain. Protect its HTML, assets and APIs through a server-enforced gateway. Cloudflare Access is an existing option for an identity-aware gateway; validate its configuration and account limits before setup. Do not migrate the public site solely to change its navigation.

An invitation link starts enrollment. It should grant only selected tools to the intended verified identity, expire, and support revocation. For the initial small pilot, an administrator-managed allowlist plus email verification can implement enrollment without building a new account system. If self-service invitations become necessary, redeem a high-entropy, single-use invite server-side into scoped account grants; store only its hash and remove the raw token from the browser URL after redemption. A forwarded URL alone should not grant ongoing organizer or developer permissions. Never embed a shared secret in `VITE_*` variables or a client bundle.

The private application session and a game's seat token have separate purposes. Private GOAT match creation, room lookup, joining, reads and actions all require pilot access in addition to room authorization. Event organizer actions require pilot access. For an invited organizer's store demo, a table QR may grant a narrowly scoped guest seat without granting the hub or other tools. Public Table Companion stays account-optional. Public AT matches keep normal friend-invite behavior. These audiences must be explicit, not one global gate on the combined backend.

Protect direct service URLs and alternate deployment hostnames as well as the friendly domain. Validate signed access assertions at the trusted backend or use same-origin authenticated routing; CORS and a client-side login screen are insufficient. Anonymous private HTML, JavaScript chunks, data and API requests must fail closed. `noindex` is additional indexing hygiene, not authorization. Previously downloaded public files cannot be made secret retroactively; audit older deployments and whether repository visibility meets the intended confidentiality level.

Acceptance: an invited tester can enter their permitted tool, an uninvited or revoked identity cannot, an expired invite fails, anonymous old GOAT/event endpoints are denied, ordinary Companion guests still join, and AT friend matches still function. No real access is changed during this planning pass.

## Target organization

Keep one repository and shared TypeScript engine initially. Use separate entry/build manifests; do not introduce a large workspace/package framework just to rename folders.

```text
src/
  app/                         public composition, routes, navigation
  games/ashen/
    engine/                    state, actions, effects, combat, Clash
    cards/                     data, validation, deck model, artwork mapping
    arena/                     battlefield, zones, hand, inspector, action menu
    presentation/              visual events, animations, audio
    ai/                        legal-action policy and opponent controller
    tutorial/                  scenarios, allowed lessons and progress
  companion/                   tracker screens and table domain
  private-dev/
    app/                       protected entry, navigation and access state
    goat/                      catalog, rules, AI, deck UI and match adapter
    events/                    organizer hub and demo-specific screens
    studio/                    editor UI and creator project tools
  shared/                      verified game-neutral framework, UI and platform
  account/                     existing sign-in and saved preferences
services/
  matches/                     public AT transport plus explicit game adapter boundary
  commander/                   public Companion service; private event authorization boundary
  private-access/              only if the selected gateway needs application invite redemption
tests/                         suite configuration, manifests and integration scenarios
docs/
  platform-roadmap.md          current priorities and acceptance gates
  ashen-production-plan.md     this audit and boundary plan
  history/                    superseded roadmaps and completed development records
```

This is a destination, not a bulk-move instruction. First extract interfaces at existing locations; then move one owned feature at a time and repair imports atomically. Keep asset URLs and browser storage keys stable, with migrations where required. Physical npm workspaces can follow if independent publishing actually needs them.

Likely first files: `App.tsx`, `platformRoutes.ts`, `PlatformNavigation.tsx`, `PlatformHome.tsx`, `PlatformSections.tsx`, `PrivateMatchRoom.tsx`, `matches/model.ts`, both service workers, `vite.config.ts`, `vite.mobile.config.ts`, `package.json`, Pages workflow, public-page scripts and README. Arena extraction then targets `AshenBattlefield.tsx`, `AshenDuelArena.tsx`, `AshenOpeningHands.tsx`, `AshenPhaseControls.tsx`, `AshenEffectDecision.tsx`, `ashenBattlefieldState.ts`, `games/ashen/*`, `ashenPhone.css`, `ashenDuelRoom.css` and `ashenBattlefield.css`.

## Rules authority and engine boundary

The catalog declares schema version 2 and a source of user-supplied prototype DOCX decks. That is not a pinned rules version. Before changing gameplay, identify the current approved rulebook/deck documents, assign a rules/card revision, and record hashes or versions. Compare the catalog, print-text overrides, `AshenThrone.tsx` rule copy and `games/ashen/reference.ts`. Do not pick one silently when they disagree.

Available source candidates were located in `C:/Users/joshu/OneDrive/Desktop/Ashen Throne/`: `Ashen Throne — Command Seige Prototype Rules.docx`, the Brute and Noble Command Siege deck documents, and `Quick Start Guide.docx`. Copies also exist under the Print and Play Kit; a separate Battle Siege v1.8 rulebook exists too. Compare the relevant copies before pinning Command Siege authority. Their presence is verified; their current agreement with the implementation is not yet verified.

Existing opening-hand code implements six cards, one free redraw, shrinking subsequent redraws and a minimum hand of one. Existing tests cover this; it is not a missing system to rebuild. Brute/Noble effects, triggers and priority also have regression coverage. We have not completed a rulebook-to-engine correctness audit in this pass. Ambiguous damage ordering, target legality at resolution, simultaneous defeat, fatigue exceptions and the full card-effect inventory must be checked against the approved sources before claiming complete rules support.

Introduce a game-facing interface for state, legal action descriptors, validated action application, pending decisions, player-redacted views and ordered presentation events. UI, AI and tutorials dispatch through the same action path. Internal mutation helpers may remain internal; controllers must not bypass validation. Seeded randomness and replayable action logs support reproducible failures. Network commands retain revision checks and authenticated fixed seats.

## Arena design

Desktop/tablet: fixed viewport with opponent summary and hand at the top, both Frontlines and Command Stations in the center, current phase and one primary progression action, and own hand anchored at the bottom. Open a readable inspector/action drawer when a card is selected; empty zones need less space than occupied zones. Fonts, resources, counters and combat assignments must remain legible. The Clash gets a distinct pending-action stack, clear priority owner and legal target selection. Do not show hidden opponent card identities.

Phone: dedicated landscape composition, compact opponent row, battlefield in the center and hand along the bottom. Use tap-to-inspect with large legal-action targets; allow horizontal hand/occupied-zone browsing where necessary. Portrait offers a readable orientation prompt or limited inspection instead of compressing the whole arena. Menus and long reference text may scroll; ordinary play must not require page scrolling. Busy boards must not achieve viewport fit by shrinking cards to unreadable thumbnails.

Opening hands: compact six-card strip, selected-card inspection, explicit Keep or Redraw with the resulting hand size, and correct seat ownership. No scrolling modal of six full-size cards. Tutorial instructions should be collapsible and concise, never displace the battlefield offscreen.

The visual layer consumes ordered events rather than guessing every effect from DOM changes. Logical state advances independently; animations are short, skippable and reduced-motion compatible. Start with Font burn, Unit deployment, damage and destruction, then Clash sequencing. Reuse existing motion/audio primitives after removing game-specific assumptions.

## Test suites and production checks

Use test projects/configurations and scripts, not a test-per-component quota:

- `test:public`: shared engine/contracts, AT rules and critical journeys, public navigation, invite/permission boundaries, Companion/account behavior and AT transport.
- `test:ashen`: AT engine, cards and targeted gameplay regressions for day-to-day game work.
- `test:companion`: tracker, account templates and ordinary table service behavior.
- `test:private:goat`, `test:private:events`, `test:private:studio`: retain existing tests with their owners; private releases run these, unrelated AT edits do not.
- `test:all`: explicit full regression job for shared-boundary changes or scheduled/release validation.

These commands are proposed, not installed in this audit. Classify every existing file; no tests should disappear through a filename glob. Some match/service files currently import GOAT transitively, so selecting fewer tests is insufficient until the code boundary is separated. Shared framework changes trigger all consuming suites. A short public smoke set must cover a complete match, opening redraws, payment, attack/block, Clash response, defeat, reconnect and hidden-information isolation. Add tests for meaningful rules, security and regression risks; avoid tests that only mirror JSX or implementation details.

Public CI must type-check its entry graph, run its owned suite, build web and Android bundles, and verify that GOAT/event/studio chunks and data are absent from public artifacts. Private CI has independent builds and contract tests against the gateway. Asset-copy allowlists matter because Vite's default public-directory copy can leak private data even when imports are separated. Runtime syntax/type checks alone are not acceptance for a playable arena.

## Cleanup policy and candidates

The outer DT workspace contains many temporary patch scripts, screenshots, logs and previous previews. It is not the application source tree. The canonical checkout is `DuelTheory-github`. Do not copy the workspace into the release or indiscriminately delete user attachments and design references.

Within the checkout:

- `public/catalog.pre-goat-repair.json` is a generated catalog backup currently in a publicly copied directory; `scripts/sync-goat-missing.mjs` creates it. Move the backup/report workflow outside public output when isolating GOAT.
- `goat-missing-repair-report.json` belongs with private maintenance/audit tooling rather than the application root.
- `AshenWalkthrough.tsx` has no importer found in the audited source. Its lesson data still has a regression-test consumer, while `AshenPractice.tsx` is the live practice route. Review the lesson content before consolidating or removing the unused quiz UI.
- `cardStudio` artwork persistence and `CreatorTabletop` are active AT dependencies despite their names. Extract/rehome their shared parts before any private-module move.
- Superseded roadmap/README claims should be marked historical. Preserve unique decisions and test records rather than erasing evidence.
- Generated builds, logs, keystores, local environment files and dependencies stay out of version control; existing ignore rules already cover these categories.

Before each removal, check tracked imports, dynamic imports, worker entrypoints, public URL references, scripts, build manifests, Android copies and storage migrations. Record what replaces it. Delete confirmed redundant source only after the owning feature suite/build passes; use Git history for recovery rather than accumulating `.old` or `.bak` files beside active code.

## Milestones and acceptance

| Milestone | Playable or reviewable result | Required acceptance |
| --- | --- | --- |
| 0. Audit and plan | This document, current roadmap, cleanup inventory | Scope/architecture review; no runtime changes or rules invention |
| 1. Production boundaries | AT-first public shell; isolated private build and secured entry/API; owned test suites | Anonymous bypass tests, scoped invitation/revocation checks, public output excludes private artifacts, Companion and AT invitations still work; preserve saves/assets |
| 2. Playable battlefield | Extracted AT arena and compact opening/Clash flows | Complete a Brute-vs-Noble match on desktop and landscape phone without page scrolling; readable inspection and legal actions; test busy boards and both player perspectives |
| 3. Rules audit and presentation | Versioned rules/cards and validated critical effects; clear Font/summon/damage events | Resolve documented rules gaps before dependent effects; reproducible action traces; reduced motion; no animation-dependent correctness |
| 4. One solo opponent | Brute policy controlling a real engine seat | Uses legal information/actions, handles choices/blocks/Clash, completes seeded matches; no opponent hidden-hand knowledge or invented moves |
| 5. First Siege | Five playable teaching encounters using actual cards | Opening choice, Essence, defense, Clash and victory goals; real opponent actions and engine completion checks; progress survives reload as designed |
| 6. Mobile and network polish | Shared web/Android game with resilient private AT matches | Landscape touch review on real devices, reconnects, stale command handling, seat privacy, background/resume, versioned save compatibility |
| 7. Focused playtest | A small public/controlled release with feedback capture | Track completed matches, tutorial completion and reproducible failures; do not equate compiling, traffic or feature count with a finished game |

Security isolation and rules baselines come before major arena behavior changes. The first gameplay milestone is the readable no-scroll arena; AI and elaborate visual effects wait until that is usable. No new runtime systems, source moves or source deletions are performed by this audit.

Reference: [Cloudflare Access web applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/). Deployment choice and invitation administration are implementation decisions to verify during milestone 1, not configured infrastructure today.
