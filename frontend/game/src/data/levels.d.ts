export type LevelMovement = {
  axis: 'x' | 'y';
  distance: number;
  speed: number;
};

export type LevelObstacle = {
  type: 'wall' | 'lowRidge' | 'ridge' | 'ceilingRock';
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LevelHazard = {
  type: 'movingDrone';
  x: number;
  y: number;
  movement?: LevelMovement;
};

export type LevelConfig = {
  id: number;
  name: string;
  difficulty: number;
  launchPad: {
    x: number;
    y: number;
  };
  landingPad: {
    x: number;
    y: number;
    width: number;
    movement?: LevelMovement;
  };
  fuel: number;
  gravity: number;
  wind: number;
  obstacles: LevelObstacle[];
  hazards: LevelHazard[];
  targetTime: number;
  landingRules?: {
    maxVerticalSpeed?: number;
    maxHorizontalSpeed?: number;
    maxAngleDegrees?: number;
  };
};

export const LEVELS: LevelConfig[];
