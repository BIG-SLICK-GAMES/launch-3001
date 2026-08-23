export default {
  id: 24,
  name: 'Roof Switchback',
  description: 'A roofed switchback route with alternating refills.',
  gravity: -5.26,
  thrustPower: 8.52,
  steeringPower: 4.8,
  damping: 0.982,
  windStrength: 0,
  windDirection: { x: 0, y: 0, z: 0 },
  maxSpeed: { horizontal: 7.9, verticalUp: 8.4, verticalDown: 10.7 },
  fuelBurnRate: 13.55,
  launchPad: { position: { x: 8, y: 0.1, z: 170 }, size: { x: 3.8, y: 0.2, z: 3.8 } },
  landingPad: { position: { x: -8, y: 0.1, z: -374 }, size: { x: 3, y: 0.2, z: 3 } },
  landingThresholds: { verticalSpeed: 1.3, horizontalSpeed: 1.12, angle: 0.23 },
  worldBounds: { minX: -25, maxX: 25, minZ: -410, maxZ: 178, maxY: 22 },
  terrain: { width: 58, depth: 636, segments: 124, amplitude: 3.35, frequency: 0.24, seed: 331 },
  obstacles: [
    { type: 'wall', position: { x: -7, y: 2, z: -56 }, size: { x: 1.3, y: 3.8, z: 32 } },
    { type: 'wall', position: { x: 7, y: 2, z: -174 }, size: { x: 1.3, y: 3.8, z: 32 } }
  ],
  pickups: [
    { id: 2401, type: 'instant', amount: 32, position: { x: 6, y: 4.2, z: 108 }, radius: 1 },
    { id: 2402, type: 'instant', amount: 34, position: { x: 1, y: 3.8, z: 26 }, radius: 1 },
    { id: 2403, type: 'refill', amount: 60, refillRate: 30, position: { x: -6, y: 3.4, z: -74 }, radius: 1.24 },
    { id: 2404, type: 'instant', amount: 42, position: { x: 5, y: 3.1, z: -186 }, radius: 1 },
    { id: 2405, type: 'refill', amount: 62, refillRate: 30, position: { x: -8, y: 2.7, z: -348 }, radius: 1.24 }
  ],
  roofs: [
    { type: 'caveRoof', position: { x: 0, y: 6.4, z: 24 }, size: { x: 25, y: 1.35, z: 156 } },
    { type: 'caveRoof', position: { x: 0, y: 6.2, z: -202 }, size: { x: 24, y: 1.35, z: 186 } }
  ],
  walls: [
    { type: 'wall', position: { x: -12.8, y: 3, z: -88 }, size: { x: 1.1, y: 5.8, z: 360 } },
    { type: 'wall', position: { x: 12.8, y: 3, z: -88 }, size: { x: 1.1, y: 5.8, z: 360 } }
  ],
  tutorialMessages: ['Switch sides under the roof.', 'Use refills as turn markers.', 'Keep the rocket low and settled.'],
  scoreMultiplier: 5.25,
  visualTheme: { terrain: 0x1e252e }
};
