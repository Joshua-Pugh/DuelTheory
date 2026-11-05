# DuelTheory platform roadmap

Recorded October 19, 2026. These are architectural requirements and planned work, not a claim that deployment isolation or commercial permissions already exist.

## Product boundaries

- DuelTheory platform: accounts, community, discovery, private tables, generic interaction, event logs and creator publishing.
- YGO Sandbox: free GOAT-specific rules, catalog, artwork and adapters. No payment dependency. Must eventually be independently buildable, deployable and removable.
- Creator Studio: original game definitions, creator-owned/licensed assets, local playtests and later publishing services.
- Ashen Throne: an original game module consuming shared tools without GOAT identifiers or rules.
- Community Arena: discovery and playtesting for independently published original games.

## Implementation order

1. **Inventory and boundaries:** map imports, catalog/image paths and hosting dependencies. Keep new shared utilities free of GOAT card IDs, zones, effect names and catalog imports. Current AI action ranking lives in `framework/decisions.ts`; the GOAT observation and strategy adapters remain in `ai/`.
2. **Module registration and feature switch:** introduce game manifests/adapters and a build-time GOAT-off switch. Acceptance: Creator Studio, AT, Commander Table and generic private tables can build and run with GOAT disabled.
3. **Catalog and asset separation:** independent game bundles, asset manifests and storage paths. Avoid loading the YGO catalog/art for original-game routes. Audit asset/data licenses before commercialization.
4. **Deployment independence:** separate YGO deployment/storage from paid platform infrastructure, with a tested disable/removal procedure. A separate repository or free access is not a legal firewall.
5. **Creator publishing:** permissions, content ownership/licenses, moderation and complaint/takedown handling. Confirm the business/legal approach with appropriate counsel before paid launch.
6. **Commerce:** charge for original creator tools and platform services only after the asset and rights review. Do not imply official publisher affiliation.

## Practice and teaching

- First Chaos Turbo AI: local single-game and best-of-three guided practice with player-only sideboarding and local setup records, original legal-action engine, fixed human seat, source-informed resource policy, hidden-information redaction, response decisions, and explanatory notes. No paid inference service, training claim, private-room bot seat, AI sideboarding or tournament-strength certification.
- Follow-up: benchmark tactical mistakes with reviewed replays; add difficulty levels, reproducible scenarios, AT adapters and later additional deck policies.
- Demo video: record a short narrated/captioned walkthrough from the actual UI. Show setup/coin flip, Thunder Dragon into Charity, Spy/Dekoichi/Faith advantage, discard recovery, LIGHT/DARK costs, Chaos payoff, and a Book response. Produce an honest gameplay example, not an animation implying perfect AI. Video has not been generated in this pass.

Strategy references: https://www.goatformat.com/chaos-turbo.html, https://www.goatformat.com/home/ghostrider15s-chaos-turbo-analysis, https://www.goatformat.com/home/thunder-dragon-chaos.

## Tactical planning update — October 19, 2026

Chaos Turbo now uses a shared bounded beam-search utility with a GOAT simulation adapter. Limits: five strategic actions, beam width three, 64 expanded nodes; forced response/battle steps have a separate cap. Every selected move is matched back to a real legal action and the engine state is never replaced with a simulation.

Planning uses a redacted clone, removes identities from both draw piles, estimates unknown defenders, and stops on unknown own draws or the next turn. Visible opposing responses use the baseline pilot; hidden back row is uncertainty, not a guarantee of safe lethal. This is current-turn tactical planning, not trained self-play or multi-turn prediction. Resource heuristics remain the fallback. Phone responsiveness still requires field testing on real devices.

## AI match testing — October 20, 2026

AI Practice offers Single Duel or Best of Three. Only the human exchanges Main/Side cards; the original registered pool and section sizes are validated with the same helper used by private rooms. Cards sided into active play must have supported effects. The AI retains its original Main Deck. Game one uses the coin toss; a later game's loser chooses the starter (AI chooses itself). A drawn game does not award a win and retains the previous starter.

Completed match records live on the current browser/device, capped at 500, with JSON export. Each records the setup label, exact starting list, mode, pilot version, AI list, per-game sided list, result, starter, turn count and seed. Setup summaries distinguish actual starting composition, label, format and pilot/opponent versions. Leaving requires explicit concession; no fictitious game wins are awarded for a match forfeit. Refresh does not restore an unfinished match, and clearing site data removes saved records. Records are user-controlled practice notes, not authenticated competitive rankings.
