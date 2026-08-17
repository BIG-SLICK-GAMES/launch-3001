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
import { ProfileSystem } from './ProfileSystem.js';
import { ScoreSystem } from './ScoreSystem.js';
import { AudioSystem } from './AudioSystem.js';
import { EffectsSystem } from './EffectsSystem.js';
import { VRController } from './VRController.js';
import { UIController } from './UIController.js';
import { BSGHubBridge } from './BSGHubBridge.js';
import { GameState, STATES } from './GameState.js';
import { DEMO_CHECKPOINT_LIMIT, FIXED_STEP, LANDING_GRADES, MAX_FRAME_DELTA, ROCKET_STANDING_HEIGHT, SHOP_URL } from './constants.js';
import { UpgradeManager } from './UpgradeManager.js';
import { BoostManager } from './BoostManager.js';
import { RocketStatResolver } from './RocketStatResolver.js';
import { CheckpointStarSystem } from './CheckpointStarSystem.js';
import { WalletClient } from './WalletClient.js';
import { BONUS_STAR_PACKAGES } from './BoostDefinitions.js';

export class Game {
  constructor(root) {
    this.root = root;
    this.root.className = 'game-root';
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 140);
    this.renderer = new Renderer(root);
    this.save = new SaveSystem();
    this.settings = this.save.loadSettings();
    this.profile = new ProfileSystem(this.save);
    this.fullAccess = true;
    this.score = new ScoreSystem(this.save);
    this.upgrades = new UpgradeManager(this.save, this.score.progress);
    this.boosts = new BoostManager(this.save, this.score.progress);
    this.stars = new CheckpointStarSystem(this.save, this.boosts, this.score.progress);
    this.statResolver = new RocketStatResolver(this.upgrades, this.boosts);
    this.wallet = new WalletClient(this);
    this.audio = new AudioSystem(this.settings);
    this.levels = new LevelManager();
    this.world = new World(this.scene);
    this.rocket = new Rocket();
    this.statResolver.recalculate();
    this.statResolver.applyToRocket(this.rocket);
    this.scene.add(this.rocket.group);
    this.padShadow = this.#createPadShadow();
    this.scene.add(this.padShadow);
    this.input = new InputController(this.renderer.renderer.domElement, this.settings);
    this.physics = new PhysicsController();
    this.cameraController = new CameraController(this.camera, this.settings);
    this.vr = new VRController(this.renderer, this.scene, this.camera);
    this.hub = new BSGHubBridge(this);
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
    this.takeoffLocked = false;
    this.lastCheckpointTime = 0;
    this.landedPad = null;
    this.passedMarkers = new Set();
    this.collectedDrops = new Set();
    this.refillRemaining = new Map();
    this.voiceFlags = {};
    this.reserveFuelUsed = false;
    this.mobileTutorialDone = false;
    this.deviceMode = this.settings.deviceMode ?? '';
    if (this.deviceMode) this.root.dataset.deviceMode = this.deviceMode;
    this.missionHintDone = localStorage.getItem('launch3001.missionHintDone') === '1';
    this.state.onChange((next, previous, payload) => this.ui.showState(next, payload));
    this.#bindLifecycle();
  }

  refreshProfile() {
    this.profile.refresh();
    this.fullAccess = true;
    this.ui.refreshProfile();
  }

  start() {
    this.loadLevel(1);
    this.hub.start();
    this.state.transition(STATES.SPLASH);
    this.renderer.resize(this.camera);
    this.running = true;
    this.renderer.setAnimationLoop((time, frame) => this.#frame(time, frame));
  }

  loadLevel(id) {
    this.state.clearTimers();
    this.profile.refresh();
    this.fullAccess = true;
    this.activeLanding = false;
    this.runRecorded = false;
    this.currentStartId = id;
    this.currentLevel = this.levels.load(id);
    this.recalculateRocketStats();
    this.world.load(this.currentLevel);
    const launch = this.currentLevel.launchPad.position;
    this.rocket.reset({ x: launch.x, y: launch.y + 0.12 + ROCKET_STANDING_HEIGHT, z: launch.z });
    this.rocket.landed = true;
    this.takeoffLocked = true;
    this.lastCheckpointTime = 0;
    this.landedPad = this.currentLevel.launchPad;
    this.passedMarkers = new Set();
    this.collectedDrops = new Set();
    this.refillRemaining = new Map();
    this.voiceFlags = { launch: false, lowFuel: false, approachMarkerId: null, refuelPad: null };
    this.reserveFuelUsed = false;
    this.cameraController.update(this.rocket, 1);
    this.renderer.resize(this.camera);
  }

  startLevel(id) {
    if (!this.deviceMode) {
      this.showDeviceSelect();
      return;
    }
    const startId = Math.min(id, this.levels.levels.length);
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

  recalculateRocketStats() {
    this.statResolver.recalculate();
    this.statResolver.applyToRocket(this.rocket);
  }

  purchaseUpgrade(upgradeId) {
    const result = this.upgrades.purchase(upgradeId);
    if (result.ok) this.recalculateRocketStats();
    return result;
  }

  resetUpgrades() {
    const result = this.upgrades.reset();
    this.recalculateRocketStats();
    return result;
  }

  equipBoost(boostId) {
    const result = this.boosts.equip(boostId);
    if (result.ok) this.recalculateRocketStats();
    return result;
  }

  unequipBoost(boostId) {
    const result = this.boosts.unequip(boostId);
    if (result.ok) this.recalculateRocketStats();
    return result;
  }

  async buyBoost(boostId) {
    const result = await this.wallet.purchaseBoost(boostId, 1);
    if (!result.ok) return result;
    this.boosts.grant(boostId, 1, 'boost_purchase');
    this.recalculateRocketStats();
    return result;
  }

  async buyStars(packageId) {
    const pack = BONUS_STAR_PACKAGES.find((entry) => entry.packageId === packageId);
    if (!pack) return { ok: false, reason: 'Unknown star package' };
    const result = await this.wallet.purchaseStars(packageId);
    if (!result.ok) return result;
    this.score.progress.availableStars = (this.score.progress.availableStars ?? 0) + pack.stars;
    this.score.progress.bonusStarsPurchased = (this.score.progress.bonusStarsPurchased ?? 0) + pack.stars;
    this.score.progress.upgradeTransactions = [
      ...(this.score.progress.upgradeTransactions ?? []),
      { id: result.transactionId, type: 'chip_purchased_stars', stars: pack.stars, chips: -pack.chipPrice, at: new Date().toISOString() }
    ].slice(-100);
    this.save.saveProgress(this.score.progress);
    return { ok: true, ...result, stars: pack.stars };
  }

  resetRun() {
    this.score.resetRun();
    this.startLevel(1);
  }

  showLobby() {
    if (!this.deviceMode) {
      this.showDeviceSelect();
      return;
    }
    this.audio.stopEngine();
    this.state.clearTimers();
    this.state.transition(STATES.LOBBY);
  }

  enterHangar() {
    this.showDeviceSelect();
  }

  showDeviceSelect() {
    this.audio.stopEngine();
    this.state.clearTimers();
    this.state.transition(STATES.DEVICE_SELECT);
  }

  isAuthReady() {
    return true;
  }

  selectDeviceMode(mode) {
    if (!['mobile', 'pc', 'vr'].includes(mode)) return;
    this.deviceMode = mode;
    this.root.dataset.deviceMode = mode;
    this.settings.deviceMode = mode;
    this.save.saveSettings(this.settings);
    this.mobileTutorialDone = mode !== 'mobile';
    if (mode === 'vr') {
      this.cameraController.setMode('COCKPIT');
      this.ui.showVrPrompt();
      return;
    }
    if (mode === 'mobile') {
      this.ui.showMobileTiltPrompt();
      return;
    }
    this.showLobby();
  }

  enterGame() {
    if (!this.deviceMode) {
      this.showDeviceSelect();
      return;
    }
    if (this.deviceMode === 'mobile' && !this.mobileTutorialDone) {
      this.ui.showMobileTiltPrompt();
      return;
    }
    this.startLevel(this.score.progress.highestUnlockedLevel);
    if (!this.missionHintDone) this.ui.showMissionHint();
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
    else this.ui.showMobileTiltPrompt();
    return ok;
  }

  async enableAudio() {
    await this.audio.enable();
    this.save.saveSettings(this.settings);
  }

  calibrateTiltFromPrompt() {
    this.input.calibrate();
    this.ui.showMobileReadyPrompt();
  }

  completeMobileTutorial() {
    this.mobileTutorialDone = true;
    this.state.transition(STATES.LOBBY);
    this.ui.showState(STATES.LOBBY);
  }

  skipMobileTutorial() {
    this.mobileTutorialDone = false;
    this.state.transition(STATES.LOBBY);
    this.ui.showState(STATES.LOBBY);
  }

  #frame(time) {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000 || 0, MAX_FRAME_DELTA);
    this.lastTime = time;
    if (!document.hidden && !this.state.is(STATES.PAUSED) && !this.state.is(STATES.MENU) && !this.state.is(STATES.LEVEL_SELECT) && !this.state.is(STATES.DEMO_COMPLETE) && !this.state.is(STATES.SPLASH) && !this.state.is(STATES.DEVICE_SELECT) && !this.state.is(STATES.LOBBY)) {
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
    const runtimeLevel = this.statResolver.adjustedLevel(this.currentLevel);
    const steering = this.#combinedSteering();
    const thrust = this.#combinedThrust();
    if (!thrust) this.takeoffLocked = false;
    if (this.vr.enabled && this.state.is(STATES.CRASHED) && thrust) {
      this.restartLevel();
      return;
    }
    if (this.state.is(STATES.READY) && thrust && !this.takeoffLocked) {
      this.#beginTakeoff();
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
    this.physics.step(this.rocket, runtimeLevel, steering, dt, active, this.settings);
    this.world.updateMovingHazards(this.rocket.flightTime);
    this.#tickGroundTimer(dt, active);
    this.#applyEmergencyFuel();
    this.#applyAirBrake(dt, active);
    this.rocket.updateVisual(dt, steering, {
      ...this.settings,
      rocketTiltMax: (this.settings.rocketTiltMax ?? 0.62) * (this.rocket.stats?.tiltResponseMultiplier ?? 1)
    });
    this.#refuelOnPad(dt);
    this.score.updateLeaderboard(this.rocket.distance, this.rocket.flightTime);
    if (active) {
      this.#updateFuelPickups(dt);
      const result = this.collision.check(this.rocket, runtimeLevel);
      if (result?.type === 'crash') this.#handleCrashResult(result.reason);
      if (result?.type === 'landed') this.#land(result.grade, result.marker);
      this.#checkDemoWall();
    }
  }

  #update(dt) {
    if (this.vr.consumeSessionStart()) {
      if (this.state.is(STATES.MENU) || this.state.is(STATES.LEVEL_SELECT) || this.state.is(STATES.LOBBY) || this.state.is(STATES.DEVICE_SELECT)) {
        this.startLevel(1);
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
    this.#updatePadShadow();
    this.#voiceStatus(altitude);
      this.ui.update({
      level: this.statResolver.adjustedLevel(this.currentLevel),
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
    if (this.rocket.landed || this.state.is(STATES.READY) || this.state.is(STATES.LANDED)) {
      return { x: 0, z: 0 };
    }
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

  #handleCrashResult(reason) {
    const tolerance = this.rocket.stats?.collisionToleranceMultiplier ?? 1;
    const impact = Math.hypot(this.rocket.velocity.x, this.rocket.velocity.y, this.rocket.velocity.z);
    if (tolerance > 1 && impact < 2.2 * tolerance) {
      this.rocket.velocity.multiplyScalar(-0.18);
      this.rocket.fuel = Math.max(0, this.rocket.fuel - 8);
      this.effects.burst(this.rocket.position, 0xffd166, 10);
      this.audio.speak('Hull absorbed impact.', 'hullAbsorb', 5000);
      return;
    }
    const shield = this.boosts.activate('crash_shield');
    if (shield) {
      this.rocket.velocity.multiplyScalar(-0.22);
      this.rocket.fuel = Math.max(0, this.rocket.fuel - 14);
      this.effects.burst(this.rocket.position, 0x7deeff, 18);
      this.audio.speak('Crash shield spent.', 'crashShield', 7000);
      this.recalculateRocketStats();
      return;
    }
    const insurance = this.boosts.activate('checkpoint_insurance');
    if (insurance) {
      this.audio.speak('Checkpoint insurance used.', 'checkpointInsurance', 8000);
      this.restartLevel();
      this.recalculateRocketStats();
      return;
    }
    this.#crash(reason);
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
    this.landedPad = marker;
    this.rocket.position.set(pad.x, pad.y + 0.12 + ROCKET_STANDING_HEIGHT, pad.z);
    this.rocket.velocity.set(0, 0, 0);
    const elapsed = Math.max(0.1, this.rocket.flightTime - this.lastCheckpointTime);
    const points = this.score.scoreCheckpoint(marker, elapsed, marker.distance ?? this.rocket.distance);
    const reward = this.score.checkpointBreakdown(marker, elapsed, marker.distance ?? this.rocket.distance);
    const starReward = this.stars.award(marker, elapsed, grade);
    const nextId = Math.min(this.levels.levels.length, Math.floor((marker.distance ?? 0) / 540) + 1);
    this.score.commitCheckpoint(marker, points, nextId);
    this.passedMarkers.add(marker.id);
    this.lastCheckpointTime = this.rocket.flightTime;
    this.audio.playLanding(grade === LANDING_GRADES.perfect);
    this.audio.playCheckpoint();
    this.effects.emitLandingDust(this.rocket.position);
    this.effects.burst(this.rocket.position, grade === LANDING_GRADES.perfect ? 0x33ff8a : 0x24b7ff, 14);
    this.takeoffLocked = true;
    this.rocket.alive = true;
    this.activeLanding = false;
    this.#applyPadRefuel(marker, FIXED_STEP);
    if (this.#isDemoComplete(marker)) {
      this.#completeDemo(marker);
      return;
    }
    this.state.transition(STATES.READY);
    this.ui.showCheckpointReward({ ...reward, grade, stars: starReward, consumedBoosts: [...this.boosts.runConsumed] });
    this.audio.speak('Touchdown.', 'touchdown', 2500);
  }

  #isDemoComplete(marker) {
    return !this.fullAccess && marker.id >= DEMO_CHECKPOINT_LIMIT;
  }

  #checkDemoWall() {
    if (this.fullAccess || !this.state.is(STATES.FLYING)) return;
    const marker = (this.currentLevel.checkpoints ?? []).find((entry) => entry.id === DEMO_CHECKPOINT_LIMIT);
    if (!marker || this.rocket.distance < marker.distance + 24) return;
    this.rocket.alive = false;
    this.rocket.landed = false;
    this.rocket.setFlame(false);
    this.rocket.velocity.set(0, 0, 0);
    this.audio.stopEngine();
    this.#completeDemo(marker, 'wall');
  }

  #completeDemo(marker, reason = 'landed') {
    this.state.transition(STATES.DEMO_COMPLETE, { marker, shopUrl: SHOP_URL, reason });
    this.audio.speak('Nice! You have completed the demo version of Launch 3001.', 'demoComplete', 12000);
  }

  #beginTakeoff() {
    this.rocket.alive = true;
    this.rocket.landed = false;
    this.landedPad = null;
    this.activeLanding = false;
    this.boosts.beginCheckpoint();
    this.recalculateRocketStats();
    if (!this.missionHintDone) {
      this.missionHintDone = true;
      localStorage.setItem('launch3001.missionHintDone', '1');
    }
  }

  #updateFuelPickups(dt) {
    for (const pickup of this.currentLevel.pickups ?? []) {
      if (!this.#nearFuelDrop(pickup)) continue;
      if (pickup.type === 'refill') {
        this.#refillFromPickup(pickup, dt);
        continue;
      }
      if (this.collectedDrops.has(pickup.id)) continue;
      this.collectedDrops.add(pickup.id);
      const amount = pickup.amount * (this.rocket.stats?.pickupValueMultiplier ?? 1);
      this.rocket.fuel = Math.min(this.rocket.maxFuel, this.rocket.fuel + amount);
      const mesh = this.world.current.pickupMeshes?.find((item) => item.name === `Drop ${pickup.id}`);
      if (mesh) mesh.visible = false;
      this.effects.burst(this.rocket.position, 0x4de6ff, 12);
      this.audio.speak('Refueled Sir!', 'fuelPickup', 1200);
    }
  }

  #refillFromPickup(pickup, dt) {
    if (this.collectedDrops.has(pickup.id) || this.rocket.fuel >= this.rocket.maxFuel) return;
    const remaining = this.refillRemaining.get(pickup.id) ?? pickup.amount;
    if (remaining <= 0) {
      this.#depleteFuelPickup(pickup);
      return;
    }
    const transfer = Math.min(remaining, this.rocket.maxFuel - this.rocket.fuel, (pickup.refillRate ?? 26) * dt);
    if (transfer <= 0) return;
    this.refillRemaining.set(pickup.id, remaining - transfer);
    this.rocket.fuel = Math.min(this.rocket.maxFuel, this.rocket.fuel + transfer);
    this.effects.burst(this.rocket.position, 0xffd166, 2);
    if (this.voiceFlags.activeRefill !== pickup.id) {
      this.audio.speak('Refueling Sir!', 'holdRefuel', 1800);
      this.voiceFlags.activeRefill = pickup.id;
    }
    if (remaining - transfer <= 0.05) this.#depleteFuelPickup(pickup);
  }

  #depleteFuelPickup(pickup) {
    this.collectedDrops.add(pickup.id);
    const mesh = this.world.current.pickupMeshes?.find((item) => item.name === `Drop ${pickup.id}`);
    if (mesh) mesh.visible = false;
    this.effects.burst(this.rocket.position, 0xffd166, 12);
  }

  #nearFuelDrop(pickup) {
    const dx = this.rocket.position.x - pickup.position.x;
    const dz = this.rocket.position.z - pickup.position.z;
    const horizontal = Math.hypot(dx, dz);
    const vertical = Math.abs(this.rocket.position.y - pickup.position.y);
    const radiusBonus = this.rocket.stats?.pickupRadiusBonus ?? 0;
    return horizontal <= pickup.radius + this.rocket.radius + 1.05 + radiusBonus && vertical <= 2.2 + radiusBonus * 0.18;
  }

  #refuelOnPad(dt) {
    if (!this.state.is(STATES.READY) && !this.state.is(STATES.LANDED)) return;
    const pad = this.rocket.landed && this.landedPad ? this.landedPad : this.#currentPad();
    if (!pad) return;
    this.#applyPadRefuel(pad, dt);
  }

  #applyPadRefuel(pad, dt) {
    if (this.rocket.fuel < 99 && this.voiceFlags.refuelPad !== pad.id) {
      this.audio.speak('We will take some fuel Captain!', 'padRefuel', 5000);
      this.voiceFlags.refuelPad = pad.id;
    }
    this.rocket.fuel = Math.min(this.rocket.maxFuel, this.rocket.fuel + 20 * dt);
  }

  #applyEmergencyFuel() {
    if (!this.state.is(STATES.FLYING) || this.rocket.fuel > 0) return;
    const emergencyBoost = this.boosts.activate('emergency_fuel');
    if (emergencyBoost) {
      this.rocket.fuel = Math.min(this.rocket.maxFuel, this.rocket.fuel + (emergencyBoost.effects.instantFuelFlat ?? 0));
      this.effects.burst(this.rocket.position, 0xffd166, 16);
      this.audio.speak('Emergency fuel online.', 'emergencyFuel', 5000);
      this.recalculateRocketStats();
      return;
    }
    if (!this.reserveFuelUsed && (this.rocket.stats?.reserveFuel ?? 0) > 0) {
      this.reserveFuelUsed = true;
      this.rocket.fuel = Math.min(this.rocket.maxFuel, this.rocket.stats.reserveFuel);
      this.effects.burst(this.rocket.position, 0x33ff8a, 14);
      this.audio.speak('Reserve fuel engaged.', 'reserveFuel', 6000);
    }
  }

  #applyAirBrake(dt, active) {
    if (!active || this.rocket.landed) return;
    const brake = Math.max(0, (this.rocket.stats?.airBrakeMultiplier ?? 1) - 1);
    if (brake <= 0) return;
    const factor = Math.max(0.88, 1 - brake * 0.18 * dt);
    this.rocket.velocity.x *= factor;
    this.rocket.velocity.z *= factor;
    if (this.rocket.velocity.y < -0.1) this.rocket.velocity.y *= Math.max(0.9, 1 - brake * 0.1 * dt);
  }

  #currentPad() {
    const pads = [this.currentLevel.launchPad, ...(this.currentLevel.checkpoints ?? [])];
    return pads.find((pad) => (
      Math.abs(this.rocket.position.x - pad.position.x) <= pad.size.x / 2 &&
      Math.abs(this.rocket.position.z - pad.position.z) <= pad.size.z / 2 &&
      Math.abs((this.rocket.position.y - ROCKET_STANDING_HEIGHT) - (pad.position.y + 0.12)) < 1.2
    ));
  }

  #createPadShadow() {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false })
    );
    shadow.name = 'Rocket pad shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.visible = false;
    return shadow;
  }

  #updatePadShadow() {
    const pad = (this.currentLevel.checkpoints ?? []).find((entry) => (
      Math.abs(this.rocket.position.x - entry.position.x) <= entry.size.x / 2 &&
      Math.abs(this.rocket.position.z - entry.position.z) <= entry.size.z / 2
    )) || (
      Math.abs(this.rocket.position.x - this.currentLevel.launchPad.position.x) <= this.currentLevel.launchPad.size.x / 2 &&
      Math.abs(this.rocket.position.z - this.currentLevel.launchPad.position.z) <= this.currentLevel.launchPad.size.z / 2
        ? this.currentLevel.launchPad
        : null
    );
    const groundY = this.world.getTerrainHeight(this.rocket.position.x, this.rocket.position.z);
    const surfaceY = pad ? Math.max(groundY, pad.position.y + 0.14) : groundY;
    const height = Math.max(0.1, this.rocket.position.y - surfaceY - ROCKET_STANDING_HEIGHT);
    const strength = Math.max(0, Math.min(0.46, 0.46 - height * 0.045));
    if (strength <= 0.03) {
      this.padShadow.visible = false;
      return;
    }
    this.padShadow.visible = true;
    this.padShadow.material.opacity = strength;
    this.padShadow.position.set(this.rocket.position.x, surfaceY + 0.035, this.rocket.position.z);
    const scale = Math.max(0.62, Math.min(2.8, 0.72 + height * 0.18));
    this.padShadow.scale.set(scale, scale, 1);
  }

  #nextMarker() {
    return (this.currentLevel.checkpoints ?? []).find((marker) => !this.passedMarkers.has(marker.id));
  }

  #voiceStatus(altitude) {
    if (!this.state.is(STATES.FLYING)) return;
    if (altitude < 1.35 && this.rocket.velocity.y < -0.28) {
      this.audio.speak('Emergency, pull up!', 'emergencyAltitude', 2600);
    }
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
    document.addEventListener('selectstart', (event) => {
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
      event.preventDefault();
    });
    document.addEventListener('selectionchange', () => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
      window.getSelection()?.removeAllRanges();
    });
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
