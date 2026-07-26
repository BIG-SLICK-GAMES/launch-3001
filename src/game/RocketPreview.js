import * as THREE from 'three';
import { Rocket } from './Rocket.js';
import { disposeObject3D } from './utils.js';

const FOCUS_PRESETS = {
  fuel_capacity: { label: 'Fuel Tank', targetY: 0.26, scale: 1.72, yaw: -0.22, pitch: 0.1, marker: [0, 0.22, 0] },
  fuel_efficiency: { label: 'Efficiency Core', targetY: -0.42, scale: 1.75, yaw: 0.24, pitch: -0.08, marker: [0, -0.56, 0] },
  boost_power: { label: 'Boost Engine', targetY: -0.92, scale: 2.12, yaw: 0.18, pitch: -0.18, marker: [0, -1.1, 0] },
  boost_efficiency: { label: 'Boost Injector', targetY: -1.02, scale: 2.08, yaw: -0.2, pitch: -0.16, marker: [0, -1.16, 0] },
  steering: { label: 'Steering Fins', targetY: -0.56, scale: 1.98, yaw: 0.94, pitch: -0.08, marker: [0.45, -0.58, 0] },
  stability: { label: 'Stability Gyro', targetY: 0.48, scale: 1.66, yaw: -0.62, pitch: 0.08, marker: [0, 0.48, 0] },
  landing_gear: { label: 'Landing Gear', targetY: -1.12, scale: 2.2, yaw: 0.72, pitch: -0.2, marker: [0.42, -1.2, 0.32] },
  hull_strength: { label: 'Hull Plating', targetY: 0.54, scale: 1.85, yaw: -0.34, pitch: 0.08, marker: [0, 0.72, -0.36] },
  fuel_collector: { label: 'Fuel Collector', targetY: 0.05, scale: 1.66, yaw: 0.76, pitch: 0.06, marker: [0.62, 0.06, 0] },
  air_brake: { label: 'Air Brake Fins', targetY: -0.54, scale: 1.92, yaw: -0.95, pitch: -0.04, marker: [-0.44, -0.58, 0] },
  emergency_reserve: { label: 'Emergency Reserve', targetY: 0.05, scale: 1.9, yaw: 0.08, pitch: 0.1, marker: [0, -0.08, 0.42] },
  emergency_fuel: { label: 'Emergency Fuel', targetY: 0.04, scale: 1.9, yaw: 0.12, pitch: 0.1, marker: [0, -0.08, 0.42] },
  fuel_saver: { label: 'Fuel Saver', targetY: -0.44, scale: 1.78, yaw: 0.2, pitch: -0.08, marker: [0, -0.56, 0] },
  power_boost: { label: 'Power Boost', targetY: -0.96, scale: 2.12, yaw: 0.18, pitch: -0.18, marker: [0, -1.1, 0] },
  landing_assist: { label: 'Landing Assist', targetY: -1.1, scale: 2.1, yaw: 0.7, pitch: -0.2, marker: [0.42, -1.2, 0.32] },
  crash_shield: { label: 'Crash Shield', targetY: 0.46, scale: 1.74, yaw: -0.42, pitch: 0.08, marker: [0, 0.52, 0] },
  fuel_magnet: { label: 'Fuel Magnet', targetY: 0.05, scale: 1.66, yaw: 0.76, pitch: 0.06, marker: [0.62, 0.06, 0] },
  air_brake_booster: { label: 'Air Brake Booster', targetY: -0.54, scale: 1.92, yaw: -0.95, pitch: -0.04, marker: [-0.44, -0.58, 0] },
  star_protector: { label: 'Star Protector', targetY: 0.78, scale: 1.82, yaw: -0.18, pitch: 0.04, marker: [0, 1.02, -0.2] },
  repair_kit: { label: 'Repair Kit', targetY: 0.42, scale: 1.78, yaw: 0.32, pitch: 0.08, marker: [0, 0.54, 0.22] },
  checkpoint_insurance: { label: 'Insurance Beacon', targetY: 0.12, scale: 1.62, yaw: 0.42, pitch: 0.04, marker: [0, 0.12, -0.5] },
  default: { label: 'Rocket Overview', targetY: 0.02, scale: 1.36, yaw: -0.35, pitch: 0.08, marker: [0, 0.35, 0] }
};

export class RocketPreview {
  constructor(container, initialFocus = 'default') {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 24);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
    this.rocket = new Rocket();
    this.scene.add(this.rocket.group);
    this.target = { yaw: 0, pitch: 0, scale: 1.35, y: 0 };
    this.current = { yaw: 0, pitch: 0, scale: 1.35, y: 0 };
    this.drag = null;
    this.#buildScene();
    this.#bind();
    this.resize();
    this.focus(initialFocus);
    this.#animate();
  }

  focus(focusId = 'default') {
    const preset = FOCUS_PRESETS[focusId] ?? FOCUS_PRESETS.default;
    this.focusId = focusId;
    this.target = { yaw: preset.yaw, pitch: preset.pitch, scale: preset.scale, y: preset.targetY };
    this.marker.position.set(...preset.marker);
    this.marker.visible = true;
    this.label.textContent = preset.label;
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    disposeObject3D(this.scene);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.label?.remove();
  }

  #buildScene() {
    this.camera.position.set(0, 0.22, 6.2);
    this.scene.add(new THREE.HemisphereLight(0xcdf7ff, 0x081018, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 4, 4);
    this.scene.add(key);
    const rim = new THREE.PointLight(0x24dfff, 4, 8);
    rim.position.set(-2.2, 1.4, 2.6);
    this.scene.add(rim);
    this.marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.018, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0x33ff8a, transparent: true, opacity: 0.92 })
    );
    this.marker.rotation.x = Math.PI / 2;
    this.rocket.group.add(this.marker);
    this.label = document.createElement('div');
    this.label.className = 'rocket-preview__label';
    this.container.appendChild(this.label);
  }

  #bind() {
    this.onPointerDown = (event) => {
      this.drag = { x: event.clientX, y: event.clientY, yaw: this.target.yaw, pitch: this.target.pitch };
      this.renderer.domElement.setPointerCapture?.(event.pointerId);
    };
    this.onPointerMove = (event) => {
      if (!this.drag) return;
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      this.target.yaw = this.drag.yaw + dx * 0.012;
      this.target.pitch = Math.max(-0.65, Math.min(0.65, this.drag.pitch + dy * 0.008));
    };
    this.onPointerUp = () => {
      this.drag = null;
    };
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
  }

  #animate() {
    this.frame = requestAnimationFrame(() => this.#animate());
    const ease = 0.12;
    this.current.yaw += (this.target.yaw - this.current.yaw) * ease;
    this.current.pitch += (this.target.pitch - this.current.pitch) * ease;
    this.current.scale += (this.target.scale - this.current.scale) * ease;
    this.current.y += (this.target.y - this.current.y) * ease;
    this.rocket.group.rotation.set(this.current.pitch, this.current.yaw, 0);
    this.rocket.group.position.y = -this.current.y;
    this.rocket.group.scale.setScalar(this.current.scale);
    this.marker.rotation.z += 0.025;
    this.renderer.render(this.scene, this.camera);
  }
}
