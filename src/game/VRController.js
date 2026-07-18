import * as THREE from 'three';
import { CAMERA_MODES, VR_CAMERA_MODES, VR_CAMERA_MODE_SEQUENCE } from './constants.js';
import { clamp } from './utils.js';

export class VRController {
  constructor(renderer, scene, camera) {
    this.renderer = renderer.renderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = false;
    this.sessionStarted = false;
    this.thrust = false;
    this.steering = { x: 0, z: 0 };
    this.status = 'VR READY';
    this.settingsOpen = false;
    this.selectedSetting = 0;
    this.menuConfirm = false;
    this.menuButtonDown = false;
    this.stickCooldown = 0;
    this.rig = new THREE.Group();
    this.rig.name = 'VR cockpit rig';
    this.rig.add(camera);
    scene.add(this.rig);
    this.rightController = null;
    this.rightNeutral = new THREE.Quaternion();
    this.rightRelative = new THREE.Quaternion();
    this.rightEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.cameraWorldPosition = new THREE.Vector3();
    this.cameraWorldQuaternion = new THREE.Quaternion();
    this.panelOffset = new THREE.Vector3(0, -0.22, -1.85);
    this.hudOffset = new THREE.Vector3(0, -0.72, -1.74);
    this.topStatsOffset = new THREE.Vector3(0, 0.62, -1.7);
    this.cockpitOffset = new THREE.Vector3(0, 0.82, 1.05);
    this.rigRotation = 0;
    this.controllers = [0, 1].map((index) => this.#setupController(index));
    this.panel = this.#createPanel();
    this.topStatsPanel = this.#createSurface(768, 88, 1.95, 0.22);
    scene.add(this.panel.group);
    scene.add(this.topStatsPanel.group);

    this.renderer.xr.addEventListener('sessionstart', () => {
      this.enabled = true;
      this.sessionStarted = true;
      this.status = 'VR ACTIVE';
      this.panel.group.visible = true;
      this.topStatsPanel.group.visible = true;
      this.#calibrateRightStick();
    });
    this.renderer.xr.addEventListener('sessionend', () => {
      this.enabled = false;
      this.thrust = false;
      this.steering.x = 0;
      this.steering.z = 0;
      this.status = 'VR READY';
      this.panel.group.visible = false;
      this.topStatsPanel.group.visible = false;
      this.rig.position.set(0, 0, 0);
      this.rig.rotation.set(0, 0, 0);
    });
  }

  update(game, dt) {
    if (!this.enabled) return;
    this.stickCooldown = Math.max(0, this.stickCooldown - dt);
    this.#updateRig(game);
    this.#updateGamepadSteering();
    this.#updateMenuButton(game);
    this.#updateSettingsInput(game);
    this.#updatePanel(game, dt);
    if (game.cameraController.mode !== CAMERA_MODES.cockpit) {
      game.cameraController.setMode(CAMERA_MODES.cockpit);
    }
  }

  getInput() {
    return {
      thrust: this.enabled && !this.settingsOpen && this.thrust,
      steering: this.enabled && !this.settingsOpen ? this.steering : { x: 0, z: 0 }
    };
  }

  consumeSessionStart() {
    if (!this.sessionStarted) return false;
    this.sessionStarted = false;
    return true;
  }

  #setupController(index) {
    const controller = this.renderer.xr.getController(index);
    if (index === 1) this.rightController = controller;
    controller.addEventListener('selectstart', () => {
      if (index !== 1) return;
      if (this.settingsOpen) {
        this.menuConfirm = true;
        return;
      }
      this.thrust = true;
    });
    controller.addEventListener('selectend', () => {
      if (index === 1) this.thrust = false;
    });
    this.scene.add(controller);
    return controller;
  }

