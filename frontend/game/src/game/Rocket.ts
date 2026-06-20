import Phaser from 'phaser';
import type { RocketProfile } from '../config/rocketProfiles';
import type { TuningValues } from '../ui/TuningPanel';
import { FLOOR_Y, LINEAR_DAMPING, ROCKET_COLLISION_SIZE, ROCKET_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from './PhysicsConfig';

export type RocketControls = {
  rotateLeft: boolean;
  rotateRight: boolean;
  thrust: boolean;
  boost: boolean;
  tiltSteer: number;
};

const STEERING_RESPONSE_MULTIPLIER = 0.5;
const KEYBOARD_STEERING_MULTIPLIER = 1.54;
const TILT_STEERING_MULTIPLIER = 3.4;
const TILT_DAMPING_MULTIPLIER = 0.72;
const BOOST_THRUST_MULTIPLIER = 1.55;
const BOOSTER_SEPARATION_THRUST_SECONDS = 2.6;
const BOOSTER_LOCAL_X = 27;
const BOOSTER_LOCAL_Y = 18;
const FLAME_LOCAL_Y = 60;

export class Rocket {
  readonly sprite: Phaser.GameObjects.Container;

  velocity = new Phaser.Math.Vector2(0, 0);
  angularVelocity = 0;
  isThrusting = false;

  private readonly flame: Phaser.GameObjects.Container;
  private readonly boosterFlames: Array<{
    core: Phaser.GameObjects.Triangle;
    outer: Phaser.GameObjects.Triangle;
  }>;
  private readonly sideBoosters: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly profile: RocketProfile;
  private readonly detachedBoosters: Phaser.GameObjects.Container[] = [];
  private boosterThrustSeconds = 0;
  private boostersDetached = false;

  constructor(scene: Phaser.Scene, x: number, y: number, profile: RocketProfile) {
    this.scene = scene;
    this.profile = profile;

    Rocket.ensureRocketTexture(scene);
    Rocket.ensureBoosterTexture(scene);
    const rocketArt = scene.add.image(0, 0, 'rocketShip').setOrigin(0.5);

    const leftFlame = this.createBoosterFlame(scene, -BOOSTER_LOCAL_X);
    const rightFlame = this.createBoosterFlame(scene, BOOSTER_LOCAL_X);
    this.boosterFlames = [leftFlame.parts, rightFlame.parts];
    this.flame = scene.add.container(0, 0, [leftFlame.root, rightFlame.root]);
    this.flame.setVisible(false);

    this.sideBoosters = scene.add.container(0, BOOSTER_LOCAL_Y, [
      scene.add.image(-BOOSTER_LOCAL_X, 0, 'sideBooster').setOrigin(0.5),
      scene.add.image(BOOSTER_LOCAL_X, 0, 'sideBooster').setOrigin(0.5)
    ]);

    this.sprite = scene.add.container(x, y, [
      this.flame,
      rocketArt,
      this.sideBoosters
    ]);
    this.sprite.setSize(ROCKET_SIZE.width, ROCKET_SIZE.height);
    this.sprite.setScale(0.5);
    this.sprite.setDepth(10);
  }

  update(deltaSeconds: number, controls: RocketControls, tuning: TuningValues): void {
    this.isThrusting = controls.thrust;
    const steering = this.profile.steering * tuning.steeringMultiplier * STEERING_RESPONSE_MULTIPLIER;
    const gravity = this.profile.gravity * tuning.gravityMultiplier;
    const thrust = this.profile.thrust * tuning.thrustMultiplier;

    const keyboardSteering = steering * KEYBOARD_STEERING_MULTIPLIER;

    if (controls.rotateLeft) {
      this.angularVelocity -= keyboardSteering * deltaSeconds;
    }

    if (controls.rotateRight) {
      this.angularVelocity += keyboardSteering * deltaSeconds;
    }

    if (controls.tiltSteer !== 0) {
      this.angularVelocity += steering * controls.tiltSteer * TILT_STEERING_MULTIPLIER * deltaSeconds;
    }

    const angularDamping = controls.tiltSteer !== 0
      ? this.profile.angularDamping * TILT_DAMPING_MULTIPLIER
      : this.profile.angularDamping;
    this.angularVelocity -= this.angularVelocity * angularDamping * deltaSeconds;
    this.sprite.rotation += this.angularVelocity;

    this.velocity.y += gravity * deltaSeconds;

    if (controls.thrust) {
      const thrustPower = controls.boost ? thrust * BOOST_THRUST_MULTIPLIER : thrust;
      this.velocity.x += Math.sin(this.sprite.rotation) * thrustPower * deltaSeconds;
      this.velocity.y -= Math.cos(this.sprite.rotation) * thrustPower * deltaSeconds;
    }

    this.velocity.scale(Math.pow(LINEAR_DAMPING, deltaSeconds * 60));
    this.sprite.x += this.velocity.x * deltaSeconds;
    this.sprite.y += this.velocity.y * deltaSeconds;

    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 35, WORLD_WIDTH - 35);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, 40, WORLD_HEIGHT + 100);

    this.flame.setVisible(controls.thrust);
    if (controls.thrust) {
      this.boosterThrustSeconds += deltaSeconds;
      if (!this.boostersDetached && this.boosterThrustSeconds >= BOOSTER_SEPARATION_THRUST_SECONDS) {
        this.detachSideBoosters();
      }

      const flicker = 0.82 + Math.random() * 0.42;
      this.boosterFlames.forEach(({ outer, core }) => {
        outer.setScale(0.78 + Math.random() * 0.18, flicker);
        core.setScale(0.72 + Math.random() * 0.16, 0.68 + Math.random() * 0.28);
      });
    }
  }

  get bottom(): number {
    return this.sprite.y + ROCKET_COLLISION_SIZE.height / 2;
  }

  get top(): number {
    return this.sprite.y - ROCKET_COLLISION_SIZE.height / 2;
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

  emitLandingSmoke(): void {
    const nozzle = this.getNozzleWorldPosition();
    for (let index = 0; index < 5; index += 1) {
      const smoke = this.scene.add.circle(
        nozzle.x + (index - 2) * 10,
        nozzle.y + 8 + Math.abs(index - 2) * 3,
        10 + index * 2,
        0xd4d0c2,
        0.24
      );
      smoke.setDepth(2);
      this.scene.tweens.add({
        targets: smoke,
        y: smoke.y - 18,
        alpha: 0,
        scale: 1.8,
        duration: 360,
        ease: 'Sine.easeOut',
        onComplete: () => smoke.destroy()
      });
    }
  }

  destroy(): void {
    this.detachedBoosters.forEach((booster) => booster.destroy(true));
    this.sprite.destroy(true);
  }

  private createBoosterFlame(scene: Phaser.Scene, x: number): {
    root: Phaser.GameObjects.Container;
    parts: {
      core: Phaser.GameObjects.Triangle;
      outer: Phaser.GameObjects.Triangle;
    };
  } {
    const glow = scene.add.ellipse(x, FLAME_LOCAL_Y - 2, 22, 34, 0xffaa35, 0.22);
    const outer = scene.add.triangle(x, FLAME_LOCAL_Y, -9, 0, 9, 0, 0, 34, 0xff6a1c, 0.9);
    const core = scene.add.triangle(x, FLAME_LOCAL_Y - 2, -5, 0, 5, 0, 0, 24, 0xfff4a8, 0.95);

    return {
      root: scene.add.container(0, 0, [glow, outer, core]),
      parts: { core, outer }
    };
  }

  private detachSideBoosters(): void {
    this.boostersDetached = true;
    this.sideBoosters.setVisible(false);
    this.flame.setVisible(false);

    this.spawnDetachedBooster(-BOOSTER_LOCAL_X, -1);
    this.spawnDetachedBooster(BOOSTER_LOCAL_X, 1);
  }

  private spawnDetachedBooster(localX: number, direction: -1 | 1): void {
    const position = this.getLocalWorldPosition(localX, BOOSTER_LOCAL_Y);
    const booster = this.scene.add.image(0, 0, 'sideBooster').setOrigin(0.5);
    const canopy = this.scene.add.arc(0, -54, 28, 180, 360, false, 0xf6f1e7, 0.88);
    const leftLine = this.scene.add.line(0, 0, -22, -52, -6, -18, 0xf6f1e7, 0.8).setLineWidth(1);
    const rightLine = this.scene.add.line(0, 0, 22, -52, 6, -18, 0xf6f1e7, 0.8).setLineWidth(1);
    const chute = this.scene.add.container(0, 0, [canopy, leftLine, rightLine]);
    chute.setVisible(false);

    const detached = this.scene.add.container(position.x, position.y, [chute, booster]);
    detached.setRotation(this.sprite.rotation + direction * 0.22);
    detached.setDepth(9);
    this.detachedBoosters.push(detached);

    this.scene.tweens.add({
      targets: detached,
      x: position.x + direction * 155,
      y: Math.min(FLOOR_Y - 28, position.y + 160),
      rotation: direction * 0.7,
      duration: 620,
      ease: 'Sine.easeOut',
      onComplete: () => {
        chute.setVisible(true);
        this.scene.tweens.add({
          targets: detached,
          x: detached.x + direction * 120,
          y: FLOOR_Y - 30,
          rotation: direction * 0.08,
          duration: 2600,
          ease: 'Sine.easeInOut'
        });
      }
    });
  }

  private getLocalWorldPosition(localX: number, localY: number): Phaser.Math.Vector2 {
    const local = new Phaser.Math.Vector2(localX, localY);
    local.rotate(this.sprite.rotation);
    return new Phaser.Math.Vector2(this.sprite.x + local.x, this.sprite.y + local.y);
  }

  private getNozzleWorldPosition(): Phaser.Math.Vector2 {
    const localNozzle = new Phaser.Math.Vector2(0, ROCKET_COLLISION_SIZE.height / 2);
    localNozzle.rotate(this.sprite.rotation);
    return new Phaser.Math.Vector2(this.sprite.x + localNozzle.x, this.sprite.y + localNozzle.y);
  }

  private static ensureRocketTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('rocketShip')) {
      return;
    }

    const graphics = scene.add.graphics();
    const cx = 42;
    const cy = 68;

    graphics.fillStyle(0x05070b, 0.28);
    graphics.fillEllipse(cx + 5, cy + 7, 48, 126);

    graphics.fillStyle(0xd83f34, 1);
    graphics.lineStyle(3, 0x5f1d1b, 1);
    graphics.beginPath();
    graphics.moveTo(cx, 2);
    graphics.lineTo(cx - 17, 33);
    graphics.lineTo(cx - 7, 28);
    graphics.lineTo(cx + 7, 28);
    graphics.lineTo(cx + 17, 33);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    graphics.fillStyle(0xf6f1e7, 1);
    graphics.lineStyle(3, 0x263241, 1);
    graphics.beginPath();
    graphics.moveTo(cx - 17, 31);
    graphics.lineTo(cx - 22, 62);
    graphics.lineTo(cx - 19, 91);
    graphics.lineTo(cx - 14, 114);
    graphics.lineTo(cx + 14, 114);
    graphics.lineTo(cx + 19, 91);
    graphics.lineTo(cx + 22, 62);
    graphics.lineTo(cx + 17, 31);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    graphics.fillStyle(0xb9c2c8, 0.55);
    graphics.fillRect(cx + 5, 36, 7, 72);
    graphics.fillStyle(0xffffff, 0.42);
    graphics.fillRect(cx - 10, 38, 5, 55);

    graphics.fillStyle(0x2f84d8, 0.95);
    graphics.fillRoundedRect(cx - 4, 49, 8, 52, 4);
    graphics.fillStyle(0xffc85d, 0.95);
    graphics.fillRoundedRect(cx - 17, 86, 34, 8, 4);

    graphics.fillStyle(0xd94f42, 1);
    graphics.lineStyle(2, 0x6c2420, 1);
    graphics.beginPath();
    graphics.moveTo(cx - 14, 95);
    graphics.lineTo(cx - 38, 124);
    graphics.lineTo(cx - 15, 117);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.beginPath();
    graphics.moveTo(cx + 14, 95);
    graphics.lineTo(cx + 38, 124);
    graphics.lineTo(cx + 15, 117);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    graphics.fillStyle(0x1a2630, 1);
    graphics.fillRoundedRect(cx - 12, 111, 24, 9, 4);
    graphics.fillStyle(0x5b6770, 1);
    graphics.fillRoundedRect(cx - 7, 115, 14, 7, 3);

    graphics.fillStyle(0x5ce4ff, 0.2);
    graphics.fillCircle(cx, 48, 15);
    graphics.fillStyle(0x8fe9ff, 1);
    graphics.lineStyle(3, 0x1f3948, 1);
    graphics.fillCircle(cx, 48, 9);
    graphics.strokeCircle(cx, 48, 9);
    graphics.fillStyle(0xffffff, 0.75);
    graphics.fillCircle(cx - 3, 45, 3);

    graphics.lineStyle(1, 0x9daab2, 0.55);
    graphics.strokeLineShape(new Phaser.Geom.Line(cx - 13, 67, cx + 13, 67));
    graphics.strokeLineShape(new Phaser.Geom.Line(cx - 12, 79, cx + 12, 79));

    graphics.generateTexture('rocketShip', 84, 136);
    graphics.destroy();
  }

  private static ensureBoosterTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('sideBooster')) {
      return;
    }

    const graphics = scene.add.graphics();
    const cx = 8;

    graphics.fillStyle(0xe7edf2, 1);
    graphics.lineStyle(2, 0x40515d, 1);
    graphics.fillRoundedRect(cx - 5, 0, 10, 62, 5);
    graphics.strokeRoundedRect(cx - 5, 0, 10, 62, 5);
    graphics.fillStyle(0xffffff, 0.42);
    graphics.fillRoundedRect(cx - 2, 7, 3, 42, 2);
    graphics.fillStyle(0xffc85d, 1);
    graphics.fillRoundedRect(cx - 4, 50, 8, 12, 4);
    graphics.fillStyle(0xd94f42, 1);
    graphics.fillTriangle(cx - 5, 11, cx + 5, 11, cx, -6);
    graphics.generateTexture('sideBooster', 16, 68);
    graphics.destroy();
  }
}
