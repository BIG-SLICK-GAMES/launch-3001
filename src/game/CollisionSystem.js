import * as THREE from 'three';
import { FAILURE_REASONS, LANDING_GRADES, ROCKET_STANDING_HEIGHT } from './constants.js';

export class CollisionSystem {
  constructor(world) {
    this.world = world;
    this.tmpSphere = new THREE.Sphere();
  }

  check(rocket, level) {
    if (!rocket.alive || rocket.landed) return null;
    const p = rocket.position;
    const bounds = level.worldBounds;
    if (p.x < bounds.minX || p.x > bounds.maxX || p.y > bounds.maxY || p.z < bounds.minZ || p.z > bounds.maxZ) {
      return { type: 'crash', reason: FAILURE_REASONS.bounds };
    }
    this.tmpSphere.center.copy(p);
    this.tmpSphere.radius = rocket.radius;
    for (const entry of this.world.current.boxes) {
      if (entry.box.intersectsSphere(this.tmpSphere)) {
        const reason = entry.spec.type === 'roof' || entry.spec.type === 'caveRoof' ? FAILURE_REASONS.roof : FAILURE_REASONS.wall;
        return { type: 'crash', reason };
      }
    }
    for (const marker of level.checkpoints ?? [level.landingPad]) {
      const onPad = this.#insidePad(p, marker);
      const padTop = marker.position.y + 0.12;
      if (onPad && p.y - ROCKET_STANDING_HEIGHT <= padTop + 0.08 && rocket.velocity.y <= 0) {
        p.y = padTop + ROCKET_STANDING_HEIGHT;
        return this.#landingResult(rocket, level, marker);
      }
    }
    const terrainHeight = this.world.getTerrainHeight(p.x, p.z);
    if (p.y - rocket.radius <= terrainHeight + 0.05) {
      p.y = terrainHeight + rocket.radius;
      return { type: 'crash', reason: FAILURE_REASONS.terrain };
    }
    return null;
  }

  #insidePad(position, pad) {
    return Math.abs(position.x - pad.position.x) <= pad.size.x / 2 && Math.abs(position.z - pad.position.z) <= pad.size.z / 2;
  }

  #landingResult(rocket, level, marker) {
    const thresholds = level.landingThresholds;
    const vertical = Math.abs(rocket.velocity.y);
    const horizontal = Math.hypot(rocket.velocity.x, rocket.velocity.z);
    const angle = rocket.getTiltAngle();
    if (vertical > thresholds.verticalSpeed) return { type: 'crash', reason: FAILURE_REASONS.tooFast };
    if (horizontal > thresholds.horizontalSpeed) return { type: 'crash', reason: FAILURE_REASONS.sideSpeed };
    if (angle > thresholds.angle) return { type: 'crash', reason: FAILURE_REASONS.badAngle };
    let grade = LANDING_GRADES.safe;
    if (vertical < thresholds.verticalSpeed * 0.32 && horizontal < thresholds.horizontalSpeed * 0.32 && angle < thresholds.angle * 0.32) grade = LANDING_GRADES.perfect;
    else if (vertical < thresholds.verticalSpeed * 0.48 && horizontal < thresholds.horizontalSpeed * 0.5 && angle < thresholds.angle * 0.5) grade = LANDING_GRADES.excellent;
    else if (vertical < thresholds.verticalSpeed * 0.7 && horizontal < thresholds.horizontalSpeed * 0.72 && angle < thresholds.angle * 0.72) grade = LANDING_GRADES.good;
    else if (vertical > thresholds.verticalSpeed * 0.86 || horizontal > thresholds.horizontalSpeed * 0.86 || angle > thresholds.angle * 0.86) grade = LANDING_GRADES.hard;
    return { type: 'landed', grade, marker };
  }
}
