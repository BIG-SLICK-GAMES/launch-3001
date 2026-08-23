export default {
  id: 5,
  name: 'Low Overhang',
  description: 'First overhead ground shelf with a wide route.',
  gravity: -4.45,
  thrustPower: 7.65,
  steeringPower: 4.1,
  damping: 0.989,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 6.7, verticalUp: 7.2, verticalDown: 9.2 },
  fuelBurnRate: 10.4,
  launchPad: { position: { x: -6, y: 0.1, z: 58 }, size: { x: 4.8, y: 0.2, z: 4.8 } },
  landingPad: { position: { x: 8, y: 0.1, z: -110 }, size: { x: 4.8, y: 0.2, z: 4.8 } },
  landingThresholds: { verticalSpeed: 1.9, horizontalSpeed: 1.68, angle: 0.38 },
  worldBounds: { minX: -24, maxX: 24, minZ: -132, maxZ: 66, maxY: 26 },
  terrain: { width: 58, depth: 216, segments: 78, amplitude: 1.6, frequency: 0.17, seed: 41 },
  obstacles: [],
  pickups: [
    { id: 501, type: 'instant', amount: 22, position: { x: -4, y: 4.6, z: 28 }, radius: 1.18 },
    { id: 502, type: 'instant', amount: 22, position: { x: -1, y: 4.8, z: -4 }, radius: 1.18 },
    { id: 503, type: 'instant', amount: 24, position: { x: 3, y: 4.3, z: -40 }, radius: 1.18 },
    { id: 504, type: 'instant', amount: 26, position: { x: 6.5, y: 3.8, z: -78 }, radius: 1.18 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: 0, y: 7.8, z: -18 }, size: { x: 35, y: 1.35, z: 52 } }
  ],
  walls: [],
  tutorialMessages: ['This level introduces an upturned ground shelf.', 'Stay under the shelf and follow the droplets.', 'Do not climb late; level out before landing.'],
  scoreMultiplier: 1.62,
  visualTheme: { terrain: 0x21252e }
};
