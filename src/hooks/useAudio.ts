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

// ── Disco melody (tropical pluck loop) ───────────────────────────────

let discoGain: GainNode | null = null

export function playDiscoMelody() {
  if (!ctx || !master || useAudioStore.getState().muted) return
  if (ctx.state === 'suspended') ctx.resume()

  // Dedicated gain node so we can kill all disco audio on stop
  discoGain = ctx.createGain()
  discoGain.connect(master)
  _playDiscoMelody(ctx, discoGain)
}

export function stopDiscoMelody() {
  if (discoGain && ctx) {
    discoGain.gain.setValueAtTime(0, ctx.currentTime)
    discoGain.disconnect()
    discoGain = null
  }
}

// Duration of the melody in seconds (exported so animation can sync)
export const DISCO_MELODY_DURATION = (60 / 114) * 4 * 4 * 3 // ~25.3s

function _playDiscoMelody(c: AudioContext, m: GainNode) {
  // Original tropical pluck melody — D major / B minor, ~114 BPM
  // Chord progression: G - A - Bm - D (IV - V - vi - I)
  const bpm = 114
  const beat = 60 / bpm // ~0.526s per beat
  const eighth = beat / 2
  const t = c.currentTime + 0.1

  // Tropical pluck — triangle + slight detuned layer for width
  function pluck(freq: number, time: number, dur: number, vol: number) {
    for (const detune of [0, 6]) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      osc.detune.value = detune

      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(vol * (detune ? 0.4 : 1), time + 0.005)
      gain.gain.exponentialRampToValueAtTime(vol * 0.15, time + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur)

      osc.connect(gain)
      gain.connect(m)
      osc.start(time)
      osc.stop(time + dur + 0.02)
    }
  }

  // Sub bass — sine, follows chord roots
  function bass(freq: number, time: number, dur: number) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.10, time + 0.04)
    gain.gain.setValueAtTime(0.10, time + dur - 0.06)
    gain.gain.linearRampToValueAtTime(0, time + dur)
    osc.connect(gain)
    gain.connect(m)
    osc.start(time)
    osc.stop(time + dur + 0.02)
  }

  // Pad — warm sine chord, very soft
  function pad(freqs: number[], time: number, dur: number) {
    for (const freq of freqs) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.025, time + 0.3)
      gain.gain.setValueAtTime(0.025, time + dur - 0.3)
      gain.gain.linearRampToValueAtTime(0, time + dur)
      osc.connect(gain)
      gain.connect(m)
      osc.start(time)
      osc.stop(time + dur + 0.02)
    }
  }

  // D major scale notes
  const Fs4 = 369.99, G4 = 392.00, A4 = 440.00, B4 = 493.88
  const Cs5 = 554.37, D5 = 587.33, Fs5 = 739.99
  const D4 = 293.66, E5 = 659.25
  // Bass register
  const G2 = 98.00, A2 = 110.00, B2 = 123.47, D3 = 146.83

  // 4 bars per section, each bar = 4 beats at 114bpm = ~2.1s per bar
  const barLen = beat * 4

  // Vocal-style pluck melody over chord progression
  const melody = [
    // Bar 1 (G) — "Our hearts are like fire-stones"
    { n: Fs4, t: eighth },          // "Our"
    { n: Fs4, t: beat },            // "hearts"
    { n: Fs4, t: beat + eighth },   // "are"
    { n: A4, t: beat * 2 },         // "like"
    { n: B4, t: beat * 2 + eighth },// "fire-"
    { n: A4, t: beat * 3 + eighth },// "-stones"

    // Bar 2 (A) — "And when they strike, we feel the love"
    { n: Fs4, t: barLen + eighth },           // "And"
    { n: Fs4, t: barLen + beat },             // "when"
    { n: A4, t: barLen + beat + eighth },     // "they"
    { n: B4, t: barLen + beat * 2 },          // "strike"
    { n: D5, t: barLen + beat * 2 + eighth }, // "we"
    { n: B4, t: barLen + beat * 3 },          // "feel the"
    { n: A4, t: barLen + beat * 3 + eighth }, // "love"

    // Bar 3 (Bm) — "Sparks will fly, they ignite our bones"
    { n: Fs4, t: barLen * 2 + eighth },           // "Sparks"
    { n: A4, t: barLen * 2 + beat },               // "will"
    { n: B4, t: barLen * 2 + beat + eighth },      // "fly"
    { n: B4, t: barLen * 2 + beat * 2 },           // "they ig-"
    { n: A4, t: barLen * 2 + beat * 2 + eighth },  // "-nite"
    { n: B4, t: barLen * 2 + beat * 3 },           // "our"
    { n: Fs4, t: barLen * 2 + beat * 3 + eighth }, // "bones"

    // Bar 4 (D) — "And when they strike, we light up the world"
    { n: Fs4, t: barLen * 3 + eighth },           // "And"
    { n: A4, t: barLen * 3 + beat },               // "when they"
    { n: B4, t: barLen * 3 + beat + eighth },      // "strike"
    { n: D5, t: barLen * 3 + beat * 2 },           // "we"
    { n: D5, t: barLen * 3 + beat * 2 + eighth },  // "light up"
    { n: B4, t: barLen * 3 + beat * 3 },           // "the"
    { n: A4, t: barLen * 3 + beat * 3 + eighth },  // "world"
  ]

  // Bass — chord roots on each bar
  const bassNotes = [
    { n: G2, t: 0,          d: barLen },
    { n: A2, t: barLen,     d: barLen },
    { n: B2, t: barLen * 2, d: barLen },
    { n: D3, t: barLen * 3, d: barLen },
  ]

  // Pad chords — G, A, Bm, D (lower voicing to not clash with melody)
  const chords = [
    { ns: [G4, B4, D5],       t: 0,          d: barLen },
    { ns: [A4, Cs5, E5],      t: barLen,     d: barLen },
    { ns: [B4, D5, Fs5],      t: barLen * 2, d: barLen },
    { ns: [D4, Fs4, A4],      t: barLen * 3, d: barLen },
  ]

  const loopLen = barLen * 4 // ~8.4s per loop

  // 3 loops = ~25s
  for (let loop = 0; loop < 3; loop++) {
    const ls = t + loop * loopLen
    const fadeM = loop === 2 ? 0.5 : 1

    for (const note of melody) {
      pluck(note.n, ls + note.t, beat * 0.6, 0.18 * fadeM)
    }
    for (const note of bassNotes) {
      bass(note.n, ls + note.t, note.d)
    }
    for (const chord of chords) {
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
