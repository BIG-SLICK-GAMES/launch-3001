export default {
  id: 23,
  name: 'Triple Gate',
  description: 'Three gate sets stacked across a long approach.',
  gravity: -5.22,
  thrustPower: 8.48,
  steeringPower: 4.78,
  damping: 0.982,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.85, verticalUp: 8.4, verticalDown: 10.6 },
  fuelBurnRate: 13.4,
  launchPad: { position: { x: -9, y: 0.1, z: 164 }, size: { x: 3.8, y: 0.2, z: 3.8 } },
  landingPad: { position: { x: 9, y: 0.1, z: -358 }, size: { x: 3.1, y: 0.2, z: 3.1 } },
  landingThresholds: { verticalSpeed: 1.32, horizontalSpeed: 1.14, angle: 0.24 },
  worldBounds: { minX: -25, maxX: 25, minZ: -392, maxZ: 172, maxY: 22 },
  terrain: { width: 58, depth: 610, segments: 122, amplitude: 3.3, frequency: 0.23, seed: 307 },
  obstacles: [
    { type: 'wall', position: { x: -5, y: 2.1, z: 44 }, size: { x: 1.3, y: 4, z: 38 } },
    { type: 'wall', position: { x: 5, y: 2.1, z: -52 }, size: { x: 1.3, y: 4, z: 38 } },
    { type: 'wall', position: { x: -5, y: 2.1, z: -148 }, size: { x: 1.3, y: 4, z: 38 } },
    { type: 'wall', position: { x: 5, y: 2.1, z: -244 }, size: { x: 1.3, y: 4, z: 38 } }
  ],
  pickups: [
    { id: 2301, type: 'instant', amount: 32, position: { x: -7, y: 4.4, z: 104 }, radius: 1.02 },
    { id: 2302, type: 'instant', amount: 34, position: { x: -1, y: 4.0, z: 28 }, radius: 1.02 },
    { id: 2303, type: 'refill', amount: 58, refillRate: 30, position: { x: 5, y: 3.5, z: -58 }, radius: 1.25 },
    { id: 2304, type: 'instant', amount: 40, position: { x: -5, y: 3.1, z: -166 }, radius: 1.02 },
    { id: 2305, type: 'instant', amount: 42, position: { x: 5, y: 2.9, z: -254 }, radius: 1.02 },
    { id: 2306, type: 'refill', amount: 60, refillRate: 30, position: { x: 9, y: 2.7, z: -332 }, radius: 1.25 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['Commit to each gate early.', 'Refill at the middle gate.', 'The last gate sets the landing line.'],
  scoreMultiplier: 5.02,
  visualTheme: { terrain: 0x212833 }
};
