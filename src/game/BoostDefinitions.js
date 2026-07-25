export const BOOST_DEFINITIONS = [
  { boostId: 'emergency_fuel', displayName: 'Emergency Fuel', activationType: 'OnFuelEmpty', durationType: 'SingleActivation', maximumPerRun: 1, chipPrice: 75, effects: { instantFuelFlat: 28 } },
  { boostId: 'fuel_saver', displayName: 'Fuel Saver', activationType: 'Passive', durationType: 'EntireCheckpoint', maximumPerRun: 1, chipPrice: 100, effects: { fuelBurnPercent: -15 } },
  { boostId: 'power_boost', displayName: 'Power Boost', activationType: 'Passive', durationType: 'EntireCheckpoint', maximumPerRun: 1, chipPrice: 125, effects: { thrustPowerPercent: 18, fuelBurnPercent: 6 } },
  { boostId: 'landing_assist', displayName: 'Landing Assist', activationType: 'OnLandingApproach', durationType: 'EntireCheckpoint', maximumPerRun: 1, chipPrice: 100, effects: { landingVerticalPercent: 10, landingHorizontalPercent: 8, landingAnglePercent: 10 } },
  { boostId: 'crash_shield', displayName: 'Crash Shield', activationType: 'OnCollision', durationType: 'SingleActivation', maximumPerRun: 1, chipPrice: 175, effects: { collisionShield: 1 } },
  { boostId: 'fuel_magnet', displayName: 'Fuel Magnet', activationType: 'Passive', durationType: 'EntireCheckpoint', maximumPerRun: 1, chipPrice: 125, effects: { pickupRadiusFlat: 2.5, pickupValuePercent: 10 } },
  { boostId: 'air_brake_booster', displayName: 'Air Brake Booster', activationType: 'Passive', durationType: 'EntireCheckpoint', maximumPerRun: 1, chipPrice: 125, effects: { airBrakePercent: 18, maxHorizontalSpeedPercent: -8 } },
  { boostId: 'star_protector', displayName: 'Star Protector', activationType: 'OnLandingApproach', durationType: 'SingleActivation', maximumPerRun: 1, chipPrice: 150, effects: { starPenaltyProtection: 1 } },
  { boostId: 'repair_kit', displayName: 'Repair Kit', activationType: 'Manual', durationType: 'Instant', maximumPerRun: 1, chipPrice: 100, effects: { repairFlat: 25 } },
  { boostId: 'checkpoint_insurance', displayName: 'Checkpoint Insurance', activationType: 'OnCollision', durationType: 'SingleActivation', maximumPerRun: 1, chipPrice: 200, effects: { checkpointRestart: 1 } }
];

export const BONUS_STAR_PACKAGES = [
  { packageId: 'stars_5', stars: 5, chipPrice: 250 },
  { packageId: 'stars_12', stars: 12, chipPrice: 500 },
  { packageId: 'stars_30', stars: 30, chipPrice: 1000 },
  { packageId: 'stars_85', stars: 85, chipPrice: 2500 }
];

export function boostById(boostId) {
  return BOOST_DEFINITIONS.find((boost) => boost.boostId === boostId);
}
