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

- `src/assets/terrain/canyon_floor.png`

The scene currently uses one rendered image layer:

- Terrain: canyon floor image, fixed to the viewport and tweened from right-aligned to left-aligned over `rocketFlightDurationMs`.

The rocket is a Phaser-drawn placeholder sprite. A final rocket PNG can be added later under `src/assets/rockets/` and wired into `Rocket.ts`.

## Scope Limits

This prototype intentionally has no backend, database, account system, fuel system, upgrades, real-money logic, or production menu flow.
