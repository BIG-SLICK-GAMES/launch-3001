import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants.js';

export class SaveSystem {
  loadSettings() {
    return { ...DEFAULT_SETTINGS, ...this.#read(STORAGE_KEYS.settings, {}) };
  }

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  loadProgress() {
    return {
      totalScore: 0,
      bestTotalScore: 0,
      highestUnlockedLevel: 1,
      bestScores: {},
      bestGrades: {},
      attempts: {},
      perfectLandings: 0,
      availableStars: 0,
      totalStarsEarned: 0,
      starsSpent: 0,
      bonusStarsPurchased: 0,
      checkpointStarResults: {},
      upgradeLevels: {},
      boostInventory: {},
      equippedBoosts: [],
      upgradeTransactions: [],
      boostTransactions: [],
      activeRocketId: 'default',
      activeLoadoutId: 'default',
      leaderboard: {
        bestDistance: 0,
        bestDistanceTime: 0,
        runs: []
      },
      ...this.#read(STORAGE_KEYS.progress, {})
    };
  }

  saveProgress(progress) {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
  }

  loadProfile() {
    return {
      purchases: {},
      ...this.#read(STORAGE_KEYS.profile, {})
    };
  }

  #read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }
}
