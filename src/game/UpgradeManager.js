import { UPGRADE_DEFINITIONS, upgradeById } from './UpgradeDefinitions.js';

export class UpgradeManager {
  constructor(saveSystem, progress = null) {
    this.saveSystem = saveSystem;
    this.progress = progress ?? saveSystem.loadProgress();
  }

  levelFor(upgradeId) {
    return Math.max(0, Number(this.progress.upgradeLevels?.[upgradeId]) || 0);
  }

  availableStars() {
    return Math.max(0, Number(this.progress.availableStars) || 0);
  }

  completionPercent() {
    const total = UPGRADE_DEFINITIONS.reduce((sum, upgrade) => sum + upgrade.maximumLevel, 0);
    const owned = UPGRADE_DEFINITIONS.reduce((sum, upgrade) => sum + this.levelFor(upgrade.upgradeId), 0);
    return total ? Math.round((owned / total) * 100) : 0;
  }

  nextCost(upgradeId) {
    const definition = upgradeById(upgradeId);
    const level = this.levelFor(upgradeId);
    return definition?.starCosts?.[level] ?? null;
  }

  canUpgrade(upgradeId) {
    const definition = upgradeById(upgradeId);
    if (!definition) return { ok: false, reason: 'Unknown upgrade' };
    const level = this.levelFor(upgradeId);
    if (level >= definition.maximumLevel) return { ok: false, reason: 'Maximum level reached' };
    if ((definition.requiredCheckpoint ?? 0) > (this.progress.highestUnlockedLevel ?? 1)) return { ok: false, reason: 'Checkpoint prerequisite locked' };
    if ((definition.requiredTotalStars ?? 0) > (this.progress.totalStarsEarned ?? 0)) return { ok: false, reason: 'Star prerequisite locked' };
    const cost = definition.starCosts[level];
    if (this.availableStars() < cost) return { ok: false, reason: 'Not enough stars' };
    return { ok: true, cost, level, nextLevel: level + 1, definition };
  }

  purchase(upgradeId) {
    const check = this.canUpgrade(upgradeId);
    if (!check.ok) return check;
    this.progress.upgradeLevels = { ...(this.progress.upgradeLevels ?? {}), [upgradeId]: check.nextLevel };
    this.progress.availableStars = this.availableStars() - check.cost;
    this.progress.starsSpent = (this.progress.starsSpent ?? 0) + check.cost;
    this.#transaction('upgrade_purchase', { upgradeId, level: check.nextLevel, stars: -check.cost });
    this.saveSystem.saveProgress(this.progress);
    return { ok: true, ...check };
  }

  reset(refundPercent = 0.8) {
    const spent = Number(this.progress.starsSpent) || 0;
    const refund = Math.floor(spent * refundPercent);
    this.progress.upgradeLevels = {};
    this.progress.availableStars = this.availableStars() + refund;
    this.progress.starsSpent = 0;
    this.#transaction('upgrade_reset', { refund, refundPercent });
    this.saveSystem.saveProgress(this.progress);
    return { spent, refund, refundPercent };
  }

  #transaction(type, payload) {
    this.progress.upgradeTransactions = [
      ...(this.progress.upgradeTransactions ?? []),
      { id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`, type, at: new Date().toISOString(), ...payload }
    ].slice(-100);
  }
}
