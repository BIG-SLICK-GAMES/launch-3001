export type GameRunResult = {
  score?: number;
  status: 'landed' | 'crashed';
  verticalSpeed: number;
  horizontalSpeed: number;
  angleDegrees: number;
  rocketProfileId: string;
};
