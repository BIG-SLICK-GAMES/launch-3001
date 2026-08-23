export default {
  id: 10,
  name: 'Underhook',
  description: 'A wide overhang with a late landing turn.',
  gravity: -4.7,
  thrustPower: 7.95,
  steeringPower: 4.4,
  damping: 0.987,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.2, verticalUp: 7.7, verticalDown: 9.9 },
  fuelBurnRate: 11.45,
  launchPad: { position: { x: 7, y: 0.1, z: 88 }, size: { x: 4.4, y: 0.2, z: 4.4 } },
  landingPad: { position: { x: -8, y: 0.1, z: -176 }, size: { x: 4, y: 0.2, z: 4 } },
  landingThresholds: { verticalSpeed: 1.64, horizontalSpeed: 1.42, angle: 0.31 },
  worldBounds: { minX: -25, maxX: 25, minZ: -202, maxZ: 96, maxY: 24 },
  terrain: { width: 58, depth: 322, segments: 96, amplitude: 2.2, frequency: 0.19, seed: 109 },
  obstacles: [
    { type: 'wall', position: { x: 8, y: 2, z: -84 }, size: { x: 1.4, y: 3.7, z: 24 } }
  ],
  pickups: [
    { id: 1001, type: 'instant', amount: 24, position: { x: 5, y: 4.7, z: 48 }, radius: 1.14 },
    { id: 1002, type: 'instant', amount: 24, position: { x: 1, y: 4.4, z: 6 }, radius: 1.14 },
    { id: 1003, type: 'instant', amount: 28, position: { x: -3, y: 4.0, z: -42 }, radius: 1.14 },
    { id: 1004, type: 'instant', amount: 30, position: { x: -7, y: 3.6, z: -108 }, radius: 1.14 },
    { id: 1005, type: 'refill', amount: 38, refillRate: 25, position: { x: -8, y: 3.0, z: -154 }, radius: 1.35 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: 0, y: 7.0, z: -22 }, size: { x: 28, y: 1.35, z: 104 } }
  ],
  walls: [],
  tutorialMessages: ['Stay low through the overhang.', 'Begin the left turn before the exit.', 'Use the refill before the landing pad.'],
  scoreMultiplier: 2.58,
  visualTheme: { terrain: 0x202833 }
};
