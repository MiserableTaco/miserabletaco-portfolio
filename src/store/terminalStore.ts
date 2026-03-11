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

  // Easter eggs
  if (command === 'sudo') {
    if (args.join(' ') === 'rm -rf /') {
      return [
        { type: 'output' as const, text: '[sudo] password for gerard: ********' },
        { type: 'output' as const, text: '' },
        { type: 'output' as const, text: 'Deleting universe...' },
        { type: 'output' as const, text: '[\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593] 100%' },
        { type: 'output' as const, text: '' },
        { type: 'error' as const, text: 'Error: Cannot delete self. Philosophical paradox detected.' },
      ]
    }
    if (args[0] === 'make' && args[1] === 'me' && args[2] === 'a' && args[3] === 'sandwich') {
      return [{ type: 'output' as const, text: 'Okay.' }]
    }
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
    return [
      { type: 'output' as const, text: '  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588' },
      { type: 'output' as const, text: '  \u2588                  \u2588' },
      { type: 'output' as const, text: '  \u2588   \u25CF\u25CF\u25CF\u25CF\u25CF>    \u25CB   \u2588' },
      { type: 'output' as const, text: '  \u2588                  \u2588' },
      { type: 'output' as const, text: '  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588' },
      { type: 'output' as const, text: '  Score: 42   High: 42' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: '  You already won. Trust the process.' },
    ]
  }

  if (command === 'matrix') {
    const chars = '\u30A2\u30A4\u30A6\u30A8\u30AA\u30AB\u30AD\u30AF\u30B1\u30B3\u30B5\u30B7\u30B9\u30BB\u30BD0123456789'
    const lines: TerminalLine[] = []
    for (let i = 0; i < 8; i++) {
      let line = ''
      for (let j = 0; j < 36; j++) {
        line += chars[Math.floor(Math.random() * chars.length)]
      }
      lines.push({ type: 'output' as const, text: line })
    }
    lines.push({ type: 'output' as const, text: '' })
    lines.push({ type: 'output' as const, text: 'Wake up, Neo...' })
    return lines
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
      { type: 'output' as const, text: '00000000  54 61 73 74 65 20 2b 20  |Taste + |' },
      { type: 'output' as const, text: '00000008  65 78 65 63 75 74 69 6f  |executio|' },
      { type: 'output' as const, text: '00000010  6e 2e                    |n.      |' },
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

  if (command === 'hack') {
    const target = args[0] || 'mainframe'
    return [
      { type: 'output' as const, text: `Connecting to ${target}...` },
      { type: 'output' as const, text: 'Bypassing firewall............. [OK]' },
      { type: 'output' as const, text: 'Decrypting SSL handshake....... [OK]' },
      { type: 'output' as const, text: 'Injecting SQL payload.......... [OK]' },
      { type: 'output' as const, text: 'Escalating privileges.......... [OK]' },
      { type: 'output' as const, text: 'Downloading secrets............ [OK]' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'SECRET FILE CONTENTS:' },
      { type: 'output' as const, text: '"G ships fast and cares about taste."' },
      { type: 'output' as const, text: '' },
      { type: 'error' as const, text: 'CONNECTION TERMINATED BY REMOTE HOST' },
    ]
  }

  if (command === 'weather') {
    const temps = [28, 29, 30, 31, 32, 33, 34]
    const temp = temps[Math.floor(Math.random() * temps.length)]
    const conditions = ['Humid', 'Very humid', 'Extremely humid', 'Soup']
    const cond = conditions[Math.floor(Math.random() * conditions.length)]
    return [
      { type: 'output' as const, text: '\u2601 Singapore Weather Report' },
      { type: 'output' as const, text: `  Temperature: ${temp}\u00B0C` },
      { type: 'output' as const, text: `  Humidity: 94%` },
      { type: 'output' as const, text: `  Conditions: ${cond}` },
      { type: 'output' as const, text: `  UV Index: Yes` },
      { type: 'output' as const, text: '  Forecast: Same as yesterday. And tomorrow.' },
    ]
  }

  if (command === 'joke') {
    const jokes = [
      ['Why do programmers prefer dark mode?', 'Because light attracts bugs.'],
      ['A SQL query walks into a bar,', 'walks up to two tables and asks...', '"Can I join you?"'],
      ['!false', "It's funny because it's true."],
      ['"Knock knock." "Race condition."', '"Who\'s there?"'],
      ['How many programmers does it take', 'to change a light bulb?', 'None. That\'s a hardware problem.'],
      ['There are only 10 types of people:', 'Those who understand binary', 'and those who don\'t.'],
      ['A programmer\'s wife tells him:', '"Go to the store and buy a gallon of milk.', 'If they have eggs, get a dozen."', 'He comes home with 12 gallons of milk.'],
      ['What\'s the best thing about', 'UDP jokes?', 'I don\'t care if you get them.'],
      ['["hip","hip"]', '(hip hip array!)'],
      ['What\'s a pirate\'s favorite', 'programming language?', 'You\'d think R, but their first', 'love is the C.'],
    ]
    const j = jokes[Math.floor(Math.random() * jokes.length)]
    return j.map(line => ({ type: 'output' as const, text: line }))
  }

  if (command === 'rickroll') {
    return [
      { type: 'output' as const, text: '\u266A Never gonna give you up' },
      { type: 'output' as const, text: '\u266A Never gonna let you down' },
      { type: 'output' as const, text: '\u266A Never gonna run around and desert you' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'You just got terminal-rolled.' },
    ]
  }

  if (command === 'xyzzy') {
    return [
      { type: 'output' as const, text: 'A hollow voice says "Plugh."' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'You are in a dimly lit office.' },
      { type: 'output' as const, text: 'A CRT monitor hums softly.' },
      { type: 'output' as const, text: 'Exits: TRUST, CULTURE, UNDERTOW' },
    ]
  }

  if (command === 'plugh') {
    return [
      { type: 'output' as const, text: 'A hollow voice says "Xyzzy."' },
      { type: 'output' as const, text: 'You\'re going in circles.' },
    ]
  }

  if (command === 'secret' || command === 'secrets') {
    return [
      { type: 'output' as const, text: 'Hidden things in this terminal:' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: '  [\u2713] You found the secret command' },
      { type: 'output' as const, text: '  [ ] Try a classic adventure game word' },
      { type: 'output' as const, text: '  [ ] There\'s a cheat code for everything' },
      { type: 'output' as const, text: '  [ ] Click the objects on the desk' },
      { type: 'output' as const, text: '  [ ] The sticky notes have stories' },
      { type: 'output' as const, text: '  [ ] Some commands have hidden arguments' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'Curiosity is the only credential.' },
    ]
  }

  if (command === 'git' && args[0] === 'log') {
    return [
      { type: 'output' as const, text: 'commit a1b2c3d (HEAD -> main)' },
      { type: 'output' as const, text: '  fix: finally fixed that one bug' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'commit e4f5g6h' },
      { type: 'output' as const, text: '  fix: the fix for the fix' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'commit i7j8k9l' },
      { type: 'output' as const, text: '  feat: mass refactor at 3am (what could go wrong)' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'commit m0n1o2p' },
      { type: 'output' as const, text: '  chore: deleted 2000 lines of "temporary" code' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'commit q3r4s5t' },
      { type: 'output' as const, text: '  init: first commit. this will be simple.' },
    ]
  }

  if (command === 'git' && args[0] === 'blame') {
    return [
      { type: 'output' as const, text: 'g  (Mar 2026)  line 1:  // TODO: fix this later' },
      { type: 'output' as const, text: 'g  (Mar 2026)  line 2:  // I\'ll remember why this works' },
      { type: 'output' as const, text: 'g  (Mar 2026)  line 3:  // don\'t touch this' },
      { type: 'output' as const, text: 'g  (Mar 2026)  line 4:  // here be dragons' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'Blame: yourself. Always yourself.' },
    ]
  }

  if (command === 'nmap') {
    const target = args[0] || 'miserabletaco.dev'
    return [
      { type: 'output' as const, text: `Starting Nmap scan of ${target}` },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'PORT     STATE    SERVICE' },
      { type: 'output' as const, text: '22/tcp   closed   ssh' },
      { type: 'output' as const, text: '80/tcp   open     http' },
      { type: 'output' as const, text: '443/tcp  open     https' },
      { type: 'output' as const, text: '1337/tcp open     taste' },
      { type: 'output' as const, text: '8080/tcp open     side-projects' },
      { type: 'output' as const, text: '9001/tcp open     ambition (over 9000)' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: '6 services detected. 0 vulnerabilities. Nice try.' },
    ]
  }

  if (command === 'traceroute') {
    return [
      { type: 'output' as const, text: 'traceroute to success (∞ hops max)' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: ' 1  idea.local          0.1ms' },
      { type: 'output' as const, text: ' 2  prototype.dev        2.3ms' },
      { type: 'output' as const, text: ' 3  * * * doubt.timeout  ∞ms' },
      { type: 'output' as const, text: ' 4  refactor.again       45.2ms' },
      { type: 'output' as const, text: ' 5  ship-it.prod         0.4ms' },
      { type: 'output' as const, text: ' 6  users.pay            ???ms' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'Destination reached. Eventually.' },
    ]
  }

  if (command === 'figlet') {
    const text = args.join(' ').toUpperCase() || 'HI'
    if (text.length > 8) {
      return [{ type: 'error' as const, text: 'figlet: text too long (max 8 chars)' }]
    }
    // Simple block letter generator
    const font: Record<string, string[]> = {
      'H': ['\u2588  \u2588', '\u2588\u2588\u2588\u2588', '\u2588  \u2588', '\u2588  \u2588'],
      'I': ['\u2588\u2588\u2588', ' \u2588 ', ' \u2588 ', '\u2588\u2588\u2588'],
      'G': [' \u2588\u2588\u2588', '\u2588   ', '\u2588 \u2588\u2588', ' \u2588\u2588\u2588'],
      'A': [' \u2588\u2588 ', '\u2588  \u2588', '\u2588\u2588\u2588\u2588', '\u2588  \u2588'],
      'B': ['\u2588\u2588\u2588 ', '\u2588  \u2588', '\u2588\u2588\u2588 ', '\u2588\u2588\u2588 '],
      'C': [' \u2588\u2588\u2588', '\u2588   ', '\u2588   ', ' \u2588\u2588\u2588'],
      'D': ['\u2588\u2588\u2588 ', '\u2588  \u2588', '\u2588  \u2588', '\u2588\u2588\u2588 '],
      'E': ['\u2588\u2588\u2588\u2588', '\u2588\u2588  ', '\u2588   ', '\u2588\u2588\u2588\u2588'],
      'F': ['\u2588\u2588\u2588\u2588', '\u2588\u2588  ', '\u2588   ', '\u2588   '],
      ' ': ['    ', '    ', '    ', '    '],
    }
    const rows = ['', '', '', '']
    for (const ch of text) {
      const glyph = font[ch] || font[' ']!
      for (let r = 0; r < 4; r++) rows[r] += (glyph[r] ?? '    ') + ' '
    }
    return rows.map(r => ({ type: 'output' as const, text: r }))
  }

  if (command === 'cat' && args[0] === '/dev/urandom') {
    let out = ''
    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`abcdefABCDEF0123456789'
    for (let i = 0; i < 160; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return [
      { type: 'output' as const, text: out.slice(0, 40) },
      { type: 'output' as const, text: out.slice(40, 80) },
      { type: 'output' as const, text: out.slice(80, 120) },
      { type: 'output' as const, text: out.slice(120) },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: '^C  (you probably wanted that)' },
    ]
  }

  if (command === 'apt' || command === 'pip') {
    return [
      { type: 'output' as const, text: `${command}: command not found` },
      { type: 'output' as const, text: 'This is a browser, not a server.' },
      { type: 'output' as const, text: 'Try: brew' },
    ]
  }

  if (command === 'wget') {
    const url = args[0] || 'https://example.com'
    return [
      { type: 'output' as const, text: `--2026-03-11 15:42:00--  ${url}` },
      { type: 'output' as const, text: 'Resolving... failed.' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'You can\'t download the internet from a portfolio.' },
    ]
  }

  if (command === 'chmod') {
    return [
      { type: 'output' as const, text: 'chmod: changing permissions of \'everything\': Nice try.' },
      { type: 'output' as const, text: 'You\'re a guest. Guests get read access.' },
    ]
  }

  if (command === 'whois') {
    return [
      { type: 'output' as const, text: 'Domain: miserabletaco.dev' },
      { type: 'output' as const, text: 'Registrant: G' },
      { type: 'output' as const, text: 'Location: Singapore' },
      { type: 'output' as const, text: 'Status: Building' },
      { type: 'output' as const, text: 'Stack: React + Three.js + Zustand' },
      { type: 'output' as const, text: 'Philosophy: Ship fast, care about taste' },
      { type: 'output' as const, text: 'Coffee: Essential' },
    ]
  }

  if (command === 'lolcat') {
    const text = args.join(' ') || 'meow'
    const rainbow = ['\x1b[31m', '\x1b[33m', '\x1b[32m', '\x1b[36m', '\x1b[34m', '\x1b[35m']
    let colored = ''
    for (let i = 0; i < text.length; i++) {
      colored += rainbow[i % rainbow.length] + text[i]
    }
    return [
      { type: 'output' as const, text: `lolcat: ANSI colors not supported in this terminal.` },
      { type: 'output' as const, text: `But here's your text anyway: ${text}` },
      { type: 'output' as const, text: '(Try "disco" for actual colors)' },
    ]
  }

  if (command === 'rm' && args[0] === '-rf' && args[1] === '/' && args.includes('--no-preserve-root')) {
    return [
      { type: 'output' as const, text: 'Deleting system files...' },
      { type: 'output' as const, text: '[\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593] 100%' },
      { type: 'output' as const, text: '' },
      { type: 'output' as const, text: 'Just kidding. Everything is still here.' },
      { type: 'output' as const, text: 'This portfolio is indestructible.' },
      { type: 'output' as const, text: 'Like cockroaches and COBOL.' },
    ]
  }

  if (command === 'disco') {
    useObjectStore.getState().activateDisco()
    return [
      { type: 'output' as const, text: '> DISCO MODE ACTIVATED' },
      { type: 'output' as const, text: '  \u266A Kygo \u2014 Firestone \u266A' },
      { type: 'output' as const, text: '  Type "stop" to end early' },
    ]
  }

  if (command === 'stop') {
    if (useObjectStore.getState().discoActive) {
      useObjectStore.getState().deactivateDisco()
      return [{ type: 'output' as const, text: '> Disco stopped.' }]
    }
    return [{ type: 'output' as const, text: 'Nothing to stop.' }]
  }

  if (input) {
    return [
      { type: 'error', text: `Command not found: ${command}` },
      { type: 'output', text: "Type 'help' for available commands." },
    ]
  }

  return []
}
