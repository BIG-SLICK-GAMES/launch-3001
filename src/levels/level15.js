export default {
  id: 15,
  name: 'Long Tunnel',
  description: 'A long tunnel that rewards steady low flight.',
  gravity: -4.9,
  thrustPower: 8.16,
  steeringPower: 4.58,
  damping: 0.985,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.45, verticalUp: 8, verticalDown: 10.2 },
  fuelBurnRate: 12.2,
  launchPad: { position: { x: 0, y: 0.1, z: 116 }, size: { x: 4.2, y: 0.2, z: 4.2 } },
  landingPad: { position: { x: -5, y: 0.1, z: -240 }, size: { x: 3.7, y: 0.2, z: 3.7 } },
  landingThresholds: { verticalSpeed: 1.5, horizontalSpeed: 1.32, angle: 0.28 },
  worldBounds: { minX: -24, maxX: 24, minZ: -268, maxZ: 124, maxY: 23 },
  terrain: { width: 56, depth: 426, segments: 106, amplitude: 2.7, frequency: 0.21, seed: 181 },
  obstacles: [],
  pickups: [
    { id: 1501, type: 'instant', amount: 26, position: { x: 0, y: 4.6, z: 68 }, radius: 1.08 },
    { id: 1502, type: 'instant', amount: 28, position: { x: -2, y: 4.2, z: 8 }, radius: 1.08 },
    { id: 1503, type: 'instant', amount: 30, position: { x: -3, y: 3.9, z: -54 }, radius: 1.08 },
    { id: 1504, type: 'refill', amount: 54, refillRate: 28, position: { x: -4, y: 3.5, z: -126 }, radius: 1.4 },
    { id: 1505, type: 'instant', amount: 34, position: { x: -5, y: 3.3, z: -196 }, radius: 1.08 },
    { id: 1506, type: 'refill', amount: 46, refillRate: 26, position: { x: -5, y: 3.0, z: -222 }, radius: 1.34 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: -2, y: 6.7, z: -68 }, size: { x: 25, y: 1.35, z: 214 } }
  ],
  walls: [
    { type: 'wall', position: { x: -13.3, y: 3.1, z: -68 }, size: { x: 1.1, y: 6, z: 214 } },
    { type: 'wall', position: { x: 13.3, y: 3.1, z: -68 }, size: { x: 1.1, y: 6, z: 214 } }
  ],
  tutorialMessages: ['Stay calm through the long tunnel.', 'Use tiny thrust bursts to hold height.', 'The final refill sets up the landing.'],
  scoreMultiplier: 3.42,
  visualTheme: { terrain: 0x1f252f }
};
