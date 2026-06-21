import Phaser from 'phaser';
import { rocketProfiles } from '../config/rocketProfiles';
import { Hud } from '../ui/Hud';
import {
  BACKGROUND_FLOOR_Y,
  BACKGROUND_WORLD_HEIGHT,
  BACKGROUND_WORLD_WIDTH,
  type BackgroundTheme,
  HangarBackgroundLayer
} from './HangarBackgroundLayer';
import { SAFE_LANDING } from './PhysicsConfig';
import { Rocket, type RocketControls } from './Rocket';
import { calculateLandingScore, LANDING_TIME_LIMIT_SECONDS } from './Scoring';
import {
  buildCeilingPoints,
  buildGroundPoints,
  buildTerrainObstacles,
  getCeilingY,
  getGroundY,
  type TerrainObstacle,
  type TerrainPoint
} from './LevelTerrain';

type PadSurface = {
  x: number;
  surfaceY: number;
  width: number;
  containsX: (x: number) => boolean;
  destroy: () => void;
};

type GameResult = 'flying' | 'landed' | 'crashed';

const DEFAULT_TUNING_VALUES = {
  gravityMultiplier: 1.03,
  steeringMultiplier: 0.12978,
  thrustMultiplier: 1.5965
};

type LevelConfig = {
  name: string;
  theme: BackgroundTheme;
  padColor: number;
  terrainLevel: number;
  obstacleLevel: number;
  launchX: number;
  launchYOffset: number;
  landingX: number;
  landingYOffset: number;
};

const LEVEL_FUEL_SECONDS = 14;
const LAUNCH_PAD_WIDTH = 220;
const LANDING_PAD_WIDTH = 250;
const LEVEL_COUNT = 100;
const TERRAIN_LEVEL_STEP = 7;
const LEVEL_THEMES: Array<Pick<LevelConfig, 'name' | 'theme' | 'padColor'>> = [
  {
    name: 'Training Orbit',
    padColor: 0x73e6ff,
    theme: { backTint: 0xffffff, midTint: 0xffffff, frontTint: 0xffffff, midAlpha: 0.78, frontAlpha: 0.55 }
  },
  {
    name: 'Red Drift',
    padColor: 0xff8f55,
    theme: { backTint: 0xffd8c5, midTint: 0xff735f, frontTint: 0xffc67a, midAlpha: 0.92, frontAlpha: 0.68 }
  },
  {
    name: 'Violet Debris',
    padColor: 0xd56dff,
    theme: { backTint: 0xd8dbff, midTint: 0xa36dff, frontTint: 0xfff0a8, midAlpha: 1, frontAlpha: 0.82 }
  },
  {
    name: 'Broken Corridor',
    padColor: 0xffe66d,
    theme: { backTint: 0xc7fff0, midTint: 0x6dfff0, frontTint: 0xffe6a0, midAlpha: 1, frontAlpha: 0.9 }
  },
  {
    name: 'Final Thread',
    padColor: 0xff6d8f,
    theme: { backTint: 0xffd6f2, midTint: 0xff5fa8, frontTint: 0xfff7b8, midAlpha: 1, frontAlpha: 1 }
  }
];
const LEVELS: LevelConfig[] = Array.from({ length: LEVEL_COUNT }, (_, index) => createLevelConfig(index));
const THRUST_FUEL_DRAIN_PER_SECOND = 1;
const BOOST_FUEL_DRAIN_PER_SECOND = 2.35;
const TILT_DEAD_ZONE = 0.08;
const TILT_MAX_DEGREES = 48;
const UPSIDE_DOWN_TILT_MESSAGE = 'turn phone around for tilt';

