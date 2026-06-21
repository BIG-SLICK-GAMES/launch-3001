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
  buildTerrainObstacles,
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
type TerrainArchetype = 'valley' | 'cliffs' | 'mountains' | 'tunnel' | 'cave' | 'steps' | 'basin' | 'ridge';

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
  launchPadWidth: number;
  landingX: number;
  landingYOffset: number;
  landingPadWidth: number;
  terrainArchetype: TerrainArchetype;
  terrainVariant: number;
  fuelSeconds: number;
};

const LEVEL_FUEL_SECONDS = 14;
const LAUNCH_PAD_WIDTH = 220;
const LANDING_PAD_WIDTH = 250;
const LEVEL_COUNT = 100;
const LONG_LEVEL_START_INDEX = 24;
const TERRAIN_LEVEL_STEP = 11;
const CAMERA_BASE_ZOOM = 1.18;
const CAMERA_MIN_ZOOM = 0.82;
const CAMERA_SPEED_FOR_FULL_ZOOM_OUT = 240;
const CAMERA_ZOOM_EASE = 0.022;
const CAMERA_SCROLL_EASE = 0.035;
const CAMERA_LOOK_AHEAD_MULTIPLIER = 0.32;
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
const TERRAIN_ARCHETYPES: TerrainArchetype[] = ['valley', 'cliffs', 'steps', 'basin', 'mountains', 'ridge', 'tunnel', 'cave'];
const EARLY_TERRAIN_SEQUENCE: TerrainArchetype[] = [
  'valley',
  'cliffs',
  'steps',
  'basin',
  'mountains',
  'ridge',
  'valley',
  'cliffs',
  'steps',
  'basin',
  'mountains',
  'ridge',
  'cliffs',
  'steps',
  'basin',
  'tunnel',
  'mountains',
  'ridge',
  'cave',
  'cliffs',
  'steps',
  'basin',
  'tunnel',
  'cave'
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
  private groundPoints: TerrainPoint[] = [];
  private ceilingPoints: TerrainPoint[] = [];
  private hud?: Hud;
  private levelBanner?: Phaser.GameObjects.Text;
  private fuelBarBack?: Phaser.GameObjects.Rectangle;
  private fuelBarFill?: Phaser.GameObjects.Rectangle;
  private fuelText?: Phaser.GameObjects.Text;
  private controlAbortController?: AbortController;
  private boostButton?: HTMLButtonElement;
  private tiltButton?: HTMLButtonElement;
  private tiltStatus?: HTMLElement;
  private levelToggleButton?: HTMLButtonElement;
  private levelPicker?: HTMLElement;
  private levelInput?: HTMLInputElement;
  private levelGoButton?: HTMLButtonElement;
  private levelCloseButton?: HTMLButtonElement;
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
    this.cameras.main.setZoom(CAMERA_BASE_ZOOM);

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
    this.fuelSeconds = this.getCurrentLevel().fuelSeconds;
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
    this.launchPad = this.createPad(level.launchX, BACKGROUND_FLOOR_Y - level.launchYOffset, level.launchPadWidth, 0xffb54a);
    this.landingPad = this.createPad(level.landingX, BACKGROUND_FLOOR_Y - level.landingYOffset, level.landingPadWidth, level.padColor);
    this.groundPoints = this.buildRouteGroundPoints(level);
    this.ceilingPoints = this.buildRouteCeilingPoints(level);
    this.terrainGraphics = this.createTerrain(level.padColor);
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
    this.levelToggleButton = document.querySelector<HTMLButtonElement>('#level-toggle') ?? undefined;
    this.levelPicker = document.querySelector<HTMLElement>('#level-picker') ?? undefined;
    this.levelInput = document.querySelector<HTMLInputElement>('#level-input') ?? undefined;
    this.levelGoButton = document.querySelector<HTMLButtonElement>('#level-go') ?? undefined;
    this.levelCloseButton = document.querySelector<HTMLButtonElement>('#level-close') ?? undefined;

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

    this.levelToggleButton?.addEventListener('click', () => {
      this.openLevelPicker();
    }, { signal });

    this.levelCloseButton?.addEventListener('click', () => {
      this.closeLevelPicker();
    }, { signal });

    this.levelGoButton?.addEventListener('click', () => {
      this.jumpToPickedLevel();
    }, { signal });

    this.levelInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.jumpToPickedLevel();
      }
    }, { signal });
  }

  private openLevelPicker(): void {
    if (this.levelPicker) {
      this.levelPicker.hidden = false;
    }

    if (this.levelToggleButton) {
      this.levelToggleButton.hidden = true;
    }

    if (this.levelInput) {
      this.levelInput.value = String(this.currentLevelIndex + 1);
      this.levelInput.focus();
      this.levelInput.select();
    }
  }

  private closeLevelPicker(): void {
    if (this.levelPicker) {
      this.levelPicker.hidden = true;
    }

    if (this.levelToggleButton) {
      this.levelToggleButton.hidden = false;
    }
  }

  private jumpToPickedLevel(): void {
    const requestedLevel = Number(this.levelInput?.value ?? 1);
    const nextLevelIndex = Phaser.Math.Clamp(Math.round(requestedLevel), 1, LEVELS.length) - 1;
    this.currentLevelIndex = nextLevelIndex;
    this.applyCurrentLevelTheme();
    this.createLevelPads();
    this.resetRocket();
    this.closeLevelPicker();
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

    const fuelPercent = Phaser.Math.Clamp(this.fuelSeconds / this.getCurrentLevel().fuelSeconds, 0, 1);
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
    const terrainGroundY = this.getGroundYAt(this.rocket.sprite.x);
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

    const ceilingY = this.getCeilingYAt(this.rocket.sprite.x);
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

    const speed = this.rocket.velocity.length();
    const altitude = Math.max(0, BACKGROUND_FLOOR_Y - this.rocket.sprite.y);
    const speedZoomOut = Phaser.Math.Clamp(speed / CAMERA_SPEED_FOR_FULL_ZOOM_OUT, 0, 1);
    const altitudeZoomOut = Phaser.Math.Clamp(altitude / 420, 0, 1);
    const targetZoom = Phaser.Math.Linear(CAMERA_BASE_ZOOM, CAMERA_MIN_ZOOM, Math.max(speedZoomOut, altitudeZoomOut));
    const nextZoom = Phaser.Math.Linear(this.cameras.main.zoom, targetZoom, CAMERA_ZOOM_EASE);
    this.cameras.main.setZoom(nextZoom);

    const visibleWidth = this.scale.width / nextZoom;
    const visibleHeight = this.scale.height / nextZoom;
    const lookAhead = Phaser.Math.Clamp(this.rocket.velocity.x * CAMERA_LOOK_AHEAD_MULTIPLIER, -90, 170);
    const targetScrollX = Phaser.Math.Clamp(
      this.rocket.sprite.x + lookAhead - visibleWidth * 0.35,
      0,
      BACKGROUND_WORLD_WIDTH - visibleWidth
    );
    const targetScrollY = Phaser.Math.Clamp(
      this.rocket.sprite.y - visibleHeight * 0.52,
      0,
      Math.max(0, BACKGROUND_WORLD_HEIGHT - visibleHeight)
    );

    this.cameras.main.setScroll(
      Phaser.Math.Linear(this.cameras.main.scrollX, targetScrollX, CAMERA_SCROLL_EASE),
      Phaser.Math.Linear(this.cameras.main.scrollY, targetScrollY, CAMERA_SCROLL_EASE)
    );
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

  private createTerrain(accentColor: number): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    graphics.setDepth(4);

    this.drawGround(graphics, this.groundPoints, accentColor);
    if (this.ceilingPoints.length > 0) {
      this.drawCeiling(graphics, this.ceilingPoints, accentColor);
    }
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

  private buildRouteGroundPoints(level: LevelConfig): TerrainPoint[] {
    const difficulty = Math.min(1, (level.terrainLevel - 1) / 9);
    const launchSurfaceY = BACKGROUND_FLOOR_Y - level.launchYOffset - 20;
    const landingSurfaceY = BACKGROUND_FLOOR_Y - level.landingYOffset - 20;
    const launchLeft = level.launchX - level.launchPadWidth / 2 - 100;
    const launchRight = level.launchX + level.launchPadWidth / 2 + 100;
    const landingLeft = level.landingX - level.landingPadWidth / 2 - 110;
    const landingRight = level.landingX + level.landingPadWidth / 2 + 110;
    const routeStartX = Math.max(0, launchLeft - 230);
    const routeEndX = Math.min(BACKGROUND_WORLD_WIDTH, landingRight + 170);
    const spanStart = launchRight + 90;
    const spanEnd = landingLeft - 90;
    const midX = (spanStart + spanEnd) / 2;
    const lowY = Math.min(BACKGROUND_WORLD_HEIGHT - 36, Math.max(launchSurfaceY, landingSurfaceY) + 150 + difficulty * 180);
    const highY = Math.max(150, Math.min(launchSurfaceY, landingSurfaceY) - (55 + difficulty * 95));
    const variantOffset = (level.terrainVariant % 3 - 1) * 34;
    let routePoints: TerrainPoint[];

    switch (level.terrainArchetype) {
      case 'cliffs':
        routePoints = [
          { x: spanStart, y: launchSurfaceY + 18 },
          { x: spanStart + 135, y: launchSurfaceY + 22 },
          { x: spanStart + 170, y: lowY },
          { x: midX + variantOffset, y: lowY + 8 },
          { x: spanEnd - 155, y: Phaser.Math.Linear(lowY, landingSurfaceY, 0.6) },
          { x: spanEnd - 80, y: landingSurfaceY + 44 },
          { x: spanEnd, y: landingSurfaceY }
        ];
        break;
      case 'mountains':
        routePoints = [
          { x: spanStart, y: launchSurfaceY + 32 },
          { x: spanStart + 180, y: Phaser.Math.Linear(launchSurfaceY, highY, 0.45) },
          { x: midX - 160, y: highY },
          { x: midX + 80, y: Math.min(lowY, highY + 250) },
          { x: spanEnd - 210, y: Phaser.Math.Linear(landingSurfaceY, highY, 0.5) },
          { x: spanEnd - 80, y: landingSurfaceY + 34 },
          { x: spanEnd, y: landingSurfaceY }
        ];
        break;
      case 'tunnel':
        routePoints = [
          { x: spanStart, y: launchSurfaceY + 20 },
          { x: spanStart + 190, y: launchSurfaceY + 54 },
          { x: midX - 170, y: Phaser.Math.Linear(launchSurfaceY, lowY, 0.38) },
          { x: midX + 90, y: Phaser.Math.Linear(lowY, landingSurfaceY, 0.42) },
          { x: spanEnd - 160, y: landingSurfaceY + 62 },
          { x: spanEnd, y: landingSurfaceY }
        ];
        break;
      case 'cave':
        routePoints = [
          { x: spanStart, y: launchSurfaceY + 26 },
          { x: spanStart + 170, y: Math.min(lowY, launchSurfaceY + 120) },
          { x: midX - 130, y: lowY },
          { x: midX + 160, y: lowY - 36 },
          { x: spanEnd - 190, y: Phaser.Math.Linear(lowY, landingSurfaceY, 0.55) },
          { x: spanEnd, y: landingSurfaceY }
        ];
        break;
      case 'steps':
        routePoints = [
          { x: spanStart, y: launchSurfaceY + 22 },
          { x: spanStart + 180, y: launchSurfaceY + 22 },
          { x: spanStart + 210, y: launchSurfaceY + 96 + difficulty * 30 },
          { x: midX - 70, y: launchSurfaceY + 96 + difficulty * 30 },
          { x: midX - 35, y: landingSurfaceY + 84 },
          { x: spanEnd - 150, y: landingSurfaceY + 84 },
          { x: spanEnd - 90, y: landingSurfaceY + 28 },
          { x: spanEnd, y: landingSurfaceY }
        ];
        break;
      case 'basin':
        routePoints = [
          { x: spanStart, y: launchSurfaceY + 28 },
          { x: spanStart + 210, y: Math.min(lowY, launchSurfaceY + 130) },
          { x: midX - 170, y: lowY + 16 },
          { x: midX + 150, y: lowY + 4 },
          { x: spanEnd - 220, y: Math.min(lowY, landingSurfaceY + 135) },
          { x: spanEnd - 90, y: landingSurfaceY + 38 },
          { x: spanEnd, y: landingSurfaceY }
        ];
        break;
      case 'ridge':
        routePoints = [
          { x: spanStart, y: launchSurfaceY + 28 },
          { x: spanStart + 190, y: Phaser.Math.Linear(launchSurfaceY, highY, 0.5) },
          { x: midX - 90, y: highY + 34 },
          { x: midX + 80, y: Math.min(lowY, highY + 210) },
          { x: spanEnd - 180, y: Phaser.Math.Linear(landingSurfaceY, highY, 0.62) },
          { x: spanEnd, y: landingSurfaceY }
        ];
        break;
      case 'valley':
      default:
        routePoints = [
          { x: spanStart, y: launchSurfaceY + 24 },
          { x: spanStart + 190, y: launchSurfaceY + 44 },
          { x: midX - 140, y: Phaser.Math.Linear(launchSurfaceY, lowY, 0.55) },
          { x: midX + variantOffset, y: lowY },
          { x: midX + 160, y: lowY + 10 },
          { x: spanEnd - 190, y: Phaser.Math.Linear(lowY, landingSurfaceY, 0.48) },
          { x: spanEnd, y: landingSurfaceY }
        ];
        break;
    }

    return this.buildLunarTerrainLine(
      [
      { x: 0, y: launchSurfaceY + 36 },
      { x: routeStartX, y: launchSurfaceY + 36 },
      { x: launchLeft, y: launchSurfaceY },
      { x: launchRight, y: launchSurfaceY },
      ...routePoints,
      { x: landingLeft, y: landingSurfaceY },
      { x: landingRight, y: landingSurfaceY },
      { x: routeEndX, y: landingSurfaceY + 46 },
      { x: BACKGROUND_WORLD_WIDTH, y: landingSurfaceY + 58 }
      ],
      level
    );
  }

  private buildLunarTerrainLine(points: TerrainPoint[], level: LevelConfig): TerrainPoint[] {
    const difficulty = Math.min(1, (level.terrainLevel - 1) / 9);
    const roughness = 10 + difficulty * 40 + (level.terrainVariant % 4) * 4;
    const segmentLength = 185 - difficulty * 58;
    const launchShelfLeft = level.launchX - level.launchPadWidth / 2 - 95;
    const launchShelfRight = level.launchX + level.launchPadWidth / 2 + 95;
    const landingShelfLeft = level.landingX - level.landingPadWidth / 2 - 92;
    const landingShelfRight = level.landingX + level.landingPadWidth / 2 + 92;
    const result: TerrainPoint[] = [];

    const isPadShelf = (x: number): boolean =>
      (x >= launchShelfLeft && x <= launchShelfRight) || (x >= landingShelfLeft && x <= landingShelfRight);

    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      if (result.length === 0) {
        result.push(start);
      }

      const distance = Math.abs(end.x - start.x);
      const cuts = Math.max(1, Math.floor(distance / segmentLength));
      for (let cut = 1; cut <= cuts; cut += 1) {
        const amount = cut / cuts;
        const x = Phaser.Math.Linear(start.x, end.x, amount);
        let y = Phaser.Math.Linear(start.y, end.y, amount);

        if (!isPadShelf(x) && cut < cuts) {
          const wave = Math.sin((x * 0.013 + level.terrainVariant) * 1.7) + Math.sin((x * 0.029 + level.terrainLevel) * 0.8);
          y += wave * roughness;
        }

        result.push({ x, y });
      }
    }

    return this.normalizeTerrainPoints(result);
  }

  private buildRouteCeilingPoints(level: LevelConfig): TerrainPoint[] {
    if (level.terrainLevel <= 2 && level.terrainArchetype !== 'tunnel' && level.terrainArchetype !== 'cave') {
      return [];
    }

    const difficulty = Math.min(1, Math.max(0, level.terrainLevel - 2) / 8);
    const safeGap = 395 - difficulty * 125;
    const launchSurfaceY = BACKGROUND_FLOOR_Y - level.launchYOffset - 20;
    const landingSurfaceY = BACKGROUND_FLOOR_Y - level.landingYOffset - 20;
    const launchRight = level.launchX + level.launchPadWidth / 2 + 140;
    const landingLeft = level.landingX - level.landingPadWidth / 2 - 130;
    const midX = (launchRight + landingLeft) / 2;
    const ceilingBaseY = Math.max(84, Math.min(launchSurfaceY, landingSurfaceY) - safeGap);

    if (level.terrainArchetype === 'tunnel') {
      return this.normalizeTerrainPoints([
        { x: 0, y: 72 },
        { x: launchRight, y: 82 },
        { x: launchRight + 180, y: ceilingBaseY + 34 },
        { x: midX - 120, y: ceilingBaseY + 86 + difficulty * 34 },
        { x: midX + 170, y: ceilingBaseY + 62 },
        { x: landingLeft - 80, y: Math.max(92, landingSurfaceY - safeGap + 45) },
        { x: BACKGROUND_WORLD_WIDTH, y: 78 }
      ]);
    }

    if (level.terrainArchetype === 'cave') {
      return this.normalizeTerrainPoints([
        { x: 0, y: 70 },
        { x: launchRight - 30, y: 72 },
        { x: launchRight + 170, y: ceilingBaseY + 82 },
        { x: midX - 140, y: ceilingBaseY + 118 + difficulty * 42 },
        { x: midX + 130, y: ceilingBaseY + 78 },
        { x: landingLeft - 120, y: Math.max(92, landingSurfaceY - safeGap + 56) },
        { x: BACKGROUND_WORLD_WIDTH, y: 76 }
      ]);
    }

    if (level.terrainArchetype === 'mountains' || level.terrainArchetype === 'ridge') {
      return this.normalizeTerrainPoints([
        { x: 0, y: 72 },
        { x: launchRight + 120, y: 80 },
        { x: midX - 170, y: ceilingBaseY + 20 },
        { x: midX + 60, y: ceilingBaseY + 72 + difficulty * 26 },
        { x: landingLeft - 90, y: Math.max(86, landingSurfaceY - safeGap + 24) },
        { x: BACKGROUND_WORLD_WIDTH, y: 82 }
      ]);
    }

    return this.normalizeTerrainPoints([
      { x: 0, y: 78 },
      { x: launchRight, y: 86 + difficulty * 18 },
      { x: midX - 220, y: ceilingBaseY + 18 },
      { x: midX + 70, y: ceilingBaseY + 64 + difficulty * 30 },
      { x: landingLeft, y: Math.max(82, landingSurfaceY - safeGap) },
      { x: BACKGROUND_WORLD_WIDTH, y: 90 }
    ]);
  }

  private normalizeTerrainPoints(points: TerrainPoint[]): TerrainPoint[] {
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const normalized: TerrainPoint[] = [];
    sorted.forEach((point) => {
      const x = Phaser.Math.Clamp(point.x, 0, BACKGROUND_WORLD_WIDTH);
      const y = Phaser.Math.Clamp(point.y, 56, BACKGROUND_WORLD_HEIGHT - 24);
      const previous = normalized[normalized.length - 1];
      if (previous && Math.abs(previous.x - x) < 1) {
        previous.y = y;
        return;
      }
      normalized.push({ x, y });
    });
    return normalized;
  }

  private getGroundYAt(x: number): number {
    return this.interpolateTerrainY(this.groundPoints, x, BACKGROUND_FLOOR_Y);
  }

  private getCeilingYAt(x: number): number | undefined {
    if (this.ceilingPoints.length === 0) {
      return undefined;
    }

    return this.interpolateTerrainY(this.ceilingPoints, x, this.ceilingPoints[0].y);
  }

  private interpolateTerrainY(points: TerrainPoint[], x: number, fallbackY: number): number {
    if (points.length === 0) {
      return fallbackY;
    }

    const clampedX = Phaser.Math.Clamp(x, 0, BACKGROUND_WORLD_WIDTH);
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      if (clampedX >= start.x && clampedX <= end.x) {
        const span = end.x - start.x || 1;
        const amount = (clampedX - start.x) / span;
        return Phaser.Math.Linear(start.y, end.y, amount);
      }
    }

    return points[points.length - 1].y;
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
  const obstacleLevel = 0;
  const terrainArchetype = getTerrainArchetype(index, routeBand, routeVariant);
  const terrainVariant = (routeBand * 5 + routeVariant * 3) % 11;
  const padLayout = getPadLayout(index, terrainArchetype, routeBand, routeVariant);
  const fuelSeconds = LEVEL_FUEL_SECONDS + Math.min(8, Math.max(0, index - LONG_LEVEL_START_INDEX) * 0.08);

  return {
    ...theme,
    name: `${theme.name} ${routeBand + 1}`,
    terrainLevel,
    obstacleLevel,
    terrainArchetype,
    terrainVariant,
    fuelSeconds,
    ...padLayout
  };
}

