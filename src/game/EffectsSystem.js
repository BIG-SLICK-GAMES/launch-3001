import * as THREE from 'three';

export class EffectsSystem {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.active = [];
    this.trailPool = [];
    this.trails = [];
    this.exhaustTimer = 0;
    this.flash = new THREE.PointLight(0xff3b1f, 0, 8);
    scene.add(this.flash);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff8a22, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 64; i += 1) {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat.clone());
      particle.visible = false;
      particle.userData.velocity = new THREE.Vector3();
      scene.add(particle);
      this.pool.push(particle);
    }
    const trailMat = new THREE.MeshBasicMaterial({ color: 0xff9a2e, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 36; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), trailMat.clone());
      puff.visible = false;
      puff.userData.velocity = new THREE.Vector3();
      scene.add(puff);
      this.trailPool.push(puff);
    }
  }

  burst(position, color = 0xff6a20, count = 18) {
    this.flash.position.copy(position);
    this.flash.intensity = 3;
    for (let i = 0; i < count && this.pool.length; i += 1) {
      const particle = this.pool.pop();
      particle.visible = true;
      particle.position.copy(position);
      particle.material.color.setHex(color);
      particle.material.opacity = 0.72;
      particle.userData.life = 0.55 + Math.random() * 0.3;
      particle.scale.setScalar(0.36 + Math.random() * 0.92);
      particle.userData.velocity.set((Math.random() - 0.5) * 4.4, Math.random() * 3.4, (Math.random() - 0.5) * 4.4);
      this.active.push(particle);
    }
  }

  emitLandingDust(position) {
    this.burst(position, 0xd8eef2, 9);
  }

  emitExhaust(rocket, dt) {
    this.exhaustTimer -= dt;
    if (!rocket.thrusting || this.exhaustTimer > 0 || !this.trailPool.length) return;
    this.exhaustTimer = 0.035;
    const puff = this.trailPool.pop();
    puff.visible = true;
    puff.position.copy(rocket.position);
    puff.position.y -= 1.35;
    puff.material.opacity = 0.38;
    puff.scale.setScalar(0.35 + Math.random() * 0.25);
    puff.userData.life = 0.42;
    puff.userData.velocity.set((Math.random() - 0.5) * 0.55 - rocket.velocity.x * 0.08, -1.2 - Math.random() * 0.5, (Math.random() - 0.5) * 0.55 - rocket.velocity.z * 0.08);
    this.trails.push(puff);
  }

  update(dt, rocket = null) {
    if (rocket) this.emitExhaust(rocket, dt);
    this.flash.intensity = Math.max(0, this.flash.intensity - dt * 8);
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const particle = this.active[i];
      particle.userData.life -= dt;
      particle.userData.velocity.y -= 5 * dt;
      particle.position.addScaledVector(particle.userData.velocity, dt);
      particle.material.opacity = Math.max(0, particle.userData.life);
      if (particle.userData.life <= 0) {
        particle.visible = false;
        this.active.splice(i, 1);
        this.pool.push(particle);
      }
    }
    for (let i = this.trails.length - 1; i >= 0; i -= 1) {
      const puff = this.trails[i];
      puff.userData.life -= dt;
      puff.position.addScaledVector(puff.userData.velocity, dt);
      puff.scale.multiplyScalar(1 + dt * 1.8);
      puff.material.opacity = Math.max(0, puff.userData.life * 0.9);
      if (puff.userData.life <= 0) {
        puff.visible = false;
        this.trails.splice(i, 1);
        this.trailPool.push(puff);
      }
    }
  }
}
