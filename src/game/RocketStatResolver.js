import { boostById } from './BoostDefinitions.js';

const BASE_STATS = Object.freeze({
  maxFuel: 100,
  fuelBurnMultiplier: 1,
  boostFuelBurnMultiplier: 1,
  thrustPowerMultiplier: 1,
  steeringPowerMultiplier: 1,
  dampingMultiplier: 1,
  maxHorizontalSpeedMultiplier: 1,
  landingVerticalMultiplier: 1,
  landingHorizontalMultiplier: 1,
  landingAngleMultiplier: 1,
  collisionToleranceMultiplier: 1,
  pickupRadiusBonus: 0,
  pickupValueMultiplier: 1,
  airBrakeMultiplier: 1,
  reserveFuel: 0,
  massMultiplier: 1,
  tiltResponseMultiplier: 1
});

const STAT_TARGETS = {
  maxFuelPercent: ['maxFuel', 'percent'],
  fuelBurnPercent: ['fuelBurnMultiplier', 'percentMultiplier'],
  boostFuelBurnPercent: ['boostFuelBurnMultiplier', 'percentMultiplier'],
  thrustPowerPercent: ['thrustPowerMultiplier', 'percentMultiplier'],
  steeringPowerPercent: ['steeringPowerMultiplier', 'percentMultiplier'],
  dampingPercent: ['dampingMultiplier', 'percentMultiplier'],
  maxHorizontalSpeedPercent: ['maxHorizontalSpeedMultiplier', 'percentMultiplier'],
  landingVerticalPercent: ['landingVerticalMultiplier', 'percentMultiplier'],
  landingHorizontalPercent: ['landingHorizontalMultiplier', 'percentMultiplier'],
  landingAnglePercent: ['landingAngleMultiplier', 'percentMultiplier'],
  collisionTolerancePercent: ['collisionToleranceMultiplier', 'percentMultiplier'],
  pickupValuePercent: ['pickupValueMultiplier', 'percentMultiplier'],
  airBrakePercent: ['airBrakeMultiplier', 'percentMultiplier'],
  massPercent: ['massMultiplier', 'percentMultiplier'],
  tiltResponsePercent: ['tiltResponseMultiplier', 'percentMultiplier'],
  pickupRadiusFlat: ['pickupRadiusBonus', 'flat'],
  reserveFuelFlat: ['reserveFuel', 'flat'],
  instantFuelFlat: ['instantFuel', 'flat'],
  collisionShield: ['collisionShield', 'flat'],
  starPenaltyProtection: ['starPenaltyProtection', 'flat'],
  checkpointRestart: ['checkpointRestart', 'flat']
};

export class RocketStatResolver {
  constructor(upgrades, boosts) {
    this.upgrades = upgrades;
    this.boosts = boosts;
    this.baseStats = { ...BASE_STATS };
    this.current = { ...BASE_STATS };
  }

  recalculate() {
    const stats = { ...this.baseStats };
    for (const definition of this.upgrades.equippedDefinitions()) {
      const level = this.upgrades.levelFor(definition.upgradeId);
      this.#applyDefinition(stats, definition.statModifiers, level);
    }
    for (const equipped of this.boosts.equippedDefinitions()) {
      this.#applyEffects(stats, equipped.effects);
    }
    stats.maxFuel = Math.max(1, Number(stats.maxFuel.toFixed(2)));
    stats.fuelBurnMultiplier = Math.max(0.05, stats.fuelBurnMultiplier);
    stats.boostFuelBurnMultiplier = Math.max(0.05, stats.boostFuelBurnMultiplier);
    stats.thrustPowerMultiplier = Math.max(0.1, stats.thrustPowerMultiplier);
    stats.steeringPowerMultiplier = Math.max(0.1, stats.steeringPowerMultiplier);
    stats.massMultiplier = Math.max(0.5, stats.massMultiplier);
    this.current = stats;
    return stats;
  }

  applyToRocket(rocket) {
    const previousMax = rocket.maxFuel ?? this.baseStats.maxFuel;
    rocket.stats = this.current;
    rocket.maxFuel = this.current.maxFuel;
    if (rocket.fuel > rocket.maxFuel) rocket.fuel = rocket.maxFuel;
    if (rocket.fuel === previousMax) rocket.fuel = rocket.maxFuel;
  }

  adjustedLevel(level) {
    const stats = this.current;
    const massPenalty = Math.max(0.5, stats.massMultiplier);
    const massFuelPenalty = 1 + Math.max(0, massPenalty - 1) * 0.35;
    return {
      ...level,
      fuelBurnRate: level.fuelBurnRate * stats.fuelBurnMultiplier * stats.boostFuelBurnMultiplier * massFuelPenalty,
      thrustPower: level.thrustPower * stats.thrustPowerMultiplier / massPenalty,
      steeringPower: level.steeringPower * stats.steeringPowerMultiplier / massPenalty,
      damping: Math.min(0.998, 1 - ((1 - level.damping) * stats.dampingMultiplier)),
      maxSpeed: {
        ...level.maxSpeed,
        horizontal: level.maxSpeed.horizontal * stats.maxHorizontalSpeedMultiplier
      },
      landingThresholds: {
        verticalSpeed: level.landingThresholds.verticalSpeed * stats.landingVerticalMultiplier,
        horizontalSpeed: level.landingThresholds.horizontalSpeed * stats.landingHorizontalMultiplier,
        angle: level.landingThresholds.angle * stats.landingAngleMultiplier
      }
    };
  }

  #applyDefinition(stats, modifiers, level) {
    if (!level) return;
    for (const [key, values] of Object.entries(modifiers ?? {})) {
      const value = Array.isArray(values) ? values[level - 1] : values;
      this.#applyValue(stats, key, value);
    }
  }

  #applyEffects(stats, effects) {
    for (const [key, value] of Object.entries(effects ?? {})) {
      this.#applyValue(stats, key, value);
    }
  }

  #applyValue(stats, key, value = 0) {
    const target = STAT_TARGETS[key];
    if (!target) return;
    const [stat, mode] = target;
    if (mode === 'flat') stats[stat] = (stats[stat] ?? 0) + value;
    if (mode === 'percent') stats[stat] += this.baseStats[stat] * (value / 100);
    if (mode === 'percentMultiplier') stats[stat] *= 1 + value / 100;
  }
}
