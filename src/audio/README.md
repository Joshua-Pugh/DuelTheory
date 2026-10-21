# Duel audio

`SoundManager` owns a single browser AudioContext, synthesized original effects, gain, mute and three palettes. No external audio assets or services are used. Settings persist under `dueltheory.audio.v1` with in-memory fallback when storage is unavailable. The UI unlocks/resumes audio on a player gesture. During asynchronous resume, only the latest cue younger than 500 ms may play; stale cues and cues canceled by stopping never replay. Hidden pages stop scheduled voices. The explicit Enable / recover audio button recreates the device connection, enables effects and restores a nonzero volume before playing a preview.

`duelSounds` is a pure GOAT adapter over confirmed state/event deltas, independent of rules execution. `useDuelAudio` baselines mounts, reconnects and history rewinds; repeated snapshots are silent. Hidden-card redaction changes do not reset the event cursor. Private room results arrive without gameplay state, so `useMatchResultAudio` consumes public series results separately. Draws have no victory/defeat cue. Local two-seat practice uses a victory stinger for either winner.

To add another game, map its confirmed public events into `SoundCue[]` and call `soundManager.play(cues)`. Keep private identities out of cue selection. Add new palette synthesis in the manager; do not put browser audio in the rules engine. Ashen Throne is intentionally not wired to this GOAT adapter.

Controls are available in Preferences and the GOAT duel toolbar. Each device controls its own audio. Samples are previewable after a tap. A polled batch coalesces duplicate cues and caps playback at five cues to avoid an unbounded catch-up queue.
