import { create } from 'zustand'

// ── Mute state (Zustand) ────────────────────────────────────────────

interface AudioStoreState {
  muted: boolean
  initialized: boolean
  toggleMute: () => void
}

export const useAudioStore = create<AudioStoreState>((set) => ({
  muted: false,
  initialized: false,
  toggleMute: () =>
    set((s) => {
      const next = !s.muted
      if (master) master.gain.value = next ? 0 : 1.0
      return { muted: next }
    }),
}))

// ── Module-level audio context ──────────────────────────────────────

let ctx: AudioContext | null = null
let master: GainNode | null = null

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return
  }

  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = useAudioStore.getState().muted ? 0 : 1.0
  master.connect(ctx.destination)

  useAudioStore.setState({ initialized: true })
}

// ── Public play function ────────────────────────────────────────────

export function playSound(name: string) {
  if (!ctx || !master || useAudioStore.getState().muted) return
  if (ctx.state === 'suspended') ctx.resume()

  const c = ctx
  const m = master

  switch (name) {
    case 'keyboard':
      synthTone(c, m, 0.30, 3800, 'sine', 0.02)
      break
    case 'mug':
      synthTone(c, m, 0.35, 1200, 'sine', 0.12)
      break
    case 'paper':
      synthNoiseBurst(c, m, 0.25, 0.06, 3000, 9000)
      break
    case 'stapler':
      synthTone(c, m, 0.35, 600, 'sine', 0.05)
      break
    case 'pen':
      for (let i = 0; i < 3; i++) {
        setTimeout(() => synthTone(c, m, 0.20, 2400 + i * 300, 'sine', 0.015), i * 25)
      }
      break
    case 'leaf':
      synthNoiseBurst(c, m, 0.18, 0.08, 2000, 6000)
      break
    case 'lamp':
      synthTone(c, m, 0.30, 1800, 'sine', 0.025)
      break
    case 'phone':
      synthDialTone(c, m)
      break
    case 'window-open':
      synthSweep(c, m, 0.25, 600, 1400, 0.08)
      break
    case 'window-close':
      synthSweep(c, m, 0.25, 1200, 500, 0.07)
      break
    case 'icon':
      synthTone(c, m, 0.25, 1400, 'sine', 0.04)
      break
    case 'error':
      synthTone(c, m, 0.30, 440, 'sine', 0.15)
      setTimeout(() => synthTone(c, m, 0.30, 340, 'sine', 0.15), 130)
      break
    case 'success':
      synthChime(c, m, [523, 659, 784], 0.25, 0.08)
      break
    case 'verify':
      synthChime(c, m, [523, 659, 784, 1047], 0.20, 0.07)
      break
    case 'snap':
      synthTone(c, m, 0.30, 2200, 'sine', 0.015)
      break
    case 'fan':
      synthSweep(c, m, 0.20, 200, 400, 0.3)
      break
    case 'ping':
      synthTone(c, m, 0.30, 1047, 'sine', 0.25)
      break
    case 'disco':
      synthChime(c, m, [329.63, 440, 523.25, 659.25], 0.25, 0.1)
      break
  }
}

// ── Firestone melody (Kygo-style pluck loop) ────────────────────────

export function playFirestone() {
  if (!ctx || !master || useAudioStore.getState().muted) return
  if (ctx.state === 'suspended') ctx.resume()
  _playFirestoneInner(ctx, master)
}

