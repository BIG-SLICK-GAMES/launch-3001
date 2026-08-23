import level01 from '../levels/level01.js';
import level02 from '../levels/level02.js';
import level03 from '../levels/level03.js';
import level04 from '../levels/level04.js';
import level05 from '../levels/level05.js';
import level06 from '../levels/level06.js';
import level07 from '../levels/level07.js';
import level08 from '../levels/level08.js';
import level09 from '../levels/level09.js';
import level10 from '../levels/level10.js';
import level11 from '../levels/level11.js';
import level12 from '../levels/level12.js';
import level13 from '../levels/level13.js';
import level14 from '../levels/level14.js';
import level15 from '../levels/level15.js';
import level16 from '../levels/level16.js';
import level17 from '../levels/level17.js';
import level18 from '../levels/level18.js';
import level19 from '../levels/level19.js';
import level20 from '../levels/level20.js';
import level21 from '../levels/level21.js';
import level22 from '../levels/level22.js';
import level23 from '../levels/level23.js';
import level24 from '../levels/level24.js';
import level25 from '../levels/level25.js';
import level26 from '../levels/level26.js';
import level27 from '../levels/level27.js';
import level28 from '../levels/level28.js';
import level29 from '../levels/level29.js';
import level30 from '../levels/level30.js';

const LEVEL_DEFINITIONS = [
  level01,
  level02,
  level03,
  level04,
  level05,
  level06,
  level07,
  level08,
  level09,
  level10,
  level11,
  level12,
  level13,
  level14,
  level15,
  level16,
  level17,
  level18,
  level19,
  level20,
  level21,
  level22,
  level23,
  level24,
  level25,
  level26,
  level27,
  level28,
  level29,
  level30
];

export class LevelManager {
  constructor() {
    this.levels = LEVEL_DEFINITIONS.map((level) => this.#normalize(level));
    this.index = 0;
    this.level = this.levels[0];
  }

  get current() {
    return this.level;
  }

  getById(id) {
    return this.levels.find((level) => level.id === id) ?? this.levels[0];
  }

  load(id = 1) {
    const nextIndex = this.levels.findIndex((level) => level.id === id);
    this.index = Math.max(0, nextIndex);
    this.level = this.levels[this.index];
    return this.level;
  }

  next() {
    return this.levels[this.index + 1] ?? null;
  }

  #normalize(level) {
    const distance = this.#padDistance(level.launchPad, level.landingPad);
    const landingPad = {
      id: level.id,
      distance,
      ...level.landingPad
    };
    return {
      pickups: [],
      obstacles: [],
      roofs: [],
      walls: [],
      tunnels: [],
      movers: [],
      ...level,
      fuelBurnRate: level.fuelBurnRate ?? 8.2,
      startDistance: 0,
      landingPad,
      checkpoints: [landingPad],
      terrain: {
        centerZ: level.terrain.centerZ ?? (level.launchPad.position.z + level.landingPad.position.z) / 2,
        startDistance: 0,
        ...level.terrain
      },
      visualTheme: {
        terrain: 0x202833,
        ...(level.visualTheme ?? {})
      }
    };
  }

  #padDistance(start, finish) {
    const dx = finish.position.x - start.position.x;
    const dz = finish.position.z - start.position.z;
    return Math.round(Math.hypot(dx, dz));
  }
}
