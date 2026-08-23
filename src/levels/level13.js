export default {
  id: 13,
  name: 'Low Battery',
  description: 'A fuel-management route with fewer instant droplets and stronger refill value.',
  gravity: -4.82,
  thrustPower: 8.08,
  steeringPower: 4.52,
  damping: 0.986,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.35, verticalUp: 7.9, verticalDown: 10.1 },
  fuelBurnRate: 11.9,
  launchPad: { position: { x: 8, y: 0.1, z: 104 }, size: { x: 4.3, y: 0.2, z: 4.3 } },
  landingPad: { position: { x: -8, y: 0.1, z: -214 }, size: { x: 3.8, y: 0.2, z: 3.8 } },
  landingThresholds: { verticalSpeed: 1.55, horizontalSpeed: 1.35, angle: 0.29 },
  worldBounds: { minX: -25, maxX: 25, minZ: -240, maxZ: 112, maxY: 24 },
  terrain: { width: 58, depth: 382, segments: 102, amplitude: 2.5, frequency: 0.2, seed: 151 },
  obstacles: [
    { type: 'wall', position: { x: 0, y: 2, z: -22 }, size: { x: 2, y: 3.8, z: 60 } }
  ],
  pickups: [
    { id: 1301, type: 'instant', amount: 26, position: { x: 5, y: 4.7, z: 56 }, radius: 1.1 },
    { id: 1302, type: 'instant', amount: 28, position: { x: 1, y: 4.2, z: 0 }, radius: 1.1 },
    { id: 1303, type: 'refill', amount: 58, refillRate: 28, position: { x: -5, y: 3.6, z: -74 }, radius: 1.42 },
    { id: 1304, type: 'instant', amount: 34, position: { x: -8, y: 3.3, z: -158 }, radius: 1.1 },
    { id: 1305, type: 'refill', amount: 44, refillRate: 26, position: { x: -8, y: 3.0, z: -194 }, radius: 1.34 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['This route has fewer instant drops.', 'Hover inside refill droplets to top up.', 'Spend fuel carefully on final approach.'],
  scoreMultiplier: 3.08,
  visualTheme: { terrain: 0x202832 }
};
