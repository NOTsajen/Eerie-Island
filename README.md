# Gaps

Top-down survival game (web port of the Godot "Gaps" stage 3 project). Plain HTML/JS, no build step.

**Play:** enable GitHub Pages (Settings → Pages → Source: GitHub Actions) and push to `main`.
Local: `python3 -m http.server` then open http://localhost:8000

## Controls
- Move: WASD / arrows, or touch the left half of the screen (dynamic joystick). Swipe down quickly to sprint.
- Sprint: Shift (or Sprint button on touch)
- Action: E / Space / Action button (chop, mine, pick, drink, smelt)
- Hotbar: 1–0 or tap a slot; tap the selected slot again to use/place it
- Craft: C or Craft button

## Features
- Stage 4: autosave (localStorage), cooking raw meat at a campfire
- Stage 5: wolves at night (they avoid fire), deer by day, iron sword, combat
- Stage 6: iron tools, sound effects, win condition: craft a Raft (30 wood, 5 iron bars, 10 gold) and use it
