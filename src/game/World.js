import * as THREE from 'three';
import { LevelBuilder } from './LevelBuilder.js';
import { disposeObject3D, makeBoxFromSpec } from './utils.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.builder = new LevelBuilder();
    this.current = null;
    this.scene.background = new THREE.Color(0x050a12);
    this.scene.fog = new THREE.FogExp2(0x081522, 0.012);
    this.#lights();
  }

  load(level) {
    if (this.current) {
      this.scene.remove(this.current.group);
      disposeObject3D(this.current.group);
    }
    this.current = this.builder.build(level);
    this.scene.add(this.current.group);
    return this.current;
  }

  updateMovingHazards(time) {
    if (!this.current?.boxes) return;
    for (const entry of this.current.boxes) {
      if (!entry.spec.motion || !entry.mesh) continue;
      const t = time * (entry.spec.speed ?? 1) + (entry.spec.phase ?? 0);
      entry.spec.position.x = entry.origin.x;
      entry.spec.position.y = entry.origin.y;
      entry.spec.position.z = entry.origin.z;
      if (entry.spec.motion === 'slideX') {
        entry.spec.position.x = entry.origin.x + Math.sin(t) * (entry.spec.amplitude ?? 6);
      } else if (entry.spec.motion === 'bobY') {
        entry.spec.position.y = entry.origin.y + Math.sin(t) * (entry.spec.amplitude ?? 2);
      } else if (entry.spec.motion === 'slideZ') {
        entry.spec.position.z = entry.origin.z + Math.sin(t) * (entry.spec.amplitude ?? 8);
      }
      entry.mesh.position.set(entry.spec.position.x, entry.spec.position.y, entry.spec.position.z);
      entry.box.copy(makeBoxFromSpec(entry.spec));
    }
  }

  getTerrainHeight(x, z) {
    const terrain = this.current.terrain;
    const halfW = terrain.width / 2;
    const halfD = terrain.depth / 2;
    const u = (x + halfW) / terrain.width;
    const localZ = z - (terrain.centerZ ?? 0);
    const v = (localZ + halfD) / terrain.depth;
    if (u < 0 || u > 1 || v < 0 || v > 1) return -Infinity;
    const gx = u * terrain.segments;
    const gz = v * terrain.segments;
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const x1 = Math.min(terrain.segments, x0 + 1);
    const z1 = Math.min(terrain.segments, z0 + 1);
    const tx = gx - x0;
    const tz = gz - z0;
    const h00 = terrain.heights[z0][x0];
    const h10 = terrain.heights[z0][x1];
    const h01 = terrain.heights[z1][x0];
    const h11 = terrain.heights[z1][x1];
    return (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;
  }

  #lights() {
    this.scene.add(new THREE.HemisphereLight(0xb8dcff, 0x1d1320, 1.45));
    const key = new THREE.DirectionalLight(0xe2f4ff, 1.65);
    key.position.set(-7, 13, 9);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x24dfff, 0.85);
    rim.position.set(9, 7, -12);
    this.scene.add(rim);

    const ambientGlow = new THREE.PointLight(0x24dfff, 1.05, 52);
    ambientGlow.position.set(0, 8, -12);
    this.scene.add(ambientGlow);
  }
}
