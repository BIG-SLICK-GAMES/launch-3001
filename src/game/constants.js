export const STORAGE_KEYS = {
  settings: 'launch3001.settings',
  progress: 'launch3001.progress'
};

export const CAMERA_MODES = {
  chase: 'CHASE',
  far: 'FAR',
  side: 'SIDE',
  cockpit: 'COCKPIT'
};

export const CAMERA_MODE_SEQUENCE = [
  CAMERA_MODES.chase,
  CAMERA_MODES.far,
  CAMERA_MODES.side,
  CAMERA_MODES.cockpit
];

export const VR_CAMERA_MODES = {
  cockpit: 'VR COCKPIT',
  chase: 'VR CHASE',
  side: 'VR SIDE'
};

export const VR_CAMERA_MODE_SEQUENCE = [
  VR_CAMERA_MODES.cockpit,
  VR_CAMERA_MODES.chase,
  VR_CAMERA_MODES.side
];

export const LANDING_GRADES = {
  perfect: 'PERFECT',
  excellent: 'EXCELLENT',
  good: 'GOOD',
  safe: 'SAFE',
  hard: 'HARD LANDING',
  crash: 'CRASH'
};

export const FAILURE_REASONS = {
  tooFast: 'TOO FAST',
  sideSpeed: 'EXCESSIVE SIDE SPEED',
  badAngle: 'BAD ANGLE',
  missedPad: 'MISSED PAD',
  terrain: 'TERRAIN HIT',
  roof: 'ROOF HIT',
  wall: 'WALL HIT',
  bounds: 'OUT OF BOUNDS'
};

export const DEFAULT_SETTINGS = {
  tiltSensitivity: 1,
  tiltDeadZone: 0.06,
  tiltSmoothing: 0.18,
  invertForward: false,
  volume: 0.55,
  muted: false,
  cameraMode: CAMERA_MODES.chase,
  cameraDistance: 1,
  cameraHeight: 1,
  sideCameraSide: 1,
  vrCameraMode: VR_CAMERA_MODES.cockpit,
  vrCameraDistance: 2.3,
  vrCameraHeight: 0.85,
  vrPanelDistance: 1.85,
  vrPanelHeight: -0.22,
  vrComfortScale: 1,
  vrSideCameraSide: 1,
  noFuelDrain: false,
  debug: false
};

export const ROCKET_RADIUS = 0.55;
export const ROCKET_STANDING_HEIGHT = 1.58;
export const FIXED_STEP = 1 / 60;
export const MAX_FRAME_DELTA = 0.05;
