import { LANDING_GRADES } from './constants.js';

const DEFAULT_TARGETS = { threeStarTime: 18, twoStarTime: 34 };

export class CheckpointStarSystem {
  constructor(saveSystem, boosts, progress = null) {
    this.saveSystem = saveSystem;
    this.boosts = boosts;
    this.progress = progress ?? saveSystem.loadProgress();
  }

  targetsFor(marker) {
    const distance = Math.max(0, Number(marker.distance) || marker.id * 180);
    return {
      threeStarTime: marker.threeStarTime ?? Math.max(12, DEFAULT_TARGETS.threeStarTime + distance / 180 * 2.3),
      twoStarTime: marker.twoStarTime ?? Math.max(24, DEFAULT_TARGETS.twoStarTime + distance / 180 * 3.6)
    };
  }

  award(marker, elapsed, grade, crashed = false) {
    const checkpointId = String(marker.id);
    const targets = this.targetsFor(marker);
    let baseStars = 0;
    if (!crashed) {
      if (elapsed <= targets.threeStarTime) baseStars = 3;
      else if (elapsed <= targets.twoStarTime) baseStars = 2;
      else baseStars = 1;
    }
    const penalty = this.#penaltyFor(grade, crashed);
    let protectedPenalty = penalty;
    let starProtectorUsed = false;
    if (penalty > 0) {
      const protector = this.boosts.activate('star_protector');
      if (protector) {
        protectedPenalty = Math.max(0, penalty - 1);
        starProtectorUsed = true;
      }
    }
    const finalStars = crashed ? 0 : Math.max(1, Math.min(3, baseStars - protectedPenalty));
    const previous = this.progress.checkpointStarResults?.[checkpointId] ?? {};
    const previousBest = Number(previous.bestStarsEarned) || 0;
    const newStarsEarned = Math.max(0, finalStars - previousBest);
    this.progress.checkpointStarResults = {
      ...(this.progress.checkpointStarResults ?? {}),
      [checkpointId]: {
        checkpointId,
        ...targets,
        bestCompletionTime: Math.min(previous.bestCompletionTime ?? Infinity, elapsed),
        bestStarsEarned: Math.max(previousBest, finalStars)
      }
    };
    if (newStarsEarned > 0) {
      this.progress.totalStarsEarned = (this.progress.totalStarsEarned ?? 0) + newStarsEarned;
      this.progress.availableStars = (this.progress.availableStars ?? 0) + newStarsEarned;
      this.#transaction('checkpoint_stars', { checkpointId, stars: newStarsEarned });
    }
    this.saveSystem.saveProgress(this.progress);
    return {
      checkpointId,
      elapsed: Number(elapsed.toFixed(1)),
      ...targets,
      baseStars,
      landingPenalty: penalty,
      protectedPenalty,
      finalStars,
      previousBest,
      newStarsEarned,
      starProtectorUsed,
      availableStars: this.progress.availableStars ?? 0
    };
  }

  #penaltyFor(grade, crashed) {
    if (crashed || grade === LANDING_GRADES.crash) return 3;
    if (grade === LANDING_GRADES.hard) return 1;
    return 0;
  }

  #transaction(type, payload) {
    this.progress.upgradeTransactions = [
      ...(this.progress.upgradeTransactions ?? []),
      { id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`, type, at: new Date().toISOString(), ...payload }
    ].slice(-100);
  }
}
