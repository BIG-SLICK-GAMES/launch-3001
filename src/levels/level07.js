export default {
  id: 7,
  name: 'Needle Pass',
  description: 'Strict final route through a low narrow passage.',
  gravity: -4.7,
  thrustPower: 7.9,
  steeringPower: 4.35,
  damping: 0.987,
  windStrength: 0.78,
  windDirection: { x: 0.7, y: 0, z: -0.1 },
  maxSpeed: { horizontal: 7, verticalUp: 7.5, verticalDown: 9.6 },
  launchPad: { position: { x: 7, y: 0.1, z: 30 }, size: { x: 4.2, y: 0.2, z: 4.2 } },
  landingPad: { position: { x: -7, y: 0.1, z: -36 }, size: { x: 3.4, y: 0.2, z: 3.4 } },
  landingThresholds: { verticalSpeed: 1.45, horizontalSpeed: 1.25, angle: 0.27 },
  worldBounds: { minX: -21, maxX: 21, minZ: -50, maxZ: 36, maxY: 24 },
  terrain: { width: 52, depth: 102, segments: 66, amplitude: 2.3, frequency: 0.2, seed: 71 },
  obstacles: [
    { type: 'wall', position: { x: 0, y: 2.1, z: 2 }, size: { x: 6, y: 4, z: 2 } },
    { type: 'wall', position: { x: -3.5, y: 2.1, z: -18 }, size: { x: 2, y: 4.5, z: 8 } },
    { type: 'wall', position: { x: 3.5, y: 2.1, z: -24 }, size: { x: 2, y: 4.5, z: 8 } }
  ],
  roofs: [
    { type: 'roof', position: { x: 0, y: 6.0, z: -15 }, size: { x: 18, y: 1, z: 50 } }
  ],
  walls: [
    { type: 'wall', position: { x: -10.3, y: 3, z: -16 }, size: { x: 1.1, y: 6, z: 48 } },
    { type: 'wall', position: { x: 10.3, y: 3, z: -16 }, size: { x: 1.1, y: 6, z: 48 } }
  ],
  tutorialMessages: ['Needle pass: keep level and commit early'],
  scoreMultiplier: 2.15,
  visualTheme: { terrain: 0x1e232c }
};
