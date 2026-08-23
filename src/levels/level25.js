export default {
  id: 25,
  name: 'The Gauntlet',
  description: 'A long obstacle gauntlet for upgraded handling and fuel management.',
  gravity: -5.3,
  thrustPower: 8.56,
  steeringPower: 4.82,
  damping: 0.982,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.95, verticalUp: 8.5, verticalDown: 10.7 },
  fuelBurnRate: 13.7,
  launchPad: { position: { x: 0, y: 0.1, z: 176 }, size: { x: 3.8, y: 0.2, z: 3.8 } },
  landingPad: { position: { x: 0, y: 0.1, z: -392 }, size: { x: 3, y: 0.2, z: 3 } },
  landingThresholds: { verticalSpeed: 1.28, horizontalSpeed: 1.1, angle: 0.23 },
  worldBounds: { minX: -24, maxX: 24, minZ: -428, maxZ: 184, maxY: 22 },
  terrain: { width: 56, depth: 662, segments: 126, amplitude: 3.4, frequency: 0.24, seed: 353 },
  obstacles: [
    { type: 'wall', position: { x: -6, y: 2.1, z: 64 }, size: { x: 1.2, y: 4, z: 34 } },
    { type: 'wall', position: { x: 6, y: 2.1, z: -24 }, size: { x: 1.2, y: 4, z: 34 } },
    { type: 'wall', position: { x: -6, y: 2.1, z: -112 }, size: { x: 1.2, y: 4, z: 34 } },
    { type: 'wall', position: { x: 6, y: 2.1, z: -200 }, size: { x: 1.2, y: 4, z: 34 } },
    { type: 'wall', position: { x: 0, y: 1.8, z: -286 }, size: { x: 6, y: 3.4, z: 1.5 } }
  ],
  pickups: [
    { id: 2501, type: 'instant', amount: 34, position: { x: 0, y: 4.3, z: 116 }, radius: 1 },
    { id: 2502, type: 'instant', amount: 36, position: { x: -5, y: 3.9, z: 42 }, radius: 1 },
    { id: 2503, type: 'refill', amount: 62, refillRate: 31, position: { x: 5, y: 3.5, z: -54 }, radius: 1.24 },
    { id: 2504, type: 'instant', amount: 44, position: { x: -5, y: 3.1, z: -154 }, radius: 1 },
    { id: 2505, type: 'instant', amount: 46, position: { x: 5, y: 2.9, z: -244 }, radius: 1 },
    { id: 2506, type: 'refill', amount: 64, refillRate: 31, position: { x: 0, y: 2.7, z: -360 }, radius: 1.24 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['The gauntlet chains every skill.', 'Plan turns before the obstacles.', 'Keep fuel for the final brake.'],
  scoreMultiplier: 5.5,
  visualTheme: { terrain: 0x202832 }
};
