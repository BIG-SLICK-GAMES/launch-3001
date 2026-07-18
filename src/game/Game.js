import * as THREE from 'three';
import { Renderer } from './Renderer.js';
import { Rocket } from './Rocket.js';
import { InputController } from './InputController.js';
import { PhysicsController } from './PhysicsController.js';
import { CameraController } from './CameraController.js';
import { World } from './World.js';
import { CollisionSystem } from './CollisionSystem.js';
import { LevelManager } from './LevelManager.js';
import { SaveSystem } from './SaveSystem.js';
import { ScoreSystem } from './ScoreSystem.js';
import { AudioSystem } from './AudioSystem.js';
import { EffectsSystem } from './EffectsSystem.js';
import { VRController } from './VRController.js';
import { UIController } from './UIController.js';
import { GameState, STATES } from './GameState.js';
import { FIXED_STEP, MAX_FRAME_DELTA, LANDING_GRADES } from './constants.js';

export class Game {
  constructor(root) {
    this.root = root;
    this.root.className = 'game-root';
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 140);
    this.renderer = new Renderer(root);
    this.save = new SaveSystem();
    this.settings = this.save.loadSettings();
    this.score = new ScoreSystem(this.save);
    this.audio = new AudioSystem(this.settings);
    this.levels = new LevelManager();
    this.world = new World(this.scene);
    this.rocket = new Rocket();
    this.scene.add(this.rocket.group);
    this.input = new InputController(this.renderer.renderer.domElement, this.settings);
    this.physics = new PhysicsController();
    this.cameraController = new CameraController(this.camera, this.settings);
    this.vr = new VRController(this.renderer, this.scene, this.camera);
    this.effects = new EffectsSystem(this.scene);
    this.collision = new CollisionSystem(this.world);
    this.state = new GameState();
    this.ui = new UIController(root, this);
    this.lastTime = 0;
    this.accumulator = 0;
    this.running = false;
    this.currentLevel = this.levels.current;
    this.currentStartId = 1;
    this.activeLanding = false;
    this.runRecorded = false;
    this.lastCheckpointTime = 0;
    this.passedMarkers = new Set();
    this.collectedDrops = new Set();
    this.voiceFlags = {};
    this.mobileTutorialDone = localStorage.getItem('launch3001.mobileTiltTutorialDone') === '1';
    this.state.onChange((next, previous, payload) => this.ui.showState(next, payload));
    this.#bindLifecycle();
  }

  start() {
    this.loadLevel(1);
    this.state.transition(STATES.READY);
    this.renderer.resize(this.camera);
    this.running = true;
    this.renderer.setAnimationLoop((time, frame) => this.#frame(time, frame));
    if (this.#isMobileLike() && !this.mobileTutorialDone) {
      this.ui.showMobileTiltPrompt();
    }
  }

  loadLevel(id) {
    this.state.clearTimers();
    this.activeLanding = false;
    this.runRecorded = false;
    this.currentStartId = id;
    this.currentLevel = this.levels.load(id);
    this.world.load(this.currentLevel);
    const launch = this.currentLevel.launchPad.position;
    this.rocket.reset({ x: launch.x, y: launch.y + 1.05, z: launch.z });
    this.lastCheckpointTime = 0;
    this.passedMarkers = new Set();
    this.collectedDrops = new Set();
    this.voiceFlags = { launch: false, lowFuel: false, approachMarkerId: null, refuelPad: null };
    this.cameraController.update(this.rocket, 1);
    this.renderer.resize(this.camera);
  }

  startLevel(id) {
    const startId = Math.min(id, this.levels.levels.length);
    if (startId > this.score.progress.highestUnlockedLevel) return;
    this.loadLevel(startId);
    this.score.recordAttempt(startId);
    this.state.transition(STATES.READY);
  }

  restartLevel() {
    this.audio.stopEngine();
    this.loadLevel(this.currentStartId);
    this.score.recordAttempt(this.currentStartId);
    this.state.transition(STATES.READY);
  }

  resetRun() {
    this.score.resetRun();
    this.startLevel(1);
  }

  pause() {
    if (this.state.is(STATES.FLYING) || this.state.is(STATES.READY)) {
      this.audio.stopEngine();
      this.state.transition(STATES.PAUSED);
    }
  }

  resume() {
    if (!this.state.is(STATES.PAUSED)) {
      this.ui.showState(this.state.current);
      return;
    }
    this.state.transition(this.rocket.flightTime > 0 ? STATES.FLYING : STATES.READY);
  }

  goMenu() {
    this.audio.stopEngine();
    this.state.clearTimers();
    this.state.transition(STATES.MENU);
  }

  toggleCamera() {
    const mode = this.cameraController.toggle();
    this.settings.cameraMode = mode;
    this.save.saveSettings(this.settings);
  }

  setCameraMode(mode) {
    this.cameraController.setMode(mode);
    this.settings.cameraMode = this.cameraController.mode;
    this.save.saveSettings(this.settings);
  }

  flipSideCamera() {
    this.settings.sideCameraSide = (this.settings.sideCameraSide ?? 1) * -1;
    this.save.saveSettings(this.settings);
  }

  async enableTilt() {
    const ok = await this.input.enableTilt();
    if (ok) this.input.calibrate();
    return ok;
  }

  async enableTiltFromPrompt() {
    const ok = await this.enableTilt();
    if (ok) this.ui.showMobileCalibratePrompt();
    else this.state.transition(STATES.READY);
    return ok;
  }

  async enableAudio() {
    await this.audio.enable();
    this.save.saveSettings(this.settings);
  }

  calibrateTiltFromPrompt() {
    this.input.calibrate();
    this.mobileTutorialDone = true;
    localStorage.setItem('launch3001.mobileTiltTutorialDone', '1');
    this.state.transition(STATES.READY);
  }

  skipMobileTutorial() {
    this.mobileTutorialDone = true;
    localStorage.setItem('launch3001.mobileTiltTutorialDone', '1');
    this.state.transition(STATES.READY);
  }

  #frame(time) {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000 || 0, MAX_FRAME_DELTA);
    this.lastTime = time;
    if (!document.hidden && !this.state.is(STATES.PAUSED) && !this.state.is(STATES.MENU) && !this.state.is(STATES.LEVEL_SELECT)) {
      this.accumulator += dt;
      while (this.accumulator >= FIXED_STEP) {
        this.#fixedUpdate(FIXED_STEP);
        this.accumulator -= FIXED_STEP;
      }
    }
    this.#update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  #fixedUpdate(dt) {
    this.input.update();
    const steering = this.#combinedSteering();
    const thrust = this.#combinedThrust();
    if (this.vr.enabled && this.state.is(STATES.CRASHED) && thrust) {
      this.restartLevel();
      return;
    }
    if (this.state.is(STATES.READY) && (thrust || Math.abs(steering.x) > 0.08 || Math.abs(steering.z) > 0.08)) {
      this.state.transition(STATES.FLYING);
      if (!this.voiceFlags.launch) {
        this.audio.speak('We are clear for launch!', 'launch', 8000);
        this.voiceFlags.launch = true;
      }
    }
    const active = this.state.is(STATES.FLYING);
    this.rocket.setFlame(active && thrust && this.rocket.fuel > 0);
    if (this.rocket.thrusting) this.audio.startEngine();
    else this.audio.stopEngine();
    this.physics.step(this.rocket, this.currentLevel, steering, dt, active);
    this.#tickGroundTimer(dt, active);
    this.rocket.updateVisual(dt, steering);
    this.#refuelOnPad(dt);
    this.score.updateLeaderboard(this.rocket.distance, this.rocket.flightTime);
    if (active) {
      this.#collectDrops();
      const result = this.collision.check(this.rocket, this.currentLevel);
      if (result?.type === 'crash') this.#crash(result.reason);
      if (result?.type === 'landed') this.#land(result.grade, result.marker);
    }
  }

  #update(dt) {
    if (this.vr.consumeSessionStart()) {
      if (this.state.is(STATES.MENU) || this.state.is(STATES.LEVEL_SELECT)) {
        this.startLevel(this.score.progress.highestUnlockedLevel);
      } else if (this.state.is(STATES.PAUSED)) {
        this.resume();
      }
    }
    if (this.input.consumeAction('r')) this.restartLevel();
    if (this.input.consumeAction('c')) this.toggleCamera();
    if (this.input.consumeAction('escape')) {
      if (this.state.is(STATES.PAUSED)) this.resume();
      else this.pause();
    }
    if (this.vr.enabled) {
      this.vr.update(this, dt);
    } else {
      this.cameraController.update(this.rocket, dt);
    }
    this.effects.update(dt, this.rocket);
    const altitude = this.rocket.position.y - this.world.getTerrainHeight(this.rocket.position.x, this.rocket.position.z) - this.rocket.radius;
    this.#voiceStatus(altitude);
      this.ui.update({
      level: this.currentLevel,
      rocket: this.rocket,
      altitude,
      score: this.score,
      camera: this.cameraController,
      nextMarker: this.#nextMarker()
    });
  }

  #tickGroundTimer(dt, active) {
    if (active) return;
    if (this.rocket.flightTime <= 0) return;
    if (!this.state.is(STATES.READY) && !this.state.is(STATES.LANDED)) return;
    this.rocket.flightTime += dt;
  }

  #combinedThrust() {
    return (this.input.thrust || this.vr.getInput().thrust) && this.rocket.fuel > 0;
  }

  #combinedSteering() {
    const flat = this.input.getSteering();
    const vr = this.vr.getInput().steering;
    return {
      x: Math.max(-1, Math.min(1, flat.x + vr.x)),
      z: Math.max(-1, Math.min(1, flat.z + vr.z))
    };
  }

  #crash(reason) {
    if (!this.state.is(STATES.FLYING)) return;
    this.rocket.alive = false;
    this.rocket.setFlame(false);
    this.audio.stopEngine();
    this.audio.playCrash();
    this.effects.burst(this.rocket.position, 0xff3b1f, 24);
    this.cameraController.addShake(0.45);
    if (navigator.vibrate) navigator.vibrate(80);
    const placement = this.#recordRun();
    this.state.transition(STATES.CRASHED, { reason, placement });
  }

  #recordRun() {
    if (this.runRecorded || this.rocket.distance <= 0) return null;
    this.runRecorded = true;
    return this.score.recordRun(this.rocket.distance, this.rocket.flightTime);
  }

  #land(grade, marker = this.currentLevel.landingPad) {
    if (!this.state.is(STATES.FLYING) || this.activeLanding) return;
    if (this.passedMarkers.has(marker.id)) return;
    this.activeLanding = true;
    this.rocket.landed = true;
    this.rocket.alive = false;
    this.rocket.setFlame(false);
    this.audio.stopEngine();
    const pad = marker.position;
    this.rocket.position.set(pad.x, pad.y + 1.05, pad.z);
    this.rocket.velocity.set(0, 0, 0);
    const elapsed = Math.max(0.1, this.rocket.flightTime - this.lastCheckpointTime);
    const points = this.score.scoreCheckpoint(marker, elapsed, marker.distance ?? this.rocket.distance);
    const nextId = Math.min(this.levels.levels.length, Math.floor((marker.distance ?? 0) / 540) + 1);
    this.score.commitCheckpoint(marker, points, nextId);
    this.passedMarkers.add(marker.id);
    this.lastCheckpointTime = this.rocket.flightTime;
    this.audio.playLanding(grade === LANDING_GRADES.perfect);
    this.effects.emitLandingDust(this.rocket.position);
    this.effects.burst(this.rocket.position, grade === LANDING_GRADES.perfect ? 0x33ff8a : 0x24b7ff, 14);
    this.state.transition(STATES.LANDED, { grade: `SAVE ${marker.id}`, points });
    this.audio.speak('Touchdown.', 'touchdown', 2500);
    this.state.delay(() => {
      this.rocket.alive = true;
      this.rocket.landed = false;
      this.activeLanding = false;
      this.state.transition(STATES.READY);
    }, 750);
  }

  #collectDrops() {
    for (const pickup of this.currentLevel.pickups ?? []) {
      if (this.collectedDrops.has(pickup.id)) continue;
      if (!this.#nearFuelDrop(pickup)) continue;
      this.collectedDrops.add(pickup.id);
      this.rocket.fuel = Math.min(100, this.rocket.fuel + pickup.amount);
      const mesh = this.world.current.pickupMeshes?.find((item) => item.name === `Drop ${pickup.id}`);
      if (mesh) mesh.visible = false;
      this.effects.burst(this.rocket.position, 0x4de6ff, 12);
      this.audio.speak('Refueled Sir!', 'fuelPickup', 1200);
    }
  }

  #nearFuelDrop(pickup) {
    const dx = this.rocket.position.x - pickup.position.x;
    const dz = this.rocket.position.z - pickup.position.z;
    const horizontal = Math.hypot(dx, dz);
    const vertical = Math.abs(this.rocket.position.y - pickup.position.y);
    return horizontal <= pickup.radius + this.rocket.radius + 1.05 && vertical <= 2.2;
  }

  #refuelOnPad(dt) {
    if (!this.state.is(STATES.READY) && !this.state.is(STATES.LANDED)) return;
    const pad = this.#currentPad();
    if (!pad) return;
    if (this.rocket.fuel < 99 && this.voiceFlags.refuelPad !== pad.id) {
      this.audio.speak('We will take some fuel Captain!', 'padRefuel', 5000);
      this.voiceFlags.refuelPad = pad.id;
    }
    this.rocket.fuel = Math.min(100, this.rocket.fuel + 20 * dt);
  }

  #currentPad() {
    const pads = [this.currentLevel.launchPad, ...(this.currentLevel.checkpoints ?? [])];
    return pads.find((pad) => (
      Math.abs(this.rocket.position.x - pad.position.x) <= pad.size.x / 2 &&
      Math.abs(this.rocket.position.z - pad.position.z) <= pad.size.z / 2 &&
      Math.abs((this.rocket.position.y - this.rocket.radius) - (pad.position.y + 0.12)) < 1.2
    ));
  }

  #nextMarker() {
    return (this.currentLevel.checkpoints ?? []).find((marker) => !this.passedMarkers.has(marker.id));
  }

  #voiceStatus(altitude) {
    if (!this.state.is(STATES.FLYING)) return;
    if (altitude < 2.4 && this.rocket.velocity.y < -0.45) {
      this.audio.speak('Watch your altitude captain!', 'altitude', 5000);
    }
    if (this.rocket.fuel <= 50 && !this.voiceFlags.lowFuel) {
      this.audio.speak('Watch your fuel Cap!', 'lowFuel', 12000);
      this.voiceFlags.lowFuel = true;
    } else if (this.rocket.fuel > 65) {
      this.voiceFlags.lowFuel = false;
    }
    const marker = this.#nextMarker();
    if (!marker) return;
    const distance = Math.hypot(this.rocket.position.x - marker.position.x, this.rocket.position.z - marker.position.z);
    if (distance < 34 && this.voiceFlags.approachMarkerId !== marker.id) {
      this.audio.speak('Cleared for landing.', 'landingClear', 4500);
      this.voiceFlags.approachMarkerId = marker.id;
    }
  }

  #bindLifecycle() {
    const resize = () => this.renderer.resize(this.camera);
    const unlockAudio = () => this.audio.unlock();
    const suppressTouch = (event) => {
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
      event.preventDefault();
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);
    document.addEventListener('selectstart', (event) => event.preventDefault());
    document.addEventListener('selectionchange', () => window.getSelection()?.removeAllRanges());
    document.addEventListener('contextmenu', (event) => event.preventDefault());
    document.addEventListener('touchstart', suppressTouch, { passive: false });
    document.addEventListener('touchmove', suppressTouch, { passive: false });
    window.addEventListener('resize', resize);
    screen.orientation?.addEventListener?.('change', resize);
    window.addEventListener('orientationchange', () => window.setTimeout(resize, 80));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.is(STATES.FLYING)) this.pause();
    });
  }

  #isMobileLike() {
    return navigator.maxTouchPoints > 1 || /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  }
}
