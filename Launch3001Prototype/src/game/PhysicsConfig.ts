import { sceneLayout } from '../config/sceneLayout';

export const WORLD_WIDTH = sceneLayout.world.width;
export const WORLD_HEIGHT = sceneLayout.world.height;
export const FLOOR_Y = sceneLayout.gameplay.floorY;

export const SAFE_LANDING = {
  verticalSpeed: 90,
  horizontalSpeed: 60,
  angleDegrees: 12
};

export const ROCKET_SIZE = {
  width: 32,
  height: 74
};

export const LINEAR_DAMPING = 0.995;
