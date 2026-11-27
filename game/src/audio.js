// Kalkun Kabur — audio.js
// Semua bunyi disintesis dengan WebAudio: tanpa file suara, tanpa network.
// AudioContext baru dibuat saat gestur pertama pemain, jadi halaman yang
// dibuka tanpa interaksi tetap diam (dan adegan screenshot tidak bersuara).

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.alarmTimer = 0;
  }

  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(frequency, duration, type, volume, slideTo) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  noise(duration, volume, lowpass) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    source.start(now);
  }

  // Suara khas kalkun: dua kali "gobble" turun-naik.
  gobble() {
    this.tone(320, 0.09, 'square', 0.10, 180);
    setTimeout(() => this.tone(380, 0.09, 'square', 0.10, 200), 110);
    setTimeout(() => this.tone(300, 0.12, 'square', 0.09, 150), 230);
  }

  jump() {
    this.noise(0.16, 0.12, 1800);
    this.tone(300, 0.14, 'sine', 0.08, 620);
  }

  land() {
    this.noise(0.08, 0.10, 700);
  }

  pickup() {
    this.tone(880, 0.08, 'sine', 0.12, 1320);
    setTimeout(() => this.tone(1320, 0.10, 'sine', 0.10, 1760), 70);
  }

  thud() {
    this.noise(0.22, 0.22, 500);
    this.tone(140, 0.25, 'sawtooth', 0.14, 60);
  }

  // Alarm pendek saat petani sudah sangat dekat.
  alarm() {
    const now = performance.now();
    if (now - this.alarmTimer < 900) return;
    this.alarmTimer = now;
    this.tone(520, 0.12, 'square', 0.07, 700);
    setTimeout(() => this.tone(520, 0.12, 'square', 0.07, 700), 160);
  }

  stageUp() {
    [523, 659, 784].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.16, 'triangle', 0.12), i * 110);
    });
  }

  win() {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.22, 'triangle', 0.13), i * 130);
    });
  }

  lose() {
    [392, 330, 262, 196].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.28, 'sawtooth', 0.09), i * 180);
    });
  }
}
