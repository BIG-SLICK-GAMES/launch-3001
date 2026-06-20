import Phaser from 'phaser';
import { FLOOR_Y, WORLD_WIDTH } from './PhysicsConfig';

export const MAX_LEVEL = 10;

export type TerrainPoint = {
  x: number;
  y: number;
};

export type TerrainObstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const groundProfiles: Array<Array<[number, number]>> = [
  [
    [0, 0], [340, 0], [455, -36], [590, -36], [660, 32], [830, 42],
    [945, -72], [1050, -72], [1135, 28], [1370, 34], [1505, -22],
    [1650, -22], [1730, 18], [1960, 18], [2070, -52], [2200, -52], [2400, -8]
  ],
  [
    [0, 0], [350, 0], [410, -118], [520, -118], [575, 58], [760, 62],
    [840, -84], [940, -84], [995, 44], [1160, 50], [1240, -138],
    [1345, -138], [1410, 48], [1665, 58], [1730, -18], [1960, -18], [2050, 54],
    [2190, 54], [2280, -94], [2400, -94]
  ],
  [
    [0, 0], [340, 0], [430, -44], [520, 42], [630, -96], [720, 54],
    [830, -132], [930, 52], [1050, -70], [1165, 38], [1290, -126],
    [1400, 46], [1535, -34], [1650, 20], [1735, 6], [1960, 6], [2070, -104],
    [2190, 44], [2400, -22]
  ],
  [
    [0, 0], [350, 0], [460, -26], [555, -26], [615, 72], [900, 76],
    [980, 18], [1075, 18], [1140, 78], [1390, 78], [1495, -116],
    [1610, -116], [1685, 28], [1740, 28], [1965, 28], [2050, 76], [2230, 76], [2400, 18]
  ],
  [
    [0, 0], [345, 0], [430, -38], [555, -38], [640, -76], [760, -76],
    [845, -118], [970, -118], [1055, -18], [1180, -18], [1265, 38],
    [1410, 38], [1510, -62], [1640, -62], [1740, -12], [1960, -12], [2065, 42],
    [2220, 42], [2400, -34]
  ],
  [
    [0, 0], [340, 0], [455, 54], [650, 62], [760, 8], [850, 8],
    [930, -144], [1045, -144], [1115, 64], [1335, 68], [1435, -88],
    [1545, -88], [1630, 44], [1728, 44], [1960, 44], [2050, -22], [2160, -22], [2400, 62]
  ],
  [
    [0, 0], [350, 0], [430, -92], [545, -92], [610, 66], [800, 70],
    [875, -20], [1015, -20], [1095, 70], [1275, 70], [1370, -150],
    [1485, -150], [1565, 52], [1680, 58], [1745, -36], [1965, -36], [2045, 58],
    [2220, 58], [2400, -108]
  ],
  [
    [0, 0], [340, 0], [450, 28], [600, 28], [700, -132], [820, -132],
    [900, 70], [1090, 70], [1180, -48], [1310, -48], [1400, 36],
    [1530, 36], [1620, -124], [1715, -124], [1760, -8], [1960, -8], [2040, 68],
    [2190, 68], [2285, -58], [2400, -58]
  ],
  [
    [0, 0], [350, 0], [455, -150], [620, -150], [705, -84], [790, -84],
    [875, 72], [1095, 76], [1190, -132], [1300, -132], [1390, 60],
    [1545, 64], [1640, -12], [1740, -12], [1965, -12], [2040, -88], [2140, -88],
    [2225, 72], [2400, 72]
  ],
  [
    [0, 0], [340, 0], [415, -70], [520, -70], [585, 78], [720, 78],
    [785, -136], [900, -136], [965, 66], [1100, 66], [1170, -108],
    [1275, -108], [1345, 78], [1480, 78], [1550, -150], [1660, -150], [1725, 18],
    [1965, 18], [2035, -92], [2140, -92], [2210, 74], [2400, -40]
  ]
];

