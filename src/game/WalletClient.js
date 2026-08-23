import { BONUS_STAR_PACKAGES } from './BoostDefinitions.js';
import { boostById } from './BoostDefinitions.js';

export class WalletClient {
  constructor(game) {
    this.game = game;
  }

  async purchaseBoost(boostId, quantity = 1) {
    const boost = boostById(boostId);
    if (!boost) return { ok: false, reason: 'Unknown boost' };
    return this.#securePurchase('boost', {
      itemId: boostId,
      quantity,
      chipCost: boost.chipPrice * quantity
    });
  }

  async purchaseStars(packageId) {
    const pack = BONUS_STAR_PACKAGES.find((entry) => entry.packageId === packageId);
    if (!pack) return { ok: false, reason: 'Unknown star package' };
    return this.#securePurchase('bonus_stars', {
      itemId: packageId,
      quantity: pack.stars,
      chipCost: pack.chipPrice
    });
  }

  async #securePurchase(type, payload) {
    const profile = this.game.profile.profile;
    if (!profile?.id || profile.id === 'guest') return { ok: false, reason: 'BSG login required' };
    if ((profile.chips ?? 0) < payload.chipCost) return { ok: false, reason: 'Not enough balance' };
    const transactionId = `${type}-${payload.itemId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      const response = await fetch('/platform/wallet/launch3001/purchase', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, transactionId, productId: 'launch3001', ...payload })
      });
      if (!response.ok) return { ok: false, reason: 'Wallet server rejected the purchase' };
      const receipt = await response.json();
      return { ok: true, transactionId, receipt };
    } catch {
      return { ok: false, reason: 'Wallet server unavailable. Chips were not changed.' };
    }
  }
}
