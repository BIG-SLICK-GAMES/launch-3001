import * as THREE from 'three';
import { ROCKET_STANDING_HEIGHT } from './constants.js';
import { clamp } from './utils.js';

export class PhysicsController {
  constructor() {
    this.tmpWind = new THREE.Vector3();
  }

  step(rocket, level, input, dt, active, settings = {}) {
    if (!active || !rocket.alive || rocket.landed) return;
    const wind = this.tmpWind.set(level.windDirection.x, level.windDirection.y ?? 0, level.windDirection.z).normalize().multiplyScalar(level.windStrength);
    rocket.velocity.y += level.gravity * dt;
    rocket.velocity.x += (input.x * level.steeringPower + wind.x) * dt;
    rocket.velocity.z += (input.z * level.steeringPower + wind.z) * dt;
    if (rocket.thrusting && rocket.fuel > 0) {
      rocket.velocity.y += level.thrustPower * dt;
      rocket.thrustUse += dt;
      if (!settings.noFuelDrain) {
        rocket.fuel = clamp(rocket.fuel - level.fuelBurnRate * dt, 0, 100);
      }
    }
    rocket.velocity.multiplyScalar(Math.pow(level.damping, dt * 60));
    rocket.velocity.x = clamp(rocket.velocity.x, -level.maxSpeed.horizontal, level.maxSpeed.horizontal);
    rocket.velocity.z = clamp(rocket.velocity.z, -level.maxSpeed.horizontal, level.maxSpeed.horizontal);
    rocket.velocity.y = clamp(rocket.velocity.y, -level.maxSpeed.verticalDown, level.maxSpeed.verticalUp);
    rocket.position.addScaledVector(rocket.velocity, dt);
    const ground = this.#groundHeight(rocket, level);
    const minY = ground.height + (ground.pad ? ROCKET_STANDING_HEIGHT : rocket.radius);
    if (rocket.position.y < minY) {
      rocket.position.y = minY;
      if (rocket.velocity.y < 0) rocket.velocity.y = 0;
    }
    rocket.flightTime += dt;
    rocket.distance = Math.max(0, (level.startDistance ?? 0) + level.launchPad.position.z - rocket.position.z);
  }

  #groundHeight(rocket, level) {
    const pad = level.checkpoints?.find((marker) => (
      Math.abs(rocket.position.x - marker.position.x) <= marker.size.x / 2 &&
      Math.abs(rocket.position.z - marker.position.z) <= marker.size.z / 2
    )) ?? level.launchPad;
    const onLaunch = Math.abs(rocket.position.x - level.launchPad.position.x) <= level.launchPad.size.x / 2 &&
      Math.abs(rocket.position.z - level.launchPad.position.z) <= level.launchPad.size.z / 2;
    const onMarker = Math.abs(rocket.position.x - pad.position.x) <= pad.size.x / 2 &&
      Math.abs(rocket.position.z - pad.position.z) <= pad.size.z / 2;
    return onLaunch || onMarker ? { height: pad.position.y + 0.12, pad: true } : { height: -Infinity, pad: false };
  }
}
