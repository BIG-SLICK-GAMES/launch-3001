export default {
  id: 7,
  name: 'Needle Pass',
  description: 'Final tutorial route through a low passage with stock-rocket fuel margins.',
  gravity: -4.58,
  thrustPower: 7.8,
  steeringPower: 4.25,
  damping: 0.988,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7, verticalUp: 7.5, verticalDown: 9.6 },
  fuelBurnRate: 10.9,
  launchPad: { position: { x: 7, y: 0.1, z: 70 }, size: { x: 4.6, y: 0.2, z: 4.6 } },
  landingPad: { position: { x: -8, y: 0.1, z: -144 }, size: { x: 4.4, y: 0.2, z: 4.4 } },
  landingThresholds: { verticalSpeed: 1.8, horizontalSpeed: 1.55, angle: 0.35 },
  worldBounds: { minX: -21, maxX: 21, minZ: -168, maxZ: 78, maxY: 24 },
  terrain: { width: 52, depth: 264, segments: 90, amplitude: 2.3, frequency: 0.2, seed: 71 },
  obstacles: [
    { type: 'wall', position: { x: 0, y: 1.65, z: 22 }, size: { x: 4.2, y: 3.1, z: 1.6 } },
    { type: 'wall', position: { x: -5.8, y: 1.8, z: -28 }, size: { x: 1.45, y: 3.35, z: 10 } },
    { type: 'wall', position: { x: 5.2, y: 1.8, z: -58 }, size: { x: 1.45, y: 3.35, z: 11 } },
    { type: 'wall', position: { x: -4.2, y: 1.8, z: -94 }, size: { x: 1.45, y: 3.35, z: 11 } }
  ],
  pickups: [
    { id: 701, type: 'instant', amount: 22, position: { x: 5, y: 4.8, z: 38 }, radius: 1.22 },
    { id: 702, type: 'instant', amount: 24, position: { x: 1, y: 5.0, z: 2 }, radius: 1.22 },
    { id: 703, type: 'instant', amount: 24, position: { x: -3, y: 4.4, z: -36 }, radius: 1.22 },
    { id: 704, type: 'instant', amount: 26, position: { x: 2, y: 4.0, z: -72 }, radius: 1.22 },
    { id: 705, type: 'instant', amount: 28, position: { x: -6, y: 3.7, z: -110 }, radius: 1.22 },
    { id: 706, type: 'refill', amount: 42, refillRate: 26, position: { x: -8, y: 3.2, z: -130 }, radius: 1.5 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: -1, y: 7.0, z: -42 }, size: { x: 23, y: 1.4, z: 142 } }
  ],
  walls: [
    { type: 'wall', position: { x: -12.4, y: 3, z: -42 }, size: { x: 1.1, y: 6, z: 142 } },
    { type: 'wall', position: { x: 12.4, y: 3, z: -42 }, size: { x: 1.1, y: 6, z: 142 } }
  ],
  tutorialMessages: ['Final tutorial: the droplets mark the safe route.', 'Keep level through the low ground shelf.', 'Hover inside the double-ring refill before landing.'],
  scoreMultiplier: 2.15,
  visualTheme: { terrain: 0x1e232c }
};
