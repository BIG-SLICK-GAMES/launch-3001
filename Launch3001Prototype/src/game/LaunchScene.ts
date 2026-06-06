import Phaser from 'phaser';
import backImageUrl from '../assets/backgrounds/backimage.png';
import frontGroundUrl from '../assets/backgrounds/frontGround.png';
import midImageUrl from '../assets/backgrounds/midimage.png';
import { rocketProfiles, type RocketProfile } from '../config/rocketProfiles';
import { sceneLayout } from '../config/sceneLayout';
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
  private midLayer?: Phaser.GameObjects.Image;
  private groundFront?: Phaser.GameObjects.Image;
  private terrainDebugText?: Phaser.GameObjects.Text;
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
    this.load.image('backImage', backImageUrl);
    this.load.image('midImage', midImageUrl);
    this.load.image('frontGround', frontGroundUrl);
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world?.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.add.image(sceneLayout.layers.back.x, sceneLayout.layers.back.y, 'backImage')
      .setOrigin(0, 0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setScrollFactor(sceneLayout.layers.back.scrollFactorX, sceneLayout.layers.back.scrollFactorY)
      .setDepth(sceneLayout.layers.back.depth);

    this.midLayer = this.add.image(0, FLOOR_Y + sceneLayout.layers.mid.yOffsetFromFloor, 'midImage')
      .setOrigin(0, 0)
      .setAlpha(sceneLayout.layers.mid.alpha)
      .setTint(sceneLayout.layers.mid.tint)
      .setScrollFactor(sceneLayout.layers.mid.scrollFactorX, sceneLayout.layers.mid.scrollFactorY)
      .setDepth(sceneLayout.layers.mid.depth);
    this.sizeAndAlignMidLayer();

    this.groundFront = this.add.image(0, FLOOR_Y + sceneLayout.layers.groundFront.yOffsetFromFloor, 'frontGround')
      .setOrigin(0, 0)
      .setAlpha(sceneLayout.layers.groundFront.alpha)
      .setTint(sceneLayout.layers.groundFront.tint)
      .setScrollFactor(sceneLayout.layers.groundFront.scrollFactorX, sceneLayout.layers.groundFront.scrollFactorY)
      .setDepth(sceneLayout.layers.groundFront.depth);
    this.sizeAndAlignGroundFront();

    this.terrainDebugText = this.add.text(sceneLayout.layers.terrainDebug.x, sceneLayout.layers.terrainDebug.y, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      padding: { x: 8, y: 6 }
    }).setScrollFactor(0).setDepth(sceneLayout.layers.terrainDebug.depth);

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

    this.lockCameraToRocket();
    this.updateTerrainDebugText();

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

    this.landingPad = new LandingPad(
      this,
      sceneLayout.landingPad.x,
      FLOOR_Y + sceneLayout.landingPad.yOffsetFromFloor,
      sceneLayout.landingPad.width,
      sceneLayout.landingPad.height
    );
    this.rocket = new Rocket(this, sceneLayout.rocketSpawn.x, sceneLayout.rocketSpawn.y, this.profile);
    this.rocket.velocity.set(sceneLayout.rocketSpawn.velocityX, sceneLayout.rocketSpawn.velocityY);
    this.cameras.main.stopFollow();
    this.lockCameraToRocket();
    this.sizeAndAlignMidLayer();
    this.sizeAndAlignGroundFront();
  }

  private readControls(): RocketControls {
    return {
      rotateLeft: this.pressedCodes.has('ArrowLeft') || this.pressedCodes.has('KeyA'),
      rotateRight: this.pressedCodes.has('ArrowRight') || this.pressedCodes.has('KeyD'),
      thrust: this.pressedCodes.has('ArrowUp') || this.pressedCodes.has('KeyW') || this.pressedCodes.has('Space')
    };
  }

  private sizeAndAlignMidLayer(): void {
    if (!this.midLayer) {
      return;
    }

    const worldScale = WORLD_WIDTH / this.midLayer.width;
    this.midLayer.setScale(worldScale * sceneLayout.level.terrainScale);
    this.midLayer.x = 0;
  }

  private sizeAndAlignGroundFront(): void {
    if (!this.groundFront) {
      return;
    }

    const worldScale = WORLD_WIDTH / this.groundFront.width;
    this.groundFront.setScale(worldScale * sceneLayout.layers.groundFront.widthScale);
    this.groundFront.x = 0;
  }

  private lockCameraToRocket(): void {
    if (!this.rocket) {
      return;
    }

    const targetScrollX = Phaser.Math.Clamp(
      this.rocket.sprite.x - this.scale.width / 2,
      0,
      WORLD_WIDTH - this.scale.width
    );
    this.cameras.main.setScroll(targetScrollX, sceneLayout.camera.verticalScrollY);
  }

  private updateTerrainDebugText(): void {
    if (!this.terrainDebugText || !this.midLayer) {
      return;
    }

    this.terrainDebugText.setText([
      `mid.x: ${this.midLayer.x.toFixed(1)}`,
      `mid.width: ${this.midLayer.displayWidth.toFixed(1)}`,
      `frontGround.width: ${this.groundFront?.displayWidth.toFixed(1) ?? '0.0'}`,
      `viewportWidth: ${this.scale.width}`,
      `camera.scrollX: ${this.cameras.main.scrollX.toFixed(1)}`,
      `rocket.x: ${this.rocket?.sprite.x.toFixed(1) ?? '0.0'}`,
      `terrainScale: ${sceneLayout.level.terrainScale}`
    ]);
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
    this.resultBanner = this.add.text(this.rocket?.sprite.x ?? 0, (this.rocket?.sprite.y ?? 0) + sceneLayout.resultBanner.yOffsetFromRocket, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '44px',
      color: Phaser.Display.Color.IntegerToColor(color).rgba,
      stroke: '#071018',
      strokeThickness: 8
    });
    this.resultBanner.setOrigin(0.5);
    this.resultBanner.setDepth(sceneLayout.resultBanner.depth);
    this.tweens.add({
      targets: this.resultBanner,
      y: this.resultBanner.y - sceneLayout.resultBanner.floatUpDistance,
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
