export default {
  id: 11,
  name: 'Ladder Canyon',
  description: 'A stepped canyon route with staggered fuel.',
  gravity: -4.74,
  thrustPower: 8,
  steeringPower: 4.45,
  damping: 0.987,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.25, verticalUp: 7.8, verticalDown: 10 },
  fuelBurnRate: 11.6,
  launchPad: { position: { x: -7, y: 0.1, z: 92 }, size: { x: 4.4, y: 0.2, z: 4.4 } },
  landingPad: { position: { x: 9, y: 0.1, z: -188 }, size: { x: 3.9, y: 0.2, z: 3.9 } },
  landingThresholds: { verticalSpeed: 1.6, horizontalSpeed: 1.4, angle: 0.3 },
  worldBounds: { minX: -25, maxX: 25, minZ: -214, maxZ: 100, maxY: 24 },
  terrain: { width: 58, depth: 338, segments: 98, amplitude: 2.35, frequency: 0.19, seed: 127 },
  obstacles: [
    { type: 'wall', position: { x: -11, y: 2.3, z: -20 }, size: { x: 1.2, y: 4.3, z: 124 } },
    { type: 'wall', position: { x: 12, y: 2.3, z: -44 }, size: { x: 1.2, y: 4.3, z: 124 } },
    { type: 'wall', position: { x: 0, y: 1.8, z: -82 }, size: { x: 5.5, y: 3.3, z: 1.6 } }
  ],
  pickups: [
    { id: 1101, type: 'instant', amount: 24, position: { x: -5, y: 4.8, z: 52 }, radius: 1.12 },
    { id: 1102, type: 'instant', amount: 26, position: { x: 1, y: 4.4, z: 10 }, radius: 1.12 },
    { id: 1103, type: 'instant', amount: 28, position: { x: 7, y: 4.1, z: -36 }, radius: 1.12 },
    { id: 1104, type: 'instant', amount: 30, position: { x: 2, y: 3.8, z: -94 }, radius: 1.12 },
    { id: 1105, type: 'refill', amount: 42, refillRate: 25, position: { x: 8, y: 3.1, z: -160 }, radius: 1.34 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['The canyon alternates left and right.', 'Keep your turns shallow.', 'Do not arrive at the refill too fast.'],
  scoreMultiplier: 2.75,
  visualTheme: { terrain: 0x232832 }
};
