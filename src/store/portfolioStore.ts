import { create } from 'zustand'

// ── Content data ────────────────────────────────────────────────────

export const TRUST_FRAGMENTS = [
  '4a9f2c8b7e3d1a5f', '8e1c3f9a2d7b4e6c', '2b7e4d1c9f3a8e5d',
  '9c3e1f7a4d2b8e6f', '7d4e2b1c8f9a3e5c', '1f8e3c9b2d4a7e6c',
  '3a7e9c1d4f2b8e5c', '6e2d8f3c1a9b4e7c', '5c9e1f4a3d7b2e8c',
  '8b3f1e7c9d2a4e6c', '2e9c4f1a7d3b8e5c', '4c7e1f9a2d3b8e6c',
]

export interface CultureNode {
  id: string
  label: string
  rx: number // 0-1 fraction of content width
  ry: number // 0-1 fraction of content height
}

export const CULTURE_NODES: CultureNode[] = [
  { id: '1', label: 'Literature', rx: 0.15, ry: 0.18 },
  { id: '2', label: 'Film', rx: 0.50, ry: 0.12 },
  { id: '3', label: 'Code', rx: 0.82, ry: 0.20 },
  { id: '4', label: 'Design', rx: 0.18, ry: 0.48 },
  { id: '5', label: 'Philosophy', rx: 0.50, ry: 0.42 },
  { id: '6', label: 'History', rx: 0.82, ry: 0.50 },
  { id: '7', label: 'Art', rx: 0.15, ry: 0.75 },
  { id: '8', label: 'Music', rx: 0.50, ry: 0.72 },
  { id: '9', label: 'Technology', rx: 0.82, ry: 0.78 },
  { id: '10', label: 'Science', rx: 0.50, ry: 0.92 },
]

export const CULTURE_DESCRIPTIONS: Record<string, string> = {
  '1': 'The written word persists. Long-form analysis, not hot takes.',
  '2': 'Visual storytelling. How framing shapes perception.',
  '3': 'Code as expression. Tools that think differently.',
  '4': 'Intent made visible. Every pixel is a decision.',
  '5': 'First principles. Question the questions.',
  '6': 'Patterns repeat. Context changes everything.',
  '7': 'Raw signal. What culture looks like before curation.',
  '8': 'Sound as architecture. Emotion without words.',
  '9': 'Tools reshape thought. The medium is the message.',
  '10': 'Empiricism. What survives contact with reality.',
}

export const UNDERTOW_FRAGMENTS = [
  '2150. Southeast Asia river corridor.',
  'Post-collapse. Fractured factions.',
  'Political grand strategy. Character-driven.',
  'Command fleets. Navigate council politics.',
  'Survive 40 turns. Every decision costs.',
  'Hex-based tactical gameplay.',
  'Web-playable alpha. Desktop Chrome.',
]

export const ABOUT_LINES = [
  'G. Solo indie dev, Singapore.',
  '',
  'Three projects:',
  '',
  'TRUST  —  AcadCert + VeriCert',
  '  Cryptographic credential platform. RSA-4096,',
  '  RFC 3161, AES-256-GCM. Building credentials',
  '  that outlive the institutions that issue them.',
  '  > acadcert.com',
  '  > verify.acadcert.com',
  '',
  'CULTURE  —  DefMarks',
  '  Cultural publication. Finding connections',
  '  between things people assume are unrelated.',
  '  Articles, analysis, unexpected threads.',
  '  > defmarks.com',
  '',
  'CONSCIOUSNESS  —  ARES',
  '  Science fiction universe. Book series + grand',
  '  strategy game set in 2150 Southeast Asia.',
  '  Post-collapse river corridor politics.',
  '  > play.aresundertow.com',
  '',
  'I like invisible infrastructure plays.',
  'Willing-to-pay users, not crowdsourced ideas.',
  'Strong filter for things that won\'t work',
  'in practice.',
  '',
  'Long-term: ARES as identity infrastructure.',
  'Define what you did, who you are, that you are.',
]

export const CONTACT_LINES = [
  'Email: gerard.qiu803@gmail.com',
  'GitHub: github.com/MiserableTaco',
  '',
  'Singapore.',
  '',
  'Down to talk about:',
  '  Technical collabs, indie product ideas,',
  '  Chinese literature, SF worldbuilding,',
  '  browser extensions.',
  '',
  'Not interested in:',
  '  Generic pitches, crowdsourced anything,',
  '  consulting unrelated to my work.',
]

// ── Link maps (line index → URL) ────────────────────────────────────

export const ABOUT_LINKS: Record<number, string> = {
  8: 'https://acadcert.com',
  9: 'https://verify.acadcert.com',
  15: 'https://defmarks.com',
  21: 'https://play.aresundertow.com',
}

export const CONTACT_LINKS: Record<number, string> = {
  0: 'mailto:gerard.qiu803@gmail.com',
  1: 'https://github.com/MiserableTaco',
}

// ── Store ───────────────────────────────────────────────────────────

interface PortfolioState {
  trust: { verified: boolean[]; complete: boolean }
  culture: { explored: boolean[]; lastExplored: string | null; complete: boolean }
  undertow: { revealed: boolean[]; fragmentCount: number; complete: boolean }
  scrollOffsets: Record<string, number>

  verifyTrustFragment: (index: number) => void
  exploreCultureNode: (nodeId: string) => void
  revealUndertowHex: (index: number) => void
  scroll: (app: string, delta: number, maxScroll: number) => void
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  trust: { verified: Array(12).fill(false), complete: false },
  culture: { explored: Array(10).fill(false), lastExplored: null, complete: false },
  undertow: { revealed: Array(12).fill(false), fragmentCount: 0, complete: false },
  scrollOffsets: {},

  verifyTrustFragment: (index) => {
    const { trust } = get()
    if (trust.verified[index] || trust.complete) return

    const newVerified = [...trust.verified]
    newVerified[index] = true
    const count = newVerified.filter(Boolean).length
    set({ trust: { verified: newVerified, complete: count >= 10 } })
  },

  exploreCultureNode: (nodeId) => {
    const { culture } = get()
    if (culture.complete) return

    const index = parseInt(nodeId) - 1
    const newExplored = [...culture.explored]
    newExplored[index] = true
    const count = newExplored.filter(Boolean).length
    set({
      culture: {
        explored: newExplored,
        lastExplored: nodeId,
        complete: count >= 7,
      },
    })
  },

  revealUndertowHex: (index) => {
    const { undertow } = get()
    if (undertow.revealed[index] || undertow.complete) return

    const newRevealed = [...undertow.revealed]
    newRevealed[index] = true
    const count = Math.min(undertow.fragmentCount + 1, UNDERTOW_FRAGMENTS.length)
    set({
      undertow: {
        revealed: newRevealed,
        fragmentCount: count,
        complete: count >= UNDERTOW_FRAGMENTS.length,
      },
    })
  },

  scroll: (app, delta, maxScroll) => {
    const offsets = get().scrollOffsets
    const current = offsets[app] ?? 0
    const next = Math.max(0, Math.min(current + delta, maxScroll))
    set({ scrollOffsets: { ...offsets, [app]: next } })
  },
}))