const ceilingProfiles: Array<Array<[number, number]>> = [
  [
    [0, 86], [350, 86], [540, 102], [745, 84], [940, 132], [1110, 92],
    [1300, 158], [1530, 88], [1840, 84], [2055, 126], [2400, 96]
  ],
  [
    [0, 88], [350, 88], [520, 156], [720, 94], [900, 188], [1080, 106],
    [1310, 210], [1510, 92], [1835, 116], [2070, 186], [2400, 104]
  ],
  [
    [0, 80], [360, 80], [520, 206], [670, 92], [840, 198], [1010, 96],
    [1180, 212], [1360, 94], [1540, 190], [1840, 86], [2100, 168], [2400, 96]
  ],
  [
    [0, 94], [360, 94], [560, 88], [780, 82], [990, 108], [1200, 86],
    [1410, 120], [1600, 198], [1835, 92], [2050, 90], [2400, 84]
  ],
  [
    [0, 88], [350, 88], [545, 112], [770, 138], [995, 168], [1190, 116],
    [1410, 178], [1620, 118], [1840, 104], [2070, 156], [2400, 98]
  ],
  [
    [0, 82], [340, 82], [535, 186], [750, 96], [965, 86], [1160, 220],
    [1370, 100], [1550, 202], [1840, 92], [2055, 134], [2400, 188]
  ],
  [
    [0, 86], [350, 86], [520, 128], [735, 92], [915, 230], [1100, 112],
    [1310, 96], [1490, 222], [1670, 110], [1840, 142], [2075, 92], [2400, 210]
  ],
  [
    [0, 90], [340, 90], [520, 108], [720, 214], [910, 104], [1120, 184],
    [1325, 104], [1530, 138], [1710, 224], [1840, 112], [2090, 172], [2400, 92]
  ],
  [
    [0, 84], [350, 84], [570, 238], [780, 116], [980, 94], [1170, 218],
    [1360, 104], [1550, 226], [1730, 108], [1840, 94], [2075, 210], [2400, 122]
  ],
  [
    [0, 84], [350, 84], [500, 188], [650, 96], [815, 236], [980, 104],
    [1145, 228], [1310, 100], [1475, 238], [1640, 106], [1840, 116], [2030, 230],
    [2210, 108], [2400, 180]
  ]
];

