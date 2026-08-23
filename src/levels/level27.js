export default {
  id: 27,
  name: 'Crawlspace',
  description: 'A very low route with narrow side clearance.',
  gravity: -5.38,
  thrustPower: 8.64,
  steeringPower: 4.88,
  damping: 0.981,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 8.05, verticalUp: 8.6, verticalDown: 10.8 },
  fuelBurnRate: 14.05,
  launchPad: { position: { x: 6, y: 0.1, z: 188 }, size: { x: 3.7, y: 0.2, z: 3.7 } },
  landingPad: { position: { x: -6, y: 0.1, z: -428 }, size: { x: 2.9, y: 0.2, z: 2.9 } },
  landingThresholds: { verticalSpeed: 1.24, horizontalSpeed: 1.06, angle: 0.22 },
  worldBounds: { minX: -24, maxX: 24, minZ: -466, maxZ: 196, maxY: 21 },
  terrain: { width: 56, depth: 718, segments: 130, amplitude: 3.5, frequency: 0.25, seed: 397 },
  obstacles: [
    { type: 'wall', position: { x: -11.7, y: 2.8, z: -118 }, size: { x: 1, y: 5.4, z: 430 } },
    { type: 'wall', position: { x: 11.7, y: 2.8, z: -118 }, size: { x: 1, y: 5.4, z: 430 } }
  ],
  pickups: [
    { id: 2701, type: 'instant', amount: 36, position: { x: 5, y: 4.0, z: 128 }, radius: 0.98 },
    { id: 2702, type: 'instant', amount: 38, position: { x: 1, y: 3.6, z: 42 }, radius: 0.98 },
    { id: 2703, type: 'refill', amount: 70, refillRate: 32, position: { x: -3, y: 3.1, z: -70 }, radius: 1.2 },
    { id: 2704, type: 'instant', amount: 48, position: { x: -5, y: 2.9, z: -202 }, radius: 0.98 },
    { id: 2705, type: 'refill', amount: 72, refillRate: 32, position: { x: -6, y: 2.5, z: -396 }, radius: 1.2 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: 0, y: 5.8, z: -118 }, size: { x: 22, y: 1.35, z: 430 } }
  ],
  walls: [],
  tutorialMessages: ['This crawlspace is very low.', 'Stay inside the double-ring refills.', 'Small inputs beat big saves.'],
  scoreMultiplier: 6,
  visualTheme: { terrain: 0x1d242d }
};
