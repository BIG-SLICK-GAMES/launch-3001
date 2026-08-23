export default {
  id: 29,
  name: 'Final Tunnel',
  description: 'A long roofed tunnel with small openings and late refills.',
  gravity: -5.46,
  thrustPower: 8.72,
  steeringPower: 4.92,
  damping: 0.98,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 8.15, verticalUp: 8.7, verticalDown: 10.9 },
  fuelBurnRate: 14.35,
  launchPad: { position: { x: -7, y: 0.1, z: 200 }, size: { x: 3.6, y: 0.2, z: 3.6 } },
  landingPad: { position: { x: -7, y: 0.1, z: -468 }, size: { x: 2.8, y: 0.2, z: 2.8 } },
  landingThresholds: { verticalSpeed: 1.2, horizontalSpeed: 1.02, angle: 0.21 },
  worldBounds: { minX: -24, maxX: 24, minZ: -508, maxZ: 208, maxY: 21 },
  terrain: { width: 56, depth: 778, segments: 134, amplitude: 3.6, frequency: 0.25, seed: 443 },
  obstacles: [
    { type: 'wall', position: { x: 0, y: 1.8, z: -40 }, size: { x: 5, y: 3.4, z: 1.4 } },
    { type: 'wall', position: { x: -4, y: 1.8, z: -182 }, size: { x: 1.2, y: 3.4, z: 58 } },
    { type: 'wall', position: { x: 4, y: 1.8, z: -318 }, size: { x: 1.2, y: 3.4, z: 58 } }
  ],
  pickups: [
    { id: 2901, type: 'instant', amount: 38, position: { x: -6, y: 3.9, z: 134 }, radius: 0.96 },
    { id: 2902, type: 'instant', amount: 42, position: { x: -2, y: 3.5, z: 42 }, radius: 0.96 },
    { id: 2903, type: 'refill', amount: 74, refillRate: 33, position: { x: 3, y: 3.1, z: -88 }, radius: 1.18 },
    { id: 2904, type: 'instant', amount: 52, position: { x: -4, y: 2.8, z: -220 }, radius: 0.96 },
    { id: 2905, type: 'instant', amount: 54, position: { x: 4, y: 2.6, z: -344 }, radius: 0.96 },
    { id: 2906, type: 'refill', amount: 76, refillRate: 34, position: { x: -7, y: 2.4, z: -438 }, radius: 1.18 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: 0, y: 5.7, z: -132 }, size: { x: 23, y: 1.35, z: 444 } },
    { type: 'caveRoof', position: { x: 0, y: 5.4, z: -388 }, size: { x: 22, y: 1.35, z: 104 } }
  ],
  walls: [
    { type: 'wall', position: { x: -12.2, y: 2.8, z: -132 }, size: { x: 1, y: 5.4, z: 444 } },
    { type: 'wall', position: { x: 12.2, y: 2.8, z: -132 }, size: { x: 1, y: 5.4, z: 444 } }
  ],
  tutorialMessages: ['This tunnel leaves little room.', 'Use refills to reset speed.', 'Stay low until the final opening.'],
  scoreMultiplier: 6.58,
  visualTheme: { terrain: 0x1d232b }
};
