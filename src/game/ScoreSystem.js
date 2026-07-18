import { LANDING_GRADES } from './constants.js';

const gradeBonus = {
  [LANDING_GRADES.perfect]: 700,
  [LANDING_GRADES.excellent]: 520,
  [LANDING_GRADES.good]: 360,
  [LANDING_GRADES.safe]: 220,
  [LANDING_GRADES.hard]: 100
};

export class ScoreSystem {
  constructor(saveSystem) {
    this.saveSystem = saveSystem;
    this.progress = saveSystem.loadProgress();
    this.currentLevelScore = 0;
  }

  recordAttempt(levelId) {
    this.progress.attempts[levelId] = (this.progress.attempts[levelId] ?? 0) + 1;
    this.saveSystem.saveProgress(this.progress);
  }

  scoreLanding(level, rocket, grade, hadCollision) {
    const thresholds = level.landingThresholds;
    const verticalBonus = Math.max(0, 1 - Math.abs(rocket.velocity.y) / thresholds.verticalSpeed) * 180;
    const horizontal = Math.hypot(rocket.velocity.x, rocket.velocity.z);
    const horizontalBonus = Math.max(0, 1 - horizontal / thresholds.horizontalSpeed) * 180;
    const angleBonus = Math.max(0, 1 - rocket.getTiltAngle() / thresholds.angle) * 160;
    const timeBonus = Math.max(0, 120 - rocket.flightTime * 4);
    const thrustBonus = Math.max(0, 120 - rocket.thrustUse * 18);
    const cleanBonus = hadCollision ? 0 : 120;
    const raw = 500 + gradeBonus[grade] + verticalBonus + horizontalBonus + angleBonus + timeBonus + thrustBonus + cleanBonus;
    this.currentLevelScore = Math.round(raw * level.scoreMultiplier);
    return this.currentLevelScore;
  }

  commitLevel(levelId, grade, unlockLevelId) {
    const score = this.currentLevelScore;
    this.progress.totalScore += score;
    this.progress.bestTotalScore = Math.max(this.progress.bestTotalScore, this.progress.totalScore);
    this.progress.bestScores[levelId] = Math.max(this.progress.bestScores[levelId] ?? 0, score);
    this.progress.bestGrades[levelId] = this.#bestGrade(this.progress.bestGrades[levelId], grade);
    if (grade === LANDING_GRADES.perfect) this.progress.perfectLandings += 1;
    if (unlockLevelId) this.progress.highestUnlockedLevel = Math.max(this.progress.highestUnlockedLevel, unlockLevelId);
    this.saveSystem.saveProgress(this.progress);
  }

  resetRun() {
    this.progress.totalScore = 0;
    this.currentLevelScore = 0;
    this.saveSystem.saveProgress(this.progress);
  }

  updateLeaderboard(distance, time) {
    const board = this.progress.leaderboard ?? { bestDistance: 0, bestDistanceTime: 0 };
    const roundedDistance = Math.floor(distance);
    const roundedTime = Number(time.toFixed(1));
    const farther = roundedDistance > (board.bestDistance ?? 0);
    const sameDistanceFaster = roundedDistance === board.bestDistance && (!board.bestDistanceTime || roundedTime < board.bestDistanceTime);
    if (!farther && !sameDistanceFaster) return;
    this.progress.leaderboard = {
      ...board,
      bestDistance: roundedDistance,
      bestDistanceTime: roundedTime
    };
    this.saveSystem.saveProgress(this.progress);
  }

  scoreCheckpoint(marker, elapsed, distance) {
    const base = 100;
    const points = elapsed <= 30
      ? Math.min(200, base * (30 / Math.max(15, elapsed)))
      : Math.max(25, base - ((elapsed - 30) / 60) * 50);
    const distanceBonus = Math.floor(distance / 100) * 5;
    this.currentLevelScore = Math.round(points + distanceBonus);
    return this.currentLevelScore;
  }

  commitCheckpoint(marker, points, unlockLevelId) {
    this.progress.totalScore += points;
    this.progress.bestTotalScore = Math.max(this.progress.bestTotalScore, this.progress.totalScore);
    this.progress.bestScores[marker.id] = Math.max(this.progress.bestScores[marker.id] ?? 0, points);
    this.progress.bestGrades[marker.id] = 'SAVED';
    if (unlockLevelId) this.progress.highestUnlockedLevel = Math.max(this.progress.highestUnlockedLevel, unlockLevelId);
    this.saveSystem.saveProgress(this.progress);
  }

  #bestGrade(current, incoming) {
    const order = [LANDING_GRADES.hard, LANDING_GRADES.safe, LANDING_GRADES.good, LANDING_GRADES.excellent, LANDING_GRADES.perfect];
    return order.indexOf(incoming) > order.indexOf(current) ? incoming : current ?? incoming;
  }
}
