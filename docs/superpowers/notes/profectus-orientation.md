# Profectus Orientation Notes

Captured from upstream `profectus-engine/Profectus` (shallow clone in `/tmp/profectus-study/`) before copying into our project. These notes inform Tasks 16/17 (Profectus integration).

Stack: TypeScript + Vue 3 + Vite + JSX (`.tsx`), `break_eternity.js` (via `util/bignum`) for Decimal math, `lz-string` for save compression, `nanoevents` for the event bus.

## Top-level source layout (`src/`)

- `main.ts` — Vite entry; mounts `App.vue`.
- `App.vue` — root component.
- `data/` — project content (the "mod"). Includes `projEntry.tsx` (entry layer), `projInfo.json` (project metadata + version), `themes.ts`, and `layers/` (one file per gameplay layer).
- `game/` — engine core: `gameLoop.ts`, `layers.tsx`, `persistence.ts`, `player.ts`, `events.ts` (global event bus), `state.ts`, `settings.ts`, `requirements.tsx`, `modifiers.tsx`, `notifications.ts`, plus subfolders `boards/` and `formulas/`.
- `features/` — reusable engine primitives: `resources/`, `clickables/` (clickable, upgrade, repeatable, action), `achievements/`, `bars/`, `challenges/`, `tabs/`, `trees/`, `infoboxes/`, `links/`, `particles/`, `hotkey.tsx`, `reset.ts`, `conversion.ts`, `feature.ts`, `VueFeature.vue`.
- `util/` — `bignum.ts` (Decimal export), `save.ts` (save/load/import/export entry points), `vue.ts` (`render()` + JSX helpers), `proxies.ts` (`createLazyProxy` — used by every feature factory), `computed.ts`.
- `components/`, `mixins/`, `wrappers/` — Vue UI scaffolding (tooltips, modal, layout).

## 1. Layer definition

A "layer" is a `.tsx` file under `src/data/layers/` exporting a default created via `createLayer(id, factoryFn)` from `game/layers`.

- The factory receives the layer instance and returns an object with whatever you want exposed (name, color, points, display, treeNode, hotkey, etc.).
- Layers are registered in `data/projEntry.tsx` — the `main` layer's `createTree({ nodes: [[prestige.treeNode]] })` declares which other layers are reachable from the main tree.
- Layers can subscribe to engine events via `layer.on("update", diff => {...})` (per-tick) — that's where production-per-second math lives. Example from `projEntry.tsx`:
  ```ts
  layer.on("update", diff => {
      points.value = Decimal.add(points.value, Decimal.times(pointGain.value, diff));
  });
  ```
- The `display` field is a function returning JSX rendered by the active-layer tab.
- Reference example: `src/data/layers/prestige.tsx` — minimal but shows every common piece (resource, conversion, reset, tree node, tooltip, reset button, hotkey).

## 2. Currencies / resources

`createResource<T>(defaultValue, displayName?, precision?, small?)` from `features/resources/resource.ts`.

- Returns a `Ref<DecimalSource>` augmented to be a `Persistent` (auto-saved if the ref ends up on the layer's returned object).
- Tracking helpers in the same module: `trackBest(resource)`, `trackTotal(resource)`, `trackOOMPS(resource, pointGainRef)` (orders of magnitude per second).
- Display via `<MainDisplay resource={points} color={color} />` (`features/resources/MainDisplay.vue`) or `<Resource ... />`.
- All arithmetic uses `Decimal` from `util/bignum` (re-export of `break_eternity.js`): `Decimal.add`, `.times`, `.div`, `.sqrt`, `format(x)`, `formatWhole(x)`, `formatTime(x)`.

## 3. Upgrades and buyables

- **Upgrade** (one-shot purchase): `createUpgrade(() => ({ requirements, display, onPurchase? }))` from `features/clickables/upgrade.tsx`. Persistent boolean `bought`. `requirements` built via helpers from `game/requirements` (`createCostRequirement`, `createBooleanRequirement`, `createVisibilityRequirement`). Renders as a `Clickable.vue`.
- **Repeatable** (buyable, purchasable many times with scaling cost): `createRepeatable(() => ({ requirements, limit?, initialAmount?, display }))` from `features/clickables/repeatable.tsx`. Persistent `amount`. Supports bulk buying via `maxRequirementsMet`. Cost scaling is expressed via `game/formulas` (`Formula` builder — `Formula.variable(amount).pow(...).times(...)` etc.).
- **Action** (cooldown-based clickable): `features/clickables/action.tsx`.
- Discovery: `findFeatures(layer, UpgradeType | RepeatableType | ...)` iterates a layer's properties by symbol tag — useful when implementing "buy max" or summary UI.

## 4. Prestige / resets

- `createReset({ thingsToReset: () => [layer], onReset? })` from `features/reset.ts`. Reset walks the array, finds every `Persistent` ref by symbol, and writes back its `[DefaultValue]`.
- `createCumulativeConversion({ formula: x => x.div(10).sqrt(), baseResource, gainResource })` from `features/conversion.ts` defines the exchange rate from a base resource to a prestige currency.
- `createResetButton({ conversion, tree, treeNode })` (from `data/common.tsx`) renders the standard "Reset for X points" button. `createLayerTreeNode({ layerID, color, reset })` makes the tree-graph node.
- Multi-layer reset propagation: `branchedResetPropagation` (passed to `createTree`) handles which downstream layers get reset when an upstream layer prestiges. See `projEntry.tsx`.

## 5. Save system

- Entry points: `src/util/save.ts` — `save(player?)`, `load()`, `loadSave(playerObj)`, `newSave()`, `decodeSave(string)`, `setupInitialStore(partial)`.
- Storage: `localStorage`, keyed by `player.id`. Value is `LZString.compressToUTF16(JSON.stringify(player))`. Active save id lives in `settings.active` (`game/settings.ts`).
- Player shape: `game/player.ts` — `{ id, name, tabs, time, autosave, offlineProd, offlineTime, timePlayed, keepGoing, modID, modVersion, layers: {} }`. Per-layer persistent values are nested under `player.layers[layerId]` automatically (`game/persistence.ts` walks the layer object for `Persistent` refs at layer-creation time — see `addingLayers` / `persistentRefs`).
- Project identity: `data/projInfo.json` provides `id`, `versionNumber`, `initialTabs`. `modID` mismatch → fresh save.
- Migration hook: `fixOldSave(oldVersion, player)` exported from `data/projEntry.tsx` runs on load.
- Tick + autosave loop: `src/game/gameLoop.ts` (drives `layer.on("update", diff)`).

## Pieces that will matter for Playbook

- `createLayer` per **era** (one `.tsx` under `src/data/layers/eras/` later).
- `createResource` for our currencies (Attention, Doubt, Influence, etc.).
- `createRepeatable` for tactic-buyables with `Formula`-based cost scaling.
- `createUpgrade` for one-shot era milestones.
- `createReset` + `createCumulativeConversion` for the era-transition prestige.
- We will replace `data/projEntry.tsx`, gut `data/layers/prestige.tsx`, and keep all of `game/`, `features/`, `util/`, `components/` untouched.
- `projInfo.json` needs our `id` ("playbook") and `versionNumber` set before first save, otherwise migrations break.
