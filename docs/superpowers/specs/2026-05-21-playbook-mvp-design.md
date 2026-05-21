# Playbook (working title) — Phase 1 MVP Design

> Web-based incremental/idle game about the history of disinformation. Player rises through 12 historical eras as the disinformer; the game subtly teaches real disinformation techniques and, in its eventual third act (Phase 4, not in MVP), reveals itself as an inoculation game pointing to mebro.app, a fact-checker.
>
> **This spec covers Phase 1 only:** the engine, scaffolding, content schema, and 3 reference eras (Antiquity → Printing Press → Penny Press), shipped as a PWA.

---

## 1. Vision

A 12-era idle game where the player runs a disinformation operation across history, starting with Octavian-era smear campaigns and (eventually) ending in the 2026 AI-saturation era. Each era is a self-contained run with progressively richer mechanics; the player prestiges between eras, carrying forward a permanent multiplier currency.

The game's long-term vision is a **content-driven live experience**: ship 12 eras as Season 1, then add monthly current-events drops indefinitely. Architecture must support this from day one — all era content lives in data files conforming to a schema, never in code.

The game's third-act reveal (deferred to Phase 4) flips perspective: the player realizes they have been doing what the bad guys do, and the game offers mebro.app as the fact-checker antidote. **Phase 1 does not include this reveal or any scaffolding for it.**

## 2. Non-goals (Phase 1)

- Eras 4–12
- The mebro reveal mechanic or its hooks
- AI-generated content pipeline (manual authoring only)
- Email list / push notifications
- Audio (silent v0.1; audio in v0.2)
- Alternative player-frame modes (Mode B "force" / Mode C "operator") — these are future expansion packs; only Mode A "you are the disinformer" ships in Phase 1
- Native iOS port (PWA delivers iPhone-installable already; native via Capacitor deferred)
- Steam, itch.io, or app-store distribution beyond a single web URL

## 3. Player frame

The player is **the disinformer**, anonymously persistent across eras (you "reincarnate" each era with new tools, same playbook). All in-game copy referencing player identity ("you forged…", "your reach…") lives in content files, never hardcoded — so a future expansion can swap the frame to Mode B (you are Disinformation Itself) or Mode C (you are an AI operator simulating history) without touching game logic.

## 4. Stack

| Layer | Choice | Reason |
|---|---|---|
| Engine | **Profectus** (TypeScript + Vue 3 + Vite, MIT) | Modern, modular, ships every primitive (tick, save, prestige, big-numbers, achievements). Built for content-driven games. |
| Big-number math | **break_eternity.js** (MIT) | Bundled with Profectus. Handles 10^^1e308 — more than enough headroom for 12+ eras with stacking exponents. |
| Save compression | **lz-string** (MIT) | De-facto standard for browser idle-game saves; compresses JSON for localStorage and export strings. |
| PWA tooling | **vite-plugin-pwa** | Manifest + service worker + offline support with minimal config. |
| Typography | **Google Fonts** (per-era stacks; system fallback) | Cinzel, UnifrakturMaguntia, EB Garamond, Playfair Display, Old Standard TT, Rye, Bebas Neue, Oswald, Inter. |
| Hosting | Static web (GitHub Pages, Vercel, Netlify — TBD at deploy time) | No backend; localStorage saves; PWA install. |