function _playFirestoneInner(c: AudioContext, m: GainNode) {
  const bpm = 120
  const beat = 60 / bpm // 0.5s per beat
  const t = c.currentTime + 0.1

  // Kygo-style pluck — triangle wave, fast attack, medium decay
  function pluck(freq: number, time: number, dur: number, vol: number) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq

    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(vol, time + 0.008)
    gain.gain.exponentialRampToValueAtTime(vol * 0.25, time + 0.06)
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur)

    osc.connect(gain)
    gain.connect(m)
    osc.start(time)
    osc.stop(time + dur + 0.02)
  }

  // Sub bass
  function bass(freq: number, time: number, dur: number) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq

    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.12, time + 0.05)
    gain.gain.setValueAtTime(0.12, time + dur - 0.08)
    gain.gain.linearRampToValueAtTime(0, time + dur)

    osc.connect(gain)
    gain.connect(m)
    osc.start(time)
    osc.stop(time + dur + 0.02)
  }

  // Warm pad — soft sine chords
  function pad(freqs: number[], time: number, dur: number) {
    for (const freq of freqs) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.035, time + 0.4)
      gain.gain.setValueAtTime(0.035, time + dur - 0.4)
      gain.gain.linearRampToValueAtTime(0, time + dur)

      osc.connect(gain)
      gain.connect(m)
      osc.start(time)
      osc.stop(time + dur + 0.02)
    }
  }

  // Note frequencies (E minor / Em pentatonic)
  const E4 = 329.63, G4 = 392.00, A4 = 440.00, B4 = 493.88
  const D5 = 587.33, E5 = 659.25
  const E3 = 164.81, G3 = 196.00, A3 = 220.00, B3 = 246.94
  const C5 = 523.25, F5 = 698.46

  // Firestone drop melody — 8 bars (16 beats at 120bpm = 8 seconds per loop)
  const melodyPattern = [
    // Bars 1-2: Opening ascending phrase
    { n: E4, t: 0,           d: beat * 0.7 },
    { n: G4, t: beat,        d: beat * 0.7 },
    { n: A4, t: beat * 2,    d: beat * 0.7 },
    { n: B4, t: beat * 3,    d: beat * 1.4 },
    // Bars 3-4: Peak and descent
    { n: D5, t: beat * 4,    d: beat * 0.7 },
    { n: E5, t: beat * 5,    d: beat * 1.4 },
    { n: D5, t: beat * 6.5,  d: beat * 0.7 },
    { n: B4, t: beat * 7.5,  d: beat * 1.4 },
    // Bars 5-6: Second phrase
    { n: A4, t: beat * 8,    d: beat * 0.7 },
    { n: B4, t: beat * 9,    d: beat * 0.7 },
    { n: D5, t: beat * 10,   d: beat * 0.7 },
    { n: B4, t: beat * 11,   d: beat * 1.4 },
    // Bars 7-8: Resolution
    { n: A4, t: beat * 12,   d: beat * 0.7 },
    { n: G4, t: beat * 13,   d: beat * 1.4 },
    { n: E4, t: beat * 14.5, d: beat * 1.4 },
  ]

  // Bass follows chord roots
  const bassPattern = [
    { n: E3, t: 0,           d: beat * 4 },
    { n: G3, t: beat * 4,    d: beat * 4 },
    { n: A3, t: beat * 8,    d: beat * 4 },
    { n: B3, t: beat * 12,   d: beat * 4 },
  ]

  // Chord pads — Em progression
  const chordPattern = [
    { ns: [E4, G4, B4],    t: 0,          d: beat * 4 },
    { ns: [G4, B4, D5],    t: beat * 4,   d: beat * 4 },
    { ns: [A4, C5, E5],    t: beat * 8,   d: beat * 4 },
    { ns: [B4, D5, F5],    t: beat * 12,  d: beat * 4 },
  ]

  const loopLen = beat * 16 // 8s per loop

  // 4 loops = 32 seconds (covers 30s active + 2s fade)
  for (let loop = 0; loop < 4; loop++) {
    const ls = t + loop * loopLen
    const fadeM = loop === 3 ? 0.4 : 1 // fade on last loop

    for (const note of melodyPattern) {
      pluck(note.n, ls + note.t, note.d, 0.22 * fadeM)
    }

    for (const note of bassPattern) {
      bass(note.n, ls + note.t, note.d)
    }

    for (const chord of chordPattern) {
      pad(chord.ns, ls + chord.t, chord.d)
    }
  }
}

// ── Synthesis primitives ────────────────────────────────────────────

function synthTone(
  c: AudioContext, m: GainNode,
  vol: number, freq: number, type: OscillatorType, dur: number,
) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  osc.connect(gain)
  gain.connect(m)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + dur + 0.01)
}

function synthNoiseBurst(
  c: AudioContext, m: GainNode,
  vol: number, dur: number, loFreq: number, hiFreq: number,
) {
  const bufferSize = Math.max(1, Math.ceil(c.sampleRate * dur))
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

  const src = c.createBufferSource()
  src.buffer = buffer

  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = (loFreq + hiFreq) / 2
  bp.Q.value = 0.8

  const gain = c.createGain()
  gain.gain.setValueAtTime(vol, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)

  src.connect(bp)
  bp.connect(gain)
  gain.connect(m)
  src.start(c.currentTime)
}

function synthSweep(
  c: AudioContext, m: GainNode,
  vol: number, startFreq: number, endFreq: number, dur: number,
) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(startFreq, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(endFreq, c.currentTime + dur)
  gain.gain.setValueAtTime(vol, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  osc.connect(gain)
  gain.connect(m)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + dur + 0.01)
}

function synthDialTone(c: AudioContext, m: GainNode) {
  const dur = 0.8
  for (const freq of [350, 440]) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.20, c.currentTime)
    gain.gain.setValueAtTime(0.20, c.currentTime + dur - 0.05)
    gain.gain.linearRampToValueAtTime(0, c.currentTime + dur)
    osc.connect(gain)
    gain.connect(m)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + dur + 0.01)
  }
}

function synthChime(
  c: AudioContext, m: GainNode,
  freqs: number[], vol: number, noteDur: number,
) {
  freqs.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = c.currentTime + i * noteDur
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(vol, start + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, start + noteDur * 2)
    osc.connect(gain)
    gain.connect(m)
    osc.start(start)
    osc.stop(start + noteDur * 2 + 0.01)
  })
}
