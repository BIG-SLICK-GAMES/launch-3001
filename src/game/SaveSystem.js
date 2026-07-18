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
      leaderboard: {
        bestDistance: 0,
        bestDistanceTime: 0
      },
      ...this.#read(STORAGE_KEYS.progress, {})
    };
  }

  saveProgress(progress) {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
  }

  #read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }
}