export class LaunchScene extends Phaser.Scene {
  private hangarBackgroundLayer?: HangarBackgroundLayer;
  private rocket?: Rocket;
  private launchPad?: PadSurface;
  private landingPad?: PadSurface;
  private terrainGraphics?: Phaser.GameObjects.Graphics;
  private hud?: Hud;
  private levelBanner?: Phaser.GameObjects.Text;
  private fuelBarBack?: Phaser.GameObjects.Rectangle;
  private fuelBarFill?: Phaser.GameObjects.Rectangle;
  private fuelText?: Phaser.GameObjects.Text;
  private controlAbortController?: AbortController;
  private boostButton?: HTMLButtonElement;
  private tiltButton?: HTMLButtonElement;
  private tiltStatus?: HTMLElement;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyW?: Phaser.Input.Keyboard.Key;
  private keyR?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private keyShift?: Phaser.Input.Keyboard.Key;
  private hasLaunched = false;
  private hasClearedLaunchPad = false;
  private result: GameResult = 'flying';
  private resultBanner?: Phaser.GameObjects.Text;
  private currentLevelIndex = 0;
  private fuelSeconds = LEVEL_FUEL_SECONDS;
  private flightElapsedSeconds = 0;
  private score = 0;
  private boostPointerDown = false;
  private tiltEnabled = false;
  private tiltAxis = 0;

  constructor() {
    super('LaunchScene');
  }

  preload(): void {
    HangarBackgroundLayer.preload(this);
    Rocket.preload(this);
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, BACKGROUND_WORLD_WIDTH, BACKGROUND_WORLD_HEIGHT);
    this.cameras.main.setZoom(1.18);

    this.hangarBackgroundLayer?.destroy();
    this.hangarBackgroundLayer = new HangarBackgroundLayer(this);
    this.applyCurrentLevelTheme();
    this.createLevelPads();

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keyA = this.input.keyboard?.addKey('A');
    this.keyD = this.input.keyboard?.addKey('D');
    this.keyW = this.input.keyboard?.addKey('W');
    this.keyR = this.input.keyboard?.addKey('R');
    this.keySpace = this.input.keyboard?.addKey('SPACE');
    this.keyShift = this.input.keyboard?.addKey('SHIFT');

