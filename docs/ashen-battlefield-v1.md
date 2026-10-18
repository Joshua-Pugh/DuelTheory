# Ashen Throne battlefield foundation — 2026-10-17

Open **Ashen Throne → Battlefield**. The first visit loads a labeled populated layout preview. **New table** shuffles the existing Brute/Noble prototype lists and deals six cards per player; Command Stations are separated from the draw decks. This is local hotseat manual playtesting, not an automated rules engine or online match.

## Layout and interaction

- One shared overhead ruined battlefield illustration, with the opposing frontlines near the center and fonts/support areas behind each frontline.
- Unlimited, wrapping Frontline, Ley Font, and Runes/Relics regions. Cards retain their size on crowded fields; additional rows expand the table. A Command Station has its own location and editable HP.
- Both players have a labeled Ley Basin, displaying Untuned, Oath, Fury, Ash and Veil symbols, names, and individual counts. A Ready Font's Burn button flips it down and adds one essence matching its subtype. An animated symbol travels from that specific font to that player's basin. Reduced-motion preferences shorten the travel animation.
- Basin +/- controls provide manual spending and adjustments. Counts cannot go negative. Advanced font abilities are explicitly left to the players; no card effect or deployment-cost automation is claimed.
- End turn clears both basins and readies the incoming player's fonts. Draws, unit readiness, combat, healing, and other start/end effects remain manual. This deliberately small foundation is separate from the future complete Ashen rules engine.
- Drag cards, or select one and use placement buttons. Inspect, fatigue, flip, add/remove counters, return to hand, send to the Ossuary, draw, and browse discard/banished piles. Opposing battlefield cards face their controller; opposing hands stay hidden until the viewing seat is switched.
- Fullscreen focus, 30 undo snapshots, session export, and automatic local save under `dueltheory-ashen-battlefield-v1`. Existing GOAT/Creator saves and deck builders are unchanged. New table and Layout preview replacements are undoable.

## Art

`public/ashen/battlefield/ruined-playmat.png` was generated with the built-in image-generation tool for this project. The image is original background illustration: overhead medieval ruins, charcoal stone, edge rubble, embers, and quiet central space. All labels, zones, cards, basins, counters, and animations are live HTML/CSS over the image. The source PNG is retained intact.

## Next implementation stage

This pass establishes the battlefield and resource interaction. It does not yet implement the Clash, unit combat, tokens/stacking, card effects, legal deployment/payment, advanced-font entry conditions, win detection, custom-deck selection, or AI. The starter lists remain the existing provisional document-derived rosters.
