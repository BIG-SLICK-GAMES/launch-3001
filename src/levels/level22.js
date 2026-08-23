export default {
  id: 22,
  name: 'Marker Maze',
  description: 'A maze-like obstacle route with a clear fuel breadcrumb path.',
  gravity: -5.18,
  thrustPower: 8.44,
  steeringPower: 4.75,
  damping: 0.983,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.8, verticalUp: 8.3, verticalDown: 10.6 },
  fuelBurnRate: 13.25,
  launchPad: { position: { x: 9, y: 0.1, z: 158 }, size: { x: 3.9, y: 0.2, z: 3.9 } },
  landingPad: { position: { x: -9, y: 0.1, z: -342 }, size: { x: 3.1, y: 0.2, z: 3.1 } },
  landingThresholds: { verticalSpeed: 1.34, horizontalSpeed: 1.16, angle: 0.24 },
  worldBounds: { minX: -25, maxX: 25, minZ: -376, maxZ: 166, maxY: 22 },
  terrain: { width: 58, depth: 586, segments: 120, amplitude: 3.25, frequency: 0.23, seed: 283 },
  obstacles: [
    { type: 'wall', position: { x: 1, y: 2, z: 52 }, size: { x: 1.3, y: 3.8, z: 42 } },
    { type: 'wall', position: { x: -7, y: 2, z: -28 }, size: { x: 1.3, y: 3.8, z: 52 } },
    { type: 'wall', position: { x: 7, y: 2, z: -112 }, size: { x: 1.3, y: 3.8, z: 52 } },
    { type: 'wall', position: { x: -4, y: 2, z: -206 }, size: { x: 1.3, y: 3.8, z: 48 } }
  ],
  pickups: [
    { id: 2201, type: 'instant', amount: 30, position: { x: 7, y: 4.4, z: 98 }, radius: 1.02 },
    { id: 2202, type: 'instant', amount: 32, position: { x: 2, y: 4.0, z: 34 }, radius: 1.02 },
    { id: 2203, type: 'instant', amount: 34, position: { x: -6, y: 3.7, z: -42 }, radius: 1.02 },
    { id: 2204, type: 'refill', amount: 56, refillRate: 29, position: { x: 3, y: 3.3, z: -126 }, radius: 1.26 },
    { id: 2205, type: 'instant', amount: 40, position: { x: -4, y: 3.0, z: -224 }, radius: 1.02 },
    { id: 2206, type: 'refill', amount: 58, refillRate: 29, position: { x: -9, y: 2.8, z: -316 }, radius: 1.26 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['The fuel line shows the maze path.', 'Do not overcorrect around posts.', 'Use the last refill to slow down.'],
  scoreMultiplier: 4.8,
  visualTheme: { terrain: 0x202832 }
};
