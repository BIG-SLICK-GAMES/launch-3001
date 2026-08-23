export default {
  id: 26,
  name: 'Fuel Debt',
  description: 'A high-burn route that depends on refill discipline.',
  gravity: -5.34,
  thrustPower: 8.6,
  steeringPower: 4.85,
  damping: 0.981,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 8, verticalUp: 8.5, verticalDown: 10.8 },
  fuelBurnRate: 13.9,
  launchPad: { position: { x: -8, y: 0.1, z: 182 }, size: { x: 3.7, y: 0.2, z: 3.7 } },
  landingPad: { position: { x: 8, y: 0.1, z: -410 }, size: { x: 2.9, y: 0.2, z: 2.9 } },
  landingThresholds: { verticalSpeed: 1.26, horizontalSpeed: 1.08, angle: 0.22 },
  worldBounds: { minX: -25, maxX: 25, minZ: -448, maxZ: 190, maxY: 22 },
  terrain: { width: 58, depth: 690, segments: 128, amplitude: 3.45, frequency: 0.24, seed: 379 },
  obstacles: [
    { type: 'wall', position: { x: 0, y: 2, z: -10 }, size: { x: 2, y: 3.8, z: 70 } },
    { type: 'wall', position: { x: 7, y: 2, z: -182 }, size: { x: 1.2, y: 3.8, z: 70 } }
  ],
  pickups: [
    { id: 2601, type: 'instant', amount: 34, position: { x: -7, y: 4.2, z: 120 }, radius: 0.98 },
    { id: 2602, type: 'refill', amount: 68, refillRate: 32, position: { x: -2, y: 3.8, z: 38 }, radius: 1.22 },
    { id: 2603, type: 'instant', amount: 42, position: { x: 5, y: 3.4, z: -66 }, radius: 0.98 },
    { id: 2604, type: 'refill', amount: 70, refillRate: 32, position: { x: -5, y: 3.1, z: -184 }, radius: 1.22 },
    { id: 2605, type: 'instant', amount: 50, position: { x: 5, y: 2.8, z: -294 }, radius: 0.98 },
    { id: 2606, type: 'refill', amount: 66, refillRate: 31, position: { x: 8, y: 2.6, z: -382 }, radius: 1.22 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['Fuel burn is higher here.', 'Do not rush through refills.', 'Collect nearly everything.'],
  scoreMultiplier: 5.75,
  visualTheme: { terrain: 0x202731 }
};
