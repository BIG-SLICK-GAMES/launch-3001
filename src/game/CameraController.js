import * as THREE from 'three';
import { CAMERA_MODES, CAMERA_MODE_SEQUENCE } from './constants.js';
import { smoothDamp } from './utils.js';

export class CameraController {
  constructor(camera, settings) {
    this.camera = camera;
    this.settings = settings;
    this.mode = settings.cameraMode ?? CAMERA_MODES.chase;
    this.position = new THREE.Vector3(0, 4, 8);
    this.lookAt = new THREE.Vector3();
    this.desired = new THREE.Vector3();
    this.desiredLook = new THREE.Vector3();
    this.shake = 0;
    this.roofCameraBlend = 0;
  }

  toggle() {
    const current = CAMERA_MODE_SEQUENCE.indexOf(this.mode);
    this.mode = CAMERA_MODE_SEQUENCE[(current + 1) % CAMERA_MODE_SEQUENCE.length];
    return this.mode;
  }

  setMode(mode) {
    if (!CAMERA_MODE_SEQUENCE.includes(mode)) return;
    this.mode = mode;
  }

  addShake(amount) {
    this.shake = Math.max(this.shake, amount);
  }

  update(rocket, dt, context = {}) {
    const speed = rocket.velocity.length();
    const distanceScale = this.settings.cameraDistance ?? 1;
    const heightScale = this.settings.cameraHeight ?? 1;
    const targetRoofBlend = context.roofedArea ? 1 : 0;
    this.roofCameraBlend = smoothDamp(this.roofCameraBlend, targetRoofBlend, 5, dt);
    const roofBlend = THREE.MathUtils.clamp(this.roofCameraBlend, 0, 1);
    if (this.mode === CAMERA_MODES.chase) {
      const height = THREE.MathUtils.lerp(1.25, 0.24, roofBlend) * heightScale;
      const distance = THREE.MathUtils.lerp(6.25 + speed * 0.08, 4.25 + speed * 0.05, roofBlend) * distanceScale;
      const lookY = THREE.MathUtils.lerp(0.26, 0.08, roofBlend);
      const lookAhead = THREE.MathUtils.lerp(5 + speed * 0.18, 7.8 + speed * 0.14, roofBlend);
      this.desired.set(rocket.position.x, rocket.position.y + height, rocket.position.z + distance);
      this.desiredLook.set(rocket.position.x, rocket.position.y + lookY, rocket.position.z - lookAhead);
    } else if (this.mode === CAMERA_MODES.far) {
      const height = THREE.MathUtils.lerp(5.2, 1.35, roofBlend) * heightScale;
      const distance = THREE.MathUtils.lerp(14 + speed * 0.16, 7.2 + speed * 0.08, roofBlend) * distanceScale;
      const lookY = THREE.MathUtils.lerp(0.9, 0.28, roofBlend);
      const lookAhead = THREE.MathUtils.lerp(7 + speed * 0.22, 9.2 + speed * 0.15, roofBlend);
      this.desired.set(rocket.position.x, rocket.position.y + height, rocket.position.z + distance);
      this.desiredLook.set(rocket.position.x, rocket.position.y + lookY, rocket.position.z - lookAhead);
    } else if (this.mode === CAMERA_MODES.side) {
      const side = this.settings.sideCameraSide ?? 1;
      const sideDistance = THREE.MathUtils.lerp(10.5, 6.6, roofBlend) * side * distanceScale;
      const height = THREE.MathUtils.lerp(3.6, 0.9, roofBlend) * heightScale;
      const rearOffset = THREE.MathUtils.lerp(3.8, 2.0, roofBlend);
      const lookY = THREE.MathUtils.lerp(0.7, 0.24, roofBlend);
      this.desired.set(rocket.position.x + sideDistance, rocket.position.y + height, rocket.position.z + rearOffset);
      this.desiredLook.set(rocket.position.x, rocket.position.y + lookY, rocket.position.z - 4.8 - speed * 0.12);
    } else if (this.mode === CAMERA_MODES.cockpit) {
      this.desired.set(rocket.position.x, rocket.position.y + 0.8, rocket.position.z + 0.9);
      this.desiredLook.set(rocket.position.x, rocket.position.y + 0.4, rocket.position.z - 8);
    }
    this.position.x = smoothDamp(this.position.x, this.desired.x, 5.5, dt);
    this.position.y = smoothDamp(this.position.y, this.desired.y, 5.5, dt);
    this.position.z = smoothDamp(this.position.z, this.desired.z, 5.5, dt);
    this.lookAt.x = smoothDamp(this.lookAt.x, this.desiredLook.x, 7, dt);
    this.lookAt.y = smoothDamp(this.lookAt.y, this.desiredLook.y, 7, dt);
    this.lookAt.z = smoothDamp(this.lookAt.z, this.desiredLook.z, 7, dt);
    this.shake = Math.max(0, this.shake - dt * 2.2);
    const jitter = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    this.camera.position.copy(this.position);
    this.camera.position.x += jitter;
    this.camera.position.y += jitter * 0.5;
    const targetFov = this.mode === CAMERA_MODES.far ? 64 : this.mode === CAMERA_MODES.side ? 60 : 58;
    this.camera.fov = smoothDamp(this.camera.fov, targetFov + Math.min(speed * 1.1, 8) + roofBlend * 3, 4, dt);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.lookAt);
  }
}
