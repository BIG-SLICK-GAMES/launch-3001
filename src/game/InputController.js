import { clamp, lerp } from './utils.js';

export class InputController {
  constructor(target, settings) {
    this.target = target;
    this.settings = settings;
    this.thrust = false;
    this.keyboard = new Set();
    this.keyboardSteering = { x: 0, z: 0 };
    this.joystickSteering = { x: 0, z: 0 };
    this.rawTilt = { x: 0, z: 0 };
    this.smoothed = { x: 0, z: 0 };
    this.calibration = { beta: 0, gamma: 0 };
    this.permissionState = 'idle';
    this.error = '';
    this.hasMotion = false;
    this.#bind();
  }

  getSteering() {
    let x = this.keyboardSteering.x + this.smoothed.x + this.joystickSteering.x;
    let z = this.keyboardSteering.z + this.smoothed.z + this.joystickSteering.z;
    return { x: clamp(x, -1, 1), z: clamp(z, -1, 1) };
  }

  setJoystickSteering(x, z) {
    this.joystickSteering.x = clamp(x, -1, 1);
    this.joystickSteering.z = clamp(z, -1, 1);
  }

  clearJoystickSteering() {
    this.joystickSteering.x = 0;
    this.joystickSteering.z = 0;
  }

  async enableTilt() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') {
          this.permissionState = 'denied';
          this.error = 'Tilt permission denied';
          return false;
        }
      }
      this.permissionState = 'granted';
      window.addEventListener('deviceorientation', this.onOrientation, { passive: true });
      return true;
    } catch (error) {
      this.permissionState = 'denied';
      this.error = error?.message ?? 'Tilt unavailable';
      return false;
    }
  }

  calibrate() {
    this.calibration.beta = this.lastBeta ?? 0;
    this.calibration.gamma = this.lastGamma ?? 0;
  }

  update() {
    const smoothing = clamp(this.settings.tiltSmoothing, 0.02, 0.9);
    this.smoothed.x = lerp(this.smoothed.x, this.rawTilt.x, smoothing);
    this.smoothed.z = lerp(this.smoothed.z, this.rawTilt.z, smoothing);
    const target = this.#keyboardTarget();
    this.keyboardSteering.x = lerp(this.keyboardSteering.x, target.x, 0.32);
    this.keyboardSteering.z = lerp(this.keyboardSteering.z, target.z, 0.32);
  }

  consumeAction(key) {
    if (this.actions?.has(key)) {
      this.actions.delete(key);
      return true;
    }
    return false;
  }

  destroy() {
    window.removeEventListener('deviceorientation', this.onOrientation);
  }

  #bind() {
    this.actions = new Set();
    const press = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.pointerType === 'touch') return;
      event.preventDefault();
      this.thrust = true;
    };
    const release = (event) => {
      if (event.pointerType === 'touch') return;
      event.preventDefault();
      this.thrust = false;
    };
    this.target.addEventListener('pointerdown', press, { passive: false });
    this.target.addEventListener('pointerup', release, { passive: false });
    this.target.addEventListener('pointercancel', release, { passive: false });
    this.target.addEventListener('pointerleave', release, { passive: false });
    this.target.addEventListener('contextmenu', (event) => event.preventDefault());

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      this.keyboard.add(key);
      if (this.#isThrustKey(key)) this.thrust = true;
      if (['r', 'c', 'escape'].includes(key)) this.actions.add(key);
      if ([' ', 'shift', 'enter', 'z', 'x', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) event.preventDefault();
    });
    window.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();
      this.keyboard.delete(key);
      if (this.#isThrustKey(key) && ![...this.keyboard].some((pressed) => this.#isThrustKey(pressed))) this.thrust = false;
    });

    this.onOrientation = (event) => {
      this.hasMotion = true;
      this.lastBeta = event.beta ?? 0;
      this.lastGamma = event.gamma ?? 0;
      const beta = this.lastBeta - this.calibration.beta;
      const gamma = this.lastGamma - this.calibration.gamma;
      const angle = (screen.orientation?.angle ?? window.orientation ?? 0);
      let x = gamma / 28;
      let z = beta / 34;
      if (angle === 90) {
        x = beta / 34;
        z = -gamma / 28;
      } else if (angle === -90 || angle === 270) {
        x = -beta / 34;
        z = gamma / 28;
      } else if (angle === 180) {
        x = -gamma / 28;
        z = -beta / 34;
      }
      if (this.settings.invertForward) z *= -1;
      const dz = this.settings.tiltDeadZone;
      x = Math.abs(x) < dz ? 0 : x;
      z = Math.abs(z) < dz ? 0 : z;
      this.rawTilt.x = clamp(x * this.settings.tiltSensitivity, -1, 1);
      this.rawTilt.z = clamp(z * this.settings.tiltSensitivity, -1, 1);
    };
  }

  #keyboardTarget() {
    let x = 0;
    let z = 0;
    if (this.keyboard.has('arrowleft') || this.keyboard.has('a') || this.keyboard.has('j')) x -= 1;
    if (this.keyboard.has('arrowright') || this.keyboard.has('d') || this.keyboard.has('l')) x += 1;
    if (this.keyboard.has('arrowup') || this.keyboard.has('w') || this.keyboard.has('i')) z -= 1;
    if (this.keyboard.has('arrowdown') || this.keyboard.has('s') || this.keyboard.has('k')) z += 1;
    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }
    return { x, z };
  }

  #isThrustKey(key) {
    return key === ' ' || key === 'shift' || key === 'enter' || key === 'z' || key === 'x';
  }
}
