# Prototype Notes

This is a quick playable browser prototype built with Vite, TypeScript, Phaser, and HTML Canvas/WebGL rendering.

## Controls

- Arrow Left / A: rotate left.
- Arrow Right / D: rotate right.
- Space / W / Arrow Up: thrust.
- R: restart.
- 1 / 2 / 3: switch rocket profile.

## Tuning

The top-right sliders tune the active run live:

- Gravity defaults to 100%.
- Steering defaults to 5% of the original prototype value.
- Boost defaults to 100%.

## Assets

Scene positioning and scale are controlled from `src/config/sceneLayout.ts`. See `docs/SCENE_CONTROL.md`.

Current placeholder rendered assets are stored at:

- `src/assets/backgrounds/canyon_background.png`
- `src/assets/terrain/canyon_floor.png`
- `src/assets/terrain/canyon_ground_front.png`

The scene currently uses two rendered image layers:

- Back: canyon background image, locked to the world and sized across the level.
- Terrain: canyon floor image, locked to the world and sized across the level.
- Front ground: canyon ground image, locked to the world and drawn as the front-most image layer.
- Camera: locked directly to the rocket horizontally, with vertical scroll fixed.

The rocket is a Phaser-drawn placeholder sprite. A final rocket PNG can be added later under `src/assets/rockets/` and wired into `Rocket.ts`.

## Scope Limits

This prototype intentionally has no backend, database, account system, fuel system, upgrades, real-money logic, or production menu flow.
