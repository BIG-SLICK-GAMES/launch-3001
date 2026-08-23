import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ROCKET_RADIUS } from './constants.js';
import { clamp, smoothDamp } from './utils.js';

const ROCKET_MODEL_URL = `${import.meta.env.BASE_URL}models/launch3001-rocket.glb`;
const VISUAL_Y_OFFSET = -0.58;

export class Rocket {
  constructor(options = {}) {
    this.modelUrl = options.modelUrl ?? ROCKET_MODEL_URL;
    this.showFallback = options.showFallback ?? true;
    this.detailSegments = options.detailSegments ?? null;
    this.group = new THREE.Group();
    this.modelRoot = new THREE.Group();
    this.upgradeVisuals = new THREE.Group();
    this.group.add(this.modelRoot);
    this.group.add(this.upgradeVisuals);
    this.velocity = new THREE.Vector3();
    this.position = this.group.position;
    this.radius = ROCKET_RADIUS;
    this.alive = true;
    this.landed = false;
    this.thrusting = false;
    this.thrustUse = 0;
    this.flightTime = 0;
    this.maxFuel = 100;
    this.fuel = 100;
    this.stats = {};
    this.distance = 0;
    this.visualTiltX = 0;
    this.visualTiltZ = 0;
    this.fallbackModel = null;
    this.#build();
  }

  reset(position) {
    this.position.set(position.x, position.y, position.z);
    this.velocity.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    this.alive = true;
    this.landed = false;
    this.thrusting = false;
    this.thrustUse = 0;
    this.flightTime = 0;
    this.fuel = this.maxFuel ?? 100;
    this.distance = 0;
    this.setFlame(false);
  }

  updateVisual(dt, steering, settings = {}) {
    const maxTilt = clamp(settings.rocketTiltMax ?? 0.62, 0.28, 1.2);
    this.visualTiltZ = smoothDamp(this.visualTiltZ, clamp(-steering.x * maxTilt, -maxTilt, maxTilt), 8, dt);
    this.visualTiltX = smoothDamp(this.visualTiltX, clamp(steering.z * maxTilt * 0.82, -maxTilt, maxTilt), 8, dt);
    this.group.rotation.z = this.visualTiltZ;
    this.group.rotation.x = this.visualTiltX;
    if (this.flame) {
      this.flame.scale.y = this.thrusting ? 0.8 + Math.random() * 0.35 : 0.001;
      this.flame.scale.x = this.thrusting ? 0.85 + Math.random() * 0.2 : 0.001;
      this.flame.scale.z = this.flame.scale.x;
      this.innerFlame.scale.y = this.thrusting ? 0.65 + Math.random() * 0.22 : 0.001;
      this.glow.intensity = this.thrusting ? 1.8 : 0;
      this.engineHalo.material.opacity = this.thrusting ? 0.32 + Math.random() * 0.16 : 0;
    }
  }

  setFlame(active) {
    this.thrusting = active;
    if (this.flame) this.flame.visible = active;
  }

  getTiltAngle() {
    return Math.sqrt(this.group.rotation.x ** 2 + this.group.rotation.z ** 2);
  }

  setUpgradeLoadout(upgrades = []) {
    this.upgradeVisuals.clear();
    for (const upgrade of upgrades) {
      const level = Math.max(1, Number(upgrade.level) || 1);
      this.#addUpgradeVisual(upgrade.upgradeId, level);
    }
  }

  previewUpgrade(upgradeId, level = 1) {
    this.#addUpgradeVisual(upgradeId, Math.max(1, Number(level) || 1));
  }

