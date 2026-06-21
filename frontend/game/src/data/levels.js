export const LEVELS = [
  {
    id: 1,
    name: 'Training Hop',
    difficulty: 1,
    launchPad: { x: 120, y: 520 },
    landingPad: { x: 650, y: 520, width: 160 },
    fuel: 120,
    gravity: 280,
    wind: 0,
    obstacles: [],
    hazards: [],
    targetTime: 25
  },
  {
    id: 2,
    name: 'Longer Burn',
    difficulty: 2,
    launchPad: { x: 100, y: 520 },
    landingPad: { x: 950, y: 520, width: 150 },
    fuel: 110,
    gravity: 285,
    wind: 0,
    obstacles: [],
    hazards: [],
    targetTime: 28
  },
  {
    id: 3,
    name: 'Soft Touch',
    difficulty: 3,
    launchPad: { x: 100, y: 520 },
    landingPad: { x: 1000, y: 520, width: 110 },
    fuel: 105,
    gravity: 290,
    wind: 0,
    obstacles: [],
    hazards: [],
    targetTime: 28,
    landingRules: {
      maxVerticalSpeed: 90,
      maxHorizontalSpeed: 70
    }
  },
  {
    id: 4,
    name: 'First Wall',
    difficulty: 4,
    launchPad: { x: 100, y: 520 },
    landingPad: { x: 1150, y: 520, width: 120 },
    fuel: 105,
    gravity: 300,
    wind: 0,
    obstacles: [
      { type: 'wall', x: 600, y: 420, width: 80, height: 160 }
    ],
    hazards: [],
    targetTime: 30
  },
  {
    id: 5,
    name: 'Fuel Saver',
    difficulty: 5,
    launchPad: { x: 100, y: 520 },
    landingPad: { x: 1200, y: 520, width: 115 },
    fuel: 80,
    gravity: 300,
    wind: 0,
    obstacles: [
      { type: 'lowRidge', x: 500, y: 470, width: 220, height: 110 }
    ],
    hazards: [],
    targetTime: 32
  },
  {
    id: 6,
    name: 'High Platform',
    difficulty: 6,
    launchPad: { x: 100, y: 540 },
    landingPad: { x: 1250, y: 390, width: 120 },
    fuel: 100,
    gravity: 310,
    wind: 0,
    obstacles: [
      { type: 'ridge', x: 650, y: 470, width: 180, height: 130 }
    ],
    hazards: [],
    targetTime: 34
  },
  {
    id: 7,
    name: 'Drop Zone',
    difficulty: 7,
    launchPad: { x: 100, y: 390 },
    landingPad: { x: 1300, y: 540, width: 105 },
    fuel: 90,
    gravity: 315,
    wind: 0,
    obstacles: [
      { type: 'ceilingRock', x: 550, y: 120, width: 250, height: 90 },
      { type: 'ridge', x: 900, y: 470, width: 160, height: 130 }
    ],
    hazards: [],
    targetTime: 34
  },
  {
    id: 8,
    name: 'Crosswind',
    difficulty: 8,
    launchPad: { x: 100, y: 520 },
    landingPad: { x: 1350, y: 500, width: 105 },
    fuel: 95,
    gravity: 305,
    wind: 35,
    obstacles: [
      { type: 'wall', x: 650, y: 430, width: 70, height: 160 }
    ],
    hazards: [],
    targetTime: 36
  },
  {
    id: 9,
    name: 'Moving Target',
    difficulty: 9,
    launchPad: { x: 100, y: 520 },
    landingPad: {
      x: 1350,
      y: 500,
      width: 100,
      movement: {
        axis: 'x',
        distance: 160,
        speed: 60
      }
    },
    fuel: 95,
    gravity: 310,
    wind: 20,
    obstacles: [
      { type: 'ridge', x: 700, y: 470, width: 220, height: 120 }
    ],
    hazards: [],
    targetTime: 38
  },
  {
    id: 10,
    name: 'Canyon Run',
    difficulty: 10,
    launchPad: { x: 100, y: 540 },
    landingPad: { x: 1550, y: 430, width: 90 },
    fuel: 85,
    gravity: 320,
    wind: -30,
    obstacles: [
      { type: 'wall', x: 450, y: 430, width: 70, height: 160 },
      { type: 'ceilingRock', x: 800, y: 120, width: 250, height: 100 },
      { type: 'ridge', x: 1100, y: 480, width: 200, height: 120 }
    ],
    hazards: [
      {
        type: 'movingDrone',
        x: 950,
        y: 330,
        movement: {
          axis: 'y',
          distance: 180,
          speed: 70
        }
      }
    ],
    targetTime: 40,
    landingRules: {
      maxVerticalSpeed: 75,
      maxHorizontalSpeed: 55
    }
  }
];
