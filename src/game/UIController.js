import { STATES } from './GameState.js';
import { SHOP_URL } from './constants.js';
import { formatNumber } from './utils.js';
import { BUILD_LABEL } from './buildInfo.js';

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

  refreshProfile() {
    if (this.game.state.is(STATES.LOBBY)) this.#lobby();
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
    if (state === STATES.SPLASH) this.#splash();
    if (state === STATES.AUTH) this.#authLogin(payload.error);
    if (state === STATES.DEVICE_SELECT) this.#deviceSelect();
    if (state === STATES.LOBBY) this.#lobby();
    if (state === STATES.MENU) this.#menu();
    if (state === STATES.LEVEL_SELECT) this.#levelSelect();
    if (state === STATES.PAUSED) this.#pause();
    if (state === STATES.READY) this.overlay.innerHTML = '';
    if (state === STATES.CRASHED) this.#endActions();
    if (state === STATES.DEMO_COMPLETE) this.#demoComplete(payload.shopUrl, payload.reason);
    if (state === STATES.LANDED) this.#endActions();
    if (state === STATES.LEVEL_COMPLETE) this.#endActions();
    if (state === STATES.GAME_COMPLETE) this.#endActions();
  }

  showCheckpointReward(reward) {
    this.overlay.innerHTML = `<section class="toast checkpoint-toast">
      <strong>MARKER ${reward.markerId} SAVED</strong>
      <span>+${reward.points} | ${reward.elapsed}s | ${reward.timeRank}</span>
    </section>`;
    window.clearTimeout(this.rewardTimer);
    this.rewardTimer = window.setTimeout(() => {
      if (this.game.state.is(STATES.READY)) this.overlay.innerHTML = '';
    }, 2600);
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
      boost.setPointerCapture?.(event.pointerId);
      this.boostHeld = true;
      this.game.input.thrust = true;
      this.game.audio.unlock();
    }, { passive: false });
    const releaseBoost = (event) => {
      if (!this.boostHeld) return;
      event.preventDefault();
      event.target.releasePointerCapture?.(event.pointerId);
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
    this.root.addEventListener('submit', async (event) => {
      const form = event.target.closest('[data-auth-form]');
      if (!form) return;
      event.preventDefault();
      await this.#submitAuth(form);
    });
  }

  #menu() {
    this.#lobby();
  }

  #splash() {
    this.overlay.innerHTML = `
      <section class="splash-screen">
        <div class="splash-mark">LAUNCH <b>3001</b></div>
        <div class="splash-sub">BIG SLICK GAMES</div>
        <button data-action="enter-hangar">Enter Hangar</button>
      </section>`;
  }

  #authLogin(error = '') {
    this.overlay.innerHTML = `
      <section class="auth-screen">
        <div class="auth-brand">
          <span>BIG SLICK GAMES</span>
          <h1>Launch 3001</h1>
          <p>Sign in with your 21 Holden account to enter the hangar.</p>
        </div>
        <form class="auth-panel" data-auth-form>
          <div>
            <h2>Secure Login</h2>
            <p>Use the account tied to your BSG profile, purchases, chips, and leaderboard runs.</p>
          </div>
          <label>
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" inputmode="email" required />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" autocomplete="current-password" required />
          </label>
          ${error ? `<div class="auth-error" role="alert">${this.#escape(error)}</div>` : ''}
          <button class="primary" type="submit" data-auth-submit>Log In</button>
          <button type="button" data-action="skip-login">Skip Login</button>
          <button type="button" data-action="external-login">Open BSG Login</button>
          <div class="auth-security">
            <span>21 Holden DB</span>
            <span>Encrypted session</span>
          </div>
        </form>
      </section>`;
  }

  #deviceSelect() {
    this.overlay.innerHTML = `
      <section class="device-screen">
        <div class="device-heading">
          <span>HANGAR ENTRY CHECK</span>
          <h2>What device are you playing on?</h2>
        </div>
        <div class="device-grid">
          <button class="device-card" data-action="device-mobile" type="button">
            <b>Mobile</b>
            <span>Tilt controls and touch boost.</span>
          </button>
          <button class="device-card" data-action="device-pc" type="button">
            <b>PC</b>
            <span>Keyboard steering and mouse/touchpad thrust.</span>
          </button>
          <button class="device-card" data-action="device-vr" type="button">
            <b>VR</b>
            <span>Immersive cockpit and controller input.</span>
          </button>
        </div>
      </section>`;
  }

  #lobby() {
    const profile = this.game.profile.profile;
    const loggedIn = this.game.profile.isLoggedIn();
    const canPlay = this.game.isAuthReady();
    const best = this.game.score.progress.leaderboard ?? {};
    this.overlay.innerHTML = `
      <section class="lobby-screen">
        <div class="lobby-brand">
          <span>BIG SLICK GAMES</span>
          <h1>Launch 3001</h1>
          ${this.game.fullAccess ? '<p>FULL ACCESS</p>' : ''}
        </div>
        <div class="lobby-panel lobby-menu">
          <button class="primary" data-action="${canPlay ? 'play' : 'login'}">${loggedIn ? 'Play' : 'Play As Guest'}</button>
          <button data-action="store">Store</button>
          ${loggedIn ? '<button data-action="profile">Profile</button>' : ''}
          <button data-action="${canPlay ? 'level-select' : 'login'}">Load Checkpoint</button>
          <button data-action="leaderboard">Leaderboard</button>
        </div>
        <div class="lobby-panel profile-card">
          <h2>Profile</h2>
          <div class="pilot-row">
            <div class="pilot-avatar">${this.#initials(profile.name)}</div>
            <div><b>${profile.name ?? 'Guest Pilot'}</b><span>${profile.source ?? 'guest'} profile</span></div>
          </div>
          ${this.game.fullAccess ? '<div class="access-pill owned">Full Game Owned</div>' : ''}
          ${canPlay ? '' : '<p class="login-note">Log in with BSG to play the demo.</p><button data-action="login">Log In With BSG</button>'}
          <dl>
            <dt>BSG chips</dt><dd>${formatNumber(profile.chips ?? 0, 0)}</dd>
            <dt>Best distance</dt><dd>${formatNumber(best.bestDistance ?? 0, 0)}m</dd>
            <dt>Best time</dt><dd>${formatNumber(best.bestDistanceTime ?? 0, 1)}s</dd>
          </dl>
        </div>
        <div class="lobby-panel store-card">
          <h2>Full Game</h2>
          <p>Unlock the full route, more checkpoints, quests, caves, moving hazards, and leaderboard runs.</p>
          <button data-action="store">${this.game.fullAccess ? 'Owned' : 'Unlock Full Game'}</button>
        </div>
      </section>`;
  }

  #store() {
    this.overlay.innerHTML = `
      <section class="panel store-panel">
        <h2>Full Version</h2>
        <p>Finish the demo to unlock the full Launch 3001 route from your BSG profile.</p>
        <button data-action="shop" data-shop-url="${SHOP_URL}">Go To BSG Shop</button>
        <button data-action="login">Log In With BSG</button>
        <button data-action="lobby">Back To Lobby</button>
      </section>`;
  }

  #profile() {
    if (!this.game.profile.isLoggedIn()) {
      this.#loginRequired();
      return;
    }
    const profile = this.game.profile.profile;
    this.overlay.innerHTML = `
      <section class="panel profile-panel">
        <h2>Profile</h2>
        <div class="pilot-row">
          <div class="pilot-avatar">${this.#initials(profile.name)}</div>
          <div><b>${profile.name ?? 'Guest Pilot'}</b><span>${profile.email || profile.source || 'BSG profile pending'}</span></div>
        </div>
        <dl>
          <dt>BSG chips</dt><dd>${formatNumber(profile.chips ?? 0, 0)}</dd>
        </dl>
        <p>${this.game.fullAccess ? 'Launch 3001 full access is active on this profile.' : 'Launch 3001 full access is not active on this profile.'}</p>
        <button data-action="store">Store</button>
        <button data-action="lobby">Back To Lobby</button>
      </section>`;
  }

  #demoComplete() {
    this.#endActions();
  }

  #endActions() {
    this.overlay.innerHTML = `
      <section class="panel demo-panel">
        <button data-action="restart">Restart</button>
        <button data-action="menu">Lobby</button>
      </section>`;
  }

  showMobileTiltPrompt() {
    this.root.dataset.state = STATES.LOBBY;
    this.overlay.innerHTML = `
      <section class="panel menu-panel mobile-tutorial-panel">
        <h2>Mobile Controls</h2>
        <div class="phone-demo" aria-hidden="true">
          <div class="phone-shape"><div class="phone-screen"></div></div>
          <div class="comfort-lines"><span></span><span></span><span></span></div>
        </div>
        <p>Hold the phone in a comfortable flying position.</p>
        <button data-action="mobile-tilt">Enable Tilt</button>
      </section>`;
  }

  showMobileCalibratePrompt() {
    this.root.dataset.state = STATES.LOBBY;
    this.overlay.innerHTML = `
      <section class="panel menu-panel mobile-tutorial-panel">
        <h2>Calibrate Tilt</h2>
        <div class="phone-demo calibrating" aria-hidden="true">
          <div class="phone-shape"><div class="phone-screen"></div></div>
          <div class="comfort-lines"><span></span><span></span><span></span></div>
        </div>
        <p>Keep the phone steady in that position, then calibrate.</p>
        <button data-action="mobile-calibrate">Calibrate</button>
      </section>`;
  }

  showMobileReadyPrompt() {
    this.root.dataset.state = STATES.LOBBY;
    this.overlay.innerHTML = `
      <section class="panel menu-panel mobile-tutorial-panel">
        <h2>Tilt Ready</h2>
        <p>Tilt steering is enabled and calibrated.</p>
        <button data-action="mobile-ok">OK</button>
      </section>`;
  }

  showVrPrompt() {
    this.root.dataset.state = STATES.LOBBY;
    this.overlay.innerHTML = `
      <section class="panel menu-panel vr-ready-panel">
        <h2>VR Mode</h2>
        <p>Use the VR button in the top right to enter immersive mode. Cockpit camera is selected for this session.</p>
        <button data-action="lobby">Continue</button>
      </section>`;
  }

  showMissionHint() {
    this.overlay.innerHTML = `
      <section class="toast mission-hint">
        <strong>MISSION</strong>
        <span>Thread the gates, collect fuel, land on numbered markers.</span>
      </section>`;
  }

  #levelSelect() {
    const levels = this.game.levels.levels.map((level) => {
      const markerId = level.markerId ?? Math.max(0, Math.floor(level.startDistance / 180));
      const score = this.game.score.progress.bestScores[markerId] ?? 0;
      const grade = markerId === 0 ? 'START' : (this.game.score.progress.bestGrades[markerId] ?? 'READY');
      return `<button class="level-card" data-action="level" data-level-id="${level.id}">
        <strong>${level.name}</strong><span>${formatNumber(level.startDistance, 0)}m | ${grade} | ${score}</span>
      </button>`;
    }).join('');
    this.overlay.innerHTML = `<section class="panel level-panel"><h2>Load Checkpoint</h2><div class="level-grid">${levels}</div><button data-action="back">Back</button></section>`;
  }

  #pause() {
    this.overlay.innerHTML = `<section class="panel control-panel">
      <h2>Menu</h2>
      <div class="control-actions">
        <button data-action="menu">Lobby</button>
        <button data-action="reset-run">Reset</button>
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

  #trophyFor(place) {
    if (place === 1) return '🏆';
    if (place === 2) return '🥈';
    if (place === 3) return '🥉';
    return '•';
  }

  async #handleAction(action, target) {
    if (action === 'shop') {
      this.game.hub.openShop();
      return;
    }
    await this.game.audio.unlock();
    this.game.audio.playClick();
    if (action === 'enter-hangar') this.game.enterHangar();
    if (action === 'play') {
      if (!this.game.isAuthReady()) {
        this.#loginRequired();
      } else {
        this.#launchSequence();
      }
    }
    if (action === 'lobby') this.game.showLobby();
    if (action === 'store') this.#store();
    if (action === 'profile') this.#profile();
    if (action === 'login') this.game.showAuth();
    if (action === 'skip-login') this.game.skipLogin();
    if (action === 'external-login') this.game.hub.requestLogin();
    if (action === 'device-mobile') this.game.selectDeviceMode('mobile');
    if (action === 'device-pc') this.game.selectDeviceMode('pc');
    if (action === 'device-vr') this.game.selectDeviceMode('vr');
    if (action === 'level-select') {
      if (!this.game.isAuthReady()) this.#loginRequired();
      else this.game.state.transition(STATES.LEVEL_SELECT);
    }
    if (action === 'menu') this.game.showLobby();
    if (action === 'resume') this.game.resume();
    if (action === 'close-settings') this.#closeSettings();
    if (action === 'pause') this.game.pause();
    if (action === 'leaderboard') this.#leaderboard();
    if (action === 'hud-side') this.#toggleHudSide();
    if (action === 'restart') this.game.restartLevel();
    if (action === 'reset-run') this.game.resetRun();
    if (action === 'mobile-tilt') this.game.enableTiltFromPrompt();
    if (action === 'mobile-calibrate') this.game.calibrateTiltFromPrompt();
    if (action === 'mobile-ok') this.game.completeMobileTutorial();
    if (action === 'mobile-skip') this.game.skipMobileTutorial();
    if (action === 'back') this.game.showLobby();
    if (action === 'level') {
      if (!this.game.isAuthReady()) this.#loginRequired();
      else this.game.startLevel(Number(target.closest('[data-level-id]').dataset.levelId));
    }
  }

  #loginRequired() {
    this.game.showAuth();
  }

  #launchSequence() {
    this.overlay.innerHTML = `
      <section class="launch-transition">
        <div class="hangar-door left-door"></div>
        <div class="hangar-door right-door"></div>
        <div class="walkway-light"></div>
        <strong>HANGAR DOORS OPENING</strong>
        <span>Walking out to the rocket</span>
      </section>`;
    window.setTimeout(() => this.game.enterGame(), 1800);
  }

  async #submitAuth(form) {
    const submit = form.querySelector('[data-auth-submit]');
    const email = form.elements.email?.value?.trim() ?? '';
    const password = form.elements.password?.value ?? '';
    submit.disabled = true;
    submit.textContent = 'Signing In...';
    try {
      await this.game.loginWithCredentials(email, password);
    } catch (error) {
      this.#authLogin(error?.message || 'Login failed. Check your email and password.');
    }
  }

  #initials(name = 'Guest Pilot') {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'GP';
  }

  #escape(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
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
        <div class="build-badge">BUILD ${BUILD_LABEL}</div>
        <button class="hud-swap" data-action="hud-side" aria-label="Move HUD">›</button>
        <div class="fuel-meter" aria-label="Fuel">
          <div class="instrument-label">FUEL</div>
          <div class="fuel-track"><div class="fuel-fill"></div></div>
          <b><span data-value="fuel">100</span>%</b>
        </div>
        <div class="instruments">
          <button class="hud-menu" data-action="pause" aria-label="Menu">Menu</button>
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
      </div>`;
  }
}
