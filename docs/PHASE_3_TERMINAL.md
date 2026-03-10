# PHASE 3: Terminal Window & Commands

> **Day 5 of 14**  
> Implement terminal window, command processing, history, and all standard/easter egg commands

**Prerequisites:** Phase 2 complete (Desktop UI system working)

---

## DELIVERABLES

By end of Phase 3, you will have:
- ✅ Terminal window auto-opens on boot
- ✅ Command input with cursor and typing
- ✅ Command execution with output
- ✅ Command history (up/down arrows)
- ✅ All portfolio navigation commands (trust, culture, undertow, about, contact)
- ✅ All info commands (whoami, pwd, ls, date, etc.)
- ✅ All easter egg/joke commands (sudo, rm -rf, vim, ping, top, git push)
- ✅ Help system showing all available commands
- ✅ Input sanitization (VibeSec)

---

## STEP 1: Terminal Store

### 1.1 Create terminal store

**Create `src/store/terminalStore.ts`:**

```typescript
import { create } from 'zustand';

export interface TerminalLine {
  type: 'command' | 'output' | 'error';
  text: string;
}

interface TerminalState {
  lines: TerminalLine[];
  commandHistory: string[];
  historyIndex: number;
  currentInput: string;
  
  addLine: (line: TerminalLine) => void;
  executeCommand: (command: string) => void;
  setInput: (input: string) => void;
  clearTerminal: () => void;
  navigateHistory: (direction: 'up' | 'down') => void;
}

const MAX_LINES = 100;
const MAX_HISTORY = 50;

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
  
  addLine: (line) => set((state) => ({
    lines: [...state.lines.slice(-MAX_LINES), line],
  })),
  
  setInput: (input) => set({ currentInput: input }),
  
  executeCommand: (command) => {
    const trimmed = sanitizeInput(command);
    
    // Add command to output
    get().addLine({ type: 'command', text: `> ${trimmed}` });
    
    // Add to history
    if (trimmed) {
      set((state) => ({
        commandHistory: [...state.commandHistory.slice(-MAX_HISTORY), trimmed],
        historyIndex: -1,
      }));
    }
    
    // Execute command
    const output = processCommand(trimmed);
    output.forEach(line => get().addLine(line));
    
    // Clear input
    set({ currentInput: '' });
  },
  
  clearTerminal: () => set({
    lines: [
      { type: 'output', text: '' },
    ],
  }),
  
  navigateHistory: (direction) => {
    const { commandHistory, historyIndex } = get();
    
    if (direction === 'up') {
      const newIndex = historyIndex === -1 
        ? commandHistory.length - 1 
        : Math.max(0, historyIndex - 1);
      
      set({
        historyIndex: newIndex,
        currentInput: commandHistory[newIndex] || '',
      });
    } else {
      const newIndex = historyIndex === -1 
        ? -1 
        : Math.min(commandHistory.length - 1, historyIndex + 1);
      
      set({
        historyIndex: newIndex,
        currentInput: newIndex === -1 ? '' : commandHistory[newIndex],
      });
    }
  },
}));

// Sanitize input (VibeSec)
function sanitizeInput(input: string): string {
  // Strip HTML tags
  let cleaned = input.replace(/<[^>]*>/g, '');
  
  // Limit length
  if (cleaned.length > 100) {
    cleaned = cleaned.substring(0, 100);
  }
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Process command and return output lines
function processCommand(input: string): TerminalLine[] {
  const [cmd, ...args] = input.split(' ');
  const command = cmd.toLowerCase();
  
  // Portfolio navigation commands (will open windows in Phase 4)
  if (['trust', 'culture', 'undertow', 'about', 'contact'].includes(command)) {
    return [
      { type: 'output', text: `Opening ${command.toUpperCase()}...` },
      { type: 'output', text: '(Window will open in Phase 4)' },
    ];
  }
  
  // System commands
  if (command === 'help') {
    return [
      { type: 'output', text: '' },
      { type: 'output', text: 'AVAILABLE COMMANDS' },
      { type: 'output', text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
      { type: 'output', text: '' },
      { type: 'output', text: 'PORTFOLIO:' },
      { type: 'output', text: '  trust      → View cryptographic credentials project' },
      { type: 'output', text: '  culture    → View cultural publication project' },
      { type: 'output', text: '  undertow   → View ARES game project' },
      { type: 'output', text: '  about      → About G' },
      { type: 'output', text: '  contact    → Contact information' },
      { type: 'output', text: '' },
      { type: 'output', text: 'SYSTEM:' },
      { type: 'output', text: '  help       → Show this screen' },
      { type: 'output', text: '  clear      → Clear terminal' },
      { type: 'output', text: '  exit       → Close focused window' },
      { type: 'output', text: '' },
      { type: 'output', text: 'EXTRAS:' },
      { type: 'output', text: '  Try: whoami, ls, fortune, tree, snake, matrix' },
      { type: 'output', text: '  Or just explore...' },
      { type: 'output', text: '' },
    ];
  }
  
  if (command === 'clear') {
    useTerminalStore.getState().clearTerminal();
    return [];
  }
  
  if (command === 'exit') {
    return [
      { type: 'output', text: 'Use window close button [X] to close windows' },
    ];
  }
  
  // Info commands
  if (command === 'whoami') {
    return [
      { type: 'output', text: 'Solo indie dev. Singapore. Building invisible infrastructure.' },
    ];
  }
  
  if (command === 'pwd') {
    return [
      { type: 'output', text: '/home/g/portfolio' },
    ];
  }
  
  if (command === 'date') {
    return [
      { type: 'output', text: new Date().toString() },
    ];
  }
  
  if (command === 'uname' && args[0] === '-a') {
    return [
      { type: 'output', text: 'ARES v4.5 (裂世纪) Singapore/x64 consciousness-kernel' },
    ];
  }
  
  if (command === 'ls' && args[0] === '-la') {
    return [
      { type: 'output', text: 'total 24' },
      { type: 'output', text: 'drwxr-xr-x  8 g  staff   256 Mar 10 15:42 .' },
      { type: 'output', text: 'drwxr-xr-x  3 g  staff    96 Mar 10 15:42 ..' },
      { type: 'output', text: '-rw-r--r--  1 g  staff  1024 Mar 10 15:42 TRUST.md' },
      { type: 'output', text: '-rw-r--r--  1 g  staff  2048 Mar 10 15:42 CULTURE.md' },
      { type: 'output', text: '-rw-r--r--  1 g  staff  3072 Mar 10 15:42 UNDERTOW.md' },
      { type: 'output', text: '-rw-r--r--  1 g  staff   512 Mar 10 15:42 README.md' },
    ];
  }
  
  if (command === 'cat' && args[0] === 'README.md') {
    return [
      { type: 'output', text: 'Build things that outlive you.' },
      { type: 'output', text: 'No crowdsourcing. No bullshit.' },
      { type: 'output', text: 'Willing-to-pay users only.' },
    ];
  }
  
  if (command === 'echo') {
    return [
      { type: 'output', text: args.join(' ') },
    ];
  }
  
  if (command === 'history') {
    const history = useTerminalStore.getState().commandHistory;
    return history.map((cmd, i) => ({
      type: 'output' as const,
      text: `  ${i + 1}  ${cmd}`,
    }));
  }
  
  // Easter egg commands
  if (command === 'sudo' || input.startsWith('sudo ')) {
    return [
      { type: 'error', text: 'gerard is not in the sudoers file. This incident will be reported.' },
    ];
  }
  
  if (command === 'rm' && args[0] === '-rf' && args[1] === '/') {
    return [
      { type: 'output', text: 'Deleting system files...' },
      { type: 'output', text: '[▓▓▓▓▓▓▓▓▓▓] 100%' },
      { type: 'error', text: 'Access denied.' },
    ];
  }
  
  if (command === 'vim') {
    return [
      { type: 'output', text: 'Entering vim...' },
      { type: 'output', text: '' },
      { type: 'output', text: '~' },
      { type: 'output', text: '~' },
      { type: 'output', text: '~' },
      { type: 'output', text: '~' },
      { type: 'output', text: '~' },
      { type: 'output', text: '~' },
      { type: 'output', text: '' },
      { type: 'output', text: 'Type :q to exit... or try ctrl+c... or just give up.' },
      { type: 'output', text: '(JK, you cannot actually use vim here)' },
    ];
  }
  
  if (command === 'ping' && args[0] === 'localhost') {
    return [
      { type: 'output', text: 'PING localhost (127.0.0.1): 56 data bytes' },
      { type: 'output', text: '64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.045 ms' },
      { type: 'output', text: '64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.038 ms' },
      { type: 'output', text: 'Reply from yourself: stop' },
    ];
  }
  
  if (command === 'top') {
    return [
      { type: 'output', text: 'Processes: 3 total' },
      { type: 'output', text: '' },
      { type: 'output', text: 'PID    COMMAND          %CPU' },
      { type: 'output', text: '4821   career_plan      99.2' },
      { type: 'output', text: '4822   side_projects    45.7' },
      { type: 'output', text: '4823   coffee           12.1' },
    ];
  }
  
  if (command === 'git' && args[0] === 'push') {
    return [
      { type: 'output', text: 'Everything up-to-date.' },
      { type: 'output', text: 'Nothing to deploy.' },
    ];
  }
  
  if (command === 'fortune') {
    const fortunes = [
      'Build tools, not monuments.',
      'The best code is no code at all.',
      'Ship first, perfect later.',
      'Users pay for pain removed, not features added.',
      'If you are not embarrassed by your first release, you launched too late.',
      'Solve your own problems. Others have them too.',
      'Complexity is a tax on maintenance.',
      'Make it work, make it right, make it fast. In that order.',
      'Every feature is a liability.',
      'The graveyard is full of indispensable people.',
    ];
    const random = fortunes[Math.floor(Math.random() * fortunes.length)];
    return [
      { type: 'output', text: random },
    ];
  }
  
  if (command === 'tree') {
    return [
      { type: 'output', text: 'portfolio/' },
      { type: 'output', text: '├── TRUST/' },
      { type: 'output', text: '│   ├── AcadCert' },
      { type: 'output', text: '│   └── VeriCert' },
      { type: 'output', text: '├── CULTURE/' },
      { type: 'output', text: '│   └── DefMarks' },
      { type: 'output', text: '├── CONSCIOUSNESS/' },
      { type: 'output', text: '│   └── ARES (战神)' },
      { type: 'output', text: '└── README.md' },
    ];
  }
  
  if (command === 'snake') {
    return [
      { type: 'output', text: 'Snake game would load here...' },
      { type: 'output', text: '(Interactive games in Phase 7)' },
    ];
  }
  
  if (command === 'matrix') {
    return [
      { type: 'output', text: '01001101 01000001 01010100 01010010' },
      { type: 'output', text: '01001001 01011000 00100000 01000101' },
      { type: 'output', text: '01000110 01000110 01000101 01000011' },
      { type: 'output', text: '01010100 00100001' },
      { type: 'output', text: '' },
      { type: 'output', text: '(Full animation in Phase 7)' },
    ];
  }
  
  // Unknown command
  if (input) {
    return [
      { type: 'error', text: `Command not found: ${command}` },
      { type: 'output', text: "Type 'help' for available commands." },
    ];
  }
  
  return [];
}
```

