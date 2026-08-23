export default {
  id: 6,
  name: 'The Tunnel',
  description: 'A longer low tunnel carved from upturned ground.',
  gravity: -4.55,
  thrustPower: 7.72,
  steeringPower: 4.2,
  damping: 0.988,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 6.8, verticalUp: 7.4, verticalDown: 9.4 },
  fuelBurnRate: 10.7,
  launchPad: { position: { x: 0, y: 0.1, z: 64 }, size: { x: 4.5, y: 0.2, z: 4.5 } },
  landingPad: { position: { x: -6, y: 0.1, z: -126 }, size: { x: 4.5, y: 0.2, z: 4.5 } },
  landingThresholds: { verticalSpeed: 1.82, horizontalSpeed: 1.6, angle: 0.36 },
  worldBounds: { minX: -22, maxX: 22, minZ: -150, maxZ: 72, maxY: 25 },
  terrain: { width: 54, depth: 240, segments: 84, amplitude: 1.8, frequency: 0.18, seed: 53 },
  obstacles: [],
  pickups: [
    { id: 601, type: 'instant', amount: 22, position: { x: -1, y: 4.9, z: 34 }, radius: 1.18 },
    { id: 602, type: 'instant', amount: 22, position: { x: -3, y: 5.2, z: 0 }, radius: 1.18 },
    { id: 603, type: 'instant', amount: 24, position: { x: -4, y: 4.6, z: -38 }, radius: 1.18 },
    { id: 604, type: 'instant', amount: 26, position: { x: -5, y: 4.1, z: -76 }, radius: 1.18 },
    { id: 605, type: 'refill', amount: 56, refillRate: 28, position: { x: -6, y: 3.8, z: -104 }, radius: 1.45 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: -2, y: 7.3, z: -28 }, size: { x: 28, y: 1.35, z: 100 } }
  ],
  walls: [
    { type: 'wall', position: { x: -14.5, y: 3.2, z: -28 }, size: { x: 1.2, y: 6.2, z: 100 } },
    { type: 'wall', position: { x: 14.5, y: 3.2, z: -28 }, size: { x: 1.2, y: 6.2, z: 100 } }
  ],
  tutorialMessages: ['Enter the tunnel low and level.', 'Collect fuel through the center lane.', 'Double-ring droplets refill while you hover inside them.'],
  scoreMultiplier: 1.85,
  visualTheme: { terrain: 0x20242d }
};
