export const STATES = Object.freeze({
  BOOT: 'BOOT',
  SPLASH: 'SPLASH',
  DEVICE_SELECT: 'DEVICE_SELECT',
  LOBBY: 'LOBBY',
  MENU: 'MENU',
  LEVEL_SELECT: 'LEVEL_SELECT',
  READY: 'READY',
  FLYING: 'FLYING',
  LANDED: 'LANDED',
  CRASHED: 'CRASHED',
  DEMO_COMPLETE: 'DEMO_COMPLETE',
  PAUSED: 'PAUSED',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_COMPLETE: 'GAME_COMPLETE'
});

const allowed = {
  [STATES.BOOT]: [STATES.SPLASH, STATES.DEVICE_SELECT, STATES.LOBBY, STATES.MENU, STATES.READY],
  [STATES.SPLASH]: [STATES.DEVICE_SELECT, STATES.LOBBY, STATES.READY],
  [STATES.DEVICE_SELECT]: [STATES.LOBBY],
  [STATES.LOBBY]: [STATES.DEVICE_SELECT, STATES.LEVEL_SELECT, STATES.READY, STATES.MENU],
  [STATES.MENU]: [STATES.LEVEL_SELECT, STATES.READY, STATES.LOBBY],
  [STATES.LEVEL_SELECT]: [STATES.MENU, STATES.LOBBY, STATES.READY],
  [STATES.READY]: [STATES.FLYING, STATES.PAUSED, STATES.MENU, STATES.LOBBY],
  [STATES.FLYING]: [STATES.PAUSED, STATES.LANDED, STATES.CRASHED, STATES.READY, STATES.MENU, STATES.DEMO_COMPLETE],
  [STATES.PAUSED]: [STATES.FLYING, STATES.READY, STATES.MENU, STATES.LEVEL_SELECT, STATES.LOBBY],
  [STATES.LANDED]: [STATES.LEVEL_COMPLETE, STATES.READY],
  [STATES.LEVEL_COMPLETE]: [STATES.READY, STATES.GAME_COMPLETE, STATES.LEVEL_SELECT, STATES.MENU],
  [STATES.CRASHED]: [STATES.READY, STATES.MENU, STATES.LOBBY],
  [STATES.DEMO_COMPLETE]: [STATES.READY, STATES.MENU, STATES.LEVEL_SELECT, STATES.LOBBY],
  [STATES.GAME_COMPLETE]: [STATES.MENU, STATES.LEVEL_SELECT, STATES.READY, STATES.LOBBY]
};

export class GameState {
  constructor() {
    this.current = STATES.BOOT;
    this.previous = null;
    this.listeners = new Set();
    this.timers = new Set();
  }

  is(state) {
    return this.current === state;
  }

  canTransition(next) {
    return this.current === next || allowed[this.current]?.includes(next);
  }

  transition(next, payload = {}) {
    if (!this.canTransition(next)) return false;
    this.previous = this.current;
    this.current = next;
    this.listeners.forEach((listener) => listener(next, this.previous, payload));
    return true;
  }

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  delay(callback, ms) {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, ms);
    this.timers.add(id);
    return id;
  }

  clearTimers() {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers.clear();
  }
}
