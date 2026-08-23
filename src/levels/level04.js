export default {
  id: 4,
  name: 'Canyon Run',
  description: 'Tall terrain, a narrow canyon, and fuel droplets through the safe lane.',
  gravity: -4.35,
  thrustPower: 7.55,
  steeringPower: 4.0,
  damping: 0.989,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 6.5, verticalUp: 7.2, verticalDown: 9 },
  fuelBurnRate: 10.8,
  launchPad: { position: { x: 0, y: 0.1, z: 54 }, size: { x: 5, y: 0.2, z: 5 } },
  landingPad: { position: { x: -8, y: 0.1, z: -98 }, size: { x: 4.6, y: 0.2, z: 4.6 } },
  landingThresholds: { verticalSpeed: 1.9, horizontalSpeed: 1.65, angle: 0.38 },
  worldBounds: { minX: -24, maxX: 24, minZ: -118, maxZ: 62, maxY: 28 },
  terrain: { width: 56, depth: 196, segments: 74, amplitude: 2.0, frequency: 0.18, seed: 29 },
  obstacles: [
    { type: 'wall', position: { x: -15, y: 2.7, z: -10 }, size: { x: 2.2, y: 5.2, z: 64 } },
    { type: 'wall', position: { x: 14, y: 2.7, z: -12 }, size: { x: 2.2, y: 5.2, z: 68 } }
  ],
  pickups: [
    { id: 401, type: 'instant', amount: 18, position: { x: -1, y: 4.5, z: 24 }, radius: 1.1 },
    { id: 402, type: 'instant', amount: 20, position: { x: -3, y: 5.3, z: -8 }, radius: 1.1 },
    { id: 403, type: 'instant', amount: 20, position: { x: -5, y: 4.8, z: -42 }, radius: 1.1 },
    { id: 404, type: 'instant', amount: 24, position: { x: -7, y: 4.1, z: -72 }, radius: 1.1 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['Stay centered between the canyon walls.', 'Collect fuel before the final turn.', 'Touch down softly; the pad is smaller now.'],
  scoreMultiplier: 1.42,
  visualTheme: { terrain: 0x242832 }
};
