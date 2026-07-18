import { STATES } from './GameState.js';
import { CAMERA_MODE_SEQUENCE, VR_CAMERA_MODE_SEQUENCE } from './constants.js';
import { formatNumber } from './utils.js';

export class UIController {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.root.insertAdjacentHTML('beforeend', this.#template());
    this.hud = root.querySelector('.hud');
    this.overlay = root.querySelector('.overlay');
    this.warning = root.querySelector('[data-warning]');
    this.boostHeld = false;
    this.lastTouchActionAt = 0;
    this.hudSide = 'left';
    this.root.dataset.hudSide = this.hudSide;
    this.#bind();
    this.#updateHudSideControl();
  }

  update(data) {
    const markerDistance = data.nextMarker ? Math.max(0, data.nextMarker.distance - data.rocket.distance) : 0;
    const markerTime = Math.max(0, data.rocket.flightTime - this.game.lastCheckpointTime);
    const fuelPercent = Math.max(0, Math.min(100, data.rocket.fuel));
    const altitudePercent = Math.max(0, Math.min(1, data.altitude / 24));
    this.hud?.style.setProperty('--fuel', `${fuelPercent}%`);
    this.hud?.style.setProperty('--altitude-angle', `${-135 + altitudePercent * 270}deg`);
    this.#set('level', 'ENDLESS');
    this.#set('score', data.score.progress.totalScore);
    this.#set('best', data.score.progress.bestTotalScore);
    this.#set('best-distance', formatNumber(data.score.progress.leaderboard?.bestDistance ?? 0, 0));
    this.#set('best-distance-time', formatNumber(data.score.progress.leaderboard?.bestDistanceTime ?? 0, 1));
    this.#set('distance', formatNumber(data.rocket.distance, 0));
    this.#set('marker', formatNumber(markerDistance, 0));
    this.#set('fuel', formatNumber(data.rocket.fuel, 0));
    this.#set('time', formatNumber(markerTime, 1));
    this.#set('altitude', formatNumber(data.altitude));
    this.#set('altitude-dial', formatNumber(data.altitude, 1));
    this.#set('vertical', formatNumber(data.rocket.velocity.y));
    this.#set('horizontal', formatNumber(Math.hypot(data.rocket.velocity.x, data.rocket.velocity.z)));
    this.#set('angle', `${formatNumber(data.rocket.getTiltAngle() * 57.3, 0)}deg`);
    this.#set('wind', formatNumber(data.level.windStrength));
    this.#set('tolerance', `${formatNumber(data.level.landingThresholds.angle * 57.3, 0)}deg`);
    this.#set('thrust', data.rocket.thrusting ? 'ON' : 'OFF');
    this.#set('camera', data.camera.mode);
    this.#warnings(data);
  }

  showState(state, payload = {}) {
    this.root.dataset.state = state;
    delete this.root.dataset.settingsOpen;
    if (state === STATES.MENU) this.#menu();
    if (state === STATES.LEVEL_SELECT) this.#levelSelect();
    if (state === STATES.PAUSED) this.#pause();
    if (state === STATES.READY) this.overlay.innerHTML = '';
    if (state === STATES.CRASHED) this.#message(payload.reason ?? 'CRASH', this.#placementText(payload.placement));
    if (state === STATES.LANDED) this.#message(payload.grade ?? 'SAVED', `+${payload.points ?? 0} points`);
    if (state === STATES.LEVEL_COMPLETE) this.#message('MARKER SAVED', 'Keep going.');
    if (state === STATES.GAME_COMPLETE) this.#message('ENDLESS RUN', 'Route continues.');
  }