---

## STEP 2: Terminal Component

### 2.1 Create Terminal component

**Create `src/components/Terminal.tsx`:**

```typescript
import { useEffect, useRef, useState } from 'react';
import { useTerminalStore } from '@/store/terminalStore';

export function Terminal() {
  const { lines, currentInput, executeCommand, setInput, navigateHistory } = useTerminalStore();
  const [cursorVisible, setCursorVisible] = useState(true);
  const outputRef = useRef<HTMLDivElement>(null);
  
  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
    } else if (e.key === 'Backspace') {
      setInput(currentInput.slice(0, -1));
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      setInput(currentInput + e.key);
    }
  };
  
  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        background: '#000000',
        color: '#00ff00',
        fontFamily: '"Courier New", monospace',
        fontSize: '13px',
        padding: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div 
        ref={outputRef}
        style={{
          flex: 1,
          overflow: 'auto',
          marginBottom: '10px',
        }}
      >
        {lines.map((line, i) => (
          <div 
            key={i} 
            style={{ 
              color: line.type === 'error' ? '#ff0000' : '#00ff00',
              whiteSpace: 'pre-wrap',
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex' }}>
        <span>&gt; {currentInput}</span>
        {cursorVisible && <span>█</span>}
      </div>
    </div>
  );
}
```

