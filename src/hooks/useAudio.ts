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
    case 'drawer':
      synthSweep(c, m, 0.25, 300, 800, 0.18)
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
    case 'ping':
      synthTone(c, m, 0.30, 1047, 'sine', 0.25)
      break
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