  #set(key, value) {
    const el = this.root.querySelector(`[data-value="${key}"]`);
    if (el) el.textContent = value;
  }

  #warnings({ rocket, altitude, level }) {
    const horizontal = Math.hypot(rocket.velocity.x, rocket.velocity.z);
    let text = '';
    let emergency = '';
    this.root.dataset.emergency = 'false';
    if (altitude < 2.2 && !rocket.landed) text = 'LOW ALTITUDE';
    if (altitude < 1.8 && !rocket.landed) {
      emergency = 'GROUND';
    }
    if (altitude < 1.15 && rocket.velocity.y < -0.25 && !rocket.landed) {
      emergency = 'PULL UP';
    }
    if (Math.abs(rocket.velocity.y) > level.landingThresholds.verticalSpeed * 0.85) text = 'TOO FAST';
    if (horizontal > level.landingThresholds.horizontalSpeed * 0.85) text = 'SIDE SPEED';
    if (rocket.getTiltAngle() > level.landingThresholds.angle * 0.85) text = 'BAD ANGLE';
    if (rocket.fuel < 18) text = 'LOW FUEL';
    if (rocket.fuel <= 0) text = 'OUT OF FUEL';
    if (level.windStrength > 0.7) text = 'HIGH WIND';
    if (emergency) {
      text = emergency;
      this.root.dataset.emergency = 'true';
    }
    this.warning.textContent = text;
  }

  #bind() {
    this.root.addEventListener('pointerdown', (event) => {
      const boost = event.target.closest('[data-boost]');
      if (!boost) return;
      event.preventDefault();
      this.boostHeld = true;
      this.game.input.thrust = true;
      this.game.audio.unlock();
    }, { passive: false });
    const releaseBoost = (event) => {
      if (!this.boostHeld) return;
      event.preventDefault();
      this.boostHeld = false;
      this.game.input.thrust = false;
    };
    this.root.addEventListener('pointerup', releaseBoost, { passive: false });
    this.root.addEventListener('pointercancel', releaseBoost, { passive: false });
    this.root.addEventListener('pointerleave', releaseBoost, { passive: false });
    this.root.addEventListener('pointerup', async (event) => {
      if (event.pointerType !== 'touch') return;
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      event.preventDefault();
      this.lastTouchActionAt = performance.now();
      await this.#handleAction(action, event.target);
    }, { passive: false });
    this.root.addEventListener('click', async (event) => {
      if (performance.now() - this.lastTouchActionAt < 450) return;
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      await this.#handleAction(action, event.target);
    });
    this.root.addEventListener('input', (event) => {
      const input = event.target;
      if (!input.dataset.setting) return;
      const key = input.dataset.setting;
      const value = input.type === 'checkbox' ? input.checked : Number(input.value);
      this.game.settings[key] = value;
      this.game.save.saveSettings(this.game.settings);
    });
    this.root.addEventListener('change', (event) => {
      const input = event.target;
      if (input.dataset.setting === 'cameraMode') {
        this.game.setCameraMode(input.value);
      } else if (input.dataset.setting === 'vrCameraMode') {
        this.game.settings.vrCameraMode = input.value;
        this.game.save.saveSettings(this.game.settings);
      }
    });
  }

  #menu() {
    this.overlay.innerHTML = `
      <section class="panel menu-panel">
        <h1>Launch3001</h1>
        <p>Endless rocket run. Reach save markers, collect Drop fuel, and bank time bonuses.</p>
        <button data-action="play">Play</button>
        <button data-action="level-select">Load Checkpoint</button>
        <button data-action="leaderboard">Leaderboard</button>
        <button data-action="reset-run">Reset Run</button>
        <button data-action="settings">Settings</button>
      </section>`;
  }

  showMobileTiltPrompt() {
    this.root.dataset.state = STATES.MENU;
    this.overlay.innerHTML = `
      <section class="panel menu-panel">
        <h2>Mobile Controls</h2>
        <p>Enable tilt control to steer the rocket with this phone.</p>
        <button data-action="mobile-tilt">Enable Tilt</button>
        <button data-action="mobile-skip">Not Now</button>
      </section>`;
  }

  showMobileCalibratePrompt() {
    this.root.dataset.state = STATES.MENU;
    this.overlay.innerHTML = `
      <section class="panel menu-panel">
        <h2>Calibrate Tilt</h2>
        <p>Get comfortable, hold the phone how you want to play, then calibrate.</p>
        <button data-action="mobile-calibrate">Calibrate</button>
      </section>`;
  }

  #levelSelect() {
    const levels = this.game.levels.levels.map((level) => {
      const locked = level.id > this.game.score.progress.highestUnlockedLevel;
      const markerId = Math.max(1, Math.floor(level.startDistance / 180));
      const score = this.game.score.progress.bestScores[markerId] ?? 0;
      const grade = level.startDistance === 0 ? 'START' : (this.game.score.progress.bestGrades[markerId] ?? '-');
      return `<button class="level-card" data-action="level" data-level-id="${level.id}" ${locked ? 'disabled' : ''}>
        <strong>${level.name}</strong><span>${locked ? 'LOCKED' : `${formatNumber(level.startDistance, 0)}m | ${grade} | ${score}`}</span>
      </button>`;
    }).join('');
    this.overlay.innerHTML = `<section class="panel level-panel"><h2>Load Checkpoint</h2><div class="level-grid">${levels}</div><button data-action="back">Back</button></section>`;
  }

  #pause() {
    const s = this.game.settings;
    const cameraOptions = CAMERA_MODE_SEQUENCE.map((mode) => `<option value="${mode}" ${s.cameraMode === mode ? 'selected' : ''}>${mode}</option>`).join('');
    this.overlay.innerHTML = `<section class="panel control-panel">
      <h2>Menu</h2>
      <div class="control-actions">
        <button data-action="resume">Resume</button>
        <button data-action="restart">Restart</button>
        <button data-action="level-select">Load Checkpoint</button>
        <button data-action="leaderboard">Leaderboard</button>
        <button data-action="reset-run">Reset Run</button>
        <button data-action="menu">Exit</button>
      </div>
      <div class="control-settings">
        <label>Camera <select data-setting="cameraMode">${cameraOptions}</select></label>
        <label>Volume <input data-setting="volume" type="range" min="0" max="1" step="0.05" value="${s.volume}"></label>
        <label><input data-setting="noFuelDrain" type="checkbox" ${s.noFuelDrain ? 'checked' : ''}> No fuel drain</label>
        <label><input data-setting="muted" type="checkbox" ${s.muted ? 'checked' : ''}> Mute</label>
      </div>
      <div class="control-actions">
        <button data-action="audio">Audio</button>
        <button data-action="tilt">Enable Tilt</button>
        <button data-action="calibrate">Calibrate</button>
      </div>
    </section>`;
  }

  #leaderboard() {
    const board = this.game.score.progress.leaderboard ?? {};
    const rows = (board.runs ?? []).slice(0, 10).map((run, index) => `
      <div class="leader-row">
        <span>${this.#trophyFor(index + 1)} #${index + 1}</span>
        <b>${formatNumber(run.distance, 0)}m</b>
        <span>${formatNumber(run.time, 1)}s</span>
      </div>
    `).join('');
    this.overlay.innerHTML = `<section class="panel level-panel">
      <h2>Leaderboard</h2>
      <div class="leader-summary">Best distance <b>${formatNumber(board.bestDistance ?? 0, 0)}m</b> in <b>${formatNumber(board.bestDistanceTime ?? 0, 1)}s</b></div>
      <div class="leader-list">${rows || '<div class="leader-empty">No runs yet</div>'}</div>
      <button data-action="back">Back</button>
    </section>`;
  }

  #settings() {
    const s = this.game.settings;
    this.root.dataset.settingsOpen = 'true';
    const cameraOptions = CAMERA_MODE_SEQUENCE.map((mode) => `<option value="${mode}" ${s.cameraMode === mode ? 'selected' : ''}>${mode}</option>`).join('');
    const vrCameraOptions = VR_CAMERA_MODE_SEQUENCE.map((mode) => `<option value="${mode}" ${s.vrCameraMode === mode ? 'selected' : ''}>${mode}</option>`).join('');
    this.overlay.innerHTML = `<section class="panel settings-panel">
      <h2>Settings</h2>
      <label>Camera mode <select data-setting="cameraMode">${cameraOptions}</select></label>
      <label>Camera distance <input data-setting="cameraDistance" type="range" min="0.75" max="1.7" step="0.05" value="${s.cameraDistance ?? 1}"></label>
      <label>Camera height <input data-setting="cameraHeight" type="range" min="0.7" max="1.5" step="0.05" value="${s.cameraHeight ?? 1}"></label>
      <button data-action="side-camera">Flip Side Camera</button>
      <label>VR camera <select data-setting="vrCameraMode">${vrCameraOptions}</select></label>
      <label>VR distance <input data-setting="vrCameraDistance" type="range" min="0.8" max="7" step="0.2" value="${s.vrCameraDistance ?? 2.3}"></label>
      <label>VR height <input data-setting="vrCameraHeight" type="range" min="0.35" max="3.2" step="0.1" value="${s.vrCameraHeight ?? 0.85}"></label>
      <label>VR panel distance <input data-setting="vrPanelDistance" type="range" min="1.1" max="3.4" step="0.1" value="${s.vrPanelDistance ?? 1.85}"></label>
      <label>VR panel height <input data-setting="vrPanelHeight" type="range" min="-0.9" max="0.35" step="0.05" value="${s.vrPanelHeight ?? -0.22}"></label>
      <label>VR comfort scale <input data-setting="vrComfortScale" type="range" min="0.65" max="1.35" step="0.05" value="${s.vrComfortScale ?? 1}"></label>
      <label>Tilt sensitivity <input data-setting="tiltSensitivity" type="range" min="0.4" max="2" step="0.05" value="${s.tiltSensitivity}"></label>
      <label>Tilt dead zone <input data-setting="tiltDeadZone" type="range" min="0" max="0.24" step="0.01" value="${s.tiltDeadZone}"></label>
      <label>Tilt smoothing <input data-setting="tiltSmoothing" type="range" min="0.04" max="0.45" step="0.01" value="${s.tiltSmoothing}"></label>
      <label>Volume <input data-setting="volume" type="range" min="0" max="1" step="0.05" value="${s.volume}"></label>
      <label><input data-setting="invertForward" type="checkbox" ${s.invertForward ? 'checked' : ''}> Invert forward tilt</label>
      <label><input data-setting="noFuelDrain" type="checkbox" ${s.noFuelDrain ? 'checked' : ''}> No fuel drain</label>
      <label><input data-setting="muted" type="checkbox" ${s.muted ? 'checked' : ''}> Mute</label>
      <button data-action="calibrate">Recalibrate</button>
      <button data-action="close-settings">Close</button>
    </section>`;
  }

  #message(title, body) {
    this.overlay.innerHTML = `<section class="toast"><strong>${title}</strong><span>${body}</span></section>`;
  }

  #placementText(placement) {
    if (!placement) return 'Tap Restart or press R.';
    return `${this.#trophyFor(placement.placement)} Placed #${placement.placement} | ${formatNumber(placement.distance, 0)}m in ${formatNumber(placement.time, 1)}s`;
  }

  #trophyFor(place) {
    if (place === 1) return '🏆';
    if (place === 2) return '🥈';
    if (place === 3) return '🥉';
    return '•';
  }

  async #handleAction(action, target) {
    await this.game.audio.unlock();
    this.game.audio.playClick();
    if (action === 'play') this.game.startLevel(this.game.score.progress.highestUnlockedLevel);
    if (action === 'level-select') this.game.state.transition(STATES.LEVEL_SELECT);
    if (action === 'menu') this.game.goMenu();
    if (action === 'resume') this.game.resume();
    if (action === 'close-settings') this.#closeSettings();
    if (action === 'pause') this.game.pause();
    if (action === 'leaderboard') this.#leaderboard();
    if (action === 'hud-side') this.#toggleHudSide();
    if (action === 'audio') this.game.enableAudio();
    if (action === 'restart') this.game.restartLevel();
    if (action === 'reset-run') this.game.resetRun();
    if (action === 'camera') this.game.toggleCamera();
    if (action === 'camera-mode') this.game.setCameraMode(target.closest('[data-camera-mode]').dataset.cameraMode);
    if (action === 'side-camera') this.game.flipSideCamera();
    if (action === 'tilt') this.game.enableTilt();
    if (action === 'mobile-tilt') this.game.enableTiltFromPrompt();
    if (action === 'mobile-calibrate') this.game.calibrateTiltFromPrompt();
    if (action === 'mobile-skip') this.game.skipMobileTutorial();
    if (action === 'calibrate') this.game.input.calibrate();
    if (action === 'settings') this.#settings();
    if (action === 'back') this.game.state.transition(STATES.MENU);
    if (action === 'level') this.game.startLevel(Number(target.closest('[data-level-id]').dataset.levelId));
  }

  #closeSettings() {
    delete this.root.dataset.settingsOpen;
    if (this.game.state.is(STATES.PAUSED)) {
      this.game.resume();
      return;
    }
    this.uiWasSettings = false;
    this.showState(this.game.state.current);
  }

  #toggleHudSide() {
    this.hudSide = this.hudSide === 'left' ? 'right' : 'left';
    this.root.dataset.hudSide = this.hudSide;
    this.#updateHudSideControl();
  }

  #updateHudSideControl() {
    const control = this.root.querySelector('[data-action="hud-side"]');
    if (control) control.textContent = this.hudSide === 'left' ? '›' : '‹';
  }

  #template() {
    return `
      <div class="overlay"></div>
      <div class="top-stats">
        <span>SCORE <b data-value="score">0</b></span>
        <span>BEST <b data-value="best">0</b></span>
        <span>BEST DIST <b data-value="best-distance">0</b>m/<b data-value="best-distance-time">0.0</b>s</span>
        <span>DIST <b data-value="distance">0</b>m</span>
        <span>MARKER <b data-value="marker">0</b>m</span>
        <span>TIME <b data-value="time">0.0</b>s</span>
      </div>
      <div class="hud">
        <button class="hud-swap" data-action="hud-side" aria-label="Move HUD">›</button>
        <div class="fuel-meter" aria-label="Fuel">
          <div class="instrument-label">FUEL</div>
          <div class="fuel-track"><div class="fuel-fill"></div></div>
          <b><span data-value="fuel">100</span>%</b>
        </div>
        <div class="instruments">
          <button class="hud-menu" data-action="pause" aria-label="Menu">Menu</button>
          <button class="hud-audio" data-action="audio" aria-label="Enable audio">Audio</button>
          <div class="altitude-dial" aria-label="Altitude above ground">
            <div class="dial-face">
              <div class="dial-needle"></div>
              <div class="dial-pin"></div>
            </div>
            <div class="dial-readout"><b data-value="altitude-dial">0.0</b><span>ALT</span></div>
          </div>
          <button class="hud-boost" data-boost aria-label="Boost">Boost</button>
        </div>
        <div class="readouts">
          <span data-stat="level">ROUTE <b data-value="level">ENDLESS</b></span><span data-stat="score">SCORE <b data-value="score">0</b></span><span data-stat="best">BEST <b data-value="best">0</b></span>
          <span data-stat="distance">DIST <b data-value="distance">0</b>m</span><span data-stat="marker">MARKER <b data-value="marker">0</b>m</span><span data-stat="fuel">FUEL <b data-value="fuel">100</b>%</span>
          <span data-stat="altitude">ALT <b data-value="altitude">0</b></span><span data-stat="vertical">V/S <b data-value="vertical">0</b></span><span data-stat="horizontal">H/S <b data-value="horizontal">0</b></span>
          <span data-stat="angle">ANGLE <b data-value="angle">0deg</b></span><span data-stat="wind">WIND <b data-value="wind">0</b></span><span data-stat="tolerance">TOL <b data-value="tolerance">0deg</b></span>
          <span data-stat="time">TIME <b data-value="time">0.0</b>s</span><span data-stat="thrust">THRUST <b data-value="thrust">OFF</b></span><span data-stat="camera">CAM <b data-value="camera">CHASE</b></span>
        </div>
        <div class="warning" data-warning></div>
        <div class="camera-strip">
          ${CAMERA_MODE_SEQUENCE.map((mode) => `<button data-action="camera-mode" data-camera-mode="${mode}">${mode}</button>`).join('')}
        </div>
        <div class="buttons">
          <button data-action="tilt">Enable Tilt</button><button data-action="calibrate">Calibrate</button><button data-action="camera">Camera</button>
          <button data-action="pause">Pause</button><button data-action="restart">Restart</button><button data-action="settings">Settings</button>
        </div>
      </div>`;
  }
}