---

## STEP 3: Auto-open Terminal on Boot

### 3.1 Update App component

**Edit `src/App.tsx`:**

```typescript
import { useEffect } from 'react';
import { Scene } from '@/components/Scene';
import { useDesktopStore } from '@/store/desktopStore';
import { Terminal } from '@/components/Terminal';
import '@/styles/index.css';

export function App() {
  const openWindow = useDesktopStore(state => state.openWindow);
  
  // Auto-open terminal on mount
  useEffect(() => {
    setTimeout(() => {
      openWindow('terminal', 'C:\\PORTFOLIO\\TERMINAL.EXE', <Terminal />);
    }, 100);
  }, [openWindow]);
  
  return (
    <>
      <Scene />
      <div id="cursor">█</div>
    </>
  );
}

export default App;
```

---

## STEP 4: Test and Verify

### 4.1 Start dev server

```bash
pnpm dev
```

### 4.2 Expected result

On page load:
- Terminal window opens automatically
- Shows boot text: "ARES VERIFICATION PROTOCOL v4.5", "INIT SYSTEMS... [OK]", etc.
- Cursor blinks at prompt: `> █`
- Typing appears in terminal
- Enter key executes commands

### 4.3 Test commands

**Portfolio navigation:**
```
> trust
Opening TRUST...
(Window will open in Phase 4)

> culture
Opening CULTURE...
(Window will open in Phase 4)
```