function getTerrainArchetype(index: number, routeBand: number, routeVariant: number): TerrainArchetype {
  if (index < EARLY_TERRAIN_SEQUENCE.length) {
    return EARLY_TERRAIN_SEQUENCE[index];
  }

  const archetypeIndex = (index + routeBand * 2 + routeVariant * 3) % TERRAIN_ARCHETYPES.length;
  return TERRAIN_ARCHETYPES[archetypeIndex];
}

function getPadLayout(
  index: number,
  archetype: TerrainArchetype,
  routeBand: number,
  routeVariant: number
): Pick<LevelConfig, 'launchX' | 'launchYOffset' | 'launchPadWidth' | 'landingX' | 'landingYOffset' | 'landingPadWidth'> {
  const slowRise = Math.floor(index / 10);
  const longRouteProgress = Math.max(0, index - LONG_LEVEL_START_INDEX);
  const longRouteStretch = Math.min(940, longRouteProgress * 24);
  const padShrink = Math.min(118, Math.max(0, index - 8) * 1.55);
  const launchX = 280 + routeVariant * 34;
  const launchPadWidth = LAUNCH_PAD_WIDTH;
  const landingX = Math.min(3360, 1540 + routeVariant * 116 + routeBand * 20 + longRouteStretch);
  let landingPadWidth = LANDING_PAD_WIDTH - padShrink;
  let launchYOffset = 34 + ((routeBand * 13 + routeVariant * 19) % 92);
  let landingYOffset = 40 + ((routeBand * 23 + routeVariant * 29) % 112);

  switch (archetype) {
    case 'cliffs':
      launchYOffset += 45;
      landingYOffset = Math.max(26, landingYOffset - 12 + slowRise * 2);
      break;
    case 'mountains':
      launchYOffset += 18;
      landingYOffset += 42;
      break;
    case 'tunnel':
      launchYOffset += 28;
      landingYOffset += 24;
      landingPadWidth -= 8;
      break;
    case 'cave':
      launchYOffset += 10;
      landingYOffset += 52;
      landingPadWidth -= 12;
      break;
    case 'steps':
      landingYOffset += routeBand % 2 === 0 ? 28 : -8;
      break;
    case 'basin':
      launchYOffset += 36;
      landingYOffset += 36;
      break;
    case 'ridge':
      launchYOffset += 54;
      landingYOffset += 18;
      break;
    case 'valley':
    default:
      landingYOffset += 10;
      break;
  }

  return {
    launchX,
    launchYOffset: Phaser.Math.Clamp(launchYOffset, 24, 170),
    launchPadWidth,
    landingX,
    landingYOffset: Phaser.Math.Clamp(landingYOffset, 24, 178),
    landingPadWidth: Phaser.Math.Clamp(landingPadWidth, 118, LANDING_PAD_WIDTH)
  };
}
