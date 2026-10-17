# Reusable TCG framework: first implementation

## Product direction

DuelTheory is being structured as a playtesting platform with reusable rules services and game-specific plugins. Ashen Throne and GOAT are reference games. The long-term creator flow is: define game → create cards and decks → author effects → test privately → publish a versioned game to the community. This change starts the effects framework; it does not ship community publishing, accounts, online matches, or a complete universal rules engine.

## Layers and boundaries

| Layer | Responsibility | Current implementation |
| --- | --- | --- |
| Portable kernel | Costs, selectors, effect operations, events, trigger matching, LIFO resolution helpers, seeded shuffle | `src/framework/` |
| Game plugin | Legal timing, zones, phase rules, stats, resource policies, victory, keyword/combat semantics | `src/games/ashen/` and existing GOAT engine |
| Content pack | Versioned, serializable card abilities and trigger definitions | Brute first-batch pack |
| Session service | Save, undo, replay/network authority, hidden information | Local tabletop/GOAT services; networking remains future work |
| Presentation | Card frames, playmats, animation and choice controls | Existing React components; kernel imports none of them |
| Creator/publishing | Editors, validation, versions, discovery and community permissions | Manual creator tools exist; rules authoring and publishing remain future work |

The kernel does not import a game catalog, React, browser storage, or any Ashen/GOAT types. Player identifiers, resource identifiers, zones, tags and card types are supplied by the adapter. Its tests use a custom space game with players alpha and gamma, Ship entities, hangar/orbit zones and solar/plasma resources. There is no two-player assumption in that layer.

The GOAT engine now consumes the same seeded-shuffle module without changing its algorithm or public exports. The existing GOAT chain, battle and card-effect logic has **not** been migrated; those game-specific rules remain working in place. Shared cost/effect migration should happen incrementally with equivalent fixtures, not a replacement of the working duel engine.

## Developer entry point

Import from `src/framework/index.ts`. Implement `EffectAdapter<YourState>` for entity access and primitive state changes, define a data-only `EffectProgram`, and call `executeProgram(state, adapter, program, context)`. The result is a new state plus typed events; the input is not mutated. Validate imported JSON with `parseEffectProgram` or `validateEffectProgram`. Functions, cycles, unsupported operations, prototype-sensitive keys, unbounded recursion and excessive steps are rejected.

Costs and target selections are validated before payment. Generic resource payment follows the adapter pool's insertion order, after specific resources are reserved. The Ashen adapter prioritizes Untuned for generic costs. Programs can draw, change resources, damage/destroy selected entities, create tokens, apply temporary/permanent stat changes, and branch on typed results. Games retain control over legal timing, replacement effects, visibility and how those primitive operations behave.

`matchingTriggers` matches subscriptions against event snapshots. The game plugin owns simultaneous-trigger ordering, turn limits, and timing. `resolveTop` provides a LIFO helper; it is not a complete priority/response or Clash implementation. The first Ashen sandbox resolves its supported triggers immediately in stable subscription order, with a loop budget and per-turn limits. A proper Clash/priority plugin is the next prerequisite for competitive correctness.

## First Ashen integration

Open **Ashen Throne → Battlefield → Brute effects: ON**. Select a supported card in your hand and choose **Deploy with effects**. Required single-card choices advance on click. Printed essence costs and additional sacrifice costs are paid atomically; cancellation or invalid targets do not spend resources or move cards. Units enter fatigued unless the implemented definition gives Charge. Fonts are limited to one deployment per turn and Fury Pit enters spent.

This is a first-batch effects sandbox, **not** a fully supported Brute deck. There are 23 card definitions: 20 have their listed noncombat effect/keyword definitions in the batch and 3 are explicitly partial. Keyword labels alone do not implement their combat semantics. Noble cards and remaining Brute cards still use manual controls. Manual moves bypass effect automation, as clearly labeled in the UI.

- Token entry effects: Bloodpit Initiate, Bloodfang Raider (entry only), Ashclaw Skyreaver (entry only), Bloodforge Hollow.
- Activated abilities: Feral Axebreaker creates a token after exhaust + Fury payment; Ring of the Ley exhausts for 2 Untuned.
- Targeted entry damage: Rubble Flinger and Ashfang Ravine.
- Effect cards: Ragekindle, Ashen Strike, Frenzied Stampede, Bloodfire Collapse, Pit-Digger's Howl.
- Fonts: Fury Font; Fury Pit's spent entry and temporary attack bonus; Bloodforge Hollow and Ashfang Ravine entry effects.
- Event subscriptions: Pit-Sired Warmonger and Warhowl Instigator observe non-token Brute entries, including their own entry; Broken Fist Keep observes destroyed/sacrificed Brute Units, with a three-per-turn limit.
- Keyword metadata: Frenzied Grunt, Bloodpit Initiate, Howling Skyterror, Ashen Warhawk, Stonehide Juggernaut, Ironhide Catapult. Combat enforcement remains future work.

Temporary modifiers and damage clear on the next turn transition. In effects mode the incoming player's Units/support cards are readied; fonts and basins use the existing turn controls. Trigger limits reset. The inspector and field chips display modified stats and marked damage. Tokens use the normal card renderer and disappear when destroyed. Existing manual saves migrate by initializing optional rules metadata lazily.

The rules pack can be downloaded with **Export Brute rules**. It is an authoring reference, not a complete portable game package. Existing card/deck assets and the adapter are separate dependencies.

Creator Studio also accepts zero-slot zones as unlimited, matching the shared tabletop service. Existing finite-zone projects retain their capacities.

## Next stages

1. Implement an Ashen phase/Clash plugin: responses, optional choices, simultaneous triggers, last-known information, replacements and state-based destruction.
2. Implement continuous auras and the combat pipeline before completing attack-related Brute effects. Finish the Brute coverage manifest and regression scenarios before certifying the deck.
3. Complete Brute draw/discard/search, Outfit, sacrifice/damage combinations, random effects and special summoning; then move to Noble.
4. Add resource/stat/trigger authoring to Creator Studio and package schemas for complete game definitions, not just individual effects.
5. Migrate equivalent GOAT primitives through an adapter with replay fixtures; retain GOAT-specific legality and timing.
6. Add versioned publishing, private/shared playtest rooms, authoritative sessions, visibility projections, moderation and migration/version locks.

Support for unusual mechanics comes from extending the adapter/operation registry and game plugins. This foundation does not claim that every possible TCG can already be represented without extending the schema. Published content should remain data-only; any future developer extension code must run through a separately controlled deployment path.
