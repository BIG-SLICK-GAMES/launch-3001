# Scene Control

Edit `src/config/sceneLayout.ts` to control real in-game positioning and scale.

This is the master scene control file. Values in it are imported by the Phaser scene and physics config, so changes translate directly into the prototype after refresh or rebuild.

## Coordinate Rules

- `x` increases left to right.
- `y` increases top to bottom.
- The camera follows the rocket horizontally.
- `layers.back` uses viewport coordinates because it is camera-locked.
- `layers.mid` and `layers.groundFront` use world coordinates.
- Layer `yOffsetFromFloor` values are added to `gameplay.floorY`.

## Main Controls

- `view`: browser game viewport size.
- `world`: physics bounds.
- `gameplay.floorY`: collision floor height used for landing and crash checks.
- `level.terrainScale`: terrain width scale relative to the full world width.
- `camera.verticalScrollY`: fixed camera Y position.
- `layers.back`: background image locked to the camera.
- `layers.mid`: mid image moving at half camera speed.
- `layers.groundFront`: very-front ground image locked to world coordinates.
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

To tune the terrain scale:

```ts
level: {
  terrainScale: 1
}
```

To move the whole floor collision line:

```ts
gameplay: {
  floorY: 640
}
```

After editing, refresh the dev server page. If TypeScript reports a mistake, run `npm run build` from `Launch3001Prototype`.
