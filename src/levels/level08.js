export default {
  id: 8,
  name: 'Precision Descent',
  description: 'A longer descent route with clear fuel spacing and a tighter final pad.',
  gravity: -4.62,
  thrustPower: 7.85,
  steeringPower: 4.3,
  damping: 0.988,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.1, verticalUp: 7.6, verticalDown: 9.7 },
  fuelBurnRate: 11.1,
  launchPad: { position: { x: -5, y: 0.1, z: 76 }, size: { x: 4.5, y: 0.2, z: 4.5 } },
  landingPad: { position: { x: 6, y: 0.1, z: -154 }, size: { x: 4.2, y: 0.2, z: 4.2 } },
  landingThresholds: { verticalSpeed: 1.72, horizontalSpeed: 1.48, angle: 0.33 },
  worldBounds: { minX: -24, maxX: 24, minZ: -178, maxZ: 84, maxY: 25 },
  terrain: { width: 56, depth: 282, segments: 90, amplitude: 2.0, frequency: 0.18, seed: 83 },
  obstacles: [
    { type: 'wall', position: { x: -8, y: 1.9, z: -18 }, size: { x: 1.4, y: 3.5, z: 18 } },
    { type: 'wall', position: { x: 8, y: 1.9, z: -58 }, size: { x: 1.4, y: 3.5, z: 18 } }
  ],
  pickups: [
    { id: 801, type: 'instant', amount: 22, position: { x: -4, y: 4.8, z: 48 }, radius: 1.22 },
    { id: 802, type: 'instant', amount: 22, position: { x: -2, y: 4.7, z: 16 }, radius: 1.22 },
    { id: 803, type: 'instant', amount: 24, position: { x: 1, y: 4.4, z: -16 }, radius: 1.22 },
    { id: 804, type: 'instant', amount: 26, position: { x: 4, y: 4.0, z: -52 }, radius: 1.22 },
    { id: 805, type: 'instant', amount: 26, position: { x: 6, y: 3.7, z: -88 }, radius: 1.22 },
    { id: 806, type: 'refill', amount: 36, refillRate: 25, position: { x: 6, y: 3.1, z: -128 }, radius: 1.42 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['Longer routes need fuel planning.', 'Use the final refill before descent.', 'Settle the rocket before touching down.'],
  scoreMultiplier: 2.28,
  visualTheme: { terrain: 0x202731 }
};
