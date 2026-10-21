# AI game review logs

Open **Play → AI Practice → AI Game Logs**. Enable **Record all my future AI games on this device** before starting. The preference persists on that browser. No display-name matching grants access or enables recording for other visitors. Each device has a random review profile ID, with the saved display name attached as a label.

Each game records its match ID, game number, actual player/opponent decks (including sideboard swaps), initial shuffle seed, starting seat, AI pilot version and deployed build commit. Every committed engine action is retained, including actions executed by phase shortcuts and automatic progression. The event timeline, AI explanations, actor-visible decision observations and up to 100 legal alternatives per recorded decision are included. These review records never enter the live AI policy.

Finished games, concessions, errors and incomplete games are retained. Refresh does not restore a playable match, but the last completed IndexedDB write survives and appears as **in progress / interrupted**. Abrupt device shutdown can lose the most recent pending write. Undo truncates the replay branch and its decision records; the rewind count remains. Exiting after a result does not replace the result.

**Export all game logs** downloads the complete JSON collection for analysis. **Review recorded games** provides AI explanations and a readable per-game report. Reconstruct a game with `GameService.createGoatSession(log.decks, catalog, log.seed, log.first, 'auto')`, then dispatch `log.actions` in order using the recorded build's rules/catalog. Results from concession are metadata, not fabricated engine actions. Production records include the exact Git commit; local development records say `development`.

Storage is local IndexedDB, with no automatic uploads, automatic training or hidden collection of private-room games. Logs are not silently pruned at an arbitrary count. Browser quotas, private browsing and clearing site data can remove or prevent storage; keep exports as backups. Storage errors are reported without stopping the duel. Writes are ordered, and the history browser loads summaries rather than every full replay during normal navigation. Cross-device synchronization is not included in this version.

Existing AI Learning Preview feedback and completed-match W/L statistics remain separate. Logs cannot recover games played before recording was enabled.
