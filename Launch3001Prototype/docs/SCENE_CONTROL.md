# Scene Control

Edit `src/config/sceneLayout.ts` to control real in-game positioning and scale.

This is the master scene control file. Values in it are imported by the Phaser scene and physics config, so changes translate directly into the prototype after refresh or rebuild.

## Coordinate Rules

- `x` increases left to right.
- `y` increases top to bottom.
- Most gameplay/world positions use world coordinates.
- `layers.back` uses camera/screen coordinates because it is fixed to the camera.
- Layer `yOffsetFromFloor` values are added to `gameplay.floorY`.

## Main Controls

- `view`: browser game viewport size.
- `world`: full side-scrolling level size.
- `gameplay.floorY`: collision floor height used for landing and crash checks.
- `camera`: follow behavior, look-ahead, and fixed camera center.
- `layers.back`: fixed background image.
- `layers.middle`: zoomed world-space midground image.
- `layers.front`: world-space gameplay terrain image.
- `layers.groundFill`: solid visual fill below the terrain.
- `rocketSpawn`: rocket start position and starting velocity.
- `landingPad`: landing pad position and size.
- `resultBanner`: crash/landed text placement.

## Common Edits

To move the landing pad:

```ts
landingPad: {
  x: 1840,
  yOffsetFromFloor: 0,
  width: 230,
  height: 18
}
```

To scale or position the middle image:

```ts
middle: {
  x: 1200,
  yOffsetFromFloor: 34,
  width: 2880,
  height: 168
}
```

To move the whole floor collision line:

```ts
gameplay: {
  floorY: 790
}
```

After editing, refresh the dev server page. If TypeScript reports a mistake, run `npm run build` from `Launch3001Prototype`.
