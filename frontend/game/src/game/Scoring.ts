import Phaser from 'phaser';

export const LANDING_TIME_LIMIT_SECONDS = 30;
export const FULL_SCORE_SECONDS = 10;
export const MAX_LANDING_SCORE = 3000;
export const SCORE_LOSS_PER_SECOND = 100;

export function calculateLandingScore(elapsedSeconds: number): number {
  const overtimeSeconds = Math.max(0, elapsedSeconds - FULL_SCORE_SECONDS);
  const score = MAX_LANDING_SCORE - overtimeSeconds * SCORE_LOSS_PER_SECOND;

  return Math.round(Phaser.Math.Clamp(score, 0, MAX_LANDING_SCORE));
}
