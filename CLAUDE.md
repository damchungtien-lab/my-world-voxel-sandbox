# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is a browser-based 3D voxel survival sandbox built with Vite and Three.js. It uses original block colors and code rather than proprietary Minecraft assets. The playable UI is mostly Chinese, with English internal names for blocks/items and state.

The source app is intentionally small and centralized:

- `index.html` defines the canvas, start panel, inventory/crafting panel, HUD, hotbar, and toast containers.
- `src/style.css` contains all layout and HUD/panel styling.
- `src/main.js` contains the complete game implementation: data definitions, procedural world generation, rendering, player physics, entities, interactions, persistence, UI rendering, and browser automation hooks.
- `README.md` documents run commands, controls, implemented features, and backlog.
- `progress.md` is a development/history log with prior validation notes.

Generated or dependency directories such as `node_modules/`, `dist/`, and `output/` are ignored by `.gitignore` and should not be treated as source.

## Commands

```bash
npm install
```

Install dependencies from `package-lock.json`.

```bash
npm run dev -- --port 5173
```

Start the Vite dev server on `127.0.0.1:5173` as documented in the README, then open <http://127.0.0.1:5173/>.

```bash
npm run build
```

Build the production bundle into `dist/`. The current build may emit a Vite chunk-size warning because Three.js and the game code bundle into one large client chunk; this warning is expected unless code splitting is introduced.

```bash
npm run preview -- --port 4173
```

Serve the production build locally for a post-build smoke check.

There are currently no configured `lint`, `test`, or single-test npm scripts. Use `npm run build` plus browser/Playwright smoke testing for validation until a test runner is added. `test-actions.json` contains action steps used by prior browser-game validation runs.

## Architecture notes

### Data model and IDs

`src/main.js` starts with the core numeric constants and catalogs:

- World dimensions and tuning: `CHUNK_SIZE`, `WORLD_HEIGHT`, `WATER_LEVEL`, `RENDER_DISTANCE`, `MAX_REACH`, `SAVE_KEY`.
- `BLOCK` and `ITEM` define persisted numeric IDs.
- `BLOCKS`, `ITEMS`, and `CATALOG` define display labels, colors, collision/transparent/liquid flags, hardness, drops, tool tiers, armor stats, food stats, and selectability.
- `HOTBAR_DEFAULT`, `RECIPES`, `SMELTING_RECIPES`, and `FUEL_ITEMS` drive inventory, crafting, and smelting UI.

Because IDs are saved to localStorage, avoid renumbering existing `BLOCK` or `ITEM` values. Add new IDs at unused values and update the relevant catalog/recipes/hotbar logic together.

### World and chunk lifecycle

The `World` class owns terrain, chunks, saved edits, crops, chest state, redstone state, and chunk meshes. Terrain is deterministic from `seed` using local value-noise/fBM helpers. `generateChunk()` builds heightmaps, biomes, caves, ores, trees, water, snow/beaches, and village huts, then overlays saved block modifications.

Chunks are keyed by chunk coordinates and store a `Uint8Array` of block IDs. `getBlock()` lazily generates chunks. `setBlock()` writes to the chunk, records the edit in `modified`, updates crop tracking, and marks the chunk plus edge-neighbor chunks dirty. `buildDirty()` throttles mesh rebuilds. `rebuildChunk()` emits exposed cube faces into Three.js `BufferGeometry`, separating opaque solids from transparent/liquid faces.

World persistence is localStorage-only under `SAVE_KEY` (`my-world-voxel-save-v1`). `saveGame()` serializes modified blocks, crop ages, opened chests, player state, inventory, tool durability, armor durability, time, weather, and seed.

### Player, inventory, and survival systems

The `Player` class owns position/yaw/pitch, velocity, collision box dimensions, mode (`survival`/`creative`), health/hunger/oxygen, selected hotbar slot, inventory, tool durability, armor slots, and armor durability. It also handles movement physics, gravity/water/ladder behavior, collision resolution, item add/remove, eating, armor equip/unequip, damage reduction, respawn, and serialization.

Inventory and equipment UI are rendered from the same catalogs as gameplay. Tool and armor durability are only initialized for owned/equipped items; preserve that behavior when changing inventory display logic.

### Entities and interactions

`EntityManager` manages sheep, zombie, and villager entities. It creates simple Three.js box-model meshes, handles wandering/chasing/daylight behavior, attacks, drops, villager spawning near village chunks, and raycasting against entities.

Global interaction functions after scene setup handle the gameplay verbs:

- `raycastBlock()` and `entities.raycast()` establish `targetBlock`/`targetEntity`.
- `mineOrAttack()` handles left-click mining or entity damage.
- `placeOrUse()` handles right-click trading, chest loot, eating/equipping, crop harvest, door/lever toggles, tilling/planting, workbench/furnace panel opening, and block placement.
- `craft()` applies both crafting and smelting recipes.
- `updateRedstone()` propagates lever power through wires and updates lamps.

When adding a new placeable/useable item, check both the data catalogs and `useHeldItem()`/`placeOrUse()` flow so right-click behavior does not conflict with block placement.

### Rendering and game loop

Scene setup creates a `WebGLRenderer`, fog, camera, hemisphere/sun/moon lights, sun/moon meshes, the `World`, `Player`, `Input`, `EntityManager`, and a block highlight outline. `update()` advances player/world/entities/lighting/autosave depending on game state, `render()` draws the scene and HUD, and `frame()` runs the `requestAnimationFrame` loop.

`updateLighting()` drives day/night color, fog, sun/moon intensity, and weather tint. HUD and inventory are rendered directly into DOM elements via `renderHud()` and `renderInventory()`.

### Browser automation hooks

Two globals are intentionally exposed for browser-based validation:

- `window.advanceTime(ms)` advances the simulation in fixed 60 FPS steps and renders once.
- `window.render_game_to_text()` returns JSON describing mode, player state, selected item, inventory, tools, armor, crafting/redstone/exploration status, target block/entity, loaded chunks, and nearby entities.

Use these hooks for Playwright-style smoke checks instead of relying only on screenshots when validating gameplay changes.
