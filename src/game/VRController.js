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
    this.cockpitOffset = new THREE.Vector3(0, 0.82, 1.05);
    this.rigRotation = 0;
    this.controllers = [0, 1].map((index) => this.#setupController(index));
    this.panel = this.#createPanel();
    scene.add(this.panel.group);

    this.renderer.xr.addEventListener('sessionstart', () => {
      this.enabled = true;
      this.sessionStarted = true;
      this.status = 'VR ACTIVE';
      this.panel.group.visible = false;
      this.#calibrateRightStick();
    });
    this.renderer.xr.addEventListener('sessionend', () => {
      this.enabled = false;
      this.thrust = false;
      this.steering.x = 0;
      this.steering.z = 0;
      this.status = 'VR READY';
      this.panel.group.visible = false;
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
      this.panel.group.visible = this.settingsOpen;
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
      this.panel.group.visible = false;
      game.resetRun();
    } else if (item.key === 'audio') {
      game.enableAudio();
      this.status = 'AUDIO ONLINE';
    } else if (item.key === 'levelSelect') {
      this.settingsOpen = false;
      this.panel.group.visible = false;
      game.pause();
      game.state.transition('LEVEL_SELECT');
    } else if (item.key === 'close') {
      this.settingsOpen = false;
      this.panel.group.visible = false;
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
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 0.82), material);
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
    this.panel.group.visible = this.enabled && this.settingsOpen;
    if (!this.panel.group.visible) return;
    const { context, canvas, texture, group } = this.panel;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(3, 9, 16, 0.82)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#27d8ff';
    context.lineWidth = 4;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    this.#drawSettingsPanel(context, game);
    texture.needsUpdate = true;

    this.camera.getWorldPosition(this.cameraWorldPosition);
    this.camera.getWorldQuaternion(this.cameraWorldQuaternion);
    group.position.copy(this.panelOffset).applyQuaternion(this.cameraWorldQuaternion).add(this.cameraWorldPosition);
    group.quaternion.copy(this.cameraWorldQuaternion);
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
