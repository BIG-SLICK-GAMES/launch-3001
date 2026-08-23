export default {
  id: 20,
  name: 'Needle Landing',
  description: 'A long controlled run into a very small landing pad.',
  gravity: -5.1,
  thrustPower: 8.36,
  steeringPower: 4.7,
  damping: 0.984,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.7, verticalUp: 8.2, verticalDown: 10.5 },
  fuelBurnRate: 12.95,
  launchPad: { position: { x: 0, y: 0.1, z: 146 }, size: { x: 4, y: 0.2, z: 4 } },
  landingPad: { position: { x: 0, y: 0.1, z: -310 }, size: { x: 3.2, y: 0.2, z: 3.2 } },
  landingThresholds: { verticalSpeed: 1.38, horizontalSpeed: 1.2, angle: 0.25 },
  worldBounds: { minX: -24, maxX: 24, minZ: -342, maxZ: 154, maxY: 23 },
  terrain: { width: 56, depth: 538, segments: 116, amplitude: 3.15, frequency: 0.22, seed: 257 },
  obstacles: [
    { type: 'wall', position: { x: -5.5, y: 2.2, z: -88 }, size: { x: 1.2, y: 4.2, z: 150 } },
    { type: 'wall', position: { x: 5.5, y: 2.2, z: -88 }, size: { x: 1.2, y: 4.2, z: 150 } }
  ],
  pickups: [
    { id: 2001, type: 'instant', amount: 30, position: { x: 0, y: 4.5, z: 90 }, radius: 1.04 },
    { id: 2002, type: 'instant', amount: 32, position: { x: 0, y: 4.0, z: 22 }, radius: 1.04 },
    { id: 2003, type: 'instant', amount: 34, position: { x: 0, y: 3.6, z: -52 }, radius: 1.04 },
    { id: 2004, type: 'refill', amount: 52, refillRate: 28, position: { x: 0, y: 3.3, z: -134 }, radius: 1.28 },
    { id: 2005, type: 'instant', amount: 38, position: { x: 0, y: 3.1, z: -226 }, radius: 1.04 },
    { id: 2006, type: 'refill', amount: 54, refillRate: 28, position: { x: 0, y: 2.8, z: -286 }, radius: 1.28 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['This is about landing precision.', 'Stay centered in the narrow lane.', 'Arrive slow and level.'],
  scoreMultiplier: 4.36,
  visualTheme: { terrain: 0x202731 }
};
