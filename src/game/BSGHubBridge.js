import { BSG_HUB_ORIGINS, LOGIN_URL, PRODUCT_ID, SHOP_URL } from './constants.js';
import { BUILD_LABEL } from './buildInfo.js';

const PROFILE_TYPES = ['BSG_PROFILE', 'BSG_PROFILE_RESPONSE', 'BSG_AUTH_PROFILE'];

export class BSGHubBridge {
  constructor(game) {
    this.game = game;
    this.lastHubOrigin = '';
    this.boundMessage = (event) => this.#handleMessage(event);
  }

  start() {
    window.addEventListener('message', this.boundMessage);
    window.launch3001SetProfile = (profile) => this.applyProfile(profile, 'global-api');
    window.requestAnimationFrame(() => this.requestProfile());
  }

  requestProfile() {
    const payload = this.#payload('BSG_PROFILE_REQUEST');
    this.#postToHub(payload);
    this.#postToHub(this.#payload('BSG_GAME_READY'));
  }

  requestLogin() {
    const loginUrl = this.#returnUrl(LOGIN_URL);
    this.#postToHub({
      ...this.#payload('BSG_LOGIN_REQUEST'),
      loginUrl,
      returnUrl: window.location.href
    });
    this.#navigateTo(loginUrl);
  }

  openShop() {
    const url = new URL(SHOP_URL);
    url.searchParams.set('product', PRODUCT_ID);
    url.searchParams.set('currency', 'AUD');
    url.searchParams.set('return', window.location.href);
    this.#postToHub({
      ...this.#payload('BSG_SHOP_REQUEST'),
      shopUrl: url.toString()
    });
    window.open(url.toString(), '_blank', 'noopener');
  }

  #returnUrl(baseUrl) {
    const url = new URL(baseUrl);
    url.searchParams.set('product', PRODUCT_ID);
    url.searchParams.set('return', window.location.href);
    return url.toString();
  }

  #navigateTo(url) {
    try {
      if (window.top && window.top !== window) {
        window.top.location.href = url;
        return;
      }
    } catch {
      // Cross-origin frames can block top navigation; current frame is still a safe fallback.
    }
    window.location.href = url;
  }

  applyProfile(profile, source = 'hub') {
    if (!profile || typeof profile !== 'object') return;
    window.__launch3001Profile = {
      ...profile,
      source: profile.source ?? source
    };
    this.game.refreshProfile();
  }

  #handleMessage(event) {
    if (!PROFILE_TYPES.includes(event.data?.type)) return;
    if (!this.#trustedOrigin(event.origin)) return;
    this.lastHubOrigin = event.origin;
    this.applyProfile(event.data.profile, event.origin.includes('bigslickgames.com') ? 'bsg-hub' : 'local-hub');
  }

  #postToHub(payload) {
    const targets = [window.parent !== window ? window.parent : null, window.opener].filter(Boolean);
    for (const target of targets) {
      for (const origin of this.#targetOrigins()) {
        target.postMessage(payload, origin);
      }
    }
  }

  #payload(type) {
    return {
      type,
      game: PRODUCT_ID,
      productId: PRODUCT_ID,
      build: BUILD_LABEL,
      url: window.location.href,
      requestedFields: ['id', 'name', 'email', 'avatar', 'purchases', 'entitlements']
    };
  }

  #targetOrigins() {
    const origins = new Set(BSG_HUB_ORIGINS);
    if (this.lastHubOrigin) origins.add(this.lastHubOrigin);
    if (window.location.origin.startsWith('http')) origins.add(window.location.origin);
    return [...origins];
  }

  #trustedOrigin(origin) {
    if (!origin || origin === 'null') return false;
    if (origin === window.location.origin) return true;
    return BSG_HUB_ORIGINS.includes(origin);
  }
}
