export default {
  id: 28,
  name: 'Black Run',
  description: 'A long endurance route with tight fuel and landing margins.',
  gravity: -5.42,
  thrustPower: 8.68,
  steeringPower: 4.9,
  damping: 0.981,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 8.1, verticalUp: 8.6, verticalDown: 10.9 },
  fuelBurnRate: 14.2,
  launchPad: { position: { x: 0, y: 0.1, z: 194 }, size: { x: 3.6, y: 0.2, z: 3.6 } },
  landingPad: { position: { x: 9, y: 0.1, z: -448 }, size: { x: 2.8, y: 0.2, z: 2.8 } },
  landingThresholds: { verticalSpeed: 1.22, horizontalSpeed: 1.04, angle: 0.21 },
  worldBounds: { minX: -25, maxX: 25, minZ: -488, maxZ: 202, maxY: 21 },
  terrain: { width: 58, depth: 748, segments: 132, amplitude: 3.55, frequency: 0.25, seed: 419 },
  obstacles: [
    { type: 'wall', position: { x: -6, y: 2, z: 46 }, size: { x: 1.2, y: 3.8, z: 52 } },
    { type: 'wall', position: { x: 6, y: 2, z: -84 }, size: { x: 1.2, y: 3.8, z: 52 } },
    { type: 'wall', position: { x: -6, y: 2, z: -214 }, size: { x: 1.2, y: 3.8, z: 52 } },
    { type: 'wall', position: { x: 6, y: 2, z: -324 }, size: { x: 1.2, y: 3.8, z: 52 } }
  ],
  pickups: [
    { id: 2801, type: 'instant', amount: 36, position: { x: 0, y: 4.0, z: 132 }, radius: 0.96 },
    { id: 2802, type: 'instant', amount: 40, position: { x: -5, y: 3.6, z: 50 }, radius: 0.96 },
    { id: 2803, type: 'refill', amount: 72, refillRate: 33, position: { x: 5, y: 3.2, z: -72 }, radius: 1.18 },
    { id: 2804, type: 'instant', amount: 50, position: { x: -5, y: 2.9, z: -204 }, radius: 0.96 },
    { id: 2805, type: 'instant', amount: 52, position: { x: 6, y: 2.7, z: -316 }, radius: 0.96 },
    { id: 2806, type: 'refill', amount: 74, refillRate: 33, position: { x: 9, y: 2.5, z: -418 }, radius: 1.18 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['This is an endurance run.', 'Treat refills as checkpoints.', 'Keep landing fuel in reserve.'],
  scoreMultiplier: 6.28,
  visualTheme: { terrain: 0x1f242c }
};
