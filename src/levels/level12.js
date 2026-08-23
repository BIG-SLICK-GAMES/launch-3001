export default {
  id: 12,
  name: 'Gate Thread',
  description: 'A sequence of gate pillars with fuel between each gap.',
  gravity: -4.78,
  thrustPower: 8.05,
  steeringPower: 4.5,
  damping: 0.986,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.3, verticalUp: 7.8, verticalDown: 10.1 },
  fuelBurnRate: 11.75,
  launchPad: { position: { x: 0, y: 0.1, z: 98 }, size: { x: 4.3, y: 0.2, z: 4.3 } },
  landingPad: { position: { x: 0, y: 0.1, z: -202 }, size: { x: 3.8, y: 0.2, z: 3.8 } },
  landingThresholds: { verticalSpeed: 1.58, horizontalSpeed: 1.38, angle: 0.3 },
  worldBounds: { minX: -24, maxX: 24, minZ: -228, maxZ: 106, maxY: 24 },
  terrain: { width: 56, depth: 360, segments: 100, amplitude: 2.45, frequency: 0.2, seed: 139 },
  obstacles: [
    { type: 'wall', position: { x: -6, y: 2.1, z: 26 }, size: { x: 1.4, y: 4, z: 18 } },
    { type: 'wall', position: { x: 6, y: 2.1, z: -24 }, size: { x: 1.4, y: 4, z: 18 } },
    { type: 'wall', position: { x: -6, y: 2.1, z: -76 }, size: { x: 1.4, y: 4, z: 18 } },
    { type: 'wall', position: { x: 6, y: 2.1, z: -126 }, size: { x: 1.4, y: 4, z: 18 } }
  ],
  pickups: [
    { id: 1201, type: 'instant', amount: 24, position: { x: 0, y: 4.8, z: 56 }, radius: 1.12 },
    { id: 1202, type: 'instant', amount: 26, position: { x: -2, y: 4.4, z: 8 }, radius: 1.12 },
    { id: 1203, type: 'instant', amount: 28, position: { x: 2, y: 4.1, z: -46 }, radius: 1.12 },
    { id: 1204, type: 'instant', amount: 30, position: { x: -2, y: 3.8, z: -102 }, radius: 1.12 },
    { id: 1205, type: 'instant', amount: 32, position: { x: 0, y: 3.5, z: -154 }, radius: 1.12 },
    { id: 1206, type: 'refill', amount: 42, refillRate: 25, position: { x: 0, y: 3.0, z: -184 }, radius: 1.32 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['Thread the gate gaps.', 'The fuel marks the center line.', 'Brake early for the final pad.'],
  scoreMultiplier: 2.92,
  visualTheme: { terrain: 0x202a34 }
};
