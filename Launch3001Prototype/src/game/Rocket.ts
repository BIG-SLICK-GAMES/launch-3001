import Phaser from 'phaser';
import type { RocketProfile } from '../config/rocketProfiles';
import { LINEAR_DAMPING, ROCKET_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from './PhysicsConfig';

export type RocketControls = {
  rotateLeft: boolean;
  rotateRight: boolean;
  thrust: boolean;
};

export class Rocket {
  readonly sprite: Phaser.GameObjects.Container;

  velocity = new Phaser.Math.Vector2(0, 0);
  angularVelocity = 0;
  isThrusting = false;

  private readonly flame: Phaser.GameObjects.Triangle;
  private readonly profile: RocketProfile;

  constructor(scene: Phaser.Scene, x: number, y: number, profile: RocketProfile) {
    this.profile = profile;

    const body = scene.add.triangle(0, -4, 0, -ROCKET_SIZE.height / 2, -ROCKET_SIZE.width / 2, ROCKET_SIZE.height / 2, ROCKET_SIZE.width / 2, ROCKET_SIZE.height / 2, 0xe7edf2);
    body.setStrokeStyle(2, 0x2c3542);

    const cockpit = scene.add.circle(0, -12, 7, 0x79d6ff, 0.95);
    cockpit.setStrokeStyle(2, 0x1f2d38);

    const leftFin = scene.add.triangle(-13, 24, 0, -4, -15, 14, -5, 18, 0xd44b38);
    const rightFin = scene.add.triangle(13, 24, 0, -4, 15, 14, 5, 18, 0xd44b38);

    this.flame = scene.add.triangle(0, 45, -8, 22, 8, 22, 0, 56, 0xffb33f);
    this.flame.setVisible(false);

    this.sprite = scene.add.container(x, y, [this.flame, leftFin, rightFin, body, cockpit]);
    this.sprite.setSize(ROCKET_SIZE.width, ROCKET_SIZE.height);
  }

  update(deltaSeconds: number, controls: RocketControls): void {
    this.isThrusting = controls.thrust;

    if (controls.rotateLeft) {
      this.angularVelocity -= this.profile.steering * deltaSeconds;
    }

    if (controls.rotateRight) {
      this.angularVelocity += this.profile.steering * deltaSeconds;
    }

    this.angularVelocity -= this.angularVelocity * this.profile.angularDamping * deltaSeconds;
    this.sprite.rotation += this.angularVelocity;

    this.velocity.y += this.profile.gravity * deltaSeconds;

    if (controls.thrust) {
      this.velocity.x += Math.sin(this.sprite.rotation) * this.profile.thrust * deltaSeconds;
      this.velocity.y -= Math.cos(this.sprite.rotation) * this.profile.thrust * deltaSeconds;
    }

    this.velocity.scale(Math.pow(LINEAR_DAMPING, deltaSeconds * 60));
    this.sprite.x += this.velocity.x * deltaSeconds;
    this.sprite.y += this.velocity.y * deltaSeconds;

    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 35, WORLD_WIDTH - 35);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, 40, WORLD_HEIGHT + 100);

    this.flame.setVisible(controls.thrust);
    if (controls.thrust) {
      this.flame.setScale(1, 0.75 + Math.random() * 0.35);
    }
  }

  get bottom(): number {
    return this.sprite.y + ROCKET_SIZE.height / 2;
  }

  getAngleFromUprightDegrees(): number {
    const wrapped = Phaser.Math.Angle.Wrap(this.sprite.rotation);
    return Math.abs(Phaser.Math.RadToDeg(wrapped));
  }

  stop(): void {
    this.velocity.set(0, 0);
    this.angularVelocity = 0;
    this.flame.setVisible(false);
  }

  destroy(): void {
    this.sprite.destroy(true);
  }
}
