# My World Voxel Sandbox

一个从零搭建的浏览器 3D 体素生存沙盒。项目使用原创方块颜色和原创实现，目标是提供接近经典方块生存体验的可扩展基础，而不是复制任何商业游戏的专有素材或代码。

## Run

```bash
npm install
npm run dev -- --port 5173
```

Open <http://127.0.0.1:5173/>.

## Published URLs

- Source: <https://github.com/damchungtien-lab/my-world-voxel-sandbox>
- Live site: deployment pending

## Accounts and Creative Mode

The start screen includes browser-local registration and login. Account records are stored in `localStorage` with salted SHA-256 password hashes, and each account gets its own local save key (`my-world-voxel-save-v1:<account>`). Guest mode is still available and saves to a separate guest profile.

This is local profile separation, not server-backed authentication. Saves and creative unlocks do not sync across devices, and a technical user can edit their own browser storage.

Creative mode is locked by default for guest and registered accounts. Enter creative code `qwertyuiop` on the start screen to unlock creative mode for the current local account/browser profile.

## Controls

- `WASD` or arrow keys: move
- Mouse: look around after entering pointer lock
- Left click: mine block, melee attack, or shoot an equipped bow
- Right click: place block or use workstation
- Right click with food, hoe, seeds, door, bed, or mature crop: eat, till, plant, toggle, sleep/set spawn, or harvest
- Farmland is not crafted: select a hoe and right-click dirt or grass, then right-click the farmland with seeds.
- Right click with armor or redstone lever: equip armor or toggle power
- Pressure plates are crafted from planks and power adjacent redstone, lamps, doors, or powered rails when players/entities stand on them.
- Right click a redstone button to send a short power pulse; powered rails accelerate minecarts when powered and brake minecarts when unpowered.
- Observers pulse when the watched face changes; ordinary pistons extend when powered, push movable blocks, and retract their head when power is removed.
- Right click a chest or nearby villager: loot the chest or trade
- Right click water with a boat, or right click rail with a minecart: place the vehicle; right click the vehicle to ride it, `Shift` to dismount.
- Right click an enchanting table: open inventory upgrades
- Right click a brewing stand: open potion brewing
- `Space`: jump
- `Space` while on a ladder: climb
- `Shift`: sprint
- `E`: inventory and crafting
- Advanced recipes need a nearby crafting table; smelting recipes need a nearby furnace.
- `C`: survival/creative mode after creative mode has been unlocked with the creative code
- `F`: fullscreen
- `P`: save world
- Mouse wheel or `1`-`9`: select hotbar slot
- Touch screens: left joystick moves, drag on the world to look, and use the four action buttons for jump, mine, use, and inventory.

## Implemented

- Procedural chunked voxel terrain with forests, beaches, snow, caves, water, ores, and trees.
- Horizontally infinite world streaming: X/Z chunks generate on demand as you travel, while far chunks unload to keep memory bounded. Build height remains `0-71`.
- Efficient exposed-face chunk meshes with block highlighting.
- First-person movement, jumping, gravity, collision, fall damage, water slowdown, health, hunger, oxygen, respawn.
- Mobile touch controls with a virtual joystick, touch look, and jump/mine/use/inventory action buttons.
- Mining, placing, hotbar, inventory, hand/table/furnace-gated crafting, creative/survival toggle gated by a local creative unlock code, and survival inventory filtering for owned items.
- Browser-local accounts with register/login/logout, separate per-account progress, guest fallback, and account state in `render_game_to_text()`.
- Tool tiers and durability for pickaxes, shovel, axe, hoe actions, and wooden sword combat.
- First-person held-item rendering with swing feedback for blocks, tools, bow, and sword.
- Iron armor equipment slots with armor points, durability, equipment/unequip flow, and damage reduction.
- Furnace-style smelting recipes for iron ingots, glass, cooked meat, and charcoal using fuel.
- Farming loop: till dirt/grass into farmland, plant wheat seeds, wait for growth, harvest wheat and seeds, craft bread.
- Sand and gravel obey simple gravity; gravel can drop flint, and flint can be crafted into arrows.
- Door toggling with directional open/closed panels, plus climbable ladders.
- Boats, minecarts, rails, and powered rails: craftable/placeable vehicles, right-click riding, basic steering/rail movement, redstone rail boosting/braking, dismounting, and saved vehicle entities.
- Non-cube building blocks: oak/cobblestone slabs and oriented oak/cobblestone stairs with shaped rendering, collision, and saved facing metadata.
- Basic redstone-style circuit loop: redstone wire, lever toggles, button pulses, pressure plates, repeaters, observers, ordinary pistons, powered wire state, redstone lamps, redstone-opened doors, and powered rails.
- Village-style generated huts with paths, work blocks, chests, deterministic loot, and saved opened-chest state.
- Villager entities with basic trading: wheat or coal for emeralds, emeralds for bread.
- Sheep now drop wool, beds can be crafted/placed, and right-clicking a bed sets a respawn point or skips night.
- Melee and bow combat with improved entity hit detection, visible entity targeting outline, projectile state, skeleton enemies, arrow/bone/flint-arrow drops and crafting paths, hostile arrow attacks, and XP rewards.
- Player experience and level progress in the HUD, text-state output, and saved player state.
- Enchanting-table upgrade loop: spend levels and emeralds on Efficiency for tools, Power for bows, and Protection for armor.
- Brewing and potions: brewing stand, glass bottles, water bottles, healing, swiftness, and strength potions with HUD effect timers.
- Synthesized WebAudio feedback for start, mining, placing, combat, bow shots, damage, crafting, chests, trades, doors, levers, sleep, eating, potions, equipment, and saving.
- Day/night lighting, sun/moon, fog and simple weather field.
- Sheep and zombie-style entities with wandering, chase, attack, food/coal drops, and day/night behavior.
- LocalStorage save/load for world edits, oriented block metadata, crop growth, inventory, tool durability, enchantments, potion effects, entity/vehicle state, player level/experience, player state, time, and seed.
- Automated hooks: `window.advanceTime(ms)`, `window.render_game_to_text()`, and development-only test helpers for audio, touch, vehicle, auth, and redstone state.

## Expansion Backlog

- Deeper redstone components such as comparators, sticky pistons, richer redstone scheduling, curved/sloped rails, larger villages, more structures, dimensions, stronger biome generation.
- Server-backed accounts/cloud saves, multiplayer, chunk persistence files, texture atlas.
