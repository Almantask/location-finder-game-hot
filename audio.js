class AudioSynth {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Lazy initialize AudioContext on user interaction
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playHover() {
    if (this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  playConfirm() {
    if (this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(783.99, now + 0.08); // G5

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playSuccess() {
    if (this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const playTone = (freq, start, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.start(start);
      osc.stop(start + duration);
    };

    // Major arpeggio C5 -> E5 -> G5 -> C6
    playTone(523.25, now, 0.2); // C5
    playTone(659.25, now + 0.08, 0.2); // E5
    playTone(783.99, now + 0.16, 0.2); // G5
    playTone(1046.50, now + 0.24, 0.4); // C6
  }

  playFailure() {
    if (this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    // Sad slider
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now); // A3
    osc.frequency.linearRampToValueAtTime(110, now + 0.4); // Drop octave

    // Filter to make it sound muffled
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    
    osc.disconnect(gain);
    osc.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  playHint() {
    if (this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const playBell = (freq, start) => {
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator(); // overtone
      const gain = this.ctx.createGain();

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 1.5, start); // perfect 5th overtone

      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

      osc.start(start);
      osc.stop(start + 0.5);
      
      osc2.start(start);
      osc2.stop(start + 0.5);
    };

    // Double bell chime
    playBell(880, now); // A5
    playBell(1318.51, now + 0.12); // E6
  }

  playVictory() {
    if (this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const notes = [
      { f: 523.25, time: 0 },       // C5
      { f: 587.33, time: 0.1 },     // D5
      { f: 659.25, time: 0.2 },     // E5
      { f: 783.99, time: 0.3 },     // G5
      { f: 659.25, time: 0.45 },    // E5
      { f: 783.99, time: 0.55 },    // G5
      { f: 1046.50, time: 0.65 }    // C6 (held)
    ];

    notes.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.time);

      const vol = note.f === 1046.50 ? 0.18 : 0.12;
      const duration = note.f === 1046.50 ? 0.6 : 0.15;

      gain.gain.setValueAtTime(vol, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + duration);

      osc.start(now + note.time);
      osc.stop(now + note.time + duration);
    });
  }
}

export const synth = new AudioSynth();
export default synth;