**Help system:**
```
> help
AVAILABLE COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
...
```

**Info commands:**
```
> whoami
Solo indie dev. Singapore. Building invisible infrastructure.

> pwd
/home/g/portfolio

> ls -la
total 24
drwxr-xr-x  8 g  staff   256 Mar 10 15:42 .
...
```

**Easter eggs:**
```
> sudo anything
gerard is not in the sudoers file. This incident will be reported.

> rm -rf /
Deleting system files...
[▓▓▓▓▓▓▓▓▓▓] 100%
Access denied.

> vim
Entering vim...
...
(JK, you cannot actually use vim here)

> fortune
Build tools, not monuments.
```

### 4.4 Test command history

Type `help` and press Enter  
Press Up arrow → `help` appears  
Press Up arrow again → nothing (only one command in history)  
Type `whoami` and press Enter  
Press Up arrow → `whoami` appears  
Press Up arrow again → `help` appears  
Press Down arrow → `whoami` appears

### 4.5 Test clear

```
> clear
(Terminal clears, only empty lines remain)
```

---

## STEP 5: Input Sanitization Test (VibeSec)

### 5.1 Test HTML injection

Type in terminal:
```
> <script>alert('test')</script>
```

Expected: Command executes as text, no alert fires. Output should show:
```
Command not found: alert('test')
```

HTML tags stripped by `sanitizeInput()`.

### 5.2 Test length limit

Type 120+ characters → input truncates at 100 characters

### 5.3 Test special characters

```
> echo <>&"'
<>&"'
```

Special characters should display as text, not execute.

---

## STEP 6: Troubleshooting

### Terminal doesn't auto-open

Check App.tsx:
```typescript
useEffect(() => {
  setTimeout(() => {
    openWindow('terminal', 'C:\\PORTFOLIO\\TERMINAL.EXE', <Terminal />);
  }, 100);
}, [openWindow]);
```

Verify `openWindow` is imported from `useDesktopStore`.

### Typing doesn't appear

Check Terminal component has:
```typescript
tabIndex={0}
onKeyDown={handleKeyDown}
```

Click terminal window to focus it, then type.

### Commands not executing

Check `executeCommand` in terminalStore:
```typescript
executeCommand: (command) => {
  const trimmed = sanitizeInput(command);
  get().addLine({ type: 'command', text: `> ${trimmed}` });
  const output = processCommand(trimmed);
  output.forEach(line => get().addLine(line));
  set({ currentInput: '' });
}
```

### Cursor not blinking

Check cursor blink interval:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setCursorVisible(v => !v);
  }, 500);
  return () => clearInterval(interval);
}, []);
```

### Terminal doesn't scroll

Check outputRef auto-scroll:
```typescript
useEffect(() => {
  if (outputRef.current) {
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }
}, [lines]);
```

---

## PHASE 3 COMPLETE ✅

**Checkpoint:** Terminal window now fully functional with all commands.

**Next:** `docs/PHASE_4_PORTFOLIO.md` - Implement interactive portfolio pages (TRUST, CULTURE, UNDERTOW, ABOUT, CONTACT)

**Before moving to Phase 4:**
1. Verify all commands execute correctly
2. Verify command history works (up/down arrows)
3. Verify input sanitization prevents HTML injection
4. Verify terminal auto-scrolls
5. Commit code to git

```bash
git add .
git commit -m "Phase 3 complete: Terminal with all commands"
```
