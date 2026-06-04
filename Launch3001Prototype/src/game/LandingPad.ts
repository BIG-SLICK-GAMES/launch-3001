import Phaser from 'phaser';

export class LandingPad {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, width = 230, height = 18) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.graphics = scene.add.graphics();
    this.graphics.fillStyle(0x202934, 1);
    this.graphics.fillRoundedRect(x - width / 2, y - height, width, height, 4);
    this.graphics.lineStyle(3, 0x71f2ff, 1);
    this.graphics.strokeRoundedRect(x - width / 2, y - height, width, height, 4);
    this.graphics.fillStyle(0x71f2ff, 0.9);
    this.graphics.fillRect(x - width / 2 + 14, y - height - 7, width - 28, 4);
  }

  get left(): number {
    return this.x - this.width / 2;
  }

  get right(): number {
    return this.x + this.width / 2;
  }

  containsX(x: number): boolean {
    return x >= this.left && x <= this.right;
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
