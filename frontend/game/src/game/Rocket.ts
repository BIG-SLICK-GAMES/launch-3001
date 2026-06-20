import Phaser from 'phaser';
import type { RocketProfile } from '../config/rocketProfiles';
import type { TuningValues } from '../ui/TuningPanel';
import { LINEAR_DAMPING, WORLD_HEIGHT, WORLD_WIDTH } from './PhysicsConfig';
import rocketUrl from '../assets/rockets/flat-lander.svg';
import flameAUrl from '../assets/effects/booster-flame-a.png';
import flameBUrl from '../assets/effects/booster-flame-b.png';
import smokePuffUrl from '../assets/effects/smoke-puff.png';

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
const ROCKET_DISPLAY_WIDTH = 72;
const ROCKET_DISPLAY_HEIGHT = 96;
const FLAME_LOCAL_Y = 49;

export class Rocket {
  readonly sprite: Phaser.GameObjects.Container;

  velocity = new Phaser.Math.Vector2(0, 0);
  angularVelocity = 0;
  isThrusting = false;

  private readonly flame: Phaser.GameObjects.Container;
  private readonly boosterFlames: Phaser.GameObjects.Image[];
  private readonly scene: Phaser.Scene;
  private readonly profile: RocketProfile;
  private boosterThrustSeconds = 0;
  private boostersDetached = false;

  constructor(scene: Phaser.Scene, x: number, y: number, profile: RocketProfile) {
    this.scene = scene;
    this.profile = profile;

    Rocket.preload(scene);
    const rocketArt = scene.add.image(0, 0, 'rocketShip').setOrigin(0.5);
    rocketArt.setDisplaySize(ROCKET_DISPLAY_WIDTH, ROCKET_DISPLAY_HEIGHT);

    const leftFlame = this.createBoosterFlame(scene, -12, 'boosterFlameA');
    const rightFlame = this.createBoosterFlame(scene, 12, 'boosterFlameB');
    this.boosterFlames = [leftFlame, rightFlame];
    this.flame = scene.add.container(0, 0, [leftFlame, rightFlame]);
    this.flame.setVisible(false);

    this.sprite = scene.add.container(x, y, [
      this.flame,
      rocketArt
    ]);
    this.sprite.setSize(ROCKET_DISPLAY_WIDTH, ROCKET_DISPLAY_HEIGHT);
    this.sprite.setScale(0.72);
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
      this.boosterFlames.forEach((flame) => {
        flame.setScale(1.1 + Math.random() * 0.24, flicker);
        flame.setAlpha(0.76 + Math.random() * 0.24);
      });
    }
  }

  get bottom(): number {
    return this.getLandingFootY();
  }

  get top(): number {
    return this.sprite.y - this.getVisualHalfHeight();
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
    for (let index = 0; index < 7; index += 1) {
      const smoke = this.scene.add.image(
        nozzle.x + (index - 3) * 12,
        nozzle.y + 12 + Math.abs(index - 3) * 4,
        'smokePuff'
      );
      smoke.setOrigin(0.5, 0.55);
      smoke.setScale(0.06 + index * 0.008);
      smoke.setAlpha(0.42);
      smoke.setTint(0xd9d4c9);
      smoke.setDepth(2);
      this.scene.tweens.add({
        targets: smoke,
        y: smoke.y - 24,
        alpha: 0,
        scale: smoke.scaleX * 1.9,
        duration: 560,
        ease: 'Sine.easeOut',
        onComplete: () => smoke.destroy()
      });
    }
  }

  destroy(): void {
    this.sprite.destroy(true);
  }

  private createBoosterFlame(scene: Phaser.Scene, x: number, key: string): Phaser.GameObjects.Image {
    const flame = scene.add.image(x, FLAME_LOCAL_Y, key).setOrigin(0.5, 0);
    flame.setDisplaySize(20, 50);
    return flame;
  }

  private detachSideBoosters(): void {
    this.boostersDetached = true;
  }

  getVisualHalfHeight(): number {
    return (ROCKET_DISPLAY_HEIGHT * this.sprite.scaleY) / 2;
  }

  getLandingFootY(): number {
    return this.sprite.y + this.getLandingFootOffsetY();
  }

  getLandingFootOffsetY(): number {
    const localFoot = new Phaser.Math.Vector2(0, ROCKET_DISPLAY_HEIGHT / 2);
    localFoot.rotate(this.sprite.rotation);
    return localFoot.y * this.sprite.scaleY;
  }

  private getNozzleWorldPosition(): Phaser.Math.Vector2 {
    const localNozzle = new Phaser.Math.Vector2(0, ROCKET_DISPLAY_HEIGHT / 2);
    localNozzle.rotate(this.sprite.rotation);
    return new Phaser.Math.Vector2(
      this.sprite.x + localNozzle.x * this.sprite.scaleX,
      this.sprite.y + localNozzle.y * this.sprite.scaleY
    );
  }

  static preload(scene: Phaser.Scene): void {
    if (!scene.textures.exists('rocketShip')) {
      scene.load.svg('rocketShip', rocketUrl, { width: ROCKET_DISPLAY_WIDTH, height: ROCKET_DISPLAY_HEIGHT });
    }
    if (!scene.textures.exists('boosterFlameA')) {
      scene.load.image('boosterFlameA', flameAUrl);
    }
    if (!scene.textures.exists('boosterFlameB')) {
      scene.load.image('boosterFlameB', flameBUrl);
    }
    if (!scene.textures.exists('smokePuff')) {
      scene.load.image('smokePuff', smokePuffUrl);
    }
  }

}
