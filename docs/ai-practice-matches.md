# AI practice matches

Open Play → AI Practice. Choose Single Duel or Best of Three, choose your deck (Current Deck Builder deck uses your saved build), and optionally name the setup. Game one uses a coin flip. Best of Three ends at two game wins; drawn games award no win.

After each unfinished match game, exchange Main and Side Deck cards one for one. The registered card pool and Main/Side/Extra sizes cannot change. Sided-in cards must support guided effects. No swaps are required. The AI never sideboards and retains its original Chaos Turbo list. The player who lost chooses who starts next; the AI chooses itself after losing. A drawn game retains the previous starter. Ready for next game starts a fresh shuffled board and new opening hands without another coin flip.

Concede game awards one game win to the AI. Exit asks whether to concede the entire match. Cancel keeps the game running. Match concessions count as match losses but do not invent unplayed game wins.

Completed single duels and best-of-three matches are saved locally, capped at the newest 500. The practice record groups wins/losses/draws by setup label, starting card composition, format, AI pilot version and opponent composition. Each entry retains the starting deck and each actual game list, including siding, starter, seed, turn count and result. Export match records downloads those snapshots as JSON. These records are private to this browser/device; they are not account-synced, and site-data clearing removes them. Active matches are not restored after refresh. Failed browser storage produces a warning and keeps the result in page-session memory for export.

Validation includes a three-game UI flow, player-only sideboarding, immutable AI list, loser starter choices, saved record reload/deduplication, single-duel/forfeit/draw handling, invalid pool rejection and private-room series regression checks.
