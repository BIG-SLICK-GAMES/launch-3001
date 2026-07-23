import { BSG_HUB_ORIGINS, HOLDEN_AUTH_URL, LOCAL_PLATFORM_PROFILE_URL, LOGIN_URL, PRODUCT_ID, SHOP_URL } from './constants.js';
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
    this.#applyUrlHandoff();
    this.#loadLocalPlatformProfile();
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

  async loginWithCredentials(email, password) {
    const response = await fetch(HOLDEN_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        productId: PRODUCT_ID,
        game: PRODUCT_ID
      })
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // Some auth servers send status-only failures.
    }

    if (!response.ok) {
      const message = payload?.message || payload?.error || 'Login failed. Check your email and password.';
      throw new Error(message);
    }

    const profile = payload?.profile || payload?.user || payload;
    if (!profile?.id && !profile?.email) throw new Error('Login succeeded, but no player profile was returned.');
    this.applyProfile({
      id: profile.id || profile.sUserID || profile.email,
      name: profile.name || profile.username || profile.sUserName || profile.email || 'BSG Player',
      email: profile.email || profile.sEmail || email,
      avatar: profile.avatar || profile.sAvatar || '',
      token: payload?.token || payload?.accessToken || profile.token || '',
      chips: profile.chips ?? profile.nChips ?? 0,
      purchases: profile.purchases || payload?.purchases || {},
      entitlements: profile.entitlements || payload?.entitlements || {},
      source: profile.source || '21-holden-db'
    }, '21-holden-db');
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
    try {
      localStorage.setItem('launch3001.profile', JSON.stringify(window.__launch3001Profile));
    } catch {
      // Storage can be blocked; the in-memory profile still works for this session.
    }
    this.game.refreshProfile();
  }

  #applyUrlHandoff() {
    if (!window.location.hash.includes('bsgToken=')) return;

    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('bsg') !== '1') return;

    const access = params.get('access') === 'full';
    const profile = {
      id: params.get('id') || `bsg-${params.get('player') || 'player'}`,
      name: params.get('player') || 'BSG Player',
      email: params.get('email') || '',
      avatar: params.get('avatar') || '',
      token: params.get('bsgToken') || '',
      chips: Math.max(0, Number(params.get('chips')) || 0),
      purchases: access ? { [PRODUCT_ID]: true } : {},
      entitlements: access ? { [PRODUCT_ID]: true } : {},
      source: params.get('source') || 'bsg-hub'
    };

    this.applyProfile(profile, 'url-handoff');
    window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
  }

  async #loadLocalPlatformProfile() {
    if (!window.location.hostname.endsWith('.bsg.local')) return;
    try {
      const response = await fetch(LOCAL_PLATFORM_PROFILE_URL, { credentials: 'include' });
      if (!response.ok) return;
      const payload = await response.json();
      const user = payload?.user || payload?.profile;
      if (!user) return;
      this.applyProfile({
        id: user.id,
        name: user.name || user.username || user.sUserName,
        email: user.email || user.sEmail,
        avatar: user.avatar || '',
        chips: user.chips ?? user.nChips ?? 0,
        purchases: user.purchases || {},
        entitlements: user.entitlements || {},
        source: 'bsg-local-platform',
      }, 'bsg-local-platform');
    } catch {
      // Local platform is optional for standalone Launch3001 development.
    }
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