  focusPointFor(upgradeId) {
    const y = (value) => value + VISUAL_Y_OFFSET;
    const points = {
      fuel_capacity: [0.39, y(-0.56), 0],
      fuel_efficiency: [0, y(-0.12), 0],
      boost_power: [0, y(-1.04), 0],
      boost_efficiency: [0, y(-0.88), 0],
      steering: [0.48, y(-0.5), 0],
      stability: [0, y(0.36), 0],
      landing_gear: [0.46, y(-0.9), 0.46],
      hull_strength: [0, y(-0.12), -0.3],
      fuel_collector: [0.52, y(0.02), 0],
      air_brake: [0.5, y(-0.22), 0],
      emergency_reserve: [0, y(-0.62), 0.42],
      emergency_fuel: [0, y(-0.62), 0.42],
      fuel_saver: [0, y(-0.12), 0],
      power_boost: [0, y(-1.04), 0],
      landing_assist: [0.46, y(-0.9), 0.46],
      crash_shield: [0, y(0.2), 0],
      fuel_magnet: [0.52, y(0.02), 0],
      air_brake_booster: [0.5, y(-0.22), 0],
      star_protector: [0, y(0.72), -0.12],
      repair_kit: [0, y(0.22), 0.18],
      checkpoint_insurance: [0, y(0.08), -0.36]
    };
    return points[upgradeId] ?? [0, y(0.1), 0];
  }

