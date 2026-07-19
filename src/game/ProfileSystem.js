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
    if (this.profile.purchases?.[productId]) return true;
    if (this.profile.entitlements?.[productId]) return true;
    return false;
  }

  isLoggedIn() {
    return Boolean(this.profile.id && this.profile.id !== 'guest');
  }

  #resolveProfile() {
    const injected = window.BSG_PROFILE ?? window.launch3001Profile ?? null;
    const fromMessage = window.__launch3001Profile ?? null;
    const fromHubStorage = this.#hubStoredProfile();
    const local = this.saveSystem.loadProfile();
    const profile = {
      id: 'guest',
      name: 'Guest Pilot',
      email: '',
      avatar: '',
      purchases: {},
      entitlements: {},
      source: 'guest',
      ...local,
      ...fromHubStorage,
      ...fromMessage,
      ...injected
    };
    profile.purchases = this.#accessMap(local.purchases, fromHubStorage?.purchases, fromMessage?.purchases, injected?.purchases);
    profile.entitlements = this.#accessMap(local.entitlements, fromHubStorage?.entitlements, fromMessage?.entitlements, injected?.entitlements);
    const params = new URLSearchParams(window.location.search);
    if (params.get('full') === '1') {
      profile.purchases[PRODUCT_ID] = true;
      profile.source = 'url-dev';
    }
    return profile;
  }

  #hubStoredProfile() {
    for (const key of ['bsg.profile', 'BSG_PROFILE', 'bsgProfile']) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return { source: 'bsg-storage', ...JSON.parse(raw) };
      } catch {
        // Ignore malformed hub profile caches.
      }
    }
    return null;
  }

  #accessMap(...sources) {
    const access = {};
    for (const source of sources) {
      if (Array.isArray(source)) {
        source.forEach((id) => {
          if (id) access[id] = true;
        });
      } else if (source && typeof source === 'object') {
        Object.assign(access, source);
      }
    }
    return access;
  }
}
