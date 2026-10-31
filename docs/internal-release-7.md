# Internal release 1.0.6 / code 7 — hide completed dice

Prepared October 30, 2026; signing/publication pending.

The dice component returns no display after the opening roll has a winner. Completed-roll views show compact turn information instead. Seat order is available in Table menu. A new game clears the previous roll; dice appear again after seats are locked. Tie-break rounds remain visible until resolved.

Validation covers authoritative roll requests, intermediate results, disappearance on completion with turn passing enabled or disabled, continued disappearance after turn changes, and reappearance in a new game. Shared browser/app UI; no backend changes.
