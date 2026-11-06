# DuelTheory roadmap

Updated November 6, 2026. Current direction: **DuelTheory is the digital home of Ashen Throne**, developed by Ashen Forge Games. Table Companion remains the secondary free public tool.

## Current status

The **first production-boundary pass is implemented**: an AT-first public shell, separate private build and asset allowlist, signed Cloudflare Access identity checks at the gateway and original private APIs, and explicit test-suite ownership. See [implementation details](production-boundaries.md). The [first arena presentation pass](ashen-arena-update.md) adds the game start screen, visual starter selection, shared viewport layout, readable touch card actions and Clash queue. The engine is preserved. The [approved starter balance pass](design/balance-2026-11-06/applied-starters.md) now supplies two revised 60-card starters, current practice lessons, interaction and recovery effects, and a saved booster reserve. Start a new duel to test these lists. Rules authority, populated combat playtesting and real-device refinement remain ahead. Android store publication is a separate release step.

Read the [production audit and implementation plan](ashen-production-plan.md) for findings, proposed ownership, private invitations, tests, cleanup candidates and acceptance criteria. This is the current source of direction; older platform and duel roadmaps are historical records.

## Public product

Home | Play Ashen Throne | Deck Builder | Card Library | Table Companion | About. Deck Builder and Card Library refer to Ashen Throne. Account/settings is a utility entry. Public AT friend matches remain available; private development access is a separate permission.

GOAT, Event Hub and Creator Studio remain in source for invitation-only development. No new event expansion, creator marketplace, subscriptions or additional games until the core AT match is reliable and enjoyable. Existing layered card frames, artwork URLs, IDs and saved data must survive the refactor.

## Build order

1. **Production boundaries.** Separate public/private entry graphs, assets and API permissions. Implement revocable scoped access, simplify navigation, classify all tests into owned suites, and remove only verified redundant files. The default public release does not run every private simulator test or ship private modules.
2. **Playable battlefield.** Desktop and landscape-phone arena with both Frontlines and Stations visible, a usable hand and inspector, contextual legal actions, compact phases, readable opening hands and a distinct Clash interface. Normal match play needs no page scrolling.
3. **Rules baseline and presentation.** Pin approved rules/card versions, audit critical interactions, then add short, skippable Essence, summon, damage, destruction and Clash effects. Preserve reduced motion and reproducible action logs.
4. **One reliable Brute opponent.** Legal actions, resources, attacks, blocking and Clash using the same rules as human players, without hidden opponent information.
5. **The First Siege.** Five real engine-driven encounters teaching opening hands, Essence, defense, Clash and victory; followed by unguided solo practice.
6. **Mobile and multiplayer polish.** Shared web/Android engine, touch usability, reconnects, seat privacy, stale action rejection and compatible saves.
7. **Focused playtest.** Measure tutorial completion, complete matches, returning players and reproducible rules failures. Resolve the biggest observed problems before expanding scope.

## Verification policy

Keep valuable existing regression tests. Use targeted public AT/shared/Companion checks for routine public releases and separate GOAT/Event Hub/Studio suites for private releases. Shared-boundary changes trigger their consuming suites. No test-count quota and no test per trivial visual change. Critical gameplay, privacy and access checks remain release gates.

## History

- [Previous platform roadmap, through November 4](history/platform-roadmap-through-2026-11-04.md)
- [Historical GOAT duel work log](duel-roadmap.md)
- [Deferred Event Hub scaling design](event-hub-scaling.md)
