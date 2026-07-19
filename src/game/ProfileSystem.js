import { PRODUCT_ID } from './constants.js';

export class ProfileSystem {
  constructor(saveSystem) {
    this.saveSystem = saveSystem;
    this.profile = this.#resolveProfile();
  }

  refresh() {
    this.profile = this.#resolveProfile();
    return this.profile;
  }

  hasPurchase(productId = PRODUCT_ID) {
    return Boolean(this.profile.purchases?.[productId]);
  }

  #resolveProfile() {
    const injected = window.BSG_PROFILE ?? window.launch3001Profile ?? null;
    const fromMessage = window.__launch3001Profile ?? null;
    const local = this.saveSystem.loadProfile();
    const profile = {
      id: 'guest',
      name: 'Guest Pilot',
      email: '',
      avatar: '',
      purchases: {},
      source: 'guest',
      ...local,
      ...fromMessage,
      ...injected
    };
    profile.purchases = {
      ...(local.purchases ?? {}),
      ...(fromMessage?.purchases ?? {}),
      ...(injected?.purchases ?? {})
    };
    const params = new URLSearchParams(window.location.search);
    if (params.get('full') === '1') {
      profile.purchases[PRODUCT_ID] = true;
      profile.source = 'url-dev';
    }
    return profile;
  }
}
