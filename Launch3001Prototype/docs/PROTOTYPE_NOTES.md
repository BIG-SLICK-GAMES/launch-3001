# Prototype Notes

This is a quick playable browser prototype built with Vite, TypeScript, Phaser, and HTML Canvas/WebGL rendering.

## Controls

- Arrow Left / A: rotate left.
- Arrow Right / D: rotate right.
- Space / W / Arrow Up: thrust.
- R: restart.
- 1 / 2 / 3: switch rocket profile.

## Assets

Current placeholder rendered assets are stored at:

- `src/assets/backgrounds/canyon_background.png`
- `src/assets/terrain/canyon_floor.png`

The rocket is a Phaser-drawn placeholder sprite. A final rocket PNG can be added later under `src/assets/rockets/` and wired into `Rocket.ts`.

## Scope Limits

This prototype intentionally has no backend, database, account system, fuel system, upgrades, real-money logic, or production menu flow.
