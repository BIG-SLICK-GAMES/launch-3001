export class AudioSystem {
  constructor(settings) {
    this.settings = settings;
    this.context = null;
    this.engine = null;
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
    this.#tone(82, 0.32, 0.2, 'sawtooth');
    window.setTimeout(() => this.#tone(48, 0.42, 0.16, 'triangle'), 90);
  }

  playLanding(perfect = false) {
    this.#tone(perfect ? 740 : 520, 0.12, 0.08);
    window.setTimeout(() => this.#tone(perfect ? 980 : 660, 0.16, perfect ? 0.11 : 0.08), 90);
  }

  playCheckpoint() {
    this.#tone(660, 0.08, 0.07);
    window.setTimeout(() => this.#tone(880, 0.1, 0.08), 80);
    window.setTimeout(() => this.#tone(1180, 0.16, 0.07), 170);
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
    if (!this.context || this.settings.muted || this.engine) return;
    const now = this.context.currentTime;
    const master = this.context.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime((this.settings.volume ?? 0.55) * 0.12, now + 0.16);

    const low = this.context.createOscillator();
    low.type = 'sine';
    low.frequency.setValueAtTime(54, now);
    const lowGain = this.context.createGain();
    lowGain.gain.value = 0.42;

    const rumble = this.context.createOscillator();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(86, now);
    const rumbleGain = this.context.createGain();
    rumbleGain.gain.value = 0.14;

    const noise = this.context.createBufferSource();
    noise.buffer = this.#noiseBuffer();
    noise.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    const noiseGain = this.context.createGain();
    noiseGain.gain.value = 0.16;

    low.connect(lowGain).connect(master);
    rumble.connect(rumbleGain).connect(master);
    noise.connect(filter).connect(noiseGain).connect(master);
    master.connect(this.context.destination);
    low.start(now);
    rumble.start(now);
    noise.start(now);
    this.engine = { low, rumble, noise, master };
  }

  stopEngine() {
    if (!this.engine) return;
    const now = this.context.currentTime;
    this.engine.master.gain.setTargetAtTime(0, now, 0.08);
    this.engine.low.stop(now + 0.22);
    this.engine.rumble.stop(now + 0.22);
    this.engine.noise.stop(now + 0.22);
    this.engine = null;
  }

  #noiseBuffer() {
    if (this.noiseBuffer) return this.noiseBuffer;
    const length = Math.floor((this.context?.sampleRate ?? 44100) * 1.4);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      last = last * 0.86 + (Math.random() * 2 - 1) * 0.14;
      data[i] = last;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  #tone(freq, duration, gainValue, type = 'triangle') {
    if (!this.context || this.settings.muted) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.frequency.value = freq;
    osc.type = type;
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
