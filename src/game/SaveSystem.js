import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants.js';

export class SaveSystem {
  loadSettings() {
    return { ...DEFAULT_SETTINGS, ...this.#read(STORAGE_KEYS.settings, {}) };
  }

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  loadProgress() {
    const progress = {
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
      equippedUpgrades: [],
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
    if (this.#consumeLocalUnlockFlag()) {
      progress.highestUnlockedLevel = Math.max(progress.highestUnlockedLevel ?? 1, 30);
      this.saveProgress(progress);
    }
    return progress;
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

  #consumeLocalUnlockFlag() {
    const url = new URL(window.location.href);
    if (url.searchParams.get('unlockLevels') !== '1') return false;
    url.searchParams.delete('unlockLevels');
    window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);
    return true;
  }
}
