# Approved Ashen Throne card presentation

The layered renderer is shared by the AT catalog/builder, Creator Studio card editor and face-up manual tabletop cards/inspector. The outer rusted-iron PNG is always unfiltered. Nobles use gold inner metal and emerald enamel; Brutes use neutral iron inner metal and crimson enamel. Factionless cards use silver/gray Untuned materials. Artwork crop controls remain available; former palette/template choices no longer override the approved frame.

Creator Studio's **New Ashen Throne project** loads the 91 source card entries and both source playtest lists, with Command Stations included as separate tabletop objects. The new resource fields and Outfit cost are persisted in project JSON and manual-session presentation data. An explicit null Outfit cost records a user removing the printed ability, so it stays removed after export/import. Older project cost text remains supported without guessing unrecognized notation.

`src/ashenPrintData.json` records resource quantities transcribed from the two desktop source deck DOCX files. Inline Oath/Fury glyphs are counted from the title paragraph, and the numeral beside the Untuned glyph supplies its quantity. Word's duplicated fallback drawing/text representations are excluded. All 91 catalog entries matched; repeat printed copies were checked for consistent costs. `cost-transcription.json` records the source title lines and image relationship IDs. `extract_card_costs.py` documents the extraction used during integration.

Deck membership remains unchanged. Frame affinity is separate: Untuned-only Ring of the Ley (both source copies), Ashenfield Lance and Flamebelcher Rig render neutral. Both Outfit costs are 1 Untuned according to the source documents. No card cost is invented from a card's faction or apparent strength; Ley Fonts and Command Stations have no cost badge when their source header has none.

The card catalog still contains pre-existing untranscribed rules text; this integration does not claim those effects are complete or add automated AT rules. All supplied icon masters and frame PNGs are copied without resizing. Resource icon files are 1254 square; frame layers are 1060 × 1484 with alpha.

Validation: TypeScript and production build, 104 Vitest tests, and browser checks of Noble/Brute/neutral cards, live cost edits, Outfit edits/removal, and fourteen framed face-up cards after starting the source Studio session.
