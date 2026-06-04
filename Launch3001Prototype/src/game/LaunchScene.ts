import Phaser from 'phaser';
import canyonBackgroundUrl from '../assets/backgrounds/canyon_background.png';
import canyonFloorUrl from '../assets/terrain/canyon_floor.png';
import { rocketProfiles, type RocketProfile } from '../config/rocketProfiles';
import { Hud } from '../ui/Hud';
import { FLOOR_Y, ROCKET_SIZE, SAFE_LANDING, WORLD_HEIGHT, WORLD_WIDTH } from './PhysicsConfig';
import { LandingPad } from './LandingPad';
import { Rocket, type RocketControls } from './Rocket';
import { calculateLandingScore } from './Scoring';

type GameResult = 'flying' | 'landed' | 'crashed';

export class LaunchScene extends Phaser.Scene {
  private rocket?: Rocket;
  private landingPad?: LandingPad;
  private hud?: Hud;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private currentProfileIndex = 1;
  private result: GameResult = 'flying';
  private resultMessage = 'Guide the rocket to the glowing pad.';
  private score?: number;
  private resultBanner?: Phaser.GameObjects.Text;

  constructor() {
    super('LaunchScene');
  }

  preload(): void {
    this.load.image('canyonBackground', canyonBackgroundUrl);
    this.load.image('canyonFloor', canyonFloorUrl);
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world?.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'canyonBackground')
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(-10);

    this.add.image(WORLD_WIDTH / 2, FLOOR_Y + 56, 'canyonFloor')
      .setDisplaySize(WORLD_WIDTH, 170)
      .setDepth(-2);

    this.add.rectangle(WORLD_WIDTH / 2, FLOOR_Y + 72, WORLD_WIDTH, 144, 0x4b2e24, 0.78).setDepth(-1);

    this.hud = new Hud(this);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = this.input.keyboard?.addKeys('A,D,W,SPACE,R,ONE,TWO,THREE') as Record<string, Phaser.Input.Keyboard.Key>;

    this.restartWithProfile(this.currentProfileIndex);
  }

  update(_time: number, delta: number): void {
    if (!this.rocket || !this.hud) {
      return;
    }

    const deltaSeconds = delta / 1000;
    this.checkRestartAndProfileKeys();

    if (this.result === 'flying') {
      this.rocket.update(deltaSeconds, this.readControls());
      this.checkLandingOrCrash();
    }

    this.cameras.main.centerOn(
      Phaser.Math.Clamp(this.rocket.sprite.x + 180, 640, WORLD_WIDTH - 640),
      430
    );

    this.hud.update({
      verticalSpeed: this.rocket.velocity.y,
      horizontalSpeed: this.rocket.velocity.x,
      angleDegrees: this.rocket.getAngleFromUprightDegrees(),
      profile: this.profile,
      message: this.resultMessage,
      score: this.score
    });
  }

  private restartWithProfile(profileIndex: number): void {
    this.currentProfileIndex = profileIndex;
    this.result = 'flying';
    this.resultMessage = 'Guide the rocket to the glowing pad.';
    this.score = undefined;

    this.rocket?.destroy();
    this.landingPad?.destroy();
    this.resultBanner?.destroy();
    this.resultBanner = undefined;

    this.landingPad = new LandingPad(this, 1840, FLOOR_Y, 230, 18);
    this.rocket = new Rocket(this, 250, 270, this.profile);
    this.rocket.velocity.set(95, -10);
    this.cameras.main.startFollow(this.rocket.sprite, true, 0.08, 0.08, 120, 0);
  }

  private readControls(): RocketControls {
    return {
      rotateLeft: Boolean(this.cursors?.left.isDown || this.keys?.A.isDown),
      rotateRight: Boolean(this.cursors?.right.isDown || this.keys?.D.isDown),
      thrust: Boolean(this.cursors?.up.isDown || this.keys?.W.isDown || this.keys?.SPACE.isDown)
    };
  }

  private checkLandingOrCrash(): void {
    if (!this.rocket || !this.landingPad || this.rocket.bottom < FLOOR_Y) {
      return;
    }

    const horizontalSpeed = Math.abs(this.rocket.velocity.x);
    const verticalSpeed = Math.abs(this.rocket.velocity.y);
    const angleDegrees = this.rocket.getAngleFromUprightDegrees();
    const onPad = this.landingPad.containsX(this.rocket.sprite.x);
    const safe =
      onPad &&
      verticalSpeed < SAFE_LANDING.verticalSpeed &&
      horizontalSpeed < SAFE_LANDING.horizontalSpeed &&
      angleDegrees < SAFE_LANDING.angleDegrees;

    this.rocket.sprite.y = FLOOR_Y - ROCKET_SIZE.height / 2;
    this.rocket.stop();

    if (safe) {
      this.result = 'landed';
      this.score = calculateLandingScore({ verticalSpeed, horizontalSpeed, angleDegrees }, this.profile);
      this.resultMessage = `Safe landing. Final score ${this.score}.`;
      this.addResultText('LANDED', 0x7dffb2);
      return;
    }

    this.result = 'crashed';
    this.score = undefined;
    this.resultMessage = onPad
      ? 'Crash: pad contact was too fast or too angled.'
      : 'Crash: terrain impact outside the landing pad.';
    this.addResultText('CRASH', 0xff675d);
  }

  private addResultText(label: string, color: number): void {
    this.resultBanner?.destroy();
    this.resultBanner = this.add.text(this.rocket?.sprite.x ?? 0, (this.rocket?.sprite.y ?? 0) - 105, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '44px',
      color: Phaser.Display.Color.IntegerToColor(color).rgba,
      stroke: '#071018',
      strokeThickness: 8
    });
    this.resultBanner.setOrigin(0.5);
    this.resultBanner.setDepth(40);
    this.tweens.add({
      targets: this.resultBanner,
      y: this.resultBanner.y - 26,
      alpha: 0.92,
      duration: 500,
      ease: 'Sine.easeOut'
    });
  }

  private checkRestartAndProfileKeys(): void {
    if (!this.keys) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
      this.restartWithProfile(this.currentProfileIndex);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) {
      this.restartWithProfile(0);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) {
      this.restartWithProfile(1);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) {
      this.restartWithProfile(2);
    }
  }

  private get profile(): RocketProfile {
    return rocketProfiles[this.currentProfileIndex];
  }
}
