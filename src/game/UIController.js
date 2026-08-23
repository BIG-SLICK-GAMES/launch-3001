import { STATES } from './GameState.js';
import { SHOP_URL } from './constants.js';
import { formatNumber } from './utils.js';
import { BUILD_LABEL } from './buildInfo.js';
import { UPGRADE_DEFINITIONS } from './UpgradeDefinitions.js';
import { BOOST_DEFINITIONS, BONUS_STAR_PACKAGES } from './BoostDefinitions.js';
import { RocketPreview } from './RocketPreview.js';
import { AnimationDirector } from './AnimationDirector.js';

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
    this.joystickPointerId = null;
    this.hudSide = 'left';
    this.root.dataset.hudSide = this.hudSide;
    this.#bind();
    this.#updateHudSideControl();
  }

  refreshProfile() {
    if (this.game.state.is(STATES.LOBBY)) this.#lobby();
  }

  update(data) {
    const targetDistance = data.nextMarker ? Math.max(0, data.nextMarker.distance - data.rocket.distance) : 0;
    const levelTime = Math.max(0, data.rocket.flightTime);
    const fuelPercent = Math.max(0, Math.min(100, (data.rocket.fuel / (data.rocket.maxFuel ?? 100)) * 100));
    const altitudePercent = Math.max(0, Math.min(1, data.altitude / 24));
    this.hud?.style.setProperty('--fuel', `${fuelPercent}%`);
    this.hud?.style.setProperty('--altitude-angle', `${-135 + altitudePercent * 270}deg`);
    this.#set('level', data.level.id ?? this.game.currentLevel.id);
    this.#set('score', data.score.progress.totalScore);
    this.#set('best', data.score.progress.bestTotalScore);
    this.#set('best-distance', formatNumber(data.score.progress.leaderboard?.bestDistance ?? 0, 0));
    this.#set('best-distance-time', formatNumber(data.score.progress.leaderboard?.bestDistanceTime ?? 0, 1));
    this.#set('distance', formatNumber(data.rocket.distance, 0));
    this.#set('marker', formatNumber(targetDistance, 0));
    this.#set('fuel', formatNumber(data.rocket.fuel, 0));
    this.#set('time', formatNumber(levelTime, 1));
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
    this.#disposeRocketPreview();
    this.root.dataset.state = state;
    delete this.root.dataset.settingsOpen;
    if (state === STATES.DEVICE_SELECT) this.#deviceSelect();
    if (state === STATES.LOBBY) this.#lobby();
    if (state === STATES.MENU) this.#menu();
    if (state === STATES.LEVEL_SELECT) this.#levelSelect();
    if (state === STATES.PAUSED) this.#pause();
    if (state === STATES.READY) this.overlay.innerHTML = '';
    if (state === STATES.CRASHED) this.#endActions(payload);
    if (state === STATES.DEMO_COMPLETE) this.#demoComplete(payload.shopUrl, payload.reason);
    if (state === STATES.LANDED) this.#endActions(payload);
    if (state === STATES.LEVEL_COMPLETE) this.#endActions(payload);
    if (state === STATES.GAME_COMPLETE) this.#endActions(payload);
  }

  showCheckpointReward(reward) {
    const stars = reward.stars
      ? `<span>${'*'.repeat(reward.stars.finalStars).padEnd(3, '-')} | +${reward.stars.newStarsEarned} new stars | ${reward.stars.availableStars} available</span>`
      : '';
    const consumed = reward.consumedBoosts?.length ? `<span>Boosts used: ${reward.consumedBoosts.join(', ')}</span>` : '';
    this.overlay.innerHTML = `<section class="toast checkpoint-toast">
      <strong>MARKER ${reward.markerId} SAVED</strong>
      <span>+${reward.points} | ${reward.elapsed}s | ${reward.timeRank}</span>
      ${stars}
      ${consumed}
    </section>`;
    window.clearTimeout(this.rewardTimer);
    this.rewardTimer = window.setTimeout(() => {
      if (this.game.state.is(STATES.READY)) this.overlay.innerHTML = '';
    }, 2600);
  }

  #starsText(stars) {
    if (!stars) return '';
    return `${'*'.repeat(stars.finalStars).padEnd(3, '-')} | +${stars.newStarsEarned} new stars | ${stars.availableStars} available`;
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
    const joystick = this.root.querySelector('[data-mobile-joystick]');
    const updateJoystick = (event) => {
      if (!joystick) return;
      const rect = joystick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const max = rect.width * 0.36;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const length = Math.min(max, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      const x = Math.cos(angle) * length;
      const y = Math.sin(angle) * length;
      joystick.style.setProperty('--joy-x', `${x}px`);
      joystick.style.setProperty('--joy-y', `${y}px`);
      this.game.input.setJoystickSteering(x / max, y / max);
    };
    const clearJoystick = (event) => {
      if (this.joystickPointerId !== event.pointerId) return;
      this.joystickPointerId = null;
      joystick?.releasePointerCapture?.(event.pointerId);
      joystick?.style.setProperty('--joy-x', '0px');
      joystick?.style.setProperty('--joy-y', '0px');
      this.game.input.clearJoystickSteering();
    };
    joystick?.addEventListener('pointerdown', (event) => {
      if (this.game.settings.mobileControlMode !== 'joystick') return;
      event.preventDefault();
      this.joystickPointerId = event.pointerId;
      joystick.setPointerCapture?.(event.pointerId);
      updateJoystick(event);
      this.game.audio.unlock();
    }, { passive: false });
    joystick?.addEventListener('pointermove', (event) => {
      if (this.joystickPointerId !== event.pointerId) return;
      event.preventDefault();
      updateJoystick(event);
    }, { passive: false });
    joystick?.addEventListener('pointerup', clearJoystick, { passive: false });
    joystick?.addEventListener('pointercancel', clearJoystick, { passive: false });
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
    this.root.addEventListener('pointerover', (event) => {
      const focusTarget = event.target.closest('[data-focus-part]');
      if (!focusTarget || !this.rocketPreview) return;
      this.rocketPreview.focus(focusTarget.dataset.focusPart);
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
    this.#lobby();
  }

  #deviceSelect() {
    this.#disposeRocketPreview();
    this.overlay.innerHTML = `
      <section class="device-screen">
        <div class="device-heading">
          <span>CONTROL CHECK</span>
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
    this.#disposeRocketPreview();
    const profile = this.game.profile.profile;
    this.overlay.innerHTML = `
      <section class="lobby-screen lobby-command">
        <div class="lobby-status">
          <span>${profile.name ?? 'Guest Pilot'}</span>
          <span>${formatNumber(profile.chips ?? 0, 0)} chips</span>
          <span>${formatNumber(this.game.score.progress.availableStars ?? 0, 0)} stars</span>
          <span>${this.game.upgrades.completionPercent()}% upgrades</span>
        </div>
        <button class="lobby-hotspot hotspot-launch" data-action="play" aria-label="Launch">Launch</button>
        <button class="lobby-hotspot hotspot-upgrades" data-action="upgrades" aria-label="Upgrades">Upgrades</button>
        <button class="lobby-hotspot hotspot-boosts" data-action="boosts" aria-label="Boosts">Boosts</button>
        <button class="lobby-hotspot hotspot-leaderboard" data-action="leaderboard" aria-label="Leaderboard">Leaderboard</button>
        <button class="lobby-hotspot hotspot-levels" data-action="level-select" aria-label="Select Level">Select Level</button>
        <button class="lobby-hotspot hotspot-profile" data-action="profile" aria-label="Profile">Profile</button>
        <button class="lobby-chip-button" data-action="buy-stars">Buy Stars</button>
        <button class="lobby-store-button" data-action="store">Store</button>
      </section>`;
  }

  #upgrades(selectedId = UPGRADE_DEFINITIONS[0]?.upgradeId) {
    const selected = UPGRADE_DEFINITIONS.find((entry) => entry.upgradeId === selectedId) ?? UPGRADE_DEFINITIONS[0];
    const level = this.game.upgrades.levelFor(selected.upgradeId);
    const nextCost = this.game.upgrades.nextCost(selected.upgradeId);
    const check = this.game.upgrades.canUpgrade(selected.upgradeId);
    const equipped = this.game.upgrades.equipped();
    const isEquipped = this.game.upgrades.isEquipped(selected.upgradeId);
    const equipCheck = this.game.upgrades.canEquip(selected.upgradeId);
    const rows = UPGRADE_DEFINITIONS.map((upgrade) => {
      const current = this.game.upgrades.levelFor(upgrade.upgradeId);
      const status = this.game.upgrades.isEquipped(upgrade.upgradeId) ? 'EQUIPPED' : current > 0 ? 'OWNED' : 'LOCKED';
      return `<button class="upgrade-row ${upgrade.upgradeId === selected.upgradeId ? 'selected' : ''}" data-action="select-upgrade" data-upgrade-id="${upgrade.upgradeId}" data-focus-part="${upgrade.upgradeId}">
        <strong>${upgrade.displayName}</strong><span>${upgrade.category} | ${current}/${upgrade.maximumLevel} | ${status}</span>
      </button>`;
    }).join('');
    const effects = Object.entries(selected.statModifiers ?? {}).map(([key, values]) => {
      const current = level ? values[level - 1] : 0;
      const next = values[Math.min(level, values.length - 1)] ?? current;
      return `<div class="stat-row"><span>${this.#label(key)}</span><b>${formatNumber(current, 1)} -> ${formatNumber(next, 1)}</b></div>`;
    }).join('');
    const equipButton = level <= 0
      ? '<button disabled>Install before equip</button>'
      : isEquipped
        ? `<button data-action="unequip-upgrade" data-upgrade-id="${selected.upgradeId}">Remove</button>`
        : `<button data-action="equip-upgrade" data-upgrade-id="${selected.upgradeId}" ${equipCheck.ok ? '' : 'disabled'}>${equipCheck.ok ? 'Equip' : equipCheck.reason}</button>`;
    this.overlay.innerHTML = `<section class="panel area-screen upgrade-panel">
      <h2>Upgrades</h2>
      <div class="wallet-strip"><span>Stars <b>${formatNumber(this.game.score.progress.availableStars ?? 0, 0)}</b></span><span>Equipped <b>${equipped.length}/4</b></span><span>Owned <b>${this.game.upgrades.completionPercent()}%</b></span></div>
      <div class="upgrade-layout">
        <div class="rocket-preview" data-rocket-preview aria-label="Interactive rocket upgrade preview"></div>
        <div class="upgrade-list">${rows}</div>
        <div class="upgrade-detail">
          <h3>${selected.displayName}</h3>
          <p>${selected.category} module level ${level}/${selected.maximumLevel}. ${isEquipped ? 'Active in current loadout.' : 'Stored until equipped.'}</p>
          ${effects}
          <div class="cost-line">Cost: <b>${nextCost ?? 'MAX'}</b> stars</div>
          <button data-action="upgrade" data-upgrade-id="${selected.upgradeId}" ${check.ok ? '' : 'disabled'}>${check.ok ? 'Upgrade' : check.reason}</button>
          ${equipButton}
        </div>
      </div>
      <div class="control-actions"><button data-action="buy-stars">Buy Stars</button><button data-action="reset-upgrades">Reset Upgrades</button><button data-action="back">Back</button></div>
    </section>`;
    this.#mountRocketPreview(selected.upgradeId);
  }

  #boosts() {
    const equipped = this.game.boosts.equipped();
    const slots = BOOST_DEFINITIONS.map((boost, index) => {
      const isEquipped = equipped.includes(boost.boostId);
      const quantity = this.game.boosts.quantity(boost.boostId);
      const code = `${String.fromCharCode(65 + Math.floor(index / 3))}${(index % 3) + 1}`;
      return `<div class="vending-slot ${isEquipped ? 'loaded' : ''}" data-boost-id="${boost.boostId}">
        <div class="vending-code">${code}</div>
        <div class="vending-can" aria-hidden="true"><span>${boost.displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2)}</span></div>
        <div class="vending-info">
          <strong>${boost.displayName}</strong>
          <span>${this.#effectText(boost.effects) || boost.activationType}</span>
          <small>One use | Stock ${quantity}</small>
        </div>
        <div class="vending-actions">
          <b>${this.#money(boost.chipPrice)}</b>
          <button data-action="buy-boost" data-boost-id="${boost.boostId}">Buy</button>
          <button data-action="${isEquipped ? 'unequip-boost' : 'equip-boost'}" data-boost-id="${boost.boostId}" ${!isEquipped && quantity <= 0 ? 'disabled' : ''}>${isEquipped ? 'Eject' : 'Load'}</button>
        </div>
      </div>`;
    }).join('');
    this.overlay.innerHTML = `<section class="panel area-screen vending-panel">
      <div class="vending-head">
        <div>
          <span>BIG SLICK BOOST-O-MATIC</span>
          <h2>Boost Vending</h2>
        </div>
        <div class="vending-wallet">
          <span>Balance</span>
          <b>${this.#money(this.game.profile.profile.chips ?? 0)}</b>
        </div>
      </div>
      <div class="vending-status"><span>Loaded <b>${equipped.length}/3</b></span><span>Every boost is consumed once when used.</span></div>
      <div class="vending-machine">${slots}</div>
      <div class="control-actions"><button data-action="play">Launch</button><button data-action="back">Back</button></div>
    </section>`;
  }

  #boostShop() {
    this.#boosts();
  }

  #buyStars() {
    this.#disposeRocketPreview();
    const rows = BONUS_STAR_PACKAGES.map((pack) => `<div class="boost-row">
      <div><strong>${pack.stars} stars</strong><span>${pack.chipPrice} BSG chips</span></div>
      <button data-action="buy-star-pack" data-package-id="${pack.packageId}">Buy</button>
    </div>`).join('');
    this.overlay.innerHTML = `<section class="panel area-screen upgrade-panel">
      <h2>Buy Stars</h2>
      <p>Bonus stars spend like earned stars. Chip balance is validated by the BSG wallet server.</p>
      <div class="wallet-strip"><span>Stars <b>${formatNumber(this.game.score.progress.availableStars ?? 0, 0)}</b></span><span>Chips <b>${formatNumber(this.game.profile.profile.chips ?? 0, 0)}</b></span></div>
      <div class="boost-list">${rows}</div>
      <div class="control-actions"><button data-action="upgrades">Upgrades</button><button data-action="back">Back</button></div>
    </section>`;
  }

  #store() {
    this.#disposeRocketPreview();
    this.overlay.innerHTML = `
      <section class="panel area-screen store-panel">
        <h2>Full Version</h2>
        <p>Finish the demo to unlock the full Launch 3001 route from your BSG profile.</p>
        <button data-action="shop" data-shop-url="${SHOP_URL}">Go To BSG Shop</button>
        <button data-action="external-login">Open BSG Login</button>
        <button data-action="lobby">Back To Lobby</button>
      </section>`;
  }

  #profile() {
    this.#disposeRocketPreview();
    if (!this.game.profile.isLoggedIn()) {
      this.overlay.innerHTML = `
        <section class="panel area-screen profile-panel">
          <h2>BSG Profile</h2>
          <p>No BSG profile is connected for this session. You can keep playing, or sign in through the BSG login page for wallet and profile sync.</p>
          <button data-action="external-login">Open BSG Login</button>
          <button data-action="lobby">Back To Lobby</button>
        </section>`;
      return;
    }
    const profile = this.game.profile.profile;
    this.overlay.innerHTML = `
      <section class="panel area-screen profile-panel">
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

  #endActions(payload = {}) {
    this.#disposeRocketPreview();
    const state = this.game.state.current;
    const title = state === STATES.LEVEL_COMPLETE
      ? 'Level Complete'
      : state === STATES.GAME_COMPLETE
        ? 'Mission Complete'
        : state === STATES.CRASHED
          ? 'Crashed'
          : 'Landed';
    if (state === STATES.LEVEL_COMPLETE || state === STATES.GAME_COMPLETE) {
      this.overlay.innerHTML = AnimationDirector.levelResults({
        title,
        level: payload.level ?? this.game.currentLevel,
        grade: payload.grade,
        points: payload.points,
        elapsed: payload.elapsed,
        stars: payload.stars,
        nextLevel: payload.nextLevel
      });
      return;
    }
    const summary = state === STATES.LEVEL_COMPLETE || state === STATES.GAME_COMPLETE
      ? `<p>${payload.level?.name ?? this.game.currentLevel.name} | ${payload.grade} | +${payload.points ?? 0} | ${payload.elapsed ?? 0}s</p>
        <p>${this.#starsText(payload.stars)}</p>`
      : '';
    this.overlay.innerHTML = `
      <section class="panel demo-panel">
        <h2>${title}</h2>
        ${summary}
        ${payload.nextLevel ? `<button data-action="next-level" data-level-id="${payload.nextLevel.id}">Next Level</button>` : ''}
        <button data-action="restart">Restart</button>
        <button data-action="level-select">Levels</button>
        <button data-action="menu">Lobby</button>
      </section>`;
  }

  showMobileControlPrompt() {
    this.#disposeRocketPreview();
    this.root.dataset.state = STATES.LOBBY;
    this.overlay.innerHTML = `
      <section class="panel menu-panel mobile-tutorial-panel">
        <h2>Mobile Controls</h2>
        <div class="phone-demo" aria-hidden="true">
          <div class="phone-shape"><div class="phone-screen"></div></div>
          <div class="comfort-lines"><span></span><span></span><span></span></div>
        </div>
        <p>Choose how you want to steer on mobile.</p>
        <div class="mobile-control-actions">
          <button data-action="mobile-joystick">Joystick</button>
          <button data-action="mobile-tilt">Tilt</button>
        </div>
      </section>`;
  }

  showMobileCalibratePrompt() {
    this.#disposeRocketPreview();
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
    this.#disposeRocketPreview();
    this.root.dataset.state = STATES.LOBBY;
    this.overlay.innerHTML = `
      <section class="panel menu-panel mobile-tutorial-panel">
        <h2>Tilt Ready</h2>
        <p>Tilt steering is enabled and calibrated.</p>
        <button data-action="mobile-ok">OK</button>
      </section>`;
  }

  showVrPrompt() {
    this.#disposeRocketPreview();
    this.root.dataset.state = STATES.LOBBY;
    this.overlay.innerHTML = `
      <section class="panel menu-panel vr-ready-panel">
        <h2>VR Mode</h2>
        <p>Use the VR button in the top right to enter immersive mode. Cockpit camera is selected for this session.</p>
        <button data-action="lobby">Continue</button>
      </section>`;
  }

  showMissionHint() {
    this.#disposeRocketPreview();
    const level = this.game.currentLevel;
    const steps = (level.tutorialMessages ?? ['Reach the landing pad to complete the level.'])
      .map((message) => `<span>${message}</span>`)
      .join('');
    this.overlay.innerHTML = `
      <section class="toast mission-hint">
        <strong>LEVEL ${level.id}: ${level.name}</strong>
        ${steps}
      </section>`;
  }

  showMobileJoystickReadyPrompt() {
    this.#disposeRocketPreview();
    this.root.dataset.state = STATES.LOBBY;
    this.overlay.innerHTML = `
      <section class="panel menu-panel mobile-tutorial-panel">
        <h2>Joystick Ready</h2>
        <div class="joystick-demo" aria-hidden="true"><span></span></div>
        <p>Use the left joystick to steer. Hold Boost to thrust.</p>
        <button data-action="mobile-ok">OK</button>
      </section>`;
  }

  #levelSelect() {
    this.#disposeRocketPreview();
    const levels = this.game.levels.levels.map((level) => {
      const locked = level.id > (this.game.score.progress.highestUnlockedLevel ?? 1);
      const score = this.game.score.progress.bestScores[level.id] ?? 0;
      const grade = this.game.score.progress.bestGrades[level.id] ?? (locked ? 'LOCKED' : 'READY');
      return `<button class="level-card" data-action="level" data-level-id="${level.id}" ${locked ? 'disabled' : ''}>
        ${this.#levelPreview(level)}
        <strong>${level.id}. ${level.name}</strong><span>${formatNumber(level.landingPad.distance, 0)}m | ${grade} | ${score}</span>
      </button>`;
    }).join('');
    this.overlay.innerHTML = `<section class="panel area-screen level-panel"><h2>Select Level</h2><div class="level-grid">${levels}</div><button data-action="back">Back</button></section>`;
  }

  #levelPreview(level) {
    const bounds = level.worldBounds;
    const toX = (x) => ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * 100;
    const toY = (z) => (1 - ((z - bounds.minZ) / (bounds.maxZ - bounds.minZ))) * 100;
    const point = (className, position) => `<i class="${className}" style="left:${toX(position.x).toFixed(1)}%;top:${toY(position.z).toFixed(1)}%"></i>`;
    const hazards = [...(level.obstacles ?? []), ...(level.walls ?? [])]
      .slice(0, 8)
      .map((spec) => point('level-preview__hazard', spec.position))
      .join('');
    const roofs = (level.roofs ?? [])
      .slice(0, 3)
      .map((spec) => point('level-preview__roof', spec.position))
      .join('');
    const pickups = (level.pickups ?? [])
      .slice(0, 9)
      .map((pickup) => point(pickup.type === 'refill' ? 'level-preview__refill' : 'level-preview__fuel', pickup.position))
      .join('');
    const start = level.launchPad.position;
    const end = level.landingPad.position;
    const dx = toX(end.x) - toX(start.x);
    const dy = toY(end.z) - toY(start.z);
    const routeLength = Math.hypot(dx, dy).toFixed(1);
    const routeAngle = Math.atan2(dy, dx).toFixed(3);
    return `<span class="level-preview" style="--start-x:${toX(start.x).toFixed(1)}%;--start-y:${toY(start.z).toFixed(1)}%;--end-x:${toX(end.x).toFixed(1)}%;--end-y:${toY(end.z).toFixed(1)}%;--route:${routeLength}%;--route-angle:${routeAngle}rad">
      <i class="level-preview__route"></i>
      ${roofs}${hazards}${pickups}
      ${point('level-preview__start', start)}
      ${point('level-preview__end', end)}
      <i class="level-preview__ship"></i>
    </span>`;
  }

  #pause() {
    this.#disposeRocketPreview();
    this.overlay.innerHTML = `<section class="panel control-panel">
      <h2>Menu</h2>
      <div class="control-actions">
        <button data-action="menu">Lobby</button>
        <button data-action="reset-run">Reset</button>
      </div>
    </section>`;
  }

  #leaderboard() {
    this.#disposeRocketPreview();
    const board = this.game.score.progress.leaderboard ?? {};
    const rows = (board.runs ?? []).slice(0, 10).map((run, index) => `
      <div class="leader-row">
        <span>${this.#trophyFor(index + 1)} #${index + 1}</span>
        <b>${formatNumber(run.distance, 0)}m</b>
        <span>${formatNumber(run.time, 1)}s</span>
      </div>
    `).join('');
    this.overlay.innerHTML = `<section class="panel area-screen level-panel">
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
    await this.#travelToLobbyArea(target);
    if (action === 'play') {
      this.game.enterGame();
    }
    if (action === 'lobby') this.game.showLobby();
    if (action === 'store') this.#store();
    if (action === 'profile') this.#profile();
    if (action === 'upgrades') this.#upgrades();
    if (action === 'boosts') this.#boosts();
    if (action === 'boost-shop') this.#boostShop();
    if (action === 'buy-stars') this.#buyStars();
    if (action === 'login') this.game.hub.requestLogin();
    if (action === 'external-login') this.game.hub.requestLogin();
    if (action === 'device-mobile') this.game.selectDeviceMode('mobile');
    if (action === 'device-pc') this.game.selectDeviceMode('pc');
    if (action === 'device-vr') this.game.selectDeviceMode('vr');
    if (action === 'level-select') {
      this.game.state.transition(STATES.LEVEL_SELECT);
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
    if (action === 'mobile-joystick') this.game.enableJoystickFromPrompt();
    if (action === 'mobile-calibrate') this.game.calibrateTiltFromPrompt();
    if (action === 'mobile-ok') this.game.completeMobileTutorial();
    if (action === 'mobile-skip') this.game.skipMobileTutorial();
    if (action === 'back') this.game.showLobby();
    if (action === 'select-upgrade') this.#upgrades(target.closest('[data-upgrade-id]').dataset.upgradeId);
    if (action === 'upgrade') {
      const upgradeId = target.closest('[data-upgrade-id]').dataset.upgradeId;
      const check = this.game.upgrades.canUpgrade(upgradeId);
      if (check.ok && window.confirm(`Spend ${check.cost} stars on ${check.definition.displayName} level ${check.nextLevel}?`)) {
        const result = this.game.purchaseUpgrade(upgradeId);
        this.#notice(result.ok ? 'Upgrade installed' : result.reason);
        this.#upgrades(upgradeId);
      }
    }
    if (action === 'reset-upgrades') {
      const spent = this.game.score.progress.starsSpent ?? 0;
      const refund = Math.floor(spent * 0.8);
      if (window.confirm(`Reset upgrades and return ${refund} of ${spent} spent stars?`)) {
        this.game.resetUpgrades();
        this.#upgrades();
      }
    }
    if (action === 'equip-boost') {
      const result = this.game.equipBoost(target.closest('[data-boost-id]').dataset.boostId);
      if (!result.ok) this.#notice(result.reason);
      this.#boosts();
    }
    if (action === 'unequip-boost') {
      this.game.unequipBoost(target.closest('[data-boost-id]').dataset.boostId);
      this.#boosts();
    }
    if (action === 'buy-boost') {
      const boostId = target.closest('[data-boost-id]').dataset.boostId;
      const boost = BOOST_DEFINITIONS.find((entry) => entry.boostId === boostId);
      if (boost && window.confirm(`Buy one ${boost.displayName} for ${this.#money(boost.chipPrice)}?`)) {
        const result = await this.game.buyBoost(boostId);
        this.#notice(result.ok ? 'Boost dispensed' : result.reason);
        this.#boosts();
      }
    }
    if (action === 'buy-star-pack') {
      const packageId = target.closest('[data-package-id]').dataset.packageId;
      const pack = BONUS_STAR_PACKAGES.find((entry) => entry.packageId === packageId);
      if (pack && window.confirm(`Buy ${pack.stars} stars for ${pack.chipPrice} BSG chips?`)) {
        const result = await this.game.buyStars(packageId);
        this.#notice(result.ok ? `${pack.stars} stars added` : result.reason);
        this.#buyStars();
      }
    }
    if (action === 'level') {
      this.game.startLevel(Number(target.closest('[data-level-id]').dataset.levelId));
    }
    if (action === 'equip-upgrade') {
      const result = this.game.equipUpgrade(target.closest('[data-upgrade-id]').dataset.upgradeId);
      if (!result.ok) this.#notice(result.reason);
      this.#upgrades(target.closest('[data-upgrade-id]').dataset.upgradeId);
    }
    if (action === 'unequip-upgrade') {
      this.game.unequipUpgrade(target.closest('[data-upgrade-id]').dataset.upgradeId);
      this.#upgrades(target.closest('[data-upgrade-id]').dataset.upgradeId);
    }
    if (action === 'next-level') {
      this.game.startLevel(Number(target.closest('[data-level-id]').dataset.levelId));
    }
  }

  async #travelToLobbyArea(target) {
    const hotspot = target.closest?.('.lobby-hotspot');
    if (!hotspot || !this.game.state.is(STATES.LOBBY) || this.lobbyTraveling) return;
    const lobby = hotspot.closest('.lobby-command');
    if (!lobby) return;
    const lobbyBounds = lobby.getBoundingClientRect();
    const hotspotBounds = hotspot.getBoundingClientRect();
    const x = ((hotspotBounds.left + hotspotBounds.width / 2 - lobbyBounds.left) / lobbyBounds.width) * 100;
    const y = ((hotspotBounds.top + hotspotBounds.height / 2 - lobbyBounds.top) / lobbyBounds.height) * 100;
    lobby.style.setProperty('--travel-x', `${x}%`);
    lobby.style.setProperty('--travel-y', `${y}%`);
    this.lobbyTraveling = true;
    lobby.classList.remove('is-travelling');
    void lobby.offsetWidth;
    lobby.classList.add('is-travelling');
    await new Promise((resolve) => window.setTimeout(resolve, 620));
    this.lobbyTraveling = false;
  }

  #notice(text) {
    if (!text) return;
    window.clearTimeout(this.noticeTimer);
    const notice = document.createElement('div');
    notice.className = 'notice-toast';
    notice.textContent = text;
    this.root.appendChild(notice);
    this.noticeTimer = window.setTimeout(() => notice.remove(), 2200);
  }

  #mountRocketPreview(focusId) {
    this.#disposeRocketPreview();
    const container = this.root.querySelector('[data-rocket-preview]');
    if (!container) return;
    const loadout = this.game.upgrades.equippedDefinitions().map((definition) => ({
      upgradeId: definition.upgradeId,
      level: this.game.upgrades.levelFor(definition.upgradeId)
    }));
    this.rocketPreview = new RocketPreview(container, focusId, loadout);
  }

  #disposeRocketPreview() {
    this.rocketPreview?.dispose();
    this.rocketPreview = null;
  }

  #label(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/Percent|Flat/g, '').trim();
  }

  #effectText(effects = {}) {
    return Object.entries(effects).slice(0, 2).map(([key, value]) => `${this.#label(key)} ${value > 0 ? '+' : ''}${value}`).join(', ');
  }

  #money(cents = 0) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
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
      <div class="rotate-phone" aria-hidden="true">
        <div class="rotate-phone__device"></div>
        <strong>Rotate Phone</strong>
        <span>Launch 3001 plays in landscape on mobile.</span>
      </div>
      <div class="mobile-joystick" data-mobile-joystick aria-label="Steering joystick"><span></span></div>
      <button class="mobile-thrust" data-boost aria-label="Thrust">Thrust</button>
      <div class="top-stats">
        <span>SCORE <b data-value="score">0</b></span>
        <span>BEST <b data-value="best">0</b></span>
        <span>BEST DIST <b data-value="best-distance">0</b>m/<b data-value="best-distance-time">0.0</b>s</span>
        <span>DIST <b data-value="distance">0</b>m</span>
        <span>TARGET <b data-value="marker">0</b>m</span>
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
          <span data-stat="level">LEVEL <b data-value="level">1</b></span><span data-stat="score">SCORE <b data-value="score">0</b></span><span data-stat="best">BEST <b data-value="best">0</b></span>
          <span data-stat="distance">DIST <b data-value="distance">0</b>m</span><span data-stat="marker">TARGET <b data-value="marker">0</b>m</span><span data-stat="fuel">FUEL <b data-value="fuel">100</b>%</span>
          <span data-stat="altitude">ALT <b data-value="altitude">0</b></span><span data-stat="vertical">V/S <b data-value="vertical">0</b></span><span data-stat="horizontal">H/S <b data-value="horizontal">0</b></span>
          <span data-stat="angle">ANGLE <b data-value="angle">0deg</b></span><span data-stat="wind">WIND <b data-value="wind">0</b></span><span data-stat="tolerance">TOL <b data-value="tolerance">0deg</b></span>
          <span data-stat="time">TIME <b data-value="time">0.0</b>s</span><span data-stat="thrust">THRUST <b data-value="thrust">OFF</b></span><span data-stat="camera">CAM <b data-value="camera">CHASE</b></span>
        </div>
        <div class="warning" data-warning></div>
      </div>`;
  }
}
