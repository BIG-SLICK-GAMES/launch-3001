export default {
  id: 17,
  name: 'Side Squeeze',
  description: 'A narrow lane with offset side walls and refill pacing.',
  gravity: -4.98,
  thrustPower: 8.24,
  steeringPower: 4.62,
  damping: 0.985,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.55, verticalUp: 8.1, verticalDown: 10.3 },
  fuelBurnRate: 12.5,
  launchPad: { position: { x: -6, y: 0.1, z: 128 }, size: { x: 4.1, y: 0.2, z: 4.1 } },
  landingPad: { position: { x: -4, y: 0.1, z: -266 }, size: { x: 3.6, y: 0.2, z: 3.6 } },
  landingThresholds: { verticalSpeed: 1.46, horizontalSpeed: 1.28, angle: 0.27 },
  worldBounds: { minX: -24, maxX: 24, minZ: -296, maxZ: 136, maxY: 23 },
  terrain: { width: 56, depth: 470, segments: 110, amplitude: 2.9, frequency: 0.21, seed: 211 },
  obstacles: [
    { type: 'wall', position: { x: -12, y: 2.5, z: -62 }, size: { x: 1.1, y: 4.8, z: 210 } },
    { type: 'wall', position: { x: 11, y: 2.5, z: -62 }, size: { x: 1.1, y: 4.8, z: 210 } },
    { type: 'wall', position: { x: 4, y: 1.9, z: -22 }, size: { x: 1.3, y: 3.5, z: 32 } },
    { type: 'wall', position: { x: -5, y: 1.9, z: -106 }, size: { x: 1.3, y: 3.5, z: 32 } }
  ],
  pickups: [
    { id: 1701, type: 'instant', amount: 28, position: { x: -5, y: 4.7, z: 76 }, radius: 1.06 },
    { id: 1702, type: 'instant', amount: 30, position: { x: 0, y: 4.1, z: 10 }, radius: 1.06 },
    { id: 1703, type: 'refill', amount: 48, refillRate: 27, position: { x: 5, y: 3.7, z: -66 }, radius: 1.32 },
    { id: 1704, type: 'instant', amount: 34, position: { x: -3, y: 3.4, z: -150 }, radius: 1.06 },
    { id: 1705, type: 'refill', amount: 48, refillRate: 27, position: { x: -4, y: 3.0, z: -242 }, radius: 1.32 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['Side walls punish wide corrections.', 'Use the refill to slow down.', 'Exit centered before landing.'],
  scoreMultiplier: 3.78,
  visualTheme: { terrain: 0x202630 }
};
