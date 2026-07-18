export default {
  id: 6,
  name: 'The Tunnel',
  description: 'A longer low tunnel with side walls and stronger wind.',
  gravity: -4.55,
  thrustPower: 7.72,
  steeringPower: 4.2,
  damping: 0.988,
  windStrength: 0.52,
  windDirection: { x: -1, y: 0, z: 0.12 },
  maxSpeed: { horizontal: 6.8, verticalUp: 7.4, verticalDown: 9.4 },
  launchPad: { position: { x: 0, y: 0.1, z: 28 }, size: { x: 4.5, y: 0.2, z: 4.5 } },
  landingPad: { position: { x: -4, y: 0.1, z: -34 }, size: { x: 3.9, y: 0.2, z: 3.9 } },
  landingThresholds: { verticalSpeed: 1.6, horizontalSpeed: 1.42, angle: 0.31 },
  worldBounds: { minX: -22, maxX: 22, minZ: -48, maxZ: 34, maxY: 25 },
  terrain: { width: 54, depth: 98, segments: 64, amplitude: 1.8, frequency: 0.18, seed: 53 },
  obstacles: [],
  roofs: [
    { type: 'roof', position: { x: 0, y: 6.8, z: -11 }, size: { x: 23, y: 1, z: 42 } }
  ],
  walls: [
    { type: 'wall', position: { x: -12.5, y: 3.2, z: -11 }, size: { x: 1.2, y: 6.2, z: 42 } },
    { type: 'wall', position: { x: 12.5, y: 3.2, z: -11 }, size: { x: 1.2, y: 6.2, z: 42 } }
  ],
  tutorialMessages: ['Small corrections beat hard swings'],
  scoreMultiplier: 1.85,
  visualTheme: { terrain: 0x20242d }
};
