export default {
  id: 4,
  name: 'Canyon Run',
  description: 'Tall terrain and a narrower safe approach.',
  gravity: -4.35,
  thrustPower: 7.55,
  steeringPower: 4.0,
  damping: 0.989,
  windStrength: 0.18,
  windDirection: { x: -0.4, y: 0, z: -0.2 },
  maxSpeed: { horizontal: 6.5, verticalUp: 7.2, verticalDown: 9 },
  launchPad: { position: { x: 0, y: 0.1, z: 25 }, size: { x: 5, y: 0.2, z: 5 } },
  landingPad: { position: { x: -6, y: 0.1, z: -28 }, size: { x: 4.6, y: 0.2, z: 4.6 } },
  landingThresholds: { verticalSpeed: 1.9, horizontalSpeed: 1.65, angle: 0.38 },
  worldBounds: { minX: -24, maxX: 24, minZ: -42, maxZ: 30, maxY: 28 },
  terrain: { width: 56, depth: 88, segments: 58, amplitude: 2.0, frequency: 0.18, seed: 29 },
  obstacles: [
    { type: 'wall', position: { x: -15, y: 2.7, z: -4 }, size: { x: 2.2, y: 5.2, z: 22 } },
    { type: 'wall', position: { x: 14, y: 2.7, z: -5 }, size: { x: 2.2, y: 5.2, z: 24 } }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['Stay centered through the canyon'],
  scoreMultiplier: 1.42,
  visualTheme: { terrain: 0x242832 }
};
