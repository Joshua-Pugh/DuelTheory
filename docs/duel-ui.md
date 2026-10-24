# Shared duel controls

`src/duelUi` contains presentation components without game rules or card IDs:

- `PhaseSelector` renders a game's phases and legal transitions. GOAT and AT supply their own labels, current step, disabled states, and commands.
- `CardActionMenu` displays supplied actions in a bounded native modal with an accessible close control. AT uses it in local and private duels. The reader remains separate from actions.
- `ResourcePool` renders positive resources with an icon and count. Three types fit in its viewport; additional types scroll without dropping data.

AT's `AshenPhaseControls` maps its rules to the common selector. Entering SP replaces the main strip with attacker, blocker, damage, and return-to-main controls. Forward M2 and EP shortcuts use `advanceAshenTo` in the engine and private-room commands. Shortcuts cannot bypass required Reckless attacks, unresolved combat, Clash responses, or pending choices. End cleanup and subsequent Start effects still resolve normally.

`inspectAshenAction` shares preparation and payment validation with `submitAshenAction`. Inspection does not mutate the table. Submission remains authoritative, including on the private-room Worker; menu availability never replaces server validation.

Other games can provide their own action descriptors, resources, and phase mappings without importing GOAT or AT card data. The existing GOAT card menu remains independent; it has not been migrated to the shared action menu in this pass.

`CardMotionLayer` and `motionBetween` provide shared, pointer-free card travel. GOAT draws and AT animations use the same layer. `ashenVisualEvents` adapts AT state changes into draw, deployment, Ossuary, return, and shuffle events; game rules never depend on animation completion. Per-player shuffle counters identify real shuffles without treating Plan/Refine ordering as a shuffle. AT retains hand origins while a card waits in the Clash, so placement animates from its original location. Opposing hidden hands always use card backs. Reduced-motion preferences suppress animations.

Turn order follows the supplied Command Siege v0.3.9 rules: Start (start effects, ready, draw), Main I, Skirmish, Main II, End. The opening first-player draw remains skipped. The existing prototype's missing mulligan workflow is still explicitly identified in its in-game reference; this update concerns turn phases and presentation.

AT displays a turn number per complete two-player cycle through `ashenTurnNumber`. The internal individual-turn serial remains unchanged for once-per-turn limits, duration cleanup, and previous-turn effects. All pending Plan, mode, and card choices belong to `flow.context.player`; local hotseat must switch to that player and private rooms show a waiting notice to the other seat.

`ashenActionCost` calculates Command discounts for payment, hand badges, the reader and action-menu cost summaries. Each completed Plan or initiated Refine contributes one generic discount for that individual player turn, capped at the printed generic cost; colored requirements remain unchanged.

During Refine, newly emitted draw events and Refine bookkeeping are processed before the bottom-deck selection. Trusted continuations wait in `resumeAfterTriggers` until the intervening Clash entries finish. `emittedEvents` prevents duplicate draws, triggers and Command marks when the continuation resumes. Private views omit this server-only queue. Each actual draw can trigger Rune of Clarity; drawing two cards yields two independent targetable damage effects. Effect notices are presentation-only, never gate engine execution, and respect current selection ownership.


Card titles use `useFittedCardTitle` to measure the actual available width beside costs after resize and font loading, keeping complete names on one line. AT stat calculations return a bonus breakdown alongside their totals. Modifiers record the effect source via the optional game-neutral `EffectAdapter.modify` source argument; older saves retain their modifiers with an explicit unknown-source label. The reader shows printed stats, counters, continuous bonuses and temporary modifier sources. The Broken Fist Keep's attack bonus applies only to Brutes.

Artwork zoom and crop persist under per-card keys through `loadCardLook` / `saveCardLook`. The catalog, builder, card reader and battlefield all load the same card's settings. Reset affects only the selected card. Legacy global crop settings remain stored but are not copied onto unrelated cards, and artwork blobs remain unchanged. Upload/clear completion is guarded against a changed selection.
