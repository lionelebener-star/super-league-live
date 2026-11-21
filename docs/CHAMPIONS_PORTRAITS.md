# Champions League portraits

Registry: `public/champions-portraits.json`. Added 2026-11-20, 601 portraits for the 979 players supplied by `/api/champions` across 36 teams (one team has no supplied squad).

Each registry key is the football-data.org player ID. Identity was matched against Wikidata using BOTH exact date of birth (P569) and exact normalized player name (case folding, accent and punctuation removal). Ambiguous multi-entity matches were discarded. P18 supplies the Commons filename. No provider ID equivalence or guessed photo URLs from other providers is used.

Commons imageinfo/extmetadata supplies author, file page, original URL, license name and license URL. Accepted licenses: CC BY / CC BY-SA 1.0–4.0, CC0 and public domain. Missing metadata or incompatible licenses were discarded. Thumbnails are served by Wikimedia, not a paid image service. No API token is used.

Client lookup additionally requires exact stored name and birth date to match the current football-data player. Unknown or changed identities keep initials. Image load failures remove the image and reveal initials; layout dimensions stay fixed at 72px. Images lazy-load. Per-team expandable photo credits link each file, author and license and disclose thumbnail cropping. Super League portraits are unchanged.

Update procedure: obtain the current public squad response; query Wikidata by dates of birth and multilingual labels; apply the unique name/date identity check above; resolve P18 filenames through Commons imageinfo using `iiprop=url|extmetadata`; retain full attribution fields. Respect Wikimedia request limits. Review coverage and run `npm test` and `npm run build`. Never fill gaps with an unverified identity or unlicensed photo. The registry is a snapshot, not an automatic portrait harvesting task.

Tests verify required identity/provenance/license fields and refusal of changed names, changed dates, missing IDs and untrusted image URLs. No secrets, account details or private fan cards are part of this registry.

## Team navigation (2026-11-21)

The navigation label is Teams in both languages, retaining existing #joueurs URLs for compatibility. Team pages in both competitions use shared `public/team-tabs.js`: Team / Résultats (Ergebnisse in German), sliding selection and content in 400 ms, keyboard tabs, inactive panels inert, reduced-motion support and automatic panel height sizing. The club dropdown inside the Super League roster is removed; the left back control returns to the team directory. Results use only finished/awarded competition games, home and away, most recent first, with crests, dates and scores. SFL history combines published season schedule and authoritative live results; latest event ID wins. Source updates refresh the view and preserve selected subtab. No modal/player-card animation is changed.
