import Phaser from 'phaser';
import type { RocketProfile } from '../config/rocketProfiles';

export type HudState = {
  verticalSpeed: number;
  horizontalSpeed: number;
  angleDegrees: number;
  profile: RocketProfile;
  level: number;
  levelName: string;
  message: string;
  elapsedSeconds: number;
  remainingSeconds: number;
  score: number;
  fuelPercent: number;
  boostActive: boolean;
  tiltEnabled: boolean;
};

export class Hud {
  private readonly text: Phaser.GameObjects.Text;
  private lastText = '';
  private lastUpdateAt = 0;

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

  update(state: HudState, time: number): void {
    if (time - this.lastUpdateAt < 120) {
      return;
    }

    this.lastUpdateAt = time;
    const nextText =
      [
        `Level: ${state.level}`,
        `Zone: ${state.levelName}`,
        `Timer: ${state.remainingSeconds.toFixed(1)}s`,
        `Fuel: ${state.fuelPercent.toFixed(0)}%`,
        `Boost: ${state.boostActive ? 'ON' : 'OFF'}`,
        `Tilt: ${state.tiltEnabled ? 'ON' : 'OFF'}`,
        `Points: ${state.score}`,
        `V Speed: ${state.verticalSpeed.toFixed(1)}`,
        `H Speed: ${state.horizontalSpeed.toFixed(1)}`,
        `Angle: ${state.angleDegrees.toFixed(1)} deg`,
        `Elapsed: ${state.elapsedSeconds.toFixed(1)}s`,
        `Rocket: ${state.profile.name}`,
        `Result: ${state.message}`
      ].join('\n');

    if (nextText !== this.lastText) {
      this.lastText = nextText;
      this.text.setText(nextText);
    }
  }

  destroy(): void {
    this.text.destroy();
  }
}
