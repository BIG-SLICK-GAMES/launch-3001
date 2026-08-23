export default {
  id: 18,
  name: 'Fuel Sweep',
  description: 'A sweeping S-route that requires collecting most of the fuel.',
  gravity: -5.02,
  thrustPower: 8.28,
  steeringPower: 4.65,
  damping: 0.984,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.6, verticalUp: 8.1, verticalDown: 10.4 },
  fuelBurnRate: 12.65,
  launchPad: { position: { x: 9, y: 0.1, z: 134 }, size: { x: 4, y: 0.2, z: 4 } },
  landingPad: { position: { x: -9, y: 0.1, z: -280 }, size: { x: 3.5, y: 0.2, z: 3.5 } },
  landingThresholds: { verticalSpeed: 1.44, horizontalSpeed: 1.26, angle: 0.27 },
  worldBounds: { minX: -25, maxX: 25, minZ: -312, maxZ: 142, maxY: 23 },
  terrain: { width: 58, depth: 492, segments: 112, amplitude: 3.0, frequency: 0.22, seed: 229 },
  obstacles: [
    { type: 'wall', position: { x: 0, y: 2, z: 24 }, size: { x: 2, y: 3.8, z: 34 } },
    { type: 'wall', position: { x: -8, y: 2, z: -78 }, size: { x: 1.4, y: 3.8, z: 30 } },
    { type: 'wall', position: { x: 8, y: 2, z: -164 }, size: { x: 1.4, y: 3.8, z: 30 } }
  ],
  pickups: [
    { id: 1801, type: 'instant', amount: 28, position: { x: 7, y: 4.6, z: 82 }, radius: 1.06 },
    { id: 1802, type: 'instant', amount: 30, position: { x: 1, y: 4.2, z: 22 }, radius: 1.06 },
    { id: 1803, type: 'instant', amount: 32, position: { x: -7, y: 3.8, z: -54 }, radius: 1.06 },
    { id: 1804, type: 'refill', amount: 50, refillRate: 28, position: { x: -2, y: 3.5, z: -122 }, radius: 1.32 },
    { id: 1805, type: 'instant', amount: 36, position: { x: 6, y: 3.2, z: -190 }, radius: 1.06 },
    { id: 1806, type: 'refill', amount: 50, refillRate: 28, position: { x: -9, y: 3.0, z: -256 }, radius: 1.32 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['Sweep through the whole fuel line.', 'Missing fuel makes the end tight.', 'The landing pad is small and left.'],
  scoreMultiplier: 3.96,
  visualTheme: { terrain: 0x202934 }
};