    this.hud = new Hud(this);
    this.createFuelBar();
    this.createTouchControls();
    this.resetRocket();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hangarBackgroundLayer?.destroy();
      this.rocket?.destroy();
      this.launchPad?.destroy();
      this.landingPad?.destroy();
      this.terrainGraphics?.destroy();
      this.resultBanner?.destroy();
      this.levelBanner?.destroy();
      this.hud?.destroy();
      this.controlAbortController?.abort();
      window.removeEventListener('deviceorientation', this.handleDeviceOrientation);
      window.removeEventListener('orientationchange', this.handleOrientationChange);
    });
  }

  update(time: number, delta: number): void {
    if (!this.rocket || !this.launchPad || !this.landingPad) {
      return;
    }

    if (this.keyR && Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.resetRocket();
      return;
    }

    const controls = this.readControls();
    const deltaSeconds = delta / 1000;

    if (this.result === 'flying') {
      if (!this.hasLaunched && !controls.thrust) {
        this.holdRocketOnLaunchPad();
      } else {
        this.hasLaunched = true;
        this.flightElapsedSeconds += deltaSeconds;
        this.drainFuel(deltaSeconds, controls);
        const previousBottom = this.rocket.bottom;
        this.rocket.update(deltaSeconds, controls, this.getCurrentTuningValues());

        if (this.rocket.bottom < this.launchPad.surfaceY - 22) {
          this.hasClearedLaunchPad = true;
        }

        if (!this.hasClearedLaunchPad && this.rocket.bottom >= this.launchPad.surfaceY) {
          this.holdRocketOnLaunchPad();
        }

        this.checkLandingOrCrash(previousBottom);
        this.checkBoundsCrash();
      }
    }

    this.updateHud(time, controls);
    this.lockCameraToRocket();
  }

  private resetRocket(): void {
    this.rocket?.destroy();
    this.resultBanner?.destroy();
    this.resultBanner = undefined;
    this.result = 'flying';
    this.hasLaunched = false;
    this.hasClearedLaunchPad = false;
    this.fuelSeconds = LEVEL_FUEL_SECONDS;
    this.flightElapsedSeconds = 0;
    this.score = 0;

    const surfaceY = this.launchPad?.surfaceY ?? BACKGROUND_FLOOR_Y;
    const launchX = this.launchPad?.x ?? this.getCurrentLevel().launchX;
    this.rocket = new Rocket(this, launchX, surfaceY, rocketProfiles[1]);
    this.rocket.sprite.y = surfaceY - this.rocket.getVisualHalfHeight();
    this.showLevelBanner();
    this.lockCameraToRocket();
  }

  private getCurrentLevel(): LevelConfig {
    return LEVELS[this.currentLevelIndex];
  }

  private getCurrentTuningValues(): typeof DEFAULT_TUNING_VALUES {
    return DEFAULT_TUNING_VALUES;
  }

  private createLevelPads(): void {
    this.launchPad?.destroy();
    this.landingPad?.destroy();
    this.terrainGraphics?.destroy();
    const level = this.getCurrentLevel();
    this.launchPad = this.createPad(level.launchX, BACKGROUND_FLOOR_Y - level.launchYOffset, LAUNCH_PAD_WIDTH, 0xffb54a);
    this.landingPad = this.createPad(level.landingX, BACKGROUND_FLOOR_Y - level.landingYOffset, LANDING_PAD_WIDTH, level.padColor);
    this.terrainGraphics = this.createTerrain(level.terrainLevel, level.padColor);
  }

  private applyCurrentLevelTheme(): void {
    this.hangarBackgroundLayer?.applyTheme(this.getCurrentLevel().theme);
  }

  private readControls(): RocketControls {
    const hasFuel = this.fuelSeconds > 0;
    const wantsBoost = Boolean(this.keyShift?.isDown || this.boostPointerDown);
    const thrust = hasFuel && Boolean(this.cursors?.up.isDown || this.keyW?.isDown || this.keySpace?.isDown || wantsBoost);
    const boost = hasFuel && thrust && wantsBoost;

    return {
      rotateLeft: Boolean(this.cursors?.left.isDown || this.keyA?.isDown),
      rotateRight: Boolean(this.cursors?.right.isDown || this.keyD?.isDown),
      thrust,
      boost,
      tiltSteer: this.tiltEnabled ? this.tiltAxis : 0
    };
  }

  private drainFuel(deltaSeconds: number, controls: RocketControls): void {
    if (!controls.thrust || this.fuelSeconds <= 0) {
      return;
    }

    const drainRate = controls.boost ? BOOST_FUEL_DRAIN_PER_SECOND : THRUST_FUEL_DRAIN_PER_SECOND;
    this.fuelSeconds = Math.max(0, this.fuelSeconds - drainRate * deltaSeconds);
  }

  private createFuelBar(): void {
    const x = 18;
    const y = 176;
    const width = 220;
    const height = 18;

    this.fuelBarBack = this.add.rectangle(x, y, width, height, 0x05080e, 0.76).setOrigin(0, 0);
    this.fuelBarBack.setStrokeStyle(2, 0xd1dde7, 0.54);
    this.fuelBarBack.setScrollFactor(0);
    this.fuelBarBack.setDepth(50);

    this.fuelBarFill = this.add.rectangle(x + 3, y + 3, width - 6, height - 6, 0x57e389, 1).setOrigin(0, 0);
    this.fuelBarFill.setScrollFactor(0);
    this.fuelBarFill.setDepth(51);

    this.fuelText = this.add.text(x, y + 24, 'FUEL', {
      fontFamily: 'Consolas, monospace',
      fontSize: '14px',
      color: '#f3f7ff',
      stroke: '#05080e',
      strokeThickness: 4
    });
    this.fuelText.setScrollFactor(0);
    this.fuelText.setDepth(51);
  }

  private createTouchControls(): void {
    this.controlAbortController?.abort();
    this.controlAbortController = new AbortController();
    const { signal } = this.controlAbortController;

    this.boostButton = document.querySelector<HTMLButtonElement>('#boost-control') ?? undefined;
    this.tiltButton = document.querySelector<HTMLButtonElement>('#tilt-control') ?? undefined;
    this.tiltStatus = document.querySelector<HTMLElement>('#tilt-status') ?? undefined;

    const pressBoost = (isPressed: boolean): void => {
      this.boostPointerDown = isPressed;
      this.boostButton?.classList.toggle('is-active', isPressed);
      this.boostButton?.setAttribute('aria-pressed', String(isPressed));
    };

    this.boostButton?.addEventListener('pointerdown', () => pressBoost(true), { signal });
    this.boostButton?.addEventListener('pointerup', () => pressBoost(false), { signal });
    this.boostButton?.addEventListener('pointercancel', () => pressBoost(false), { signal });
    this.boostButton?.addEventListener('pointerleave', () => pressBoost(false), { signal });

    this.tiltButton?.addEventListener('click', () => {
      void this.enableTiltControls();
    }, { signal });
  }

  private async enableTiltControls(): Promise<void> {
    const orientationApi = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<PermissionState>;
    };

    try {
      await this.requestLandscapeMode();

      if (typeof orientationApi.requestPermission === 'function') {
        const permission = await orientationApi.requestPermission();
        if (permission !== 'granted') {
          this.setTiltStatus('tilt permission denied');
          return;
        }
      }

      this.tiltEnabled = true;
      this.setTiltStatus('tilt steering on');
      this.tiltButton?.classList.add('is-active');
      this.tiltButton?.setAttribute('aria-pressed', 'true');
      window.addEventListener('deviceorientation', this.handleDeviceOrientation);
      window.addEventListener('orientationchange', this.handleOrientationChange);
      this.handleOrientationChange();
    } catch {
      this.setTiltStatus('tilt unavailable');
    }
  }

  private async requestLandscapeMode(): Promise<void> {
    const documentElement = document.documentElement as HTMLElement & {
      requestFullscreen?: () => Promise<void>;
      webkitRequestFullscreen?: () => Promise<void>;
    };
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: 'landscape-primary') => Promise<void>;
    };

    try {
      if (!document.fullscreenElement) {
        const requestFullscreen = documentElement.requestFullscreen ?? documentElement.webkitRequestFullscreen;
        await requestFullscreen?.call(documentElement);
      }

      await orientation.lock?.('landscape-primary');
    } catch {
      this.setTiltStatus('turn phone sideways');
    }
  }

  private setTiltStatus(message: string): void {
    if (this.tiltStatus) {
      this.tiltStatus.textContent = message;
    }
  }

  private readonly handleDeviceOrientation = (event: DeviceOrientationEvent): void => {
    if (!this.isLandscape()) {
      this.tiltAxis = 0;
      this.setTiltStatus('turn phone sideways');
      return;
    }

    if (this.isUpsideDownLandscape()) {
      this.tiltAxis = 0;
      this.setTiltStatus(UPSIDE_DOWN_TILT_MESSAGE);
      return;
    }

    const rawTilt = event.beta ?? 0;
    const normalized = Phaser.Math.Clamp((rawTilt ?? 0) / TILT_MAX_DEGREES, -1, 1);
    this.tiltAxis = Math.abs(normalized) < TILT_DEAD_ZONE ? 0 : normalized;
    this.setTiltStatus(`tilt ${Math.round(this.tiltAxis * 100)}%`);
  };

  private readonly handleOrientationChange = (): void => {
    if (!this.tiltEnabled) {
      return;
    }

    if (!this.isLandscape()) {
      this.tiltAxis = 0;
      this.setTiltStatus('turn phone sideways');
      return;
    }

    if (this.isUpsideDownLandscape()) {
      this.tiltAxis = 0;
      this.setTiltStatus(UPSIDE_DOWN_TILT_MESSAGE);
      return;
    }

    this.setTiltStatus('tilt steering on');
  };

  private isLandscape(): boolean {
    const orientationType = screen.orientation?.type;
    if (orientationType?.startsWith('landscape')) {
      return true;
    }

    if (orientationType?.startsWith('portrait')) {
      return false;
    }

    return window.matchMedia('(orientation: landscape)').matches || Math.abs(this.getNormalizedOrientationAngle()) === 90;
  }

  private isUpsideDownLandscape(): boolean {
    const orientationType = screen.orientation?.type;
    if (orientationType === 'landscape-secondary') {
      return true;
    }

    const angle = this.getNormalizedOrientationAngle();
    return angle === 270;
  }

  private getNormalizedOrientationAngle(): number {
    const legacyOrientation = (window as unknown as { orientation?: number }).orientation;
    const angle = screen.orientation?.angle ?? legacyOrientation ?? 0;
    return ((angle % 360) + 360) % 360;
  }

  private updateHud(time: number, controls: RocketControls): void {
    if (!this.rocket) {
      return;
    }

    const fuelPercent = Phaser.Math.Clamp(this.fuelSeconds / LEVEL_FUEL_SECONDS, 0, 1);
    this.fuelBarFill?.setScale(fuelPercent, 1);
    this.fuelBarFill?.setFillStyle(fuelPercent < 0.2 ? 0xff675d : controls.boost ? 0xffb84d : 0x57e389, 1);
    this.fuelText?.setText(`FUEL ${(fuelPercent * 100).toFixed(0)}%`);

    this.hud?.update(
      {
        verticalSpeed: this.rocket.velocity.y,
        horizontalSpeed: this.rocket.velocity.x,
        angleDegrees: this.rocket.getAngleFromUprightDegrees(),
        profile: rocketProfiles[1],
        level: this.currentLevelIndex + 1,
        levelName: this.getCurrentLevel().name,
        message: this.result,
        elapsedSeconds: this.flightElapsedSeconds,
        remainingSeconds: Math.max(0, LANDING_TIME_LIMIT_SECONDS - this.flightElapsedSeconds),
        score: this.score,
        fuelPercent: fuelPercent * 100,
        boostActive: controls.boost,
        tiltEnabled: this.tiltEnabled
      },
      time
    );
  }

  private holdRocketOnLaunchPad(): void {
    if (!this.rocket || !this.launchPad) {
      return;
    }

    this.rocket.sprite.x = this.launchPad.x;
    this.rocket.sprite.y = this.launchPad.surfaceY - this.rocket.getVisualHalfHeight();
    this.rocket.sprite.rotation = 0;
    this.rocket.velocity.set(0, 0);
    this.rocket.angularVelocity = 0;
  }

  private checkLandingOrCrash(previousBottom: number): void {
    if (!this.rocket || !this.landingPad || !this.hasClearedLaunchPad) {
      return;
    }

    const onLaunchPad = this.launchPad?.containsX(this.rocket.sprite.x) ?? false;
    const onLandingPad = this.landingPad.containsX(this.rocket.sprite.x);
    const terrainLevel = this.getCurrentLevel().terrainLevel;
    const terrainGroundY = getGroundY(this.rocket.sprite.x, terrainLevel);
    const contactY = onLandingPad ? this.landingPad.surfaceY : onLaunchPad && this.launchPad ? this.launchPad.surfaceY : terrainGroundY;
    const crossedLandingSurface = previousBottom <= contactY && this.rocket.bottom >= contactY;
    if (!crossedLandingSurface && this.rocket.bottom < contactY) {
      this.checkCeilingOrObstacleCrash();
      return;
    }

    const horizontalSpeed = Math.abs(this.rocket.velocity.x);
    const verticalSpeed = Math.abs(this.rocket.velocity.y);
    const angleDegrees = this.rocket.getAngleFromUprightDegrees();
    const safe =
      onLandingPad &&
      verticalSpeed < SAFE_LANDING.verticalSpeed &&
      horizontalSpeed < SAFE_LANDING.horizontalSpeed &&
      angleDegrees < SAFE_LANDING.angleDegrees;

    this.rocket.sprite.y = contactY - this.rocket.getLandingFootOffsetY();
    this.rocket.sprite.rotation = 0;
    this.rocket.sprite.y = contactY - this.rocket.getVisualHalfHeight();
    this.rocket.stop();

    if (safe) {
      this.result = 'landed';
      this.score = calculateLandingScore(this.flightElapsedSeconds);
      this.rocket.emitLandingSmoke();
      const hasNextLevel = this.currentLevelIndex < LEVELS.length - 1;
      this.addResultText(hasNextLevel ? 'LANDED - NEXT LEVEL' : 'LANDED - FINAL LEVEL', 0x7dffb2);
      this.queueNextLevel();
      return;
    }

    this.result = 'crashed';
    this.addResultText('CRASH', 0xff675d);
  }

  private checkCeilingOrObstacleCrash(): void {
    if (!this.rocket || this.result !== 'flying') {
      return;
    }

    const terrainLevel = this.getCurrentLevel().terrainLevel;
    const ceilingY = getCeilingY(this.rocket.sprite.x, terrainLevel);
    if (ceilingY !== undefined && this.rocket.top <= ceilingY) {
      this.crashRocket();
      return;
    }

    const rocketBounds = this.getRocketApproxBounds();
    const obstacleLevel = this.getCurrentLevel().obstacleLevel;
    const obstacles = obstacleLevel > 0 ? buildTerrainObstacles(obstacleLevel) : [];
    const hitObstacle = obstacles.some((obstacle) => this.overlapsObstacle(rocketBounds, obstacle));
    if (hitObstacle) {
      this.crashRocket();
    }
  }

  private queueNextLevel(): void {
    this.time.delayedCall(1600, () => {
      if (this.result !== 'landed') {
        return;
      }

      if (this.currentLevelIndex < LEVELS.length - 1) {
        this.currentLevelIndex += 1;
      }
      this.applyCurrentLevelTheme();
      this.createLevelPads();
      this.resetRocket();
    });
  }

  private checkBoundsCrash(): void {
    if (!this.rocket || this.result !== 'flying') {
      return;
    }

    if (this.rocket.sprite.y > BACKGROUND_WORLD_HEIGHT + 80 || this.rocket.sprite.y < -120) {
      this.crashRocket();
    }
  }

  private crashRocket(): void {
    if (!this.rocket || this.result !== 'flying') {
      return;
    }

    this.rocket.stop();
    this.result = 'crashed';
    this.addResultText('CRASH', 0xff675d);
  }

  private getRocketApproxBounds(): Phaser.Geom.Rectangle {
    const width = 46;
    const height = this.rocket?.getVisualHalfHeight() ? this.rocket.getVisualHalfHeight() * 2 : 80;
    const x = (this.rocket?.sprite.x ?? 0) - width / 2;
    const y = (this.rocket?.sprite.y ?? 0) - height / 2;
    return new Phaser.Geom.Rectangle(x, y, width, height);
  }

  private overlapsObstacle(bounds: Phaser.Geom.Rectangle, obstacle: TerrainObstacle): boolean {
    return Phaser.Geom.Rectangle.Overlaps(
      bounds,
      new Phaser.Geom.Rectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
    );
  }

  private lockCameraToRocket(): void {
    if (!this.rocket) {
      return;
    }

    const visibleWidth = this.scale.width / this.cameras.main.zoom;
    const targetScrollX = Phaser.Math.Clamp(
      this.rocket.sprite.x - visibleWidth * 0.35,
      0,
      BACKGROUND_WORLD_WIDTH - visibleWidth
    );
    this.cameras.main.setScroll(targetScrollX, 0);
  }

  private createPad(x: number, y: number, width: number, accentColor: number): PadSurface {
    const shadow = this.add.ellipse(0, 18, width + 34, 22, 0x030507, 0.55);
    const base = this.add.rectangle(0, 0, width, 22, 0x1b2025, 1);
    base.setStrokeStyle(3, 0x07090d, 1);

    const deck = this.add.rectangle(0, -12, width - 22, 12, 0x59616a, 1);
    deck.setStrokeStyle(2, 0x20262c, 1);

    const stripe = this.add.rectangle(0, -20, width - 52, 4, accentColor, 0.92);
    const leftRamp = this.add.triangle(-width / 2 + 18, 4, 0, 0, 38, 0, 38, 22, 0x2a3036, 1);
    const rightRamp = this.add.triangle(width / 2 - 18, 4, 0, 0, -38, 0, -38, 22, 0x2a3036, 1);

    const pad = this.add.container(x, y, [shadow, leftRamp, rightRamp, base, deck, stripe]);
    pad.setDepth(6);

    return {
      x,
      surfaceY: y - 20,
      width,
      containsX: (candidateX: number) => candidateX >= x - width / 2 && candidateX <= x + width / 2,
      destroy: () => pad.destroy(true)
    };
  }

  private createTerrain(level: number, accentColor: number): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    graphics.setDepth(4);

    this.drawGround(graphics, buildGroundPoints(level), accentColor);
    this.drawCeiling(graphics, buildCeilingPoints(level), accentColor);
    const obstacleLevel = this.getCurrentLevel().obstacleLevel;
    if (obstacleLevel > 0) {
      this.drawObstacles(graphics, buildTerrainObstacles(obstacleLevel), accentColor);
    }

    return graphics;
  }

  private drawGround(graphics: Phaser.GameObjects.Graphics, points: TerrainPoint[], accentColor: number): void {
    graphics.fillStyle(0x101821, 0.92);
    graphics.lineStyle(3, accentColor, 0.72);
    graphics.beginPath();
    graphics.moveTo(points[0].x, BACKGROUND_WORLD_HEIGHT + 120);
    points.forEach((point) => graphics.lineTo(point.x, point.y));
    graphics.lineTo(points[points.length - 1].x, BACKGROUND_WORLD_HEIGHT + 120);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  private drawCeiling(graphics: Phaser.GameObjects.Graphics, points: TerrainPoint[], accentColor: number): void {
    graphics.fillStyle(0x0b1119, 0.78);
    graphics.lineStyle(3, accentColor, 0.5);
    graphics.beginPath();
    graphics.moveTo(points[0].x, -120);
    points.forEach((point) => graphics.lineTo(point.x, point.y));
    graphics.lineTo(points[points.length - 1].x, -120);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  private drawObstacles(graphics: Phaser.GameObjects.Graphics, obstacles: TerrainObstacle[], accentColor: number): void {
    graphics.fillStyle(0x182332, 0.88);
    graphics.lineStyle(2, accentColor, 0.65);
    obstacles.forEach((obstacle) => {
      graphics.fillRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 6);
      graphics.strokeRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 6);
    });
  }

  private addResultText(label: string, color: number): void {
    this.resultBanner?.destroy();
    this.resultBanner = this.add.text(this.rocket?.sprite.x ?? 0, (this.rocket?.sprite.y ?? 0) - 95, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '44px',
      color: Phaser.Display.Color.IntegerToColor(color).rgba,
      stroke: '#071018',
      strokeThickness: 8
    });
    this.resultBanner.setOrigin(0.5);
    this.resultBanner.setDepth(40);
  }

  private showLevelBanner(): void {
    this.levelBanner?.destroy();
    const level = this.getCurrentLevel();
    this.levelBanner = this.add.text(this.scale.width / 2, 86, `LEVEL ${this.currentLevelIndex + 1}: ${level.name}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#f3f7ff',
      stroke: '#071018',
      strokeThickness: 6
    });
    this.levelBanner.setOrigin(0.5);
    this.levelBanner.setScrollFactor(0);
    this.levelBanner.setDepth(60);

    this.tweens.add({
      targets: this.levelBanner,
      alpha: 0,
      y: 66,
      delay: 950,
      duration: 650,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.levelBanner?.destroy();
        this.levelBanner = undefined;
      }
    });
  }
}

function createLevelConfig(index: number): LevelConfig {
  const theme = LEVEL_THEMES[index % LEVEL_THEMES.length];
  const routeBand = Math.floor(index / LEVEL_THEMES.length);
  const routeVariant = index % LEVEL_THEMES.length;
  const terrainLevel = Math.min(10, Math.floor(index / TERRAIN_LEVEL_STEP) + 1);
  const obstacleLevel = terrainLevel <= 3 ? 0 : Math.min(10, terrainLevel - 3);

  return {
    ...theme,
    name: `${theme.name} ${routeBand + 1}`,
    terrainLevel,
    obstacleLevel,
    launchX: 300 + routeVariant * 38,
    launchYOffset: 34 + ((routeBand * 17 + routeVariant * 23) % 110),
    landingX: Math.min(2300, 1700 + routeVariant * 105 + routeBand * 18),
    landingYOffset: 38 + ((routeBand * 29 + routeVariant * 31) % 128)
  };
}
