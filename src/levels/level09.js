export default {
  id: 9,
  name: 'Split Fuel',
  description: 'Two fuel lanes reward early line choice.',
  gravity: -4.66,
  thrustPower: 7.88,
  steeringPower: 4.35,
  damping: 0.988,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.15, verticalUp: 7.6, verticalDown: 9.8 },
  fuelBurnRate: 11.25,
  launchPad: { position: { x: 0, y: 0.1, z: 82 }, size: { x: 4.5, y: 0.2, z: 4.5 } },
  landingPad: { position: { x: -7, y: 0.1, z: -166 }, size: { x: 4.1, y: 0.2, z: 4.1 } },
  landingThresholds: { verticalSpeed: 1.68, horizontalSpeed: 1.45, angle: 0.32 },
  worldBounds: { minX: -25, maxX: 25, minZ: -190, maxZ: 90, maxY: 25 },
  terrain: { width: 58, depth: 304, segments: 94, amplitude: 2.1, frequency: 0.18, seed: 97 },
  obstacles: [
    { type: 'wall', position: { x: 0, y: 2, z: -30 }, size: { x: 2.2, y: 3.8, z: 36 } }
  ],
  pickups: [
    { id: 901, type: 'instant', amount: 20, position: { x: -6, y: 4.8, z: 44 }, radius: 1.15 },
    { id: 902, type: 'instant', amount: 20, position: { x: 6, y: 4.8, z: 44 }, radius: 1.15 },
    { id: 903, type: 'instant', amount: 28, position: { x: -7, y: 4.2, z: -18 }, radius: 1.15 },
    { id: 904, type: 'instant', amount: 28, position: { x: 7, y: 4.2, z: -18 }, radius: 1.15 },
    { id: 905, type: 'instant', amount: 30, position: { x: -6, y: 3.8, z: -98 }, radius: 1.15 },
    { id: 906, type: 'refill', amount: 36, refillRate: 24, position: { x: -7, y: 3.1, z: -144 }, radius: 1.36 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['Choose a fuel lane early.', 'Avoid crossing late over the divider.', 'Use the refill if your approach is slow.'],
  scoreMultiplier: 2.42,
  visualTheme: { terrain: 0x222934 }
};
