import { create } from 'zustand'
import { useDesktopStore } from '@/store/desktopStore'
import { useObjectStore } from '@/store/objectStore'
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
      { type: 'output', text: '  More: brew, sl, npm install, uptime, man, :q' },
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
    return [{ type: 'output', text: 'Solo indie dev. Singapore. Building invisible infrastructure.' }]
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

  // Easter eggs
  if (command === 'sudo') {
    return [{ type: 'error', text: 'gerard is not in the sudoers file. This incident will be reported.' }]
  }

  if (command === 'rm' && args[0] === '-rf' && args[1] === '/') {
    return [
      { type: 'output', text: 'Deleting system files...' },
      { type: 'output', text: '[▓▓▓▓▓▓▓▓▓▓] 100%' },
      { type: 'error', text: 'Access denied.' },
    ]
  }

  if (command === 'vim') {
    return [
      { type: 'output', text: 'Entering vim...' },
      { type: 'output', text: '~' },
      { type: 'output', text: '~' },
      { type: 'output', text: '~' },
      { type: 'output', text: '' },
      { type: 'output', text: 'Type :q to exit... or just give up.' },
    ]
  }

  if (command === 'ping') {
    return [
      { type: 'output', text: `PING ${args[0] ?? 'localhost'} (127.0.0.1): 56 data bytes` },
      { type: 'output', text: '64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.045 ms' },
      { type: 'output', text: '64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.038 ms' },
      { type: 'output', text: 'Reply from yourself: stop' },
    ]
  }

  if (command === 'top') {
    return [
      { type: 'output', text: 'Processes: 3 total' },
      { type: 'output', text: '' },
      { type: 'output', text: 'PID    COMMAND          %CPU' },
      { type: 'output', text: '4821   career_plan      99.2' },
      { type: 'output', text: '4822   side_projects    45.7' },
      { type: 'output', text: '4823   coffee           12.1' },
    ]
  }

  if (command === 'git' && args[0] === 'push') {
    return [
      { type: 'output', text: 'Everything up-to-date.' },
      { type: 'output', text: 'Nothing to deploy.' },
    ]
  }

  if (command === 'fortune') {
    const fortunes = [
      ['Build tools, not monuments.', '— Someone who built a monument'],
      ['The best code is no code at all.', '— Every senior engineer eventually'],
      ['Ship first, perfect later.', '— The "later" never comes'],
      ['Users pay for pain removed,', 'not features added.'],
      ['If you are not embarrassed by your', 'first release, you launched too late.', '— Reid Hoffman'],
      ['Solve your own problems.', 'Others have them too.'],
      ['Complexity is a tax on maintenance.', '— Paid annually, with interest'],
      ['Make it work, make it right,', 'make it fast. In that order.', '— Kent Beck'],
      ['Every feature is a liability.', 'Every line of code is a cost.'],
      ['The graveyard is full of', 'indispensable people.', '— Charles de Gaulle'],
      ['Weeks of coding can save you', 'hours of planning.'],
      ['The best time to plant a tree was', '20 years ago. The second best time', 'is now.', '— Chinese proverb'],
      ['A complex system that works', 'invariably evolved from a simple', 'system that worked.', '— Gall\'s Law'],
      ['Perfection is achieved not when', 'there is nothing more to add, but', 'when there is nothing left to take.', '— Antoine de Saint-Exupery'],
      ['The purpose of software engineering', 'is to control complexity, not to', 'create it.', '— Pamela Zave'],
    ]
    const f = fortunes[Math.floor(Math.random() * fortunes.length)]
    return [
      { type: 'output', text: '┌────────────────────────────────────┐' },
      ...f.map(line => ({ type: 'output' as const, text: `│  ${line}` })),
      { type: 'output', text: '└────────────────────────────────────┘' },
    ]
  }

  if (command === 'tree') {
    return [
      { type: 'output', text: '' },
      { type: 'output', text: '               *' },
      { type: 'output', text: '              /|\\' },
      { type: 'output', text: '             / | \\' },
      { type: 'output', text: '            /__|__\\' },
      { type: 'output', text: '           /       \\' },
      { type: 'output', text: '          / TRUST   \\' },
      { type: 'output', text: '         / CULTURE   \\' },
      { type: 'output', text: '        /    ARES     \\' },
      { type: 'output', text: '       /_______________\\' },
      { type: 'output', text: '            |   |' },
      { type: 'output', text: '            |   |' },
      { type: 'output', text: '          __|   |__' },
      { type: 'output', text: '         |_________|' },
      { type: 'output', text: '' },
      { type: 'output', text: '  TRUST ......... AcadCert + VeriCert' },
      { type: 'output', text: '  CULTURE ....... DefMarks' },
      { type: 'output', text: '  ARES .......... Undertow' },
      { type: 'output', text: '' },
    ]
  }

  if (command === 'snake') {
    return [{ type: 'output', text: 'Snake game coming soon...' }]
  }

  if (command === 'matrix') {
    return [
      { type: 'output', text: '01001101 01000001 01010100 01010010' },
      { type: 'output', text: '01001001 01011000 00100000 01000101' },
      { type: 'output', text: '01000110 01000110 01000101 01000011' },
      { type: 'output', text: '01010100 00100001' },
    ]
  }

  if (command === 'neofetch') {
    return [
      { type: 'output' as const, text: '       ___       g@portfolio' },
      { type: 'output' as const, text: '      /   \\      OS: ARES v4.5' },
      { type: 'output' as const, text: '     | o o |     Host: miserabletaco.dev' },
      { type: 'output' as const, text: '     |  >  |     Kernel: consciousness-1.0' },
      { type: 'output' as const, text: '      \\___/      Uptime: since 2024' },
      { type: 'output' as const, text: '     /|   |\\     Shell: ARES-sh' },
      { type: 'output' as const, text: '    / |   | \\    Resolution: 1024x768' },
      { type: 'output' as const, text: '       | |       Projects: 3' },
      { type: 'output' as const, text: '      _| |_      Coffee: critical' },
    ]
  }

  if (command === 'cowsay') {
    const message = args.length > 0 ? args.join(' ') : 'moo'
    const border = '-'.repeat(message.length + 2)
    return [
      { type: 'output' as const, text: ` ${border}` },
      { type: 'output' as const, text: `< ${message} >` },
      { type: 'output' as const, text: ` ${border}` },
      { type: 'output' as const, text: '        \\   ^__^' },
      { type: 'output' as const, text: '         \\  (oo)\\_______' },
      { type: 'output' as const, text: '            (__)\\       )\\/\\' },
      { type: 'output' as const, text: '                ||----w |' },
      { type: 'output' as const, text: '                ||     ||' },
    ]
  }

  if (command === 'npm' && args[0] === 'install') {
    return [
      { type: 'output' as const, text: 'added 1,247 packages in 45s' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: '312 vulnerabilities (47 moderate, 198 high, 67 critical)' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'node_modules is now 2.3 GB. You\'re welcome.' },
    ]
  }

  if (command === 'curl') {
    return [
      { type: 'output' as const, text: 'HTTP/1.1 200 OK' },
      { type: 'output' as const, text: 'Content-Type: application/json' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: '{ "status": "alive", "mood": "building" }' },
    ]
  }

  if (command === 'ssh') {
    const host = args[0] || 'localhost'
    return [
      { type: 'output' as const, text: `ssh: connect to host ${host} port 22:` },
      { type: 'error' as const, text: 'Connection refused. Try meeting in person.' },
    ]
  }

  if (command === 'make') {
    if (args.length === 0) {
      return [{ type: 'error' as const, text: 'make: *** No targets specified. Stop.' }]
    }
    if (args[0] === 'coffee') {
      return [{ type: 'output' as const, text: 'Brewing... [=========>] Done.' }]
    }
    if (args[0] === 'money') {
      return [{ type: 'error' as const, text: 'Error: insufficient venture capital.' }]
    }
    return [{ type: 'output' as const, text: `make: Nothing to be done for '${args[0]}'.` }]
  }

  if (command === ':q' || command === ':wq' || command === ':q!') {
    return [{ type: 'output' as const, text: 'You escaped vim. Few can claim this.' }]
  }

  if (command === 'cd') {
    if (args[0] === '..') {
      return [{ type: 'output' as const, text: 'You can\'t leave. You live here now.' }]
    }
    return [{ type: 'output' as const, text: `/home/g/${args[0] || 'portfolio'}` }]
  }

  if (command === 'uptime') {
    const seconds = Math.floor(performance.now() / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return [{ type: 'output' as const, text: `up ${mins}m ${secs}s, 1 user, load average: 0.42 0.38 0.31` }]
  }

  if (command === 'yes') {
    const text = args[0] || 'y'
    return Array.from({ length: 20 }, () => ({ type: 'output' as const, text }))
  }

  if (command === 'hexdump') {
    return [
      { type: 'output' as const, text: '00000000  47 2e 20 53 6f 6c 6f 20  |G. Solo |' },
      { type: 'output' as const, text: '00000008  69 6e 64 69 65 20 64 65  |indie de|' },
      { type: 'output' as const, text: '00000010  76 2e                    |v.      |' },
    ]
  }

  if (command === 'man') {
    if (args.length === 0) {
      return [{ type: 'error' as const, text: 'What manual page do you want?' }]
    }
    return [
      { type: 'output' as const, text: `NAME` },
      { type: 'output' as const, text: `    ${args[0]} - you already know what this does` },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'DESCRIPTION' },
      { type: 'output' as const, text: '    Read the source code.' },
    ]
  }

  if (command === 'sl') {
    return [
      { type: 'output' as const, text: '      ====        ________' },
      { type: 'output' as const, text: '  _D _|  |_______/        \\__I_' },
      { type: 'output' as const, text: '   |(_)---  |   H\\________/ |  |' },
      { type: 'output' as const, text: '   /     |  |   H  |  |     |  |' },
      { type: 'output' as const, text: '  |      |  |   H  |__----__|  |' },
      { type: 'output' as const, text: '  | ________|___H__/__|_____/___\\' },
      { type: 'output' as const, text: '  |/ |     |  H  |  |     |  |' },
      { type: 'output' as const, text: '  |  |  O  |  H  |  O  O  |  O' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'You meant ls, didn\'t you?' },
    ]
  }

  if (command === 'brew' || command === 'coffee') {
    return [
      { type: 'output' as const, text: '    ( (' },
      { type: 'output' as const, text: '     ) )' },
      { type: 'output' as const, text: '  ........' },
      { type: 'output' as const, text: '  |      |]' },
      { type: 'output' as const, text: '  \\      /' },
      { type: 'output' as const, text: '   `----\'' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'Coffee brewed. Productivity +10.' },
    ]
  }

  if (command === 'grep') {
    return [
      { type: 'output' as const, text: `grep: searching for '${args.join(' ')}' in /dev/meaning-of-life` },
      { type: 'output' as const, text: 'No matches found. Keep looking.' },
    ]
  }

  if (command === 'docker') {
    return [
      { type: 'output' as const, text: 'Cannot connect to the Docker daemon. Is the Docker daemon running?' },
      { type: 'output' as const, text: 'Just kidding. This is a portfolio, not a server.' },
    ]
  }

  if (command === 'python') {
    return [
      { type: 'output' as const, text: 'Python 3.12.0' },
      { type: 'output' as const, text: '>>> import antigravity' },
      { type: 'output' as const, text: 'xkcd.com/353' },
    ]
  }

  if (command === 'cat' && args[0] !== 'README.md') {
    if (args[0]) {
      return [{ type: 'error' as const, text: `cat: ${args[0]}: Permission denied` }]
    }
    return [{ type: 'output' as const, text: 'Usage: cat <file>' }]
  }

  if (command === 'disco') {
    useObjectStore.getState().activateDisco()
    return [
      { type: 'output' as const, text: '> DISCO MODE ACTIVATED' },
      { type: 'output' as const, text: '  \u266A Kygo \u2014 Firestone \u266A' },
      { type: 'output' as const, text: '  Duration: 30 seconds' },
    ]
  }

  if (input) {
    return [
      { type: 'error', text: `Command not found: ${command}` },
      { type: 'output', text: "Type 'help' for available commands." },
    ]
  }

  return []
}
