export default {
  id: 14,
  name: 'Twin Overhangs',
  description: 'Two separate roof shelves with a clear recovery gap.',
  gravity: -4.86,
  thrustPower: 8.12,
  steeringPower: 4.55,
  damping: 0.986,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.4, verticalUp: 7.9, verticalDown: 10.2 },
  fuelBurnRate: 12.05,
  launchPad: { position: { x: -8, y: 0.1, z: 110 }, size: { x: 4.2, y: 0.2, z: 4.2 } },
  landingPad: { position: { x: 9, y: 0.1, z: -226 }, size: { x: 3.7, y: 0.2, z: 3.7 } },
  landingThresholds: { verticalSpeed: 1.52, horizontalSpeed: 1.34, angle: 0.29 },
  worldBounds: { minX: -25, maxX: 25, minZ: -254, maxZ: 118, maxY: 24 },
  terrain: { width: 58, depth: 404, segments: 104, amplitude: 2.6, frequency: 0.2, seed: 163 },
  obstacles: [
    { type: 'wall', position: { x: -8, y: 2.1, z: -92 }, size: { x: 1.3, y: 4, z: 20 } },
    { type: 'wall', position: { x: 8, y: 2.1, z: -146 }, size: { x: 1.3, y: 4, z: 20 } }
  ],
  pickups: [
    { id: 1401, type: 'instant', amount: 26, position: { x: -6, y: 4.7, z: 64 }, radius: 1.1 },
    { id: 1402, type: 'instant', amount: 28, position: { x: -2, y: 4.2, z: 12 }, radius: 1.1 },
    { id: 1403, type: 'refill', amount: 42, refillRate: 26, position: { x: 2, y: 3.7, z: -54 }, radius: 1.34 },
    { id: 1404, type: 'instant', amount: 32, position: { x: 7, y: 3.5, z: -122 }, radius: 1.1 },
    { id: 1405, type: 'refill', amount: 46, refillRate: 26, position: { x: 9, y: 3.0, z: -204 }, radius: 1.36 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: -2, y: 7.1, z: 8 }, size: { x: 28, y: 1.35, z: 78 } },
    { type: 'caveRoof', position: { x: 2, y: 6.8, z: -132 }, size: { x: 26, y: 1.35, z: 74 } }
  ],
  walls: [],
  tutorialMessages: ['Drop under the first shelf.', 'Use the gap to reset your height.', 'Stay low under the second shelf.'],
  scoreMultiplier: 3.24,
  visualTheme: { terrain: 0x1f2731 }
};
