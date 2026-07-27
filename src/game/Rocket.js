import * as THREE from 'three';
import { ROCKET_RADIUS } from './constants.js';
import { clamp, smoothDamp } from './utils.js';

export class Rocket {
  constructor() {
    this.group = new THREE.Group();
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

  #build() {
    const desktopQuality = this.#isDesktopQuality();
    const bodySegments = desktopQuality ? 72 : 28;
    const detailSegments = desktopQuality ? 32 : 18;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8edf5, metalness: 0.55, roughness: 0.28, emissive: 0x111827, emissiveIntensity: 0.12 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xff7a26, emissive: 0xff3c00, emissiveIntensity: 1.15, metalness: 0.2, roughness: 0.3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111923, metalness: 0.38, roughness: 0.42 });
    const hazardMat = new THREE.MeshStandardMaterial({ color: 0x17d8ff, emissive: 0x0888aa, emissiveIntensity: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x5be9ff, emissive: 0x1cc8ff, emissiveIntensity: 1.2, roughness: 0.14, metalness: 0.05 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 1.8, bodySegments), bodyMat);
    body.position.y = 0.15;
    this.group.add(body);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.64, bodySegments), orangeMat);
    nose.position.y = 1.37;
    this.group.add(nose);

    const booster = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.42, bodySegments), darkMat);
    booster.position.y = -0.95;
    this.group.add(booster);

    for (let i = 0; i < 4; i += 1) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.42), orangeMat);
      fin.position.set(Math.cos(i * Math.PI / 2) * 0.42, -0.58, Math.sin(i * Math.PI / 2) * 0.42);
      fin.rotation.y = i * Math.PI / 2;
      this.group.add(fin);
    }

    for (let i = 0; i < 3; i += 1) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, desktopQuality ? 14 : 8), darkMat);
      leg.position.set(Math.cos(i * Math.PI * 2 / 3) * 0.5, -1.18, Math.sin(i * Math.PI * 2 / 3) * 0.5);
      leg.rotation.z = Math.cos(i * Math.PI * 2 / 3) * 0.36;
      leg.rotation.x = -Math.sin(i * Math.PI * 2 / 3) * 0.36;
      this.group.add(leg);
    }

    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.018, 8, 24), hazardMat);
    stripe.position.y = 0.48;
    stripe.rotation.x = Math.PI / 2;
    this.group.add(stripe);

    const window = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, detailSegments, Math.max(10, Math.floor(detailSegments * 0.65))),
      glassMat
    );
    window.position.set(0, 0.82, -0.31);
    window.scale.set(1, 0.75, 0.28);
    this.group.add(window);

    this.flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, detailSegments), new THREE.MeshBasicMaterial({ color: 0xff9a2e, transparent: true, opacity: 0.82 }));
    this.flame.position.y = -1.55;
    this.flame.rotation.x = Math.PI;
    this.flame.visible = false;
    this.group.add(this.flame);

    this.innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.62, Math.max(12, Math.floor(detailSegments * 0.7))), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
    this.innerFlame.position.y = -1.48;
    this.innerFlame.rotation.x = Math.PI;
    this.flame.add(this.innerFlame);

    this.engineHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.48, 28),
      new THREE.MeshBasicMaterial({ color: 0xff7a22, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    );
    this.engineHalo.position.y = -1.18;
    this.engineHalo.rotation.x = Math.PI / 2;
    this.group.add(this.engineHalo);

    this.glow = new THREE.PointLight(0xff6a00, 0, 4);
    this.glow.position.y = -1.25;
    this.group.add(this.glow);
  }

  #isDesktopQuality() {
    const coarsePointer = globalThis.matchMedia?.('(pointer: coarse)')?.matches ?? false;
    const mobileUa = /android|iphone|ipad|ipod|mobile/i.test(globalThis.navigator?.userAgent ?? '');
    return !mobileUa && !coarsePointer;
  }
}
