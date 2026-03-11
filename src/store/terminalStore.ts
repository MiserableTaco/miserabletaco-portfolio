import { create } from 'zustand'
import { useDesktopStore } from '@/store/desktopStore'
import { sanitizeInput } from '@/utils/sanitize'

export interface TerminalLine {
  type: 'command' | 'output' | 'error'
  text: string
}

interface TerminalState {
  lines: TerminalLine[]
  commandHistory: string[]
  historyIndex: number
  currentInput: string

  addLine: (line: TerminalLine) => void
  executeCommand: (command: string) => void
  setInput: (input: string) => void
  clearTerminal: () => void
  navigateHistory: (direction: 'up' | 'down') => void
}

const MAX_LINES = 200
const MAX_HISTORY = 50

// Lazy-loaded easter eggs module — only fetched on first non-core command
let easterEggsModule: typeof import('@/store/terminalEasterEggs') | null = null
let easterEggsLoading = false

export const useTerminalStore = create<TerminalState>((set, get) => ({
  lines: [
    { type: 'output', text: 'ARES VERIFICATION PROTOCOL v4.5' },
    { type: 'output', text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
    { type: 'output', text: '' },
    { type: 'output', text: 'INIT SYSTEMS... [OK]' },
    { type: 'output', text: 'LOAD DOMAINS... [OK]' },
    { type: 'output', text: 'AUTH: GUEST' },
    { type: 'output', text: '' },
    { type: 'output', text: "TYPE 'help' FOR COMMANDS" },
    { type: 'output', text: '' },
  ],
  commandHistory: [],
  historyIndex: -1,
  currentInput: '',

  addLine: (line) =>
    set((state) => ({
      lines: [...state.lines.slice(-MAX_LINES), line],
    })),

  setInput: (input) => set({ currentInput: input }),

  executeCommand: (command) => {
    const trimmed = sanitizeInput(command)
    get().addLine({ type: 'command', text: `> ${trimmed}` })

    if (trimmed) {
      set((state) => ({
        commandHistory: [...state.commandHistory.slice(-MAX_HISTORY), trimmed],
        historyIndex: -1,
      }))
    }

    const output = processCommand(trimmed)
    for (const line of output) get().addLine(line)
    set({ currentInput: '' })
  },

  clearTerminal: () => set({ lines: [{ type: 'output', text: '' }] }),

  navigateHistory: (direction) => {
    const { commandHistory, historyIndex } = get()
    if (commandHistory.length === 0) return

    if (direction === 'up') {
      const idx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
      set({ historyIndex: idx, currentInput: commandHistory[idx] ?? '' })
    } else {
      if (historyIndex === -1) return
      const idx = historyIndex + 1
      if (idx >= commandHistory.length) {
        set({ historyIndex: -1, currentInput: '' })
      } else {
        set({ historyIndex: idx, currentInput: commandHistory[idx] ?? '' })
      }
    }
  },
}))

function processCommand(input: string): TerminalLine[] {
  const parts = input.split(' ')
  const command = (parts[0] ?? '').toLowerCase()
  const args = parts.slice(1)

  // Portfolio navigation — open windows via desktopStore
  const portfolioApps: Record<string, string> = {
    trust: 'TRUST.EXE',
    culture: 'CULTURE.EXE',
    undertow: 'UNDERTOW.EXE',
    about: 'ABOUT.TXT',
    contact: 'CONTACT.TXT',
  }
  if (command in portfolioApps) {
    useDesktopStore.getState().openWindow(command, portfolioApps[command])
    return [{ type: 'output', text: `Opening ${command.toUpperCase()}...` }]
  }

  if (command === 'help') {
    return [
      { type: 'output', text: '' },
      { type: 'output', text: 'AVAILABLE COMMANDS' },
      { type: 'output', text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
      { type: 'output', text: '' },
      { type: 'output', text: 'PORTFOLIO:' },
      { type: 'output', text: '  trust      View cryptographic credentials project' },
      { type: 'output', text: '  culture    View cultural publication project' },
      { type: 'output', text: '  undertow   View ARES game project' },
      { type: 'output', text: '  about      About G' },
      { type: 'output', text: '  contact    Contact information' },
      { type: 'output', text: '' },
      { type: 'output', text: 'SYSTEM:' },
      { type: 'output', text: '  help       Show this screen' },
      { type: 'output', text: '  clear      Clear terminal' },
      { type: 'output', text: '  exit       Close terminal window' },
      { type: 'output', text: '' },
      { type: 'output', text: 'EXTRAS:' },
      { type: 'output', text: '  Try: whoami, ls, fortune, tree, cowsay, neofetch' },
      { type: 'output', text: '  More: brew, sl, npm install, uptime, joke, weather' },
      { type: 'output', text: '' },
      { type: 'output', text: 'HIDDEN:' },
      { type: 'output', text: '  There are 50+ commands. Keep exploring.' },
      { type: 'output', text: '' },
    ]
  }

  if (command === 'clear') {
    useTerminalStore.getState().clearTerminal()
    return []
  }

  if (command === 'exit') {
    const dStore = useDesktopStore.getState()
    const termWin = dStore.windows.find((w) => w.app === 'terminal')
    if (termWin) dStore.closeWindow(termWin.id)
    return []
  }

  if (command === 'whoami') {
    return [{ type: 'output', text: 'Solo builder. Singapore. Taste + execution.' }]
  }

  if (command === 'pwd') {
    return [{ type: 'output', text: '/home/g/portfolio' }]
  }

  if (command === 'date') {
    return [{ type: 'output', text: new Date().toString() }]
  }

  if (command === 'uname') {
    return [{ type: 'output', text: 'ARES v4.5 Singapore/x64 consciousness-kernel' }]
  }

  if (command === 'ls') {
    if (args[0] === '-la') {
      return [
        { type: 'output', text: 'total 24' },
        { type: 'output', text: 'drwxr-xr-x  8 g  staff   256 Mar 10 15:42 .' },
        { type: 'output', text: 'drwxr-xr-x  3 g  staff    96 Mar 10 15:42 ..' },
        { type: 'output', text: '-rw-r--r--  1 g  staff  1024 Mar 10 15:42 TRUST.md' },
        { type: 'output', text: '-rw-r--r--  1 g  staff  2048 Mar 10 15:42 CULTURE.md' },
        { type: 'output', text: '-rw-r--r--  1 g  staff  3072 Mar 10 15:42 UNDERTOW.md' },
        { type: 'output', text: '-rw-r--r--  1 g  staff   512 Mar 10 15:42 README.md' },
      ]
    }
    return [{ type: 'output', text: 'TRUST.md  CULTURE.md  UNDERTOW.md  README.md' }]
  }

  if (command === 'cat' && args[0] === 'README.md') {
    return [
      { type: 'output', text: 'Build things that outlive you.' },
      { type: 'output', text: 'No crowdsourcing. No bullshit.' },
      { type: 'output', text: 'Willing-to-pay users only.' },
    ]
  }

  if (command === 'echo') {
    return [{ type: 'output', text: args.join(' ') }]
  }

  if (command === 'history') {
    return useTerminalStore.getState().commandHistory.map((cmd, i) => ({
      type: 'output' as const,
      text: `  ${i + 1}  ${cmd}`,
    }))
  }

  // Try easter eggs (lazy-loaded module)
  if (easterEggsModule) {
    const result = easterEggsModule.processEasterEgg(command, args, input)
    if (result) return result
  } else if (!easterEggsLoading && input) {
    // First non-core command triggers the lazy load for next time
    easterEggsLoading = true
    import('@/store/terminalEasterEggs').then((m) => { easterEggsModule = m })
  }

  if (input) {
    return [
      { type: 'error', text: `Command not found: ${command}` },
      { type: 'output', text: "Type 'help' for available commands." },
    ]
  }

  return []
}
