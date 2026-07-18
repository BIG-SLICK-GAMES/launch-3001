export class AudioSystem {
  constructor(settings) {
    this.settings = settings;
    this.context = null;
    this.engineOsc = null;
    this.lastSpeech = new Map();
    this.speechUnlocked = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stopEngine();
    });
  }

  async unlock() {
    this.#unlockSpeech();
    if (this.settings.muted) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      if (!this.context) this.context = new AudioContext();
      if (this.context.state !== 'running') await this.context.resume();
    } catch {
      this.context = null;
    }
  }

  async enable() {
    this.settings.muted = false;
    this.settings.volume = Math.max(this.settings.volume ?? 0.55, 0.7);
    await this.unlock();
    this.playClick();
    this.speak('Audio online.', 'audioOnline', 1000);
  }

  playClick() {
    this.#tone(440, 0.04, 0.025);
  }

  playCrash() {
    this.#tone(82, 0.25, 0.18);
  }

  playLanding(perfect = false) {
    this.#tone(perfect ? 880 : 620, 0.16, 0.12);
  }

  speak(line, key = line, cooldown = 2500) {
    if (this.settings.muted || !('speechSynthesis' in window)) return;
    if (!this.speechUnlocked) this.#unlockSpeech();
    const now = performance.now();
    if (now - (this.lastSpeech.get(key) ?? -Infinity) < cooldown) return;
    this.lastSpeech.set(key, now);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.rate = 1.02;
    utterance.pitch = 0.88;
    utterance.volume = Math.min(1, Math.max(0.15, this.settings.volume ?? 0.55));
    window.speechSynthesis.speak(utterance);
  }

  startEngine() {
    if (!this.context || this.settings.muted || this.engineOsc) return;
    const gain = this.context.createGain();
    gain.gain.value = this.settings.volume * 0.06;
    const osc = this.context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 96;
    osc.connect(gain).connect(this.context.destination);
    osc.start();
    this.engineOsc = { osc, gain };
  }

  stopEngine() {
    if (!this.engineOsc) return;
    this.engineOsc.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.03);
    this.engineOsc.osc.stop(this.context.currentTime + 0.08);
    this.engineOsc = null;
  }

  #tone(freq, duration, gainValue) {
    if (!this.context || this.settings.muted) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.frequency.value = freq;
    osc.type = 'triangle';
    gain.gain.value = this.settings.volume * gainValue;
    osc.connect(gain).connect(this.context.destination);
    osc.start();
    gain.gain.setTargetAtTime(0, this.context.currentTime + duration * 0.55, 0.04);
    osc.stop(this.context.currentTime + duration);
  }

  #unlockSpeech() {
    if (this.speechUnlocked || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    window.speechSynthesis.resume();
    const primer = new SpeechSynthesisUtterance(' ');
    primer.volume = 0;
    primer.rate = 1;
    window.speechSynthesis.speak(primer);
    this.speechUnlocked = true;
  }
}
