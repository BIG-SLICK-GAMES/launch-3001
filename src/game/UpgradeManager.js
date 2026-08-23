import { UPGRADE_DEFINITIONS, upgradeById } from './UpgradeDefinitions.js';

export const UPGRADE_SLOT_LIMIT = 4;

export class UpgradeManager {
  constructor(saveSystem, progress = null) {
    this.saveSystem = saveSystem;
    this.progress = progress ?? saveSystem.loadProgress();
    this.#migrateLoadout();
  }

  levelFor(upgradeId) {
    return Math.max(0, Number(this.progress.upgradeLevels?.[upgradeId]) || 0);
  }

  availableStars() {
    return Math.max(0, Number(this.progress.availableStars) || 0);
  }

  equipped() {
    return [...(this.progress.equippedUpgrades ?? [])]
      .filter((upgradeId) => this.levelFor(upgradeId) > 0 && upgradeById(upgradeId))
      .slice(0, UPGRADE_SLOT_LIMIT);
  }

  equippedDefinitions() {
    return this.equipped().map(upgradeById).filter(Boolean);
  }

  isEquipped(upgradeId) {
    return this.equipped().includes(upgradeId);
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
    if (!this.isEquipped(upgradeId) && this.equipped().length < UPGRADE_SLOT_LIMIT) {
      this.progress.equippedUpgrades = [...this.equipped(), upgradeId];
    }
    this.#transaction('upgrade_purchase', { upgradeId, level: check.nextLevel, stars: -check.cost });
    this.saveSystem.saveProgress(this.progress);
    return { ok: true, ...check };
  }

  canEquip(upgradeId) {
    if (!upgradeById(upgradeId)) return { ok: false, reason: 'Unknown upgrade' };
    if (this.levelFor(upgradeId) <= 0) return { ok: false, reason: 'Not installed' };
    if (this.isEquipped(upgradeId)) return { ok: false, reason: 'Already equipped' };
    if (this.equipped().length >= UPGRADE_SLOT_LIMIT) return { ok: false, reason: 'Upgrade slots full' };
    return { ok: true };
  }

  equip(upgradeId) {
    const check = this.canEquip(upgradeId);
    if (!check.ok) return check;
    this.progress.equippedUpgrades = [...this.equipped(), upgradeId];
    this.#transaction('upgrade_equip', { upgradeId });
    this.saveSystem.saveProgress(this.progress);
    return { ok: true };
  }

  unequip(upgradeId) {
    this.progress.equippedUpgrades = this.equipped().filter((id) => id !== upgradeId);
    this.#transaction('upgrade_unequip', { upgradeId });
    this.saveSystem.saveProgress(this.progress);
    return { ok: true };
  }

  reset(refundPercent = 0.8) {
    const spent = Number(this.progress.starsSpent) || 0;
    const refund = Math.floor(spent * refundPercent);
    this.progress.upgradeLevels = {};
    this.progress.equippedUpgrades = [];
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

  #migrateLoadout() {
    if (this.progress.upgradeLoadoutMigrated) return;
    const owned = UPGRADE_DEFINITIONS
      .filter((upgrade) => this.levelFor(upgrade.upgradeId) > 0)
      .map((upgrade) => upgrade.upgradeId);
    if (Array.isArray(this.progress.equippedUpgrades) && this.progress.equippedUpgrades.length > 0) {
      this.progress.upgradeLoadoutMigrated = true;
      this.saveSystem.saveProgress(this.progress);
      return;
    }
    this.progress.equippedUpgrades = UPGRADE_DEFINITIONS
      .filter((upgrade) => this.levelFor(upgrade.upgradeId) > 0)
      .map((upgrade) => upgrade.upgradeId)
      .slice(0, UPGRADE_SLOT_LIMIT);
    if (!owned.length) this.progress.equippedUpgrades = [];
    this.progress.upgradeLoadoutMigrated = true;
    this.saveSystem.saveProgress(this.progress);
  }
}
