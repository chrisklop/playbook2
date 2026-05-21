# Forkable Incremental Game Research — Consolidated

Three parallel research passes: (1) finished forkable games, (2) engines/frameworks, (3) story-driven/narrative incrementals.

---

## Cross-Agent Consensus

| Repo | Mentioned by | License | Stack | Why it keeps coming up |
|---|---|---|---|---|
| **Progress Knight** | Agent 1, 3 | Unlicense (public domain) | Vanilla JS, single file | Tiny, readable, career-ladder = era progression. Lowest-risk fork. |
| **Antimatter Dimensions** | Agent 1, 3 | MIT | Vue 2/3 + JS | Canonical prestige-layer math. Steal patterns, don't fork whole. |
| **Evolve** | Agent 1, 3 | MPL-2.0 | JS + Less | Era/age progression is a near-perfect mechanical match. Huge codebase. |
| **A Dark Room** | Agent 3 (called out by 1 too) | MPL-2.0 | Vanilla JS, no build | Gold-standard reveal/twist mechanic. Direct precedent for the mebro reveal. |
| **Synergism** | Agent 1 | MIT | **TypeScript** + Vite | Modern stack, modular, shipped to Steam. Strongest "professional" fork base. |
| **Level13** | Agent 3 (Agent 1 had license wrong) | **Apache-2.0 (verified)** | Vanilla JS + Ash.js ECS | Tech-tree-as-narrative across 14 vertical "levels" — direct fit for eras. |
| **Profectus (engine)** | Agent 2 | MIT | TypeScript + Vue 3 + Vite | The recommended engine if you want primitives, not a re-skin. |

---

## Three Strategic Paths

### Path A — Fork a finished game, retheme
Pick **Progress Knight** (smallest, easiest) **OR Synergism** (largest, most modern) **OR Evolve** (best mechanic match, biggest lift).
- Pro: working game on day one, all systems wired
- Con: spend time deleting + reskinning content; locked into upstream's UI conventions

### Path B — Use an engine, build content
Use **Profectus** (TypeScript + Vue 3 + Vite, MIT) — gives you tick loop, save/load, big-number math (`break_eternity.js`), currencies, prestige, achievements out of the box.
- Pro: clean slate for content, no theme-deletion work, modern stack
- Con: more architectural decisions up front, less "battle-tested gameplay" inherited

### Path C — Hybrid (Agent 2's recommendation, and probably the right one)
**Profectus engine + crib mechanics from finished games:**
- Prestige-layer patterns from **Antimatter Dimensions** (MIT)
- Era-transition framework from **Evolve** (MPL-2.0)
- Reveal/genre-shift UX from **A Dark Room** (MPL-2.0)
- Career-ladder progression from **Progress Knight** (public domain)

---

## Supporting Libraries (all permissively licensed)

- `break_eternity.js` — big-number math (handles 10^^1e308)
- `lz-string` — save string compression
- `howler.js` — Web Audio for click/upgrade/prestige SFX
- `canvas-confetti` / `animejs` — "juice" for satisfying number pops

---

## Critical Cross-Reference: Bad News / Harmony Square

Closed-source but academically validated **inoculation games** by Cambridge / DROG (Roozenbeek & van der Linden, HKS Misinfo Review 2020). Their 6-badge manipulation taxonomy (impersonation, emotion, polarization, conspiracy, discrediting, trolling) is the **DEPICT** framework already referenced in the salvaged `CORPUS.md`. This is the proven academic foundation for "make the player be the bad guy to inoculate them." It's exactly the design space.

## Recommended Reading

- *The Ontology of Incremental Games* — Deterding & Trammell, Eludamos Vol 10 No 1 (2019)
- *Breaking Harmony Square* — Roozenbeek & van der Linden, HKS Misinformation Review (Nov 2020)
- Frank Lantz on Universal Paperclips (YC interview)
