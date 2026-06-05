import Phaser from 'phaser';
import canyonBackgroundUrl from '../assets/backgrounds/canyon_background.png';
import canyonFloorUrl from '../assets/terrain/canyon_floor.png';
import { rocketProfiles, type RocketProfile } from '../config/rocketProfiles';
import { Hud } from '../ui/Hud';
import { TuningPanel } from '../ui/TuningPanel';
import { FLOOR_Y, ROCKET_SIZE, SAFE_LANDING, WORLD_HEIGHT, WORLD_WIDTH } from './PhysicsConfig';
import { LandingPad } from './LandingPad';
import { Rocket, type RocketControls } from './Rocket';
import { calculateLandingScore } from './Scoring';

type GameResult = 'flying' | 'landed' | 'crashed';

export class LaunchScene extends Phaser.Scene {
  private rocket?: Rocket;
  private landingPad?: LandingPad;
  private hud?: Hud;
  private tuningPanel?: TuningPanel;
  private readonly pressedCodes = new Set<string>();
  private readonly onKeyDown = (event: KeyboardEvent): void => this.handleKeyDown(event);
  private readonly onKeyUp = (event: KeyboardEvent): void => this.handleKeyUp(event);
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

    this.add.image(640, 360, 'canyonBackground')
      .setDisplaySize(1280, 720)
      .setScrollFactor(0)
      .setDepth(-10);

    this.add.image(WORLD_WIDTH / 2, FLOOR_Y + 34, 'canyonFloor')
      .setDisplaySize(WORLD_WIDTH, 140)
      .setAlpha(0.72)
      .setTint(0x917164)
      .setScrollFactor(0.5, 1)
      .setDepth(-3);

    this.add.image(WORLD_WIDTH / 2, FLOOR_Y + 62, 'canyonFloor')
      .setDisplaySize(WORLD_WIDTH, 178)
      .setScrollFactor(1, 1)
      .setDepth(-2);

    this.add.rectangle(WORLD_WIDTH / 2, FLOOR_Y + 94, WORLD_WIDTH, 124, 0x4b2e24, 0.78).setDepth(-1);

    this.hud = new Hud(this);
    this.tuningPanel = new TuningPanel(document.getElementById('tuning-panel'));
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    });

    this.restartWithProfile(this.currentProfileIndex);
  }

  update(_time: number, delta: number): void {
    if (!this.rocket || !this.hud) {
      return;
    }

    const deltaSeconds = delta / 1000;

    if (this.result === 'flying') {
      this.rocket.update(deltaSeconds, this.readControls(), this.tuningPanel?.getValues() ?? {
        gravityMultiplier: 1,
        steeringMultiplier: 0.05,
        thrustMultiplier: 1
      });
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
      rotateLeft: this.pressedCodes.has('ArrowLeft') || this.pressedCodes.has('KeyA'),
      rotateRight: this.pressedCodes.has('ArrowRight') || this.pressedCodes.has('KeyD'),
      thrust: this.pressedCodes.has('ArrowUp') || this.pressedCodes.has('KeyW') || this.pressedCodes.has('Space')
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

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.isGameKey(event.code)) {
      event.preventDefault();
      this.pressedCodes.add(event.code);
    }

    if (event.repeat) {
      return;
    }

    if (event.code === 'KeyR') {
      this.restartWithProfile(this.currentProfileIndex);
      return;
    }

    if (event.code === 'Digit1' || event.code === 'Numpad1') {
      this.restartWithProfile(0);
      return;
    }

    if (event.code === 'Digit2' || event.code === 'Numpad2') {
      this.restartWithProfile(1);
      return;
    }

    if (event.code === 'Digit3' || event.code === 'Numpad3') {
      this.restartWithProfile(2);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.pressedCodes.delete(event.code);
  }

  private isGameKey(code: string): boolean {
    return [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'KeyA',
      'KeyD',
      'KeyW',
      'Space',
      'KeyR',
      'Digit1',
      'Digit2',
      'Digit3',
      'Numpad1',
      'Numpad2',
      'Numpad3'
    ].includes(code);
  }

  private get profile(): RocketProfile {
    return rocketProfiles[this.currentProfileIndex];
  }
}
