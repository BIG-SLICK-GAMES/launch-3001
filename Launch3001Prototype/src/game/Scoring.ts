import Phaser from 'phaser';
import { SAFE_LANDING } from './PhysicsConfig';
import type { RocketProfile } from '../config/rocketProfiles';

export type LandingStats = {
  verticalSpeed: number;
  horizontalSpeed: number;
  angleDegrees: number;
};

export function calculateLandingScore(stats: LandingStats, profile: RocketProfile): number {
  const verticalPenalty = Phaser.Math.Clamp(stats.verticalSpeed / SAFE_LANDING.verticalSpeed, 0, 1) * 260;
  const horizontalPenalty = Phaser.Math.Clamp(stats.horizontalSpeed / SAFE_LANDING.horizontalSpeed, 0, 1) * 220;
  const anglePenalty = Phaser.Math.Clamp(stats.angleDegrees / SAFE_LANDING.angleDegrees, 0, 1) * 220;
  const baseScore = Math.max(100, Math.round(1000 - verticalPenalty - horizontalPenalty - anglePenalty));

  return Math.round(baseScore * profile.multiplier);
}
