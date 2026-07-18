export default {
  id: 5,
  name: 'Low Roof',
  description: 'First overhead hazard with a wide route.',
  gravity: -4.45,
  thrustPower: 7.65,
  steeringPower: 4.1,
  damping: 0.989,
  windStrength: 0.22,
  windDirection: { x: 0.2, y: 0, z: 0 },
  maxSpeed: { horizontal: 6.7, verticalUp: 7.2, verticalDown: 9.2 },
  launchPad: { position: { x: -5, y: 0.1, z: 26 }, size: { x: 4.8, y: 0.2, z: 4.8 } },
  landingPad: { position: { x: 6, y: 0.1, z: -30 }, size: { x: 4.3, y: 0.2, z: 4.3 } },
  landingThresholds: { verticalSpeed: 1.75, horizontalSpeed: 1.55, angle: 0.34 },
  worldBounds: { minX: -24, maxX: 24, minZ: -44, maxZ: 32, maxY: 26 },
  terrain: { width: 58, depth: 92, segments: 60, amplitude: 1.6, frequency: 0.17, seed: 41 },
  obstacles: [],
  roofs: [
    { type: 'roof', position: { x: 0, y: 7.6, z: -6 }, size: { x: 32, y: 1.1, z: 20 } }
  ],
  walls: [],
  tutorialMessages: ['Stay below the red roof'],
  scoreMultiplier: 1.62,
  visualTheme: { terrain: 0x21252e }
};
