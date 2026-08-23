export default {
  id: 30,
  name: 'Launch 3001',
  description: 'The full final route: long, low, precise, and fuel-tight.',
  gravity: -5.5,
  thrustPower: 8.8,
  steeringPower: 4.95,
  damping: 0.98,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 8.2, verticalUp: 8.8, verticalDown: 11 },
  fuelBurnRate: 14.55,
  launchPad: { position: { x: 0, y: 0.1, z: 208 }, size: { x: 3.5, y: 0.2, z: 3.5 } },
  landingPad: { position: { x: 0, y: 0.1, z: -492 }, size: { x: 2.7, y: 0.2, z: 2.7 } },
  landingThresholds: { verticalSpeed: 1.18, horizontalSpeed: 1, angle: 0.2 },
  worldBounds: { minX: -24, maxX: 24, minZ: -534, maxZ: 216, maxY: 21 },
  terrain: { width: 56, depth: 812, segments: 136, amplitude: 3.7, frequency: 0.26, seed: 467 },
  obstacles: [
    { type: 'wall', position: { x: -6, y: 2, z: 72 }, size: { x: 1.1, y: 3.8, z: 42 } },
    { type: 'wall', position: { x: 6, y: 2, z: -42 }, size: { x: 1.1, y: 3.8, z: 42 } },
    { type: 'wall', position: { x: -6, y: 2, z: -156 }, size: { x: 1.1, y: 3.8, z: 42 } },
    { type: 'wall', position: { x: 6, y: 2, z: -270 }, size: { x: 1.1, y: 3.8, z: 42 } },
    { type: 'wall', position: { x: 0, y: 1.8, z: -380 }, size: { x: 5.5, y: 3.4, z: 1.4 } }
  ],
  pickups: [
    { id: 3001, type: 'instant', amount: 40, position: { x: 0, y: 3.9, z: 144 }, radius: 0.95 },
    { id: 3002, type: 'instant', amount: 44, position: { x: -5, y: 3.5, z: 58 }, radius: 0.95 },
    { id: 3003, type: 'refill', amount: 78, refillRate: 34, position: { x: 5, y: 3.1, z: -58 }, radius: 1.16 },
    { id: 3004, type: 'instant', amount: 54, position: { x: -5, y: 2.8, z: -184 }, radius: 0.95 },
    { id: 3005, type: 'refill', amount: 80, refillRate: 34, position: { x: 5, y: 2.6, z: -306 }, radius: 1.16 },
    { id: 3006, type: 'instant', amount: 58, position: { x: 0, y: 2.4, z: -396 }, radius: 0.95 },
    { id: 3007, type: 'refill', amount: 82, refillRate: 34, position: { x: 0, y: 2.3, z: -462 }, radius: 1.16 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: 0, y: 5.8, z: -54 }, size: { x: 24, y: 1.35, z: 234 } },
    { type: 'caveRoof', position: { x: 0, y: 5.4, z: -332 }, size: { x: 22, y: 1.35, z: 224 } }
  ],
  walls: [
    { type: 'wall', position: { x: -12.2, y: 2.8, z: -194 }, size: { x: 1, y: 5.4, z: 510 } },
    { type: 'wall', position: { x: 12.2, y: 2.8, z: -194 }, size: { x: 1, y: 5.4, z: 510 } }
  ],
  tutorialMessages: ['Final level: every system matters.', 'Use every refill deliberately.', 'Land only when the rocket is completely settled.'],
  scoreMultiplier: 7,
  visualTheme: { terrain: 0x1c222a }
};
