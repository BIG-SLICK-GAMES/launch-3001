export default {
  id: 16,
  name: 'Stepdown',
  description: 'A descending line of fuel through staggered blockers.',
  gravity: -4.94,
  thrustPower: 8.2,
  steeringPower: 4.6,
  damping: 0.985,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.5, verticalUp: 8, verticalDown: 10.3 },
  fuelBurnRate: 12.35,
  launchPad: { position: { x: 8, y: 0.1, z: 122 }, size: { x: 4.1, y: 0.2, z: 4.1 } },
  landingPad: { position: { x: 8, y: 0.1, z: -252 }, size: { x: 3.6, y: 0.2, z: 3.6 } },
  landingThresholds: { verticalSpeed: 1.48, horizontalSpeed: 1.3, angle: 0.28 },
  worldBounds: { minX: -25, maxX: 25, minZ: -282, maxZ: 130, maxY: 23 },
  terrain: { width: 58, depth: 448, segments: 108, amplitude: 2.8, frequency: 0.21, seed: 193 },
  obstacles: [
    { type: 'wall', position: { x: 2, y: 1.9, z: 28 }, size: { x: 8, y: 3.6, z: 1.6 } },
    { type: 'wall', position: { x: -4, y: 1.9, z: -48 }, size: { x: 8, y: 3.6, z: 1.6 } },
    { type: 'wall', position: { x: 4, y: 1.9, z: -126 }, size: { x: 8, y: 3.6, z: 1.6 } }
  ],
  pickups: [
    { id: 1601, type: 'instant', amount: 26, position: { x: 7, y: 4.6, z: 74 }, radius: 1.08 },
    { id: 1602, type: 'instant', amount: 28, position: { x: 2, y: 4.2, z: 18 }, radius: 1.08 },
    { id: 1603, type: 'instant', amount: 30, position: { x: -3, y: 3.9, z: -54 }, radius: 1.08 },
    { id: 1604, type: 'instant', amount: 32, position: { x: 3, y: 3.6, z: -128 }, radius: 1.08 },
    { id: 1605, type: 'refill', amount: 48, refillRate: 27, position: { x: 8, y: 3.0, z: -226 }, radius: 1.34 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['Let the route step down gradually.', 'Do not climb over blockers.', 'Prepare early for the small pad.'],
  scoreMultiplier: 3.6,
  visualTheme: { terrain: 0x222832 }
};
