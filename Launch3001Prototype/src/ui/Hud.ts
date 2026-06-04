import Phaser from 'phaser';
import type { RocketProfile } from '../config/rocketProfiles';

export type HudState = {
  verticalSpeed: number;
  horizontalSpeed: number;
  angleDegrees: number;
  profile: RocketProfile;
  message: string;
  score?: number;
};

export class Hud {
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(18, 16, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '18px',
      color: '#f3f7ff',
      backgroundColor: 'rgba(5, 8, 14, 0.58)',
      padding: { x: 14, y: 12 },
      lineSpacing: 5
    });
    this.text.setScrollFactor(0);
    this.text.setDepth(50);
  }

  update(state: HudState): void {
    const scoreLine = state.score === undefined ? '' : `\nScore: ${state.score}`;
    this.text.setText(
      [
        `V Speed: ${state.verticalSpeed.toFixed(1)}`,
        `H Speed: ${state.horizontalSpeed.toFixed(1)}`,
        `Angle: ${state.angleDegrees.toFixed(1)} deg`,
        `Rocket: ${state.profile.name}`,
        `Multiplier: x${state.profile.multiplier.toFixed(1)}`,
        '1/2/3 Switch  |  R Restart',
        `Result: ${state.message}${scoreLine}`
      ].join('\n')
    );
  }
}