  #updateMenuButton() {
    let pressed = false;
    for (const source of this.renderer.xr.getSession()?.inputSources ?? []) {
      const buttons = source.gamepad?.buttons;
      if (!buttons) continue;
      pressed ||= Boolean(buttons[3]?.pressed || buttons[4]?.pressed || buttons[5]?.pressed);
    }
    if (pressed && !this.menuButtonDown) {
      this.settingsOpen = !this.settingsOpen;
      this.thrust = false;
      this.status = this.settingsOpen ? 'VR SETTINGS' : 'VR ACTIVE';
      this.panel.group.visible = true;
    }
    this.menuButtonDown = pressed;
  }

  #updateGamepadSteering() {
    let x = 0;
    let z = 0;
    if (this.rightController) {
      this.rightRelative.copy(this.rightNeutral).invert().multiply(this.rightController.quaternion);
      this.rightEuler.setFromQuaternion(this.rightRelative);
      x += clamp(-this.rightEuler.z / 0.55, -1, 1);
      z += clamp(this.rightEuler.x / 0.55, -1, 1);
    }
    for (const source of this.renderer.xr.getSession()?.inputSources ?? []) {
      if (source.handedness && source.handedness !== 'right') continue;
      const axes = source.gamepad?.axes;
      if (!axes || axes.length < 2) continue;
      const ax = axes.length >= 4 ? axes[2] : axes[0];
      const ay = axes.length >= 4 ? axes[3] : axes[1];
      x += Math.abs(ax) > 0.12 ? ax : 0;
      z += Math.abs(ay) > 0.12 ? ay : 0;
    }
    this.steering.x = clamp(x, -1, 1);
    this.steering.z = clamp(z, -1, 1);
  }

  #updateSettingsInput(game) {
    if (!this.settingsOpen) {
      this.menuConfirm = false;
      return;
    }
    const axes = this.#rightAxes();
    if (this.stickCooldown <= 0) {
      if (axes.y < -0.55) {
        this.selectedSetting = (this.selectedSetting + this.#settings(game).length - 1) % this.#settings(game).length;
        this.stickCooldown = 0.22;
      } else if (axes.y > 0.55) {
        this.selectedSetting = (this.selectedSetting + 1) % this.#settings(game).length;
        this.stickCooldown = 0.22;
      } else if (axes.x < -0.55) {
        this.#adjustSetting(game, -1);
        this.stickCooldown = 0.18;
      } else if (axes.x > 0.55) {
        this.#adjustSetting(game, 1);
        this.stickCooldown = 0.18;
      }
    }
    if (this.menuConfirm) {
      this.#confirmSetting(game);
      this.menuConfirm = false;
    }
  }

  #rightAxes() {
    for (const source of this.renderer.xr.getSession()?.inputSources ?? []) {
      if (source.handedness && source.handedness !== 'right') continue;
      const axes = source.gamepad?.axes;
      if (!axes || axes.length < 2) continue;
      return {
        x: axes.length >= 4 ? axes[2] : axes[0],
        y: axes.length >= 4 ? axes[3] : axes[1]
      };
    }
    return { x: 0, y: 0 };
  }

  #settings(game) {
    const s = game.settings;
    return [
      { key: 'vrCameraMode', label: 'VR CAMERA', value: s.vrCameraMode ?? VR_CAMERA_MODES.cockpit },
      { key: 'vrCameraDistance', label: 'DISTANCE', value: (s.vrCameraDistance ?? 2.3).toFixed(1), min: 0.8, max: 7, step: 0.2 },
      { key: 'vrCameraHeight', label: 'HEIGHT', value: (s.vrCameraHeight ?? 0.85).toFixed(2), min: 0.35, max: 3.2, step: 0.1 },
      { key: 'vrPanelDistance', label: 'PANEL DIST', value: (s.vrPanelDistance ?? 1.85).toFixed(1), min: 1.1, max: 3.4, step: 0.1 },
      { key: 'vrPanelHeight', label: 'PANEL HEIGHT', value: (s.vrPanelHeight ?? -0.22).toFixed(2), min: -0.9, max: 0.35, step: 0.05 },
      { key: 'vrComfortScale', label: 'COMFORT', value: (s.vrComfortScale ?? 1).toFixed(2), min: 0.65, max: 1.35, step: 0.05 },
      { key: 'vrSideCameraSide', label: 'SIDE', value: (s.vrSideCameraSide ?? 1) > 0 ? 'RIGHT' : 'LEFT' },
      { key: 'audio', label: 'ENABLE AUDIO', value: 'TRIGGER' },
      { key: 'resetRun', label: 'RESET RUN', value: 'TRIGGER' },
      { key: 'levelSelect', label: 'LOAD CHECKPOINT', value: 'TRIGGER' },
      { key: 'calibrate', label: 'CENTER STICK', value: 'TRIGGER' },
      { key: 'close', label: 'CLOSE MENU', value: 'PAD BUTTON' }
    ];
  }

  #adjustSetting(game, direction) {
    const item = this.#settings(game)[this.selectedSetting];
    const s = game.settings;
    if (item.key === 'vrCameraMode') {
      const index = VR_CAMERA_MODE_SEQUENCE.indexOf(s.vrCameraMode ?? VR_CAMERA_MODES.cockpit);
      s.vrCameraMode = VR_CAMERA_MODE_SEQUENCE[(index + direction + VR_CAMERA_MODE_SEQUENCE.length) % VR_CAMERA_MODE_SEQUENCE.length];
    } else if (item.key === 'vrSideCameraSide') {
      s.vrSideCameraSide = (s.vrSideCameraSide ?? 1) * -1;
    } else if (item.min !== undefined) {
      s[item.key] = clamp((s[item.key] ?? Number(item.value)) + item.step * direction, item.min, item.max);
    }
    game.save.saveSettings(s);
  }

  #confirmSetting(game) {
    const item = this.#settings(game)[this.selectedSetting];
    if (item.key === 'calibrate') {
      this.#calibrateRightStick();
      this.status = 'RIGHT STICK RECENTERED';
    } else if (item.key === 'resetRun') {
      this.settingsOpen = false;
      this.panel.group.visible = true;
      game.resetRun();
    } else if (item.key === 'audio') {
      game.enableAudio();
      this.status = 'AUDIO ONLINE';
    } else if (item.key === 'levelSelect') {
      this.settingsOpen = false;
      this.panel.group.visible = true;
      game.pause();
      game.state.transition('LEVEL_SELECT');
    } else if (item.key === 'close') {
      this.settingsOpen = false;
      this.panel.group.visible = true;
      this.status = 'VR ACTIVE';
    } else {
      this.#adjustSetting(game, 1);
    }
  }

  #calibrateRightStick() {
    if (!this.rightController) return;
    this.rightNeutral.copy(this.rightController.quaternion);
  }

  #createPanel() {
    return this.#createSurface(768, 384, 2.05, 1.02);
  }

  #createSurface(width, height, planeWidth, planeHeight) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight), material);
    const group = new THREE.Group();
    group.visible = false;
    group.add(mesh);
    return { group, mesh, canvas, context, texture };
  }

  #updateRig(game) {
    const s = game.settings;
    const mode = s.vrCameraMode ?? VR_CAMERA_MODES.cockpit;
    const distance = s.vrCameraDistance ?? 2.3;
    const height = s.vrCameraHeight ?? 0.85;
    const comfort = s.vrComfortScale ?? 1;
    const side = s.vrSideCameraSide ?? 1;
    if (mode === VR_CAMERA_MODES.chase) {
      this.cockpitOffset.set(0, height + 1.1 * comfort, distance);
      this.rigRotation = 0;
    } else if (mode === VR_CAMERA_MODES.side) {
      this.cockpitOffset.set(side * distance, height + 0.45 * comfort, 0.8);
      this.rigRotation = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      this.cockpitOffset.set(0, height, 1.05 * comfort);
      this.rigRotation = 0;
    }
    this.panelOffset.set(0, s.vrPanelHeight ?? -0.22, -(s.vrPanelDistance ?? 1.85));
    this.rig.position.copy(game.rocket.position).add(this.cockpitOffset);
    this.rig.rotation.set(0, this.rigRotation, 0);
    this.camera.near = 0.03;
    this.camera.far = 140;
  }

  #updatePanel(game) {
    this.panel.group.visible = this.enabled;
    this.topStatsPanel.group.visible = this.enabled && !this.settingsOpen;
    if (!this.panel.group.visible) return;
    const { context, canvas, texture, group } = this.panel;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (this.settingsOpen) {
      context.fillStyle = 'rgba(3, 9, 16, 0.82)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#27d8ff';
      context.lineWidth = 4;
      context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
      this.#drawSettingsPanel(context, game);
    } else {
      this.#drawFlightHud(context, game);
    }
    texture.needsUpdate = true;

    this.#positionSurface(group, this.settingsOpen ? this.panelOffset : this.hudOffset);
    this.#updateTopStatsPanel(game);
  }

  #updateTopStatsPanel(game) {
    if (!this.topStatsPanel.group.visible) return;
    const { context, canvas, texture, group } = this.topStatsPanel;
    context.clearRect(0, 0, canvas.width, canvas.height);
    this.#drawTopStats(context, game);
    texture.needsUpdate = true;
    this.#positionSurface(group, this.topStatsOffset);
  }

  #positionSurface(group, offset) {
    this.camera.getWorldPosition(this.cameraWorldPosition);
    this.camera.getWorldQuaternion(this.cameraWorldQuaternion);
    group.position.copy(offset).applyQuaternion(this.cameraWorldQuaternion).add(this.cameraWorldPosition);
    group.quaternion.copy(this.cameraWorldQuaternion);
  }

  #drawFlightHud(context, game) {
    const fuel = Math.max(0, Math.min(1, game.rocket.fuel / 100));
    const altitude = Math.max(0, game.rocket.position.y - game.world.getTerrainHeight(game.rocket.position.x, game.rocket.position.z) - game.rocket.radius);
    const marker = (game.currentLevel.checkpoints ?? []).find((entry) => !game.passedMarkers.has(entry.id));
    const markerDistance = marker ? Math.max(0, marker.distance - game.rocket.distance) : 0;
    const markerTime = Math.max(0, game.rocket.flightTime - game.lastCheckpointTime);
    const altitudePercent = Math.max(0, Math.min(1, altitude / 24));
    const needleAngle = (-135 + altitudePercent * 270) * Math.PI / 180;

    context.textBaseline = 'alphabetic';

    this.#roundRect(context, 142, 222, 484, 142, 8);
    context.fillStyle = 'rgba(3, 10, 18, 0.58)';
    context.fill();
    context.strokeStyle = 'rgba(49, 213, 255, 0.28)';
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = 'rgba(4, 12, 22, 0.78)';
    this.#roundRect(context, 626, 272, 28, 48, 8);
    context.fill();
    context.strokeStyle = 'rgba(82, 220, 255, 0.34)';
    context.stroke();
    context.fillStyle = '#d8fbff';
    context.font = '900 24px system-ui';
    context.fillText('>', 635, 304);

    context.fillStyle = '#7fa6ba';
    context.font = '800 13px system-ui';
    context.fillText('FUEL', 160, 252);
    context.fillStyle = 'rgba(5, 15, 24, 0.86)';
    this.#roundRect(context, 212, 237, 322, 20, 4);
    context.fill();
    const gradient = context.createLinearGradient(212, 0, 534, 0);
    gradient.addColorStop(0, '#21ffd4');
    gradient.addColorStop(0.62, '#ffd166');
    gradient.addColorStop(1, '#ff5f4a');
    context.fillStyle = gradient;
    this.#roundRect(context, 212, 237, 322 * fuel, 20, 4);
    context.fill();
    context.strokeStyle = 'rgba(125, 238, 255, 0.38)';
    context.strokeRect(212, 237, 322, 20);
    context.fillStyle = '#f4fbff';
    context.font = '800 15px system-ui';
    context.fillText(`${game.rocket.fuel.toFixed(0)}%`, 548, 253);

    this.#drawHudButton(context, 160, 280, 64, 38, 'MENU', false);
    this.#drawHudButton(context, 236, 280, 58, 38, 'AUDIO', false);
    this.#drawAltitudeDial(context, 342, 298, 29, needleAngle, altitude);
    this.#drawBoostButton(context, 518, 299, 31, game.rocket.thrusting);

    context.font = '800 12px system-ui';
    context.fillStyle = '#7fa6ba';
    context.fillText(`V/S ${game.rocket.velocity.y.toFixed(1)}`, 160, 342);
    context.fillText(`H/S ${Math.hypot(game.rocket.velocity.x, game.rocket.velocity.z).toFixed(1)}`, 244, 342);
    context.fillText(`ANGLE ${(game.rocket.getTiltAngle() * 57.3).toFixed(0)}deg`, 335, 342);
    context.fillText(`TIME ${markerTime.toFixed(1)}s`, 448, 342);
  }

  #drawTopStats(context, game) {
    const marker = (game.currentLevel.checkpoints ?? []).find((entry) => !game.passedMarkers.has(entry.id));
    const markerDistance = marker ? Math.max(0, marker.distance - game.rocket.distance) : 0;
    const markerTime = Math.max(0, game.rocket.flightTime - game.lastCheckpointTime);
    const bestDistance = game.score.progress.leaderboard?.bestDistance ?? 0;
    const bestDistanceTime = game.score.progress.leaderboard?.bestDistanceTime ?? 0;

    this.#roundRect(context, 20, 14, 728, 52, 8);
    context.fillStyle = 'rgba(3, 10, 18, 0.62)';
    context.fill();
    context.strokeStyle = 'rgba(49, 213, 255, 0.22)';
    context.lineWidth = 2;
    context.stroke();
    context.font = '800 15px system-ui';
    context.fillStyle = '#7fa6ba';
    context.fillText(`SCORE ${game.score.progress.totalScore}`, 44, 47);
    context.fillText(`BEST ${game.score.progress.bestTotalScore}`, 150, 47);
    context.fillText(`BEST DIST ${bestDistance.toFixed(0)}m/${bestDistanceTime.toFixed(1)}s`, 258, 47);
    context.fillText(`DIST ${game.rocket.distance.toFixed(0)}m`, 456, 47);
    context.fillText(`MARKER ${markerDistance.toFixed(0)}m`, 574, 47);
    context.fillText(`TIME ${markerTime.toFixed(1)}s`, 682, 47);
  }

  #drawHudButton(context, x, y, width, height, label) {
    this.#roundRect(context, x, y, width, height, 8);
    context.fillStyle = 'rgba(4, 12, 22, 0.74)';
    context.fill();
    context.strokeStyle = 'rgba(82, 220, 255, 0.3)';
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = '#ecfbff';
    context.font = '800 11px system-ui';
    context.textAlign = 'center';
    context.fillText(label, x + width / 2, y + 24);
    context.textAlign = 'left';
  }

  #drawBoostButton(context, x, y, radius, active) {
    const glow = active ? 0.92 : 0.42;
    context.shadowColor = 'rgba(255, 45, 32, 0.9)';
    context.shadowBlur = active ? 30 : 16;
    const gradient = context.createRadialGradient(x - 8, y - 10, 4, x, y, radius);
    gradient.addColorStop(0, active ? '#ffe1d8' : '#ffb2a4');
    gradient.addColorStop(0.45, active ? '#ff4b36' : '#ff2d20');
    gradient.addColorStop(1, active ? '#b81410' : '#81110d');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = `rgba(255, 120, 100, ${glow})`;
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = '#fff7f4';
    context.font = '900 11px system-ui';
    context.textAlign = 'center';
    context.fillText('BOOST', x, y + 4);
    context.textAlign = 'left';
  }

  #drawAltitudeDial(context, x, y, radius, needleAngle, altitude) {
    const sweep = context.createConicGradient(Math.PI * 1.25, x, y);
    sweep.addColorStop(0, '#ff5f4a');
    sweep.addColorStop(0.18, '#ffd166');
    sweep.addColorStop(0.56, '#21ffd4');
    sweep.addColorStop(0.75, 'rgba(0, 0, 0, 0)');
    sweep.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = sweep;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(4, 12, 22, 0.92)';
    context.beginPath();
    context.arc(x, y, radius - 7, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(125, 238, 255, 0.42)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = '#f4fbff';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + Math.sin(needleAngle) * 22, y - Math.cos(needleAngle) * 22);
    context.stroke();
    context.fillStyle = '#21ffd4';
    context.beginPath();
    context.arc(x, y, 5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#f4fbff';
    context.font = '800 12px system-ui';
    context.textAlign = 'center';
    context.fillText(altitude.toFixed(1), x, y + 50);
    context.fillStyle = '#7fa6ba';
    context.font = '800 10px system-ui';
    context.fillText('ALT', x, y + 64);
    context.textAlign = 'left';
  }

  #roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  #drawSettingsPanel(context, game) {
    const rows = this.#settings(game);
    context.fillStyle = '#f2fbff';
    context.font = '700 29px system-ui';
    context.fillText('VR SETTINGS', 26, 44);
    context.font = '600 20px system-ui';
    context.fillStyle = '#8fdfff';
    context.fillText('Stick: choose/adjust   trigger: select   pad button: close', 26, 76);
    context.font = '600 22px system-ui';
    rows.forEach((row, index) => {
      const y = 108 + index * 16;
      if (index === this.selectedSetting) {
        context.fillStyle = 'rgba(39, 216, 255, 0.25)';
        context.fillRect(20, y - 20, 472, 22);
      }
      context.fillStyle = index === this.selectedSetting ? '#ffffff' : '#a8cbd8';
      context.fillText(`${row.label}`, 32, y);
      context.fillStyle = index === this.selectedSetting ? '#7fffd0' : '#d7f7ff';
      context.fillText(`${row.value}`, 300, y);
    });
  }
}