  #build() {
    const detailSegments = this.detailSegments ?? (this.#isDesktopQuality() ? 36 : 18);
    this.#loadModel();

    this.flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.76, detailSegments),
      new THREE.MeshBasicMaterial({ color: 0xff9a2e, transparent: true, opacity: 0.82 })
    );
    this.flame.position.y = -1.14 + VISUAL_Y_OFFSET;
    this.flame.rotation.x = Math.PI;
    this.flame.visible = false;
    this.group.add(this.flame);

    this.innerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.085, 0.48, Math.max(12, Math.floor(detailSegments * 0.7))),
      new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
    );
    this.innerFlame.position.y = -0.02;
    this.innerFlame.rotation.x = Math.PI;
    this.flame.add(this.innerFlame);

    this.engineHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.42, 28),
      new THREE.MeshBasicMaterial({ color: 0xff7a22, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    );
    this.engineHalo.position.y = -0.94 + VISUAL_Y_OFFSET;
    this.engineHalo.rotation.x = Math.PI / 2;
    this.group.add(this.engineHalo);

    this.glow = new THREE.PointLight(0xff6a00, 0, 3.2);
    this.glow.position.y = -1.02 + VISUAL_Y_OFFSET;
    this.group.add(this.glow);
  }

  #loadModel() {
    if (this.showFallback) this.#showFallbackModel();
    const loader = new GLTFLoader();
    loader.load(
      this.modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.name = 'Launch3001 Blender rocket mesh';
        model.scale.setScalar(0.72);
        model.rotation.x = Math.PI / 2;
        model.position.y = VISUAL_Y_OFFSET;
        model.traverse((child) => {
          if (!child.isMesh) return;
          child.frustumCulled = false;
          child.castShadow = false;
          child.receiveShadow = false;
        });
        this.modelRoot.clear();
        this.fallbackModel = null;
        this.modelRoot.add(model);
      },
      undefined,
      (error) => {
        console.warn('Rocket mesh failed to load', error);
      }
    );
  }

  #showFallbackModel() {
    const white = new THREE.MeshStandardMaterial({ color: 0xf0f3f6, metalness: 0.35, roughness: 0.24 });
    const orange = new THREE.MeshStandardMaterial({ color: 0xf36c18, emissive: 0xff4a00, emissiveIntensity: 0.35, roughness: 0.24 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x05070b, metalness: 0.45, roughness: 0.28 });
    const group = new THREE.Group();
    group.position.y = VISUAL_Y_OFFSET;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.15, 28), white);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.42, 28), orange);
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.18, 24), dark);
    body.position.y = 0;
    nose.position.y = 0.78;
    engine.position.y = -0.66;
    group.add(body, nose, engine);
    for (let i = 0; i < 4; i += 1) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.18), orange);
      const angle = i * Math.PI / 2;
      fin.position.set(Math.cos(angle) * 0.32, -0.38, Math.sin(angle) * 0.32);
      fin.rotation.y = angle;
      group.add(fin);
    }
    this.fallbackModel = group;
    this.modelRoot.add(group);
  }

  #addUpgradeVisual(upgradeId, level) {
    const strength = Math.min(1, level / 5);
    const orange = new THREE.MeshStandardMaterial({ color: 0xf36c18, emissive: 0xff4a00, emissiveIntensity: 0.28, roughness: 0.26 });
    const cyan = new THREE.MeshStandardMaterial({ color: 0x24dfff, emissive: 0x0fb9df, emissiveIntensity: 0.72, roughness: 0.22 });
    const armor = new THREE.MeshStandardMaterial({ color: 0x8a98a7, metalness: 0.58, roughness: 0.32 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x10151c, metalness: 0.55, roughness: 0.34 });
    const y = (value) => value + VISUAL_Y_OFFSET;

    if (upgradeId === 'fuel_capacity') {
      this.#sidePod(0.39, y(-0.56), 0, 0.11 + strength * 0.04, 0.58, orange);
      this.#sidePod(-0.39, y(-0.56), 0, 0.11 + strength * 0.04, 0.58, orange);
    } else if (upgradeId === 'fuel_efficiency') {
      this.#ring(y(-0.12), 0.34, 0.012 + strength * 0.008, cyan);
      this.#ring(y(0.14), 0.32, 0.012, cyan);
    } else if (upgradeId === 'boost_power') {
      this.#engineNozzle(0, y(-1.04), 0, 0.18 + strength * 0.06, dark);
    } else if (upgradeId === 'boost_efficiency') {
      this.#ring(y(-0.82), 0.31, 0.014, cyan);
      this.#ring(y(-0.94), 0.27, 0.014, cyan);
    } else if (upgradeId === 'steering') {
      this.#finPair(0.48 + strength * 0.08, y(-0.5), orange);
    } else if (upgradeId === 'stability') {
      this.#ring(y(0.36), 0.36, 0.026, armor);
    } else if (upgradeId === 'landing_gear') {
      this.#landingPad(0.46, y(-0.9), 0.46, armor);
      this.#landingPad(-0.46, y(-0.9), 0.46, armor);
      this.#landingPad(0.46, y(-0.9), -0.46, armor);
      this.#landingPad(-0.46, y(-0.9), -0.46, armor);
    } else if (upgradeId === 'hull_strength') {
      this.#ring(y(0.04), 0.38, 0.035, armor);
      this.#ring(y(-0.34), 0.41, 0.032, armor);
    } else if (upgradeId === 'fuel_collector') {
      this.#collectorHoop(y(0.02), 0.52 + strength * 0.1, cyan);
    } else if (upgradeId === 'air_brake') {
      this.#airBrake(0.5 + strength * 0.08, y(-0.22), armor);
    } else if (upgradeId === 'emergency_reserve') {
      this.#sidePod(0, y(-0.62), 0.42, 0.1 + strength * 0.035, 0.42, cyan);
    }
  }

  #ring(y, radius, tube, material) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 36), material);
    mesh.position.y = y;
    mesh.rotation.x = Math.PI / 2;
    this.upgradeVisuals.add(mesh);
  }

  #sidePod(x, y, z, radius, height, material) {
    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(radius, height, 10, 18), material);
    pod.position.set(x, y, z);
    this.upgradeVisuals.add(pod);
  }

  #engineNozzle(x, y, z, radius, material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius, 0.26, 28), material);
    mesh.position.set(x, y, z);
    this.upgradeVisuals.add(mesh);
  }

  #finPair(offset, y, material) {
    [-1, 1].forEach((side) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.46, 0.18), material);
      fin.position.set(side * offset, y, 0);
      this.upgradeVisuals.add(fin);
    });
  }

  #landingPad(x, y, z, material) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.2), material);
    pad.position.set(x, y, z);
    this.upgradeVisuals.add(pad);
  }

  #collectorHoop(y, radius, material) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.014, 8, 44), material);
    hoop.position.y = y;
    hoop.rotation.x = Math.PI / 2;
    this.upgradeVisuals.add(hoop);
  }

  #airBrake(offset, y, material) {
    [-1, 1].forEach((side) => {
      const brake = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.34), material);
      brake.position.set(side * offset, y, 0);
      brake.rotation.z = side * 0.22;
      this.upgradeVisuals.add(brake);
    });
  }

  #isDesktopQuality() {
    const coarsePointer = globalThis.matchMedia?.('(pointer: coarse)')?.matches ?? false;
    const mobileUa = /android|iphone|ipad|ipod|mobile/i.test(globalThis.navigator?.userAgent ?? '');
    return !mobileUa && !coarsePointer;
  }
}
