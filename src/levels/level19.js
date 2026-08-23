export default {
  id: 19,
  name: 'Broken Roof',
  description: 'Short roof sections with gaps between them.',
  gravity: -5.06,
  thrustPower: 8.32,
  steeringPower: 4.68,
  damping: 0.984,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.65, verticalUp: 8.2, verticalDown: 10.4 },
  fuelBurnRate: 12.8,
  launchPad: { position: { x: -8, y: 0.1, z: 140 }, size: { x: 4, y: 0.2, z: 4 } },
  landingPad: { position: { x: 4, y: 0.1, z: -294 }, size: { x: 3.5, y: 0.2, z: 3.5 } },
  landingThresholds: { verticalSpeed: 1.42, horizontalSpeed: 1.24, angle: 0.26 },
  worldBounds: { minX: -25, maxX: 25, minZ: -326, maxZ: 148, maxY: 23 },
  terrain: { width: 58, depth: 514, segments: 114, amplitude: 3.1, frequency: 0.22, seed: 241 },
  obstacles: [
    { type: 'wall', position: { x: 7, y: 1.9, z: -92 }, size: { x: 1.4, y: 3.6, z: 24 } }
  ],
  pickups: [
    { id: 1901, type: 'instant', amount: 28, position: { x: -6, y: 4.5, z: 84 }, radius: 1.05 },
    { id: 1902, type: 'instant', amount: 30, position: { x: -2, y: 4.1, z: 20 }, radius: 1.05 },
    { id: 1903, type: 'refill', amount: 50, refillRate: 28, position: { x: 2, y: 3.7, z: -48 }, radius: 1.3 },
    { id: 1904, type: 'instant', amount: 36, position: { x: 5, y: 3.3, z: -142 }, radius: 1.05 },
    { id: 1905, type: 'instant', amount: 36, position: { x: 3, y: 3.1, z: -218 }, radius: 1.05 },
    { id: 1906, type: 'refill', amount: 52, refillRate: 28, position: { x: 4, y: 2.9, z: -272 }, radius: 1.3 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: -2, y: 6.8, z: 36 }, size: { x: 27, y: 1.35, z: 74 } },
    { type: 'caveRoof', position: { x: 1, y: 6.5, z: -112 }, size: { x: 25, y: 1.35, z: 88 } },
    { type: 'caveRoof', position: { x: 0, y: 6.4, z: -226 }, size: { x: 24, y: 1.35, z: 58 } }
  ],
  walls: [],
  tutorialMessages: ['Each roof has a recovery gap.', 'Use the gaps to correct height.', 'Avoid climbing into the last roof.'],
  scoreMultiplier: 4.16,
  visualTheme: { terrain: 0x1e2630 }
};
