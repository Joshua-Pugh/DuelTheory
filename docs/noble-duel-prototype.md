# Noble deck and AT Duel Arena

The Duel Arena now has GOAT and Ashen Throne entries. AT offers independent Brute/Noble starter selection for both seats, including mirror matches. A fresh seed shuffles both decks and drives the existing opening coin dialog. The displayed winner starts with six cards; the first draw is skipped. Later turns perform Start effects, ready cards, draw, then enter Strategy. This is a local two-seat prototype, not an AI opponent or network match.

All 43 Noble catalog cards have effect definitions. These combine with the 48 Brute definitions in `games/ashen/effectPacks.ts`; the field exports the combined plain-data pack. The existing Brute export remains available to code consumers.

## Shared framework

- Plan pauses with the viewed top cards and preserves their order; the player assigns top/bottom destinations and ordering. Unviewed cards retain their order.
- Refine draws once, preserves drawn-card events, then asks for hand cards to bottom. Resuming a choice does not repay costs or repeat prior steps.
- Portable mode choices, ranged selections, stat selectors, conditional availability, Fortify, Nullify, actor/target event filters, and per-turn ability metadata are reusable primitives. Game-specific flags, counter meanings, card movement, timing and auras stay in the Ashen adapter/session.
- Clash entries have stable identities for targeting. Nullifying an Action sends its card to the Ossuary; nullifying an ability/trigger only removes that entry. Paid costs remain spent.
- Aegis restricts enemy targeting; global effects still affect protected Units.

## Noble interactions

Plan/Refine/Fortify bookkeeping supports Command discounts, Bastion's end-turn bonus, Cavalier's first-Refine condition and Dominion counters/Aegis. Seraphine remembers the player's previous turn and can deploy an eligible Noble from hand for free, with its entry effect. Junior Tactician queues optional Fortify on the next Plan. Oathfire offers a decline option and offers payment only with available Oath. Lance attaches, grants Attack and grants Siege on attack. Noble Fonts produce their printed essence.

Garrett's entry Fortifies all friendly Nobles, including himself. His damage trigger requires positive damage actually dealt by a controlled Noble to a Command Station. Zero damage does not trigger it. His own Station damage retriggers his effect under the wording explicitly retained by the creator. Each target choice remains interactive, and victory stops further resolution once Station HP reaches zero.

## Validation and boundaries

288 tests across 49 files pass, including schema coverage for every Noble card, all four deck pairings, every Noble entry and activated program, Plan/Refine order, Command/Aegis, Nullify costs, Seraphine, Bastion and Garrett. Browser verification covered Noble mirror setup, coin result, Font/deployment, opponent turn draw, Spearman's start-turn Plan, Bastion's mode and the resulting Fortify.

The prototype still allows seat switching and browser-local saves. It does not provide competitive hidden-information enforcement, arbitrary-player Ashen matches, or a creator-facing rule editor. Mandate's divided Station damage is applied to the single enemy Station in this two-seat mode. Manual tabletop moves bypass assisted cleanup. A successful GitHub push does not deploy Pages; the repository's deployment workflow is manually dispatched.
