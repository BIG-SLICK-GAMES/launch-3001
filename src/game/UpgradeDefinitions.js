export const UPGRADE_COSTS = [3, 6, 10, 15, 22];

export const UPGRADE_DEFINITIONS = [
  {
    upgradeId: 'fuel_capacity',
    displayName: 'Extended Fuel Tank',
    category: 'Fuel',
    maximumLevel: 5,
    starCosts: UPGRADE_COSTS,
    statModifiers: { maxFuelPercent: [10, 20, 32, 46, 62], massPercent: [2, 4, 6, 8, 10] }
  },
  {
    upgradeId: 'fuel_efficiency',
    displayName: 'Fuel Efficiency',
    category: 'Efficiency',
    maximumLevel: 5,
    starCosts: UPGRADE_COSTS,
    statModifiers: { fuelBurnPercent: [-8, -15, -23, -31, -40], boostFuelBurnPercent: [-3, -6, -9, -12, -15] }
  },
  {
    upgradeId: 'boost_power',
    displayName: 'Boost Power',
    category: 'Boost',
    maximumLevel: 5,
    starCosts: UPGRADE_COSTS,
    statModifiers: { thrustPowerPercent: [7, 14, 22, 31, 42], fuelBurnPercent: [2, 4, 7, 10, 14] }
  },
  {
    upgradeId: 'boost_efficiency',
    displayName: 'Boost Efficiency',
    category: 'Boost',
    maximumLevel: 5,
    starCosts: UPGRADE_COSTS,
    statModifiers: { boostFuelBurnPercent: [-8, -15, -23, -31, -40], thrustPowerPercent: [2, 4, 6, 8, 10] }
  },
  {
    upgradeId: 'steering',
    displayName: 'Steering Response',
    category: 'Steering',
    maximumLevel: 5,
    starCosts: UPGRADE_COSTS,
    statModifiers: { steeringPowerPercent: [8, 16, 25, 35, 46], tiltResponsePercent: [4, 8, 12, 16, 20] }
  },
  {
    upgradeId: 'stability',
    displayName: 'Flight Stability',
    category: 'Stability',
    maximumLevel: 5,
    starCosts: UPGRADE_COSTS,
    statModifiers: { dampingPercent: [1.5, 3, 4.5, 6, 8], landingAnglePercent: [4, 8, 12, 17, 22] }
  },
  {
    upgradeId: 'landing_gear',
    displayName: 'Landing Gear',
    category: 'Landing',
    maximumLevel: 5,
    starCosts: UPGRADE_COSTS,
    statModifiers: { landingVerticalPercent: [8, 16, 25, 35, 46], landingHorizontalPercent: [6, 12, 19, 27, 36], landingAnglePercent: [6, 12, 19, 27, 36] }
  },
  {
    upgradeId: 'hull_strength',
    displayName: 'Hull Strength',
    category: 'Hull',
    maximumLevel: 5,
    starCosts: UPGRADE_COSTS,
    statModifiers: { collisionTolerancePercent: [8, 16, 25, 35, 46] }
  },
  {
    upgradeId: 'fuel_collector',
    displayName: 'Fuel Collector',
    category: 'Fuel Collection',
    maximumLevel: 5,
    starCosts: UPGRADE_COSTS,
    statModifiers: { pickupRadiusFlat: [0.4, 0.8, 1.25, 1.75, 2.3], pickupValuePercent: [5, 10, 16, 23, 31] }
  },
  {
    upgradeId: 'air_brake',
    displayName: 'Air Brake',
    category: 'Air Brake',
    maximumLevel: 5,
    starCosts: UPGRADE_COSTS,
    statModifiers: { airBrakePercent: [5, 10, 16, 23, 31], maxHorizontalSpeedPercent: [-2, -4, -6, -8, -10] }
  },
  {
    upgradeId: 'emergency_reserve',
    displayName: 'Emergency Reserve',
    category: 'Emergency',
    maximumLevel: 5,
    starCosts: UPGRADE_COSTS,
    statModifiers: { reserveFuelFlat: [6, 10, 15, 21, 28] }
  }
];

export function upgradeById(upgradeId) {
  return UPGRADE_DEFINITIONS.find((upgrade) => upgrade.upgradeId === upgradeId);
}
