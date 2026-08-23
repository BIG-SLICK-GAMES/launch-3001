export default {
  id: 1,
  name: 'First Flight',
  description: 'Open training route with a generous landing platform and a straight fuel line.',
  gravity: -3.8,
  thrustPower: 7.1,
  steeringPower: 3.6,
  damping: 0.992,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 6, verticalUp: 7, verticalDown: 8 },
  fuelBurnRate: 9.2,
  launchPad: { position: { x: 0, y: 0.1, z: 34 }, size: { x: 6, y: 0.2, z: 6 } },
  landingPad: { position: { x: 0, y: 0.1, z: -58 }, size: { x: 7, y: 0.2, z: 7 } },
  landingThresholds: { verticalSpeed: 2.4, horizontalSpeed: 2.2, angle: 0.5 },
  worldBounds: { minX: -22, maxX: 22, minZ: -74, maxZ: 42, maxY: 30 },
  terrain: { width: 52, depth: 132, segments: 58, amplitude: 0.45, frequency: 0.12, seed: 3 },
  obstacles: [],
  pickups: [
    { id: 101, type: 'instant', amount: 18, position: { x: 0, y: 4.2, z: 12 }, radius: 1.15 },
    { id: 102, type: 'instant', amount: 18, position: { x: 0, y: 4.8, z: -10 }, radius: 1.15 },
    { id: 103, type: 'instant', amount: 22, position: { x: 0, y: 4.2, z: -34 }, radius: 1.15 }
  ],
  roofs: [],
  walls: [],
  tutorialMessages: ['Hold thrust in short bursts.', 'Fly through the blue fuel droplets.', 'Set down slowly on the green landing pad.'],
  scoreMultiplier: 1,
  visualTheme: { terrain: 0x202833 }
};
