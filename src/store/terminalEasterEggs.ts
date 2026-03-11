import { useObjectStore } from '@/store/objectStore'

export interface TerminalLine {
  type: 'command' | 'output' | 'error'
  text: string
}

export function processEasterEgg(command: string, args: string[], _input: string): TerminalLine[] | null {
  if (command === 'sudo') {
    if (args.join(' ') === 'rm -rf /') {
      return [
        { type: 'output', text: '[sudo] password for g: ********' },
        { type: 'output', text: '' },
        { type: 'output', text: 'Deleting universe...' },
        { type: 'output', text: '[\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593] 100%' },
        { type: 'output', text: '' },
        { type: 'error', text: 'Error: Cannot delete self. Philosophical paradox detected.' },
      ]
    }
    if (args[0] === 'make' && args[1] === 'me' && args[2] === 'a' && args[3] === 'sandwich') {
      return [{ type: 'output', text: 'Okay.' }]
    }
    return [
      { type: 'error', text: 'g is not in the sudoers file.' },
      { type: 'error', text: 'This incident will be reported.' },
    ]
  }

  if (command === 'rm' && args[0] === '-rf' && args[1] === '/' && args.includes('--no-preserve-root')) {
    return [
      { type: 'output', text: 'Deleting system files...' },
      { type: 'output', text: '[\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593] 100%' },
      { type: 'output', text: '' },
      { type: 'output', text: 'Just kidding. Everything is still here.' },
      { type: 'output', text: 'This portfolio is indestructible.' },
      { type: 'output', text: 'Like cockroaches and COBOL.' },
    ]
  }

  if (command === 'rm' && args[0] === '-rf' && args[1] === '/') {
    return [
      { type: 'output', text: 'Deleting system files...' },
      { type: 'output', text: '[\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593] 100%' },
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
      { type: 'output', text: '  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588' },
      { type: 'output', text: '  \u2588                  \u2588' },
      { type: 'output', text: '  \u2588   \u25CF\u25CF\u25CF\u25CF\u25CF>    \u25CB   \u2588' },
      { type: 'output', text: '  \u2588                  \u2588' },
      { type: 'output', text: '  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588' },
      { type: 'output', text: '  Score: 42   High: 42' },
      { type: 'output', text: '' },
      { type: 'output', text: '  You already won. Trust the process.' },
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
      lines.push({ type: 'output', text: line })
    }
    lines.push({ type: 'output', text: '' })
    lines.push({ type: 'output', text: 'Wake up, Neo...' })
    return lines
  }

  if (command === 'neofetch') {
    return [
      { type: 'output', text: '       ___       g@portfolio' },
      { type: 'output', text: '      /   \\      OS: ARES v4.5' },
      { type: 'output', text: '     | o o |     Host: miserabletaco.dev' },
      { type: 'output', text: '     |  >  |     Kernel: consciousness-1.0' },
      { type: 'output', text: '      \\___/      Uptime: since 2024' },
      { type: 'output', text: '     /|   |\\     Shell: ARES-sh' },
      { type: 'output', text: '    / |   | \\    Resolution: 1024x768' },
      { type: 'output', text: '       | |       Projects: 3' },
      { type: 'output', text: '      _| |_      Coffee: critical' },
    ]
  }

  if (command === 'cowsay') {
    const message = args.length > 0 ? args.join(' ') : 'moo'
    const border = '-'.repeat(message.length + 2)
    return [
      { type: 'output', text: ` ${border}` },
      { type: 'output', text: `< ${message} >` },
      { type: 'output', text: ` ${border}` },
      { type: 'output', text: '        \\   ^__^' },
      { type: 'output', text: '         \\  (oo)\\_______' },
      { type: 'output', text: '            (__)\\       )\\/\\' },
      { type: 'output', text: '                ||----w |' },
      { type: 'output', text: '                ||     ||' },
    ]
  }

  if (command === 'npm' && args[0] === 'install') {
    return [
      { type: 'output', text: 'added 1,247 packages in 45s' },
      { type: 'output', text: '' },
      { type: 'output', text: '312 vulnerabilities (47 moderate, 198 high, 67 critical)' },
      { type: 'output', text: '' },
      { type: 'output', text: 'node_modules is now 2.3 GB. You\'re welcome.' },
    ]
  }

  if (command === 'curl') {
    return [
      { type: 'output', text: 'HTTP/1.1 200 OK' },
      { type: 'output', text: 'Content-Type: application/json' },
      { type: 'output', text: '' },
      { type: 'output', text: '{ "status": "alive", "mood": "building" }' },
    ]
  }

  if (command === 'ssh') {
    const host = args[0] || 'localhost'
    return [
      { type: 'output', text: `ssh: connect to host ${host} port 22:` },
      { type: 'error', text: 'Connection refused. Try meeting in person.' },
    ]
  }

  if (command === 'make') {
    if (args.length === 0) {
      return [{ type: 'error', text: 'make: *** No targets specified. Stop.' }]
    }
    if (args[0] === 'coffee') {
      return [{ type: 'output', text: 'Brewing... [=========>] Done.' }]
    }
    if (args[0] === 'money') {
      return [{ type: 'error', text: 'Error: insufficient venture capital.' }]
    }
    return [{ type: 'output', text: `make: Nothing to be done for '${args[0]}'.` }]
  }

  if (command === ':q' || command === ':wq' || command === ':q!') {
    return [{ type: 'output', text: 'You escaped vim. Few can claim this.' }]
  }

  if (command === 'cd') {
    if (args[0] === '..') {
      return [{ type: 'output', text: 'You can\'t leave. You live here now.' }]
    }
    return [{ type: 'output', text: `/home/g/${args[0] || 'portfolio'}` }]
  }

  if (command === 'uptime') {
    const seconds = Math.floor(performance.now() / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return [{ type: 'output', text: `up ${mins}m ${secs}s, 1 user, load average: 0.42 0.38 0.31` }]
  }

  if (command === 'yes') {
    const text = args[0] || 'y'
    return Array.from({ length: 20 }, () => ({ type: 'output' as const, text }))
  }

  if (command === 'hexdump') {
    return [
      { type: 'output', text: '00000000  54 61 73 74 65 20 2b 20  |Taste + |' },
      { type: 'output', text: '00000008  65 78 65 63 75 74 69 6f  |executio|' },
      { type: 'output', text: '00000010  6e 2e                    |n.      |' },
    ]
  }

  if (command === 'man') {
    if (args.length === 0) {
      return [{ type: 'error', text: 'What manual page do you want?' }]
    }
    return [
      { type: 'output', text: 'NAME' },
      { type: 'output', text: `    ${args[0]} - you already know what this does` },
      { type: 'output', text: '' },
      { type: 'output', text: 'DESCRIPTION' },
      { type: 'output', text: '    Read the source code.' },
    ]
  }

  if (command === 'sl') {
    return [
      { type: 'output', text: '      ====        ________' },
      { type: 'output', text: '  _D _|  |_______/        \\__I_' },
      { type: 'output', text: '   |(_)---  |   H\\________/ |  |' },
      { type: 'output', text: '   /     |  |   H  |  |     |  |' },
      { type: 'output', text: '  |      |  |   H  |__----__|  |' },
      { type: 'output', text: '  | ________|___H__/__|_____/___\\' },
      { type: 'output', text: '  |/ |     |  H  |  |     |  |' },
      { type: 'output', text: '  |  |  O  |  H  |  O  O  |  O' },
      { type: 'output', text: '' },
      { type: 'output', text: 'You meant ls, didn\'t you?' },
    ]
  }

  if (command === 'brew' || command === 'coffee') {
    return [
      { type: 'output', text: '    ( (' },
      { type: 'output', text: '     ) )' },
      { type: 'output', text: '  ........' },
      { type: 'output', text: '  |      |]' },
      { type: 'output', text: '  \\      /' },
      { type: 'output', text: '   `----\'' },
      { type: 'output', text: '' },
      { type: 'output', text: 'Coffee brewed. Productivity +10.' },
    ]
  }

  if (command === 'grep') {
    return [
      { type: 'output', text: `grep: searching for '${args.join(' ')}' in /dev/meaning-of-life` },
      { type: 'output', text: 'No matches found. Keep looking.' },
    ]
  }

  if (command === 'docker') {
    return [
      { type: 'output', text: 'Cannot connect to the Docker daemon. Is the Docker daemon running?' },
      { type: 'output', text: 'Just kidding. This is a portfolio, not a server.' },
    ]
  }

  if (command === 'python') {
    return [
      { type: 'output', text: 'Python 3.12.0' },
      { type: 'output', text: '>>> import antigravity' },
      { type: 'output', text: 'xkcd.com/353' },
    ]
  }

  if (command === 'cat' && args[0] !== 'README.md') {
    if (args[0] === '/dev/urandom') {
      let out = ''
      const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`abcdefABCDEF0123456789'
      for (let i = 0; i < 160; i++) out += chars[Math.floor(Math.random() * chars.length)]
      return [
        { type: 'output', text: out.slice(0, 40) },
        { type: 'output', text: out.slice(40, 80) },
        { type: 'output', text: out.slice(80, 120) },
        { type: 'output', text: out.slice(120) },
        { type: 'output', text: '' },
        { type: 'output', text: '^C  (you probably wanted that)' },
      ]
    }
    if (args[0]) {
      return [{ type: 'error', text: `cat: ${args[0]}: Permission denied` }]
    }
    return [{ type: 'output', text: 'Usage: cat <file>' }]
  }

  if (command === 'hack') {
    const target = args[0] || 'mainframe'
    return [
      { type: 'output', text: `Connecting to ${target}...` },
      { type: 'output', text: 'Bypassing firewall............. [OK]' },
      { type: 'output', text: 'Decrypting SSL handshake....... [OK]' },
      { type: 'output', text: 'Injecting SQL payload.......... [OK]' },
      { type: 'output', text: 'Escalating privileges.......... [OK]' },
      { type: 'output', text: 'Downloading secrets............ [OK]' },
      { type: 'output', text: '' },
      { type: 'output', text: 'SECRET FILE CONTENTS:' },
      { type: 'output', text: '"G ships fast and cares about taste."' },
      { type: 'output', text: '' },
      { type: 'error', text: 'CONNECTION TERMINATED BY REMOTE HOST' },
    ]
  }

  if (command === 'weather') {
    const temps = [28, 29, 30, 31, 32, 33, 34]
    const temp = temps[Math.floor(Math.random() * temps.length)]
    const conditions = ['Humid', 'Very humid', 'Extremely humid', 'Soup']
    const cond = conditions[Math.floor(Math.random() * conditions.length)]
    return [
      { type: 'output', text: '\u2601 Singapore Weather Report' },
      { type: 'output', text: `  Temperature: ${temp}\u00B0C` },
      { type: 'output', text: '  Humidity: 94%' },
      { type: 'output', text: `  Conditions: ${cond}` },
      { type: 'output', text: '  UV Index: Yes' },
      { type: 'output', text: '  Forecast: Same as yesterday. And tomorrow.' },
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
      { type: 'output', text: '\u266A Never gonna give you up' },
      { type: 'output', text: '\u266A Never gonna let you down' },
      { type: 'output', text: '\u266A Never gonna run around and desert you' },
      { type: 'output', text: '' },
      { type: 'output', text: 'You just got terminal-rolled.' },
    ]
  }

  if (command === 'xyzzy') {
    return [
      { type: 'output', text: 'A hollow voice says "Plugh."' },
      { type: 'output', text: '' },
      { type: 'output', text: 'You are in a dimly lit office.' },
      { type: 'output', text: 'A CRT monitor hums softly.' },
      { type: 'output', text: 'Exits: TRUST, CULTURE, UNDERTOW' },
    ]
  }

  if (command === 'plugh') {
    return [
      { type: 'output', text: 'A hollow voice says "Xyzzy."' },
      { type: 'output', text: 'You\'re going in circles.' },
    ]
  }

  if (command === 'secret' || command === 'secrets') {
    return [
      { type: 'output', text: 'Hidden things in this terminal:' },
      { type: 'output', text: '' },
      { type: 'output', text: '  [\u2713] You found the secret command' },
      { type: 'output', text: '  [ ] Try a classic adventure game word' },
      { type: 'output', text: '  [ ] There\'s a cheat code for everything' },
      { type: 'output', text: '  [ ] Click the objects on the desk' },
      { type: 'output', text: '  [ ] The sticky notes have stories' },
      { type: 'output', text: '  [ ] Some commands have hidden arguments' },
      { type: 'output', text: '' },
      { type: 'output', text: 'Curiosity is the only credential.' },
    ]
  }

  if (command === 'git' && args[0] === 'log') {
    return [
      { type: 'output', text: 'commit a1b2c3d (HEAD -> main)' },
      { type: 'output', text: '  fix: finally fixed that one bug' },
      { type: 'output', text: '' },
      { type: 'output', text: 'commit e4f5g6h' },
      { type: 'output', text: '  fix: the fix for the fix' },
      { type: 'output', text: '' },
      { type: 'output', text: 'commit i7j8k9l' },
      { type: 'output', text: '  feat: mass refactor at 3am (what could go wrong)' },
      { type: 'output', text: '' },
      { type: 'output', text: 'commit m0n1o2p' },
      { type: 'output', text: '  chore: deleted 2000 lines of "temporary" code' },
      { type: 'output', text: '' },
      { type: 'output', text: 'commit q3r4s5t' },
      { type: 'output', text: '  init: first commit. this will be simple.' },
    ]
  }

  if (command === 'git' && args[0] === 'blame') {
    return [
      { type: 'output', text: 'g  (Mar 2026)  line 1:  // TODO: fix this later' },
      { type: 'output', text: 'g  (Mar 2026)  line 2:  // I\'ll remember why this works' },
      { type: 'output', text: 'g  (Mar 2026)  line 3:  // don\'t touch this' },
      { type: 'output', text: 'g  (Mar 2026)  line 4:  // here be dragons' },
      { type: 'output', text: '' },
      { type: 'output', text: 'Blame: yourself. Always yourself.' },
    ]
  }

  if (command === 'nmap') {
    const target = args[0] || 'miserabletaco.dev'
    return [
      { type: 'output', text: `Starting Nmap scan of ${target}` },
      { type: 'output', text: '' },
      { type: 'output', text: 'PORT     STATE    SERVICE' },
      { type: 'output', text: '22/tcp   closed   ssh' },
      { type: 'output', text: '80/tcp   open     http' },
      { type: 'output', text: '443/tcp  open     https' },
      { type: 'output', text: '1337/tcp open     taste' },
      { type: 'output', text: '8080/tcp open     side-projects' },
      { type: 'output', text: '9001/tcp open     ambition (over 9000)' },
      { type: 'output', text: '' },
      { type: 'output', text: '6 services detected. 0 vulnerabilities. Nice try.' },
    ]
  }

  if (command === 'traceroute') {
    return [
      { type: 'output', text: 'traceroute to success (∞ hops max)' },
      { type: 'output', text: '' },
      { type: 'output', text: ' 1  idea.local          0.1ms' },
      { type: 'output', text: ' 2  prototype.dev        2.3ms' },
      { type: 'output', text: ' 3  * * * doubt.timeout  ∞ms' },
      { type: 'output', text: ' 4  refactor.again       45.2ms' },
      { type: 'output', text: ' 5  ship-it.prod         0.4ms' },
      { type: 'output', text: ' 6  users.pay            ???ms' },
      { type: 'output', text: '' },
      { type: 'output', text: 'Destination reached. Eventually.' },
    ]
  }

  if (command === 'figlet') {
    const text = args.join(' ').toUpperCase() || 'HI'
    if (text.length > 8) {
      return [{ type: 'error', text: 'figlet: text too long (max 8 chars)' }]
    }
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

  if (command === 'apt' || command === 'pip') {
    return [
      { type: 'output', text: `${command}: command not found` },
      { type: 'output', text: 'This is a browser, not a server.' },
      { type: 'output', text: 'Try: brew' },
    ]
  }

  if (command === 'wget') {
    const url = args[0] || 'https://example.com'
    return [
      { type: 'output', text: `--2026-03-11 15:42:00--  ${url}` },
      { type: 'output', text: 'Resolving... failed.' },
      { type: 'output', text: '' },
      { type: 'output', text: 'You can\'t download the internet from a portfolio.' },
    ]
  }

  if (command === 'chmod') {
    return [
      { type: 'output', text: 'chmod: changing permissions of \'everything\': Nice try.' },
      { type: 'output', text: 'You\'re a guest. Guests get read access.' },
    ]
  }

  if (command === 'whois') {
    return [
      { type: 'output', text: 'Domain: miserabletaco.dev' },
      { type: 'output', text: 'Registrant: G' },
      { type: 'output', text: 'Location: Singapore' },
      { type: 'output', text: 'Status: Building' },
      { type: 'output', text: 'Stack: React + Three.js + Zustand' },
      { type: 'output', text: 'Philosophy: Ship fast, care about taste' },
      { type: 'output', text: 'Coffee: Essential' },
    ]
  }

  if (command === 'lolcat') {
    const text = args.join(' ') || 'meow'
    return [
      { type: 'output', text: 'lolcat: ANSI colors not supported in this terminal.' },
      { type: 'output', text: `But here's your text anyway: ${text}` },
      { type: 'output', text: '(Try "disco" for actual colors)' },
    ]
  }

  if (command === 'disco') {
    useObjectStore.getState().activateDisco()
    return [
      { type: 'output', text: '> DISCO MODE ACTIVATED' },
      { type: 'output', text: '  \u266A Now playing: Tropical Pluck \u266A' },
      { type: 'output', text: '  Type "stop" to end early' },
    ]
  }

  if (command === 'stop') {
    if (useObjectStore.getState().discoActive) {
      useObjectStore.getState().deactivateDisco()
      return [{ type: 'output', text: '> Disco stopped.' }]
    }
    return [{ type: 'output', text: 'Nothing to stop.' }]
  }

  // Not an easter egg
  return null
}
