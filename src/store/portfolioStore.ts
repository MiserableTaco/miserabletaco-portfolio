import { create } from 'zustand'

// ── Content data ────────────────────────────────────────────────────

export const ABOUT_LINES = [
  'G. Singapore.',
  '',
  'Three things shipped:',
  '',
  'TRUST \u2014 AcadCert + VeriCert',
  '  Cryptographic credential verification. RSA-4096, RFC 3161,',
  '  AES-256-GCM. Credentials that outlive institutions.',
  '  > acadcert.com',
  '  > verify.acadcert.com',
  '',
  'CULTURE \u2014 DefMarks',
  '  Finding connections between things people think are unrelated.',
  '  Design, analysis, unexpected threads.',
  '  > defmarks.com',
  '',
  'ARES \u2014 \u6218\u795E (Undertow)',
  '  Political strategy game + book series. 2150 Southeast Asia,',
  '  post-collapse river corridor warfare. Naval combat, faction',
  '  politics, resource scarcity. Writing \u88C2\u4E16\u7EAA\u00B7\u6D4A\u6D41.',
  '  > play.aresundertow.com',
  '',
  'Filter: Build for people who\'ll pay, not crowdsourced ideas.',
  'If users won\'t open wallets, it\'s not ready.',
  '',
  'Chinese literature, invisible infrastructure, browser extensions.',
  'The build process matters as much as the output.',
]

export const CONTACT_LINES = [
  'Email: gerard.qiu803@gmail.com',
  'GitHub: Private repos',
  '',
  'Singapore.',
  '',
  'Down to talk: Product collabs, SF worldbuilding, Chinese lit,',
  'browser extensions, trust infrastructure.',
  '',
  'Not interested: Generic pitches, crowdsourced anything,',
  '"just need a developer" requests.',
  '',
  'I ship fast and care about taste.',
]

// ── Link maps (line index → URL) ────────────────────────────────────

export const ABOUT_LINKS: Record<number, string> = {
  7: 'https://acadcert.com',
  8: 'https://verify.acadcert.com',
  13: 'https://defmarks.com',
  19: 'https://play.aresundertow.com',
}

export const CONTACT_LINKS: Record<number, string> = {
  0: 'mailto:gerard.qiu803@gmail.com',
}

// ── Store ───────────────────────────────────────────────────────────

interface PortfolioState {
  scrollOffsets: Record<string, number>
  scroll: (app: string, delta: number, maxScroll: number) => void
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  scrollOffsets: {},

  scroll: (app, delta, maxScroll) => {
    const offsets = get().scrollOffsets
    const current = offsets[app] ?? 0
    const next = Math.max(0, Math.min(current + delta, maxScroll))
    set({ scrollOffsets: { ...offsets, [app]: next } })
  },
}))
