# Shuffle and empty Ritual search review

The opening deal and post-search shuffle share the deterministic Fisher–Yates implementation. Live sessions receive a fresh Web Crypto uint32 seed; fixed-seed replay mode intentionally repeats the same deal. There is no AI-specific opening-hand selection or redraw in the session constructor. Both seats use the same shuffle function, with a fixed seat offset.

A local sample of 100,000 shuffles per seat used the existing algorithm and fresh cryptographic seeds. Six cards represent the initial five plus the turn draw, before any search or draw effects.

| Measurement | Expected | Seat 0 sample | Seat 1 sample |
| --- | ---: | ---: | ---: |
| At least one Pot of Greed or Graceful Charity in first six | 28.077% | 28.007% | 28.185% |
| At least one Thunder Dragon in first six | 39.433% | 39.421% | 39.593% |
| A draw spell and a Thunder Dragon in first six | 9.798% | 9.805% | 9.769% |
| Adjacent identical-card pairs per full Chaos Turbo deck | 1.050 | 1.047 | 1.056 |

This sample did not reproduce opening-card favoritism or excessive duplicate adjacency. It does not establish every possible shuffle property or diagnose an unsubmitted match export. Duplicate cards can legitimately be adjacent, and searched copies are appended to the hand together. Regression checks exercise deck preservation, identical deals regardless of the starting player, and distribution checks for both seats. Existing post-search shuffle and replay checks remain in place. The shuffle algorithm was not changed, preserving existing replay behavior.

The confirmed Ritual search bug was separate: Manju or Senju could queue a search with no eligible Ritual cards left. Only a decline action remained, and the UI hid it. New Normal/Flip Summons skip an unavailable search; an already queued empty search offers a visible Continue button. Manju still searches a remaining Ritual Spell when no Ritual Monster remains; Senju does not.

For manageable exports, open **AI Game Logs** and choose **Export last 5 games** or **Export last 10 games**. The newest games include unfinished games. **Review recorded games → select a game → Export selected game** exports one complete replay. Exports use compact JSON without omitting actions, events, decision observations or recorded private-hand snapshots. Recent exports fetch only the chosen games, rather than loading the entire full-log store. Nothing is deleted or uploaded automatically.
