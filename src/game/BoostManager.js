import { BOOST_DEFINITIONS, boostById } from './BoostDefinitions.js';

export class BoostManager {
  constructor(saveSystem, progress = null) {
    this.saveSystem = saveSystem;
    this.progress = progress ?? saveSystem.loadProgress();
    this.runConsumed = new Set();
    this.runActivated = new Set();
    this.activeCheckpointBoosts = new Set();
  }

  beginCheckpoint() {
    this.runConsumed = new Set();
    this.runActivated = new Set();
    this.activeCheckpointBoosts = new Set();
    for (const boost of this.equippedDefinitions()) {
      if (boost.durationType === 'EntireCheckpoint' && this.consume(boost.boostId)) {
        this.activeCheckpointBoosts.add(boost.boostId);
      }
    }
  }

  quantity(boostId) {
    return Math.max(0, Number(this.progress.boostInventory?.[boostId]) || 0);
  }

  equipped() {
    return [...(this.progress.equippedBoosts ?? [])].slice(0, 3);
  }

  equippedDefinitions() {
    return this.equipped().map(boostById).filter(Boolean).filter((boost) => this.quantity(boost.boostId) > 0 || this.activeCheckpointBoosts.has(boost.boostId));
  }

  canEquip(boostId) {
    if (!boostById(boostId)) return { ok: false, reason: 'Unknown boost' };
    if (this.quantity(boostId) <= 0) return { ok: false, reason: 'No inventory' };
    const equipped = this.equipped();
    if (equipped.includes(boostId)) return { ok: false, reason: 'Already equipped' };
    if (equipped.length >= 3) return { ok: false, reason: 'Boost slots full' };
    const exclusive = ['emergency_fuel', 'crash_shield', 'checkpoint_insurance'];
    if (exclusive.includes(boostId) && equipped.includes(boostId)) return { ok: false, reason: 'Only one allowed' };
    return { ok: true };
  }

  equip(boostId) {
    const check = this.canEquip(boostId);
    if (!check.ok) return check;
    this.progress.equippedBoosts = [...this.equipped(), boostId];
    this.#transaction('boost_equip', { boostId });
    this.saveSystem.saveProgress(this.progress);
    return { ok: true };
  }

  unequip(boostId) {
    this.progress.equippedBoosts = this.equipped().filter((id) => id !== boostId);
    this.#transaction('boost_unequip', { boostId });
    this.saveSystem.saveProgress(this.progress);
    return { ok: true };
  }

  grant(boostId, quantity, type = 'boost_grant') {
    if (!boostById(boostId) || quantity <= 0) return { ok: false };
    this.progress.boostInventory = {
      ...(this.progress.boostInventory ?? {}),
      [boostId]: this.quantity(boostId) + quantity
    };
    this.#transaction(type, { boostId, quantity });
    this.saveSystem.saveProgress(this.progress);
    return { ok: true };
  }

  consume(boostId) {
    if (!this.equipped().includes(boostId) || this.quantity(boostId) <= 0 || this.runConsumed.has(boostId)) return false;
    this.progress.boostInventory = { ...(this.progress.boostInventory ?? {}), [boostId]: this.quantity(boostId) - 1 };
    this.runConsumed.add(boostId);
    this.#transaction('boost_consumed', { boostId, quantity: -1 });
    this.saveSystem.saveProgress(this.progress);
    return true;
  }

  activate(boostId) {
    const boost = boostById(boostId);
    if (!boost || this.runActivated.has(boostId)) return null;
    if (!this.consume(boostId)) return null;
    this.runActivated.add(boostId);
    return boost;
  }

  activateByType(activationType) {
    return this.equippedDefinitions()
      .filter((boost) => boost.activationType === activationType)
      .map((boost) => this.activate(boost.boostId))
      .filter(Boolean);
  }

  #transaction(type, payload) {
    this.progress.boostTransactions = [
      ...(this.progress.boostTransactions ?? []),
      { id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`, type, at: new Date().toISOString(), ...payload }
    ].slice(-100);
  }
}