Credit Profectus, break_eternity.js, lz-string, and Cambridge/DROG (Roozenbeek & van der Linden's *Bad News* research, source of the technique taxonomy) in the in-game About / Credits screen.

## 5. Content-driven architecture (the most important decision)

**All era content lives in data files; the engine reads them at runtime. Adding a new era never requires touching game logic.**

```
src/
  game/         ← engine code (TypeScript): tick loop, save/load, math, prestige, UI
  content/
    eras/
      01-antiquity/
        era.json          ← schema-conformant era definition
        codex/            ← markdown files, one per codex entry
          octavian-vs-antony.md
          battle-of-kadesh.md
          ...
        ticker.json       ← real-fact ticker quotes
        copy.json         ← era-specific UI strings
        theme.json        ← typography + palette tokens
      02-printing-press/
      03-penny-press/
    shared/
      copy.json           ← cross-era UI strings (settings, transparency page, etc.)
```

Future content (eras 4–12, monthly drops, AI-generated specials) is created by adding new directories conforming to the same schema. No engine changes required.

### 5.1 Era schema (TypeScript type, validated at load time)

```ts
type EraDefinition = {
  id: string;                       // "antiquity"
  ordinal: number;                  // 1
  date_range: string;               // "~3000 BCE – 500 CE"
  display_name: string;             // "Antiquity"
  theme_id: string;                 // references theme.json in same folder
  techniques_unlocked: TechniqueId[]; // ["impersonation", "discrediting"]
  generators: GeneratorTier[];      // tiers 1..N for this era
  prestige_into: string;            // next era id; or null for final era
  prestige_bridge_copy: string;     // markdown for the transition screen
  codex_entries: CodexRef[];        // metadata; bodies in codex/*.md
  starting_resources: { rumor: 0, reach: 0, cred: 0 };
};

type GeneratorTier = {
  id: string;                       // "spread-rumor", "forge-naru-tablet", ...
  tier: number;                     // 1, 2, 3, 4
  display_name: string;             // "Spread Rumor"
  description: string;              // shown in the card
  technique_tag: TechniqueId;       // for the Tree view filter
  resource: ResourceId;             // which resource it consumes
  base_cost: number;                // cost(0) = base_cost
  cost_growth: number;              // 1.07 .. 1.15
  base_production: number;          // production per second per unit (Tier 1 click-driven exception)
  is_click_driven: boolean;         // Tier 1 only: gains on click
  auto_unlock_at: number;           // ownership threshold to unlock auto-operative (e.g. 10)
  auto_operative_name: string;      // "Sycophant"
  milestones: number[];             // [25, 50, 100, 200, 300, 400] — each grants ×2
  codex_link: string | null;        // codex entry id to surface "based on"
};

type Transition = {
  from_era: string;
  to_era: string;
  prestige_formula: "sqrt-lifetime"; // only this formula in MVP
  prestige_pivot: number;            // the 10^15 in `150 × sqrt(lifetime / 10^15)`
  prestige_currency_label: string;   // "Memetic Inheritance"
  carryover_multiplier: (mi: number) => number; // applied to all production next era
};
```

The schema is enforced at load time with `zod` (small validation library); any malformed content file fails loudly during dev rather than silently breaking the game.

## 6. Math (anchored to AdVenture Capitalist / Pecorella principles)

All era economy follows the consensus rules in `research/from-playbook/idle-game-math/00-principles.md`. Phase 1 specifics:

- **Cost curve:** `cost(n) = base × growth^n`, growth in `[1.07, 1.15]` per tier
- **Production:** linear in count × multipliers
- **Per-tier base-cost ratio:** new tier ≈ 5× previous tier base
- **Per-tier production ratio:** new tier ≈ 7–10× previous tier base
- **Milestones:** `[25, 50, 100, 200, 300, 400]` per tier → each ×2 permanent multiplier
- **First-tier click reward:** clicking the primary action gives 1 Rumor (instant feedback hook from AdCap)
- **First auto-operative unlock:** at 10 owned of Tier 1 → buy "Sycophant" (or era equivalent) which auto-spreads
- **Time-to-next-buy:** doubles every 5–10 buys (pacing principle)
- **Prestige formula:** `MI = 150 × sqrt(lifetime_rumor / 10^15)` (sqrt-on-lifetime, AdCap pattern)
- **First prestige timing target:** 30–60 minutes of fresh active play
- **Carryover multiplier next era:** `1 + MI × 0.02` applied to all production (tunable)

These numbers live in shared config, not hardcoded per era. Each era can override `cost_growth`, `base_cost`, and `base_production` per its `GeneratorTier`, but the *structure* is identical.

## 7. The 6 techniques (Cambridge / DROG taxonomy)

Per Bad News research (Roozenbeek & van der Linden, 2019): **I**mpersonation / **E**motion / **P**olarization / **C**onspiracy / **D**iscrediting / **T**rolling. Credited in About screen with link to Cambridge.

Phase 1 unlock schedule (Pattern C — progressive across eras):

| Era | Newly unlocked |
|---|---|
| Era 1 — Antiquity | **Impersonation**, **Discrediting**, **Trolling** (Greek sykophants pattern) |
| Era 2 — Printing Press | + **Polarization**, + **Conspiracy** |
| Era 3 — Penny Press | + **Emotion** (full set active by end of Phase 1) |

Each technique acts as a tag on generators; the Tree view groups generators by technique. Future eras (4–12) deepen each branch by adding higher-tier generators tagged with the same techniques rather than introducing new ones.

## 8. Era 1 economy (Antiquity) — reference implementation

Four generator tiers, sized per Pecorella's ratios. Numbers tunable in playtesting.

| Tier | Generator | Technique | Base cost (Rumor) | Cost growth | Base prod /s | Reveal at lifetime | Notes |
|---|---|---|---|---|---|---|---|
| 1 | **Spread Rumor** (click) | Impersonation | — (clicker) | — | 1 / click | 0 (always) | Auto-operative ("Sycophant") unlocks at 10 owned → auto-spreads |
| 2 | **Forge Naru Tablet** | Impersonation | 250 | 1.07 | ~7 | 50 | Codex link: Sargon's naru tradition |
| 3 | **Smear Rival** | Discrediting | 1,250 | 1.10 | ~70 | 500 | Codex link: Octavian vs. Antony |
| 3 | **Hire Sykophant** | Trolling | 2,000 | 1.10 | ~90 | 750 | Codex link: Athenian sykophants |
| 4 | **Bronze Coin Mint** | Impersonation | 6,250 | 1.12 | ~700 | 5,000 | Codex link: Augustan coinage; era-end tier |

### Progressive reveal (AdVenture Capitalist pattern)

Each generator's card is hidden until the player has earned at least `reveal_at_lifetime` of the corresponding resource in lifetime total. Tier 1 is always visible (= 0). Subsequent tiers reveal in a faded/locked state once the threshold is crossed; they become buyable when the player can actually afford the current cost. This keeps the next building as a *discoverable carrot* instead of dumping all options on the player at session start — the core moment-to-moment dopamine of idle games.

**Bulk-buy buttons** (x1 / x10 / x100 / Max): x1 always present; x10, x100, Max reveal at later prestige tiers. Out of scope for v0.1 (ship with x1 only); add in v0.2 polish pass.

**Prestige UI**: hidden entirely until `MI >= 1` (already specified in the Memetic Inheritance section).

Trolling-tagged generator (e.g. "Hire Sykophant Litigator") appears in Era 1 at Tier 3+ as a side-branch; design TBD during implementation but the tag exists in the schema.

Era ends when player chooses to prestige (UI prompts at first hit of `MI >= 1`, roughly 30–60 minutes). Prestige currency carries into Era 2.

Eras 2 and 3 follow the same template with era-appropriate generators (Pamphlet Workshop, Cranach Woodcut, Mercurius Newsbook for Era 2; Penny Sheet, Wire Service Stringer, Halftone Press for Era 3). Detailed numbers are specified during implementation per the Pecorella checklist.

## 9. Layout

**iOS Tab Bar** with 4 tabs at bottom: **Play / Tree / Codex / More**.

- **Play** (default tab) — masthead, news ticker, era banner + progress bar, resource row (Rumor / Reach / Cred), scrollable cards of available operations (generators) with cost and "buy" affordance.
- **Tree** — visualizes the 6 techniques as branches; each branch shows owned generators across eras (a vertical history). Tap a branch to filter Play view to just that technique.
- **Codex** — list of unlocked codex entries (real-world disinformation cases). Each opens to a 2–4 paragraph markdown article with cited source links. Earned by hitting milestones or progressing eras.
- **More** — Settings, Transparency Page, About / Credits, Save Export / Import, Hard Reset.

Mobile-first. Designed at iPhone safe-area viewport (393×852). Desktop is responsive (max-width container, generous side gutters). Tablet uses a wider single column.

## 10. Visual aesthetic — era-evolving typography

Each era ships its own theme tokens (`theme.json`) defining: font stack, masthead style, palette (background, surface, text, accent), border treatment, and card style. The UI chrome itself evolves as you progress, becoming a tutorial in communication-tech history.

Phase 1 references:

| Era | Type stack | Palette feel |
|---|---|---|
| Antiquity | Cinzel (Roman caps) + EB Garamond | Cream parchment on near-black text |
| Printing Press | UnifrakturMaguntia (blackletter masthead) + EB Garamond | Aged paper, dark ink |
| Penny Press | Playfair Display + Old Standard TT + Rye accent | Cream broadsheet with red banner accents |

(Eras 4+ later: Bebas/Oswald poster, ChatGPT dark mode for AI era, etc.)

Themes are pure data — `theme.json` is a token bundle that the Vue components read. Switching themes during prestige transitions is a `theme_id` swap, no engine code involved.

## 11. News ticker

Horizontal scrolling strip below the masthead. Pulls quotes from the active era's `ticker.json`. Each quote is a real cited fact ("Octavian read Antony's will aloud in 32 BCE — Cassius Dio Book 50"); tap to open the linked codex entry. The ticker is the primary educational payload — facts scrolling by during normal play.

Cadence: one quote visible at a time, scrolls every 8 seconds, picks randomly from the era's pool (with no-repeat-in-N constraint).

## 12. Codex (the inoculation payload)

Each era ships ~6–10 codex entries. Each entry is a Markdown file with frontmatter:

```yaml
---
id: octavian-vs-antony
title: "Octavian vs. Mark Antony (32 BCE)"
era: antiquity
techniques: [impersonation, discrediting]
sources:
  - url: https://www.worldhistory.org/article/1474/the-propaganda-of-octavian-and-mark-antonys-civil/
    label: "World History Encyclopedia"
  - url: https://en.wikipedia.org/wiki/War_of_Actium
    label: "Wikipedia: War of Actium"
unlock_trigger:
  type: generator_owned
  generator: smear-rival
  count: 1
---

Body markdown here, 2–4 paragraphs…
```

**Every codex entry MUST have at least one source URL.** This is a schema validation requirement, not a guideline. Citation is non-negotiable for credibility (the game is about disinformation; it cannot itself be loose with facts) and to defend against future AI-generated content shipping unverified claims.

## 13. Save / load

- LocalStorage primary, with versioned save schema
- Save state compressed via lz-string
- Export-to-string and import-from-string for manual backup (paste into a text editor)
- Auto-save every 10 seconds and on visibility-change
- Schema-version migration: on load, if `save.version < CURRENT_VERSION`, run a registered migration function
- "Hard Reset" in More tab → wipes save with double-confirm

## 14. PWA

- `manifest.json` with: short_name "Playbook", full name "Playbook: A History of Disinformation", `display: standalone`, theme colors, icon set (192/512/maskable)
- `service-worker.js` (via vite-plugin-pwa) — pre-cache app shell; offline-first; idle games are perfect for offline play
- "Add to Home Screen" works on iOS Safari and Android Chrome

## 15. Transparency page (More tab)

A plain-language page covering:

- What this game is and why it exists
- That player plays the "bad guy" as inoculation (cite Bad News research)
- Where the facts come from (every codex entry has a source URL)
- That this is a solo project (no investors, no data collection)
- Future-proofed slot: "Some content in [era name] was AI-drafted and reviewed by a human" (badge per era — empty in Phase 1, populated when AI pipeline ships)
- Link to mebro.app as the spiritual sister project / inspiration
- Credits: Cambridge/DROG, Profectus, every library, every source author

## 16. Out-of-scope explicit deferrals

- **Mebro reveal mechanic & hooks** → Phase 4
- **Eras 4–12** → Phases 2/3/4
- **Audio (SFX + music)** → v0.2 (post-MVP polish pass)
- **Mode B/C player frames** → future expansion pack
- **AI content generation pipeline** → future infrastructure project
- **Email list / push alerts** → post-MVP, deferred until a content cadence justifies subscribers
- **Native iOS via Capacitor** → post-MVP, deferred until PWA install signals demand for native
- **Study Mode** → post-MVP. A separate mode (toggle or dedicated tab) that turns the codex into a deeper pedagogical experience: interactive era timelines, technique-spotting exercises, "did this really happen?" matching, cross-era pattern discovery, optional quiz/test mode. Reuses all existing codex content + the same six-techniques taxonomy; adds an exam/exploration UI layer. Natural extension of the inoculation premise — once the player has seen the playbook, Study Mode lets them practice spotting it. Estimated as its own future spec.
- **Series packs (deep-dive content within an era)** → post-MVP. Each top-level era stays a broad container; a *series* is a thematic deep-dive that ships inside it. Example: Era 6 (Early Internet / Talk Radio) ships, then later we drop a "Fairness Doctrine" series with 8 cited codex entries on the 1987 repeal, Limbaugh's syndication, Ailes' 1970 Nixon-era TV memo, Fox launch, the talk-radio→Drudge→cable feedback loop, etc. Optionally adds bonus generators or unique ticker quotes. Architecturally trivial because our content-driven schema already supports it: add a `Series` schema type, glob-load from `src/content/eras/<era>/series/<series-id>/`, surface as a sub-grouping in the Codex tab. No engine work required. Not monetised — same free game, just deeper content over time.

## 17. Success criteria for Phase 1 (v0.1 ship)

- Three eras playable end-to-end (Antiquity → Printing Press → Penny Press)
- A new player reaches first prestige within 30–60 minutes
- A new player reaches Era 3 within 3 hours of total play
- Game runs offline as installed PWA on iPhone and Android home screen
- All 6 techniques active by end of Era 3
- All codex entries have source URLs that resolve to live pages (CI check)
- Save survives browser restart and PWA re-install
- 60fps on mid-range mobile (iPhone 12 / Pixel 6 baseline)

## 18. Open questions to resolve during implementation planning

These are deliberately not specified here; they're tactical, not architectural:

- Tree view layout (radial? vertical timeline? grouped list?)
- Prestige transition cinematic vs. simple modal
- Initial click-power tuning (start at 1 Rumor/click — confirm it feels right)
- Exact tier-4 cost in Era 1 that gates prestige timing to ~45 min
- Codex unlock cadence — count per era and trigger types
- Whether milestone bonuses surface as a popup, banner, or just silently apply

These will be resolved in the implementation plan (next document, written via `writing-plans` skill).
