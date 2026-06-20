import Phaser from 'phaser';

type PadRole = 'launch' | 'landing';

export class LandingPad {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  private readonly scene: Phaser.Scene;
  private readonly role: PadRole;
  private readonly root: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number, width = 230, height = 18, role: PadRole = 'landing') {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.role = role;

    const deckColor = role === 'launch' ? 0x24302f : 0x202934;
    const glowColor = role === 'launch' ? 0xffd36a : 0x71f2ff;
    const accentColor = role === 'launch' ? 0xff734c : 0x7dffb2;

    const shadow = scene.add.ellipse(0, 2, width + 26, 22, 0x05070a, 0.45);

    const base = scene.add.rectangle(0, -height / 2, width, height, deckColor, 1);
    base.setStrokeStyle(3, 0x10161b, 1);

    const topRail = scene.add.rectangle(0, -height - 6, width - 24, 6, glowColor, 0.92);
    const centerStripe = scene.add.rectangle(0, -height / 2, width - 42, 4, accentColor, 0.75);

    const leftStrut = scene.add.triangle(-width * 0.33, 2, -18, 0, 18, 0, 0, 34, 0x171f22);
    const rightStrut = scene.add.triangle(width * 0.33, 2, -18, 0, 18, 0, 0, 34, 0x171f22);

    this.root = scene.add.container(x, y, [shadow, leftStrut, rightStrut, base, centerStripe, topRail]);
    this.root.setDepth(4);
  }

  get left(): number {
    return this.x - this.width / 2;
  }

  get right(): number {
    return this.x + this.width / 2;
  }

  get surfaceY(): number {
    return this.y - this.height;
  }

  containsX(x: number): boolean {
    return x >= this.left && x <= this.right;
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
