import * as THREE from 'three';
import { LevelBuilder } from './LevelBuilder.js';
import { disposeObject3D } from './utils.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.builder = new LevelBuilder();
    this.current = null;
    this.scene.background = new THREE.Color(0x03060b);
    this.scene.fog = new THREE.FogExp2(0x07101a, 0.018);
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
    this.scene.add(new THREE.HemisphereLight(0x9cc8ff, 0x130b16, 1.25));
    const key = new THREE.DirectionalLight(0xcde9ff, 1.45);
    key.position.set(-7, 13, 9);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x24dfff, 0.6);
    rim.position.set(9, 7, -12);
    this.scene.add(rim);

    const ambientGlow = new THREE.PointLight(0x173bff, 1.2, 42);
    ambientGlow.position.set(0, 8, -12);
    this.scene.add(ambientGlow);
  }
}
