# Island Echoes: Survival & Betrayal
Phaser 3 + Vite. `npm i && npm run dev`. Deploy on Vercel (framework: Vite).

Keys: WASD move · Space act/hit · E eat · C campfire · T talk · 1-9 build (fence, spike, cabin, plot, greenhouse, turret, chest, torch, sprinkler) · Z/X/V/B/N craft (charcoal, plate, circuit, battery, transceiver; next to a campfire) · L lantern · F repair tower · M room · P ping · Enter chat.

Online play: deploy `server/` somewhere that supports WebSockets and set `VITE_WS_URL` (see `.env.example`). Without it, rooms sync between tabs of one browser.
Autosave: localStorage. Trees and rocks re-roll on load; buildings, crops, NPCs and stats are restored.

## Upgrade batch 1
Q build menu (all buildings, incl. wall/barn/well/blacksmith/lab) · U upgrade a cabin (Cabin > House > Castle) · E eats berries/eggs/milk/meat.
Space on a wild animal with a berry tames it; tame animals show `!` when they have eggs/milk/meat. Blacksmith (Space) = tools/swords/armor. Laboratory (Space) = research bench.
NPC jobs: Farmer, Guard, Builder, Scavenger, Blacksmith, Scientist, each does its own work. Salvage the crashed plane for scrap, circuits, batteries.

## Upgrade batch 2
Stand next to a cabin/house/castle and press H to go inside (floors = level). Inside: Q furniture menu, Space use (bed rests, stove cooks, piano plays, lamp toggles, chest stores), X remove (refund), C recolor, W/S stairs on the right, H/Esc leave. Furniture is saved.


## v15 controls
- Hotbar: keys 1-9 (or click a slot) select a slot; E eats the selected food first. Building moved to **Shift+1-9** (touch build buttons unchanged).
- Y: sleep outside at night. Seasons last 10 days. River freezes in winter (walkable). Mouse wheel scrolls the hotbar. Soil patches grow crops 1.5x faster.