const obstacleProfiles: TerrainObstacle[][] = [
  [
    { x: 820, y: 452, width: 112, height: 44 },
    { x: 1260, y: 324, width: 150, height: 36 },
    { x: 1615, y: 498, width: 120, height: 46 }
  ],
  [
    { x: 610, y: 276, width: 70, height: 260 },
    { x: 920, y: 488, width: 210, height: 54 },
    { x: 1310, y: 258, width: 82, height: 290 },
    { x: 1660, y: 384, width: 180, height: 46 }
  ],
  [
    { x: 540, y: 392, width: 170, height: 42 },
    { x: 790, y: 222, width: 76, height: 230 },
    { x: 1045, y: 512, width: 230, height: 50 },
    { x: 1395, y: 278, width: 86, height: 252 },
    { x: 1710, y: 420, width: 210, height: 42 }
  ],
  [
    { x: 560, y: 298, width: 96, height: 244 },
    { x: 760, y: 474, width: 330, height: 52 },
    { x: 1150, y: 260, width: 92, height: 254 },
    { x: 1495, y: 476, width: 300, height: 50 },
    { x: 1920, y: 306, width: 96, height: 220 }
  ],
  [
    { x: 500, y: 214, width: 260, height: 42 },
    { x: 500, y: 524, width: 260, height: 46 },
    { x: 860, y: 350, width: 92, height: 220 },
    { x: 1130, y: 202, width: 280, height: 44 },
    { x: 1130, y: 502, width: 280, height: 48 },
    { x: 1510, y: 348, width: 98, height: 232 },
    { x: 1790, y: 438, width: 210, height: 46 }
  ],
  [
    { x: 510, y: 478, width: 300, height: 54 },
    { x: 845, y: 228, width: 78, height: 272 },
    { x: 1125, y: 332, width: 260, height: 44 },
    { x: 1470, y: 520, width: 250, height: 52 },
    { x: 1810, y: 252, width: 92, height: 248 }
  ],
  [
    { x: 520, y: 270, width: 220, height: 42 },
    { x: 720, y: 486, width: 250, height: 50 },
    { x: 1070, y: 240, width: 92, height: 286 },
    { x: 1325, y: 452, width: 245, height: 46 },
    { x: 1640, y: 288, width: 94, height: 250 },
    { x: 1950, y: 482, width: 210, height: 48 }
  ],
  [
    { x: 520, y: 188, width: 230, height: 44 },
    { x: 520, y: 514, width: 230, height: 48 },
    { x: 850, y: 328, width: 96, height: 244 },
    { x: 1115, y: 234, width: 240, height: 42 },
    { x: 1360, y: 492, width: 260, height: 50 },
    { x: 1710, y: 296, width: 96, height: 260 },
    { x: 1990, y: 404, width: 210, height: 46 }
  ],
  [
    { x: 455, y: 298, width: 90, height: 264 },
    { x: 680, y: 460, width: 280, height: 52 },
    { x: 1010, y: 206, width: 86, height: 286 },
    { x: 1265, y: 372, width: 300, height: 46 },
    { x: 1615, y: 510, width: 260, height: 54 },
    { x: 1940, y: 248, width: 96, height: 290 }
  ],
  [
    { x: 475, y: 212, width: 250, height: 42 },
    { x: 475, y: 522, width: 250, height: 48 },
    { x: 810, y: 342, width: 84, height: 232 },
    { x: 1040, y: 188, width: 270, height: 44 },
    { x: 1040, y: 500, width: 270, height: 50 },
    { x: 1390, y: 326, width: 92, height: 250 },
    { x: 1650, y: 214, width: 250, height: 42 },
    { x: 1650, y: 514, width: 250, height: 48 },
    { x: 1990, y: 346, width: 96, height: 246 }
  ]
];

export function buildGroundPoints(level: number): TerrainPoint[] {
  return pointsFromOffsets(groundProfiles[clampLevel(level) - 1]);
}

export function buildCeilingPoints(level: number): TerrainPoint[] {
  return ceilingProfiles[clampLevel(level) - 1].map(([x, y]) => ({ x, y }));
}

export function buildTerrainObstacles(level: number): TerrainObstacle[] {
  return obstacleProfiles[clampLevel(level) - 1].map((obstacle) => ({ ...obstacle }));
}

export function getGroundY(x: number, level: number): number {
  return interpolateTerrainY(buildGroundPoints(level), x, FLOOR_Y);
}

export function getCeilingY(x: number, level: number): number | undefined {
  const points = buildCeilingPoints(level);

  if (points.length === 0) {
    return undefined;
  }

  return interpolateTerrainY(points, x, points[0].y);
}

export function getDifficulty(level: number): number {
  return (clampLevel(level) - 1) / (MAX_LEVEL - 1);
}

export function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(1, Math.round(level)));
}

function interpolateTerrainY(points: TerrainPoint[], x: number, fallbackY: number): number {
  if (points.length === 0) {
    return fallbackY;
  }

  const clampedX = Math.min(WORLD_WIDTH, Math.max(0, x));

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (clampedX >= start.x && clampedX <= end.x) {
      const span = end.x - start.x || 1;
      const amount = (clampedX - start.x) / span;
      return Phaser.Math.Linear(start.y, end.y, amount);
    }
  }

  return points[points.length - 1].y;
}

function pointsFromOffsets(points: Array<[number, number]>): TerrainPoint[] {
  return points.map(([x, offsetY]) => ({ x, y: FLOOR_Y + offsetY }));
}
