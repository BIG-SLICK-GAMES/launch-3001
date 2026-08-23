export default {
  id: 21,
  name: 'Deep Shelf',
  description: 'A low shelf over most of the route with spaced refills.',
  gravity: -5.14,
  thrustPower: 8.4,
  steeringPower: 4.72,
  damping: 0.983,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.75, verticalUp: 8.3, verticalDown: 10.5 },
  fuelBurnRate: 13.1,
  launchPad: { position: { x: -7, y: 0.1, z: 152 }, size: { x: 3.9, y: 0.2, z: 3.9 } },
  landingPad: { position: { x: 7, y: 0.1, z: -326 }, size: { x: 3.2, y: 0.2, z: 3.2 } },
  landingThresholds: { verticalSpeed: 1.36, horizontalSpeed: 1.18, angle: 0.25 },
  worldBounds: { minX: -24, maxX: 24, minZ: -360, maxZ: 160, maxY: 22 },
  terrain: { width: 56, depth: 562, segments: 118, amplitude: 3.2, frequency: 0.23, seed: 271 },
  obstacles: [],
  pickups: [
    { id: 2101, type: 'instant', amount: 30, position: { x: -5, y: 4.3, z: 92 }, radius: 1.03 },
    { id: 2102, type: 'instant', amount: 32, position: { x: -2, y: 3.9, z: 16 }, radius: 1.03 },
    { id: 2103, type: 'refill', amount: 56, refillRate: 29, position: { x: 1, y: 3.4, z: -66 }, radius: 1.28 },
    { id: 2104, type: 'instant', amount: 38, position: { x: 5, y: 3.1, z: -164 }, radius: 1.03 },
    { id: 2105, type: 'refill', amount: 58, refillRate: 29, position: { x: 7, y: 2.8, z: -294 }, radius: 1.28 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: 0, y: 6.2, z: -92 }, size: { x: 24, y: 1.35, z: 312 } }
  ],
  walls: [
    { type: 'wall', position: { x: -12.7, y: 3.0, z: -92 }, size: { x: 1.1, y: 5.8, z: 312 } },
    { type: 'wall', position: { x: 12.7, y: 3.0, z: -92 }, size: { x: 1.1, y: 5.8, z: 312 } }
  ],
  tutorialMessages: ['The shelf stays low for a long time.', 'Use refills as rest points.', 'Do not pop up before the exit.'],
  scoreMultiplier: 4.58,
  visualTheme: { terrain: 0x1d252e }
};
