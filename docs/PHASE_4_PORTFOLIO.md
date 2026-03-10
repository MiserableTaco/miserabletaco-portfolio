# PHASE 4: Portfolio Pages

> **Days 6-7 of 14**  
> Implement interactive portfolio pages with full mechanics

**Prerequisites:** Phase 3 complete (Terminal working with all commands)

---

## DELIVERABLES

By end of Phase 4, you will have:
- ✅ TRUST.EXE - Signature fragment verification game (click to verify 12 fragments)
- ✅ CULTURE.EXE - Network graph connection game (draw lines between 20 nodes)
- ✅ UNDERTOW.EXE - Hex grid navigation game (click hexes to reveal fragments)
- ✅ ABOUT.TXT - Static scrollable text content
- ✅ CONTACT.TXT - Static scrollable text content
- ✅ Terminal commands open actual portfolio windows (not placeholders)
- ✅ All interactive pages have win states and final reveals

---

## STEP 1: Update Terminal Commands

### 1.1 Modify processCommand to open windows

**Edit `src/store/terminalStore.ts`:**

Import at top:
```typescript
import { useDesktopStore } from './desktopStore';
```

Replace portfolio command handling in `processCommand`:

```typescript
// Portfolio navigation commands
if (command === 'trust') {
  useDesktopStore.getState().openWindow('trust', 'TRUST.EXE', getTrustContent());
  return [{ type: 'output', text: 'Opening TRUST.EXE...' }];
}

if (command === 'culture') {
  useDesktopStore.getState().openWindow('culture', 'CULTURE.EXE', getCultureContent());
  return [{ type: 'output', text: 'Opening CULTURE.EXE...' }];
}

if (command === 'undertow') {
  useDesktopStore.getState().openWindow('undertow', 'UNDERTOW.EXE', getUndertowContent());
  return [{ type: 'output', text: 'Opening UNDERTOW.EXE...' }];
}

if (command === 'about') {
  useDesktopStore.getState().openWindow('about', 'ABOUT.TXT', getAboutContent());
  return [{ type: 'output', text: 'Opening ABOUT.TXT...' }];
}

if (command === 'contact') {
  useDesktopStore.getState().openWindow('contact', 'CONTACT.TXT', getContactContent());
  return [{ type: 'output', text: 'Opening CONTACT.TXT...' }];
}
```

Add helper functions at bottom of file:

```typescript
// Import React
import React from 'react';

// Placeholder functions - will create actual components below
function getTrustContent() {
  // Will import actual component in Step 2
  return React.createElement('div', { style: { padding: '20px', color: '#00ffff' } }, 'TRUST content loading...');
}

function getCultureContent() {
  return React.createElement('div', { style: { padding: '20px', color: '#ff00ff' } }, 'CULTURE content loading...');
}

function getUndertowContent() {
  return React.createElement('div', { style: { padding: '20px', color: '#ffaa00' } }, 'UNDERTOW content loading...');
}

function getAboutContent() {
  return React.createElement('div', { style: { padding: '20px', color: '#00ff00' } }, 'ABOUT content loading...');
}

function getContactContent() {
  return React.createElement('div', { style: { padding: '20px', color: '#00ff00' } }, 'CONTACT content loading...');
}
```

---

## STEP 2: Create Portfolio Components

### 2.1 TRUST.EXE - Signature Verification Game

**Create `src/components/Portfolio/Trust.tsx`:**

```typescript
import { useState } from 'react';

const FRAGMENTS = [
  '4a9f2c8b7e3d1a5f',
  '8e1c3f9a2d7b4e6c',
  '2b7e4d1c9f3a8e5d',
  '9c3e1f7a4d2b8e6f',
  '7d4e2b1c8f9a3e5c',
  '1f8e3c9b2d4a7e6c',
  '3a7e9c1d4f2b8e5c',
  '6e2d8f3c1a9b4e7c',
  '5c9e1f4a3d7b2e8c',
  '8b3f1e7c9d2a4e6c',
  '2e9c4f1a7d3b8e5c',
  '4c7e1f9a2d3b8e6c',
];

export function Trust() {
  const [verified, setVerified] = useState<Set<number>>(new Set());
  const [revealing, setRevealing] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  
  const handleFragmentClick = (index: number) => {
    if (verified.has(index) || revealing !== null) return;
    
    setRevealing(index);
    
    // Simulate character-by-character reveal
    setTimeout(() => {
      setVerified(prev => new Set([...prev, index]));
      setRevealing(null);
      
      // Check if all verified
      if (verified.size + 1 >= 10) { // 10 out of 12
        setTimeout(() => setComplete(true), 500);
      }
    }, 1000);
  };
  
  if (complete) {
    return (
      <div style={{
        padding: '40px',
        color: '#00ffff',
        fontFamily: '"Courier New", monospace',
        fontSize: '13px',
      }}>
        <div style={{ borderTop: '1px solid #00ffff', borderBottom: '1px solid #00ffff', padding: '10px 0', marginBottom: '20px' }}>
          SYSTEM: TRUST
          <br />
          STATUS: VERIFIED
        </div>
        
        <div style={{ lineHeight: 1.8 }}>
          ACADCERT + VERICERT
          <br /><br />
          Cryptographic credentials. RSA-4096 signatures,
          <br />
          RFC 3161 timestamps, AES-256-GCM encryption.
          <br /><br />
          Building credentials that outlive the institutions
          <br />
          that issue them.
          <br /><br />
          → acadcert.com
          <br />
          → verify.acadcert.com
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      padding: '20px',
      color: '#00ffff',
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
    }}>
      <div style={{ marginBottom: '20px' }}>
        Click fragments to verify signature
        <br />
        {verified.size} / 12 verified
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
      }}>
        {FRAGMENTS.map((fragment, i) => (
          <div
            key={i}
            onClick={() => handleFragmentClick(i)}
            style={{
              padding: '10px',
              background: verified.has(i) ? '#003333' : '#1a1a1a',
              border: `1px solid ${verified.has(i) ? '#00ffff' : '#333333'}`,
              cursor: verified.has(i) || revealing !== null ? 'default' : 'pointer',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: verified.has(i) ? '#00ffff' : '#666666',
              opacity: revealing === i ? 0.5 : 1,
              transition: 'all 0.3s',
            }}
          >
            {verified.has(i) || revealing === i ? fragment : '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.2 CULTURE.EXE - Network Graph Connection Game

**Create `src/components/Portfolio/Culture.tsx`:**

```typescript
import { useState } from 'react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}

const NODES: Node[] = [
  { id: '1', label: 'Literature', x: 100, y: 100 },
  { id: '2', label: 'Film', x: 300, y: 100 },
  { id: '3', label: 'Code', x: 100, y: 200 },
  { id: '4', label: 'Design', x: 300, y: 200 },
  { id: '5', label: 'Philosophy', x: 100, y: 300 },
  { id: '6', label: 'History', x: 300, y: 300 },
  { id: '7', label: 'Art', x: 500, y: 100 },
  { id: '8', label: 'Music', x: 500, y: 200 },
  { id: '9', label: 'Technology', x: 500, y: 300 },
  { id: '10', label: 'Science', x: 500, y: 400 },
];

const VALID_PAIRS = [
  ['1', '2'], // Literature ↔ Film
  ['3', '4'], // Code ↔ Design
  ['5', '6'], // Philosophy ↔ History
  ['7', '8'], // Art ↔ Music
  ['9', '10'], // Technology ↔ Science
];

export function Culture() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connections, setConnections] = useState<Array<[string, string]>>([]);
  const [complete, setComplete] = useState(false);
  
  const handleNodeClick = (nodeId: string) => {
    if (complete) return;
    
    if (selectedNode === null) {
      setSelectedNode(nodeId);
    } else if (selectedNode === nodeId) {
      setSelectedNode(null);
    } else {
      // Check if valid connection
      const isValid = VALID_PAIRS.some(pair =>
        (pair[0] === selectedNode && pair[1] === nodeId) ||
        (pair[1] === selectedNode && pair[0] === nodeId)
      );
      
      if (isValid) {
        const newConnection: [string, string] = [selectedNode, nodeId];
        setConnections(prev => [...prev, newConnection]);
        setSelectedNode(null);
        
        // Check if all connected
        if (connections.length + 1 >= VALID_PAIRS.length) {
          setTimeout(() => setComplete(true), 500);
        }
      } else {
        // Invalid connection - flash and reset
        setTimeout(() => setSelectedNode(null), 1000);
      }
    }
  };
  
  if (complete) {
    return (
      <div style={{
        padding: '40px',
        color: '#ff00ff',
        fontFamily: '"Courier New", monospace',
        fontSize: '13px',
      }}>
        <div style={{ borderTop: '1px solid #ff00ff', borderBottom: '1px solid #ff00ff', padding: '10px 0', marginBottom: '20px' }}>
          SYSTEM: CULTURE
          <br />
          STATUS: VERIFIED
        </div>
        
        <div style={{ lineHeight: 1.8 }}>
          DEFMARKS
          <br /><br />
          Cultural publication. Finding connections between
          <br />
          things people assume are unrelated.
          <br /><br />
          Site's live. Content coming.
          <br /><br />
          → defmarks.com
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      padding: '20px',
      color: '#ff00ff',
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      position: 'relative',
      height: '100%',
    }}>
      <div style={{ marginBottom: '20px' }}>
        Draw connections between related concepts
        <br />
        {connections.length} / {VALID_PAIRS.length} connected
      </div>
      
      <svg style={{ position: 'absolute', top: 60, left: 0, width: '100%', height: 'calc(100% - 60px)', pointerEvents: 'none' }}>
        {connections.map((conn, i) => {
          const node1 = NODES.find(n => n.id === conn[0])!;
          const node2 = NODES.find(n => n.id === conn[1])!;
          return (
            <line
              key={i}
              x1={node1.x + 40}
              y1={node1.y + 15}
              x2={node2.x + 40}
              y2={node2.y + 15}
              stroke="#ff00ff"
              strokeWidth="2"
            />
          );
        })}
        {selectedNode && (
          <>
            {NODES.filter(n => n.id !== selectedNode).map(node => {
              const selectedNodeData = NODES.find(n => n.id === selectedNode)!;
              return (
                <line
                  key={node.id}
                  x1={selectedNodeData.x + 40}
                  y1={selectedNodeData.y + 15}
                  x2={node.x + 40}
                  y2={node.y + 15}
                  stroke="#ff00ff"
                  strokeWidth="1"
                  opacity="0.3"
                  strokeDasharray="4"
                />
              );
            })}
          </>
        )}
      </svg>
      
      <div style={{ position: 'relative', paddingTop: '20px' }}>
        {NODES.map(node => (
          <div
            key={node.id}
            onClick={() => handleNodeClick(node.id)}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              padding: '8px 16px',
              background: selectedNode === node.id ? '#ff00ff' : '#1a1a1a',
              border: `2px solid #ff00ff`,
              color: selectedNode === node.id ? '#000' : '#ff00ff',
              cursor: 'pointer',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            {node.label}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.3 UNDERTOW.EXE - Hex Grid Navigation

**Create `src/components/Portfolio/Undertow.tsx`:**

```typescript
import { useState } from 'react';

const FRAGMENTS = [
  '2150. Southeast Asia river corridor.',
  'Post-collapse. Fractured factions.',
  'Political grand strategy. Character-driven.',
  'Command fleets. Navigate council politics.',
  'Survive 40 turns. Every decision costs.',
  'Hex-based tactical gameplay.',
  'Web-playable alpha. Desktop Chrome.',
];

// Flat-top hex coordinates (axial: q, r)
const HEXES = [
  { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 },
  { q: 0, r: 1 }, { q: 1, r: 1 }, { q: 2, r: 1 },
  { q: 0, r: 2 }, { q: 1, r: 2 }, { q: 2, r: 2 },
  { q: 0, r: 3 }, { q: 1, r: 3 }, { q: 2, r: 3 },
];

function hexToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * (3/2 * q);
  const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return { x, y };
}

export function Undertow() {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [currentFragment, setCurrentFragment] = useState(0);
  const [complete, setComplete] = useState(false);
  
  const handleHexClick = (index: number) => {
    if (revealed.has(index) || complete) return;
    
    setRevealed(prev => new Set([...prev, index]));
    
    if (currentFragment < FRAGMENTS.length) {
      setCurrentFragment(prev => prev + 1);
      
      if (currentFragment + 1 >= FRAGMENTS.length) {
        setTimeout(() => setComplete(true), 500);
      }
    }
  };
  
  if (complete) {
    return (
      <div style={{
        padding: '40px',
        color: '#ffaa00',
        fontFamily: '"Courier New", monospace',
        fontSize: '13px',
      }}>
        <div style={{ borderTop: '1px solid #ffaa00', borderBottom: '1px solid #ffaa00', padding: '10px 0', marginBottom: '20px' }}>
          SYSTEM: UNDERTOW
          <br />
          STATUS: VERIFIED
        </div>
        
        <div style={{ lineHeight: 1.8 }}>
          ARES: UNDERTOW (裂世纪·浊流)
          <br /><br />
          Political grand strategy. 2150 Southeast Asia.
          <br />
          Command fleets, navigate politics, survive.
          <br /><br />
          → play.aresundertow.com
        </div>
      </div>
    );
  }
  
  const size = 60;
  
  return (
    <div style={{
      padding: '20px',
      color: '#ffaa00',
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
    }}>
      <div style={{ marginBottom: '20px' }}>
        Navigate the corridor. Click hexes to reveal.
        <br />
        {currentFragment} / {FRAGMENTS.length} fragments
      </div>
      
      <svg width="600" height="400" style={{ display: 'block', margin: '0 auto' }}>
        {HEXES.map((hex, i) => {
          const { x, y } = hexToPixel(hex.q, hex.r, size);
          const points = [];
          for (let j = 0; j < 6; j++) {
            const angle = (Math.PI / 3) * j;
            const px = x + size * Math.cos(angle) + 150;
            const py = y + size * Math.sin(angle) + 50;
            points.push(`${px},${py}`);
          }
          
          return (
            <polygon
              key={i}
              points={points.join(' ')}
              fill={revealed.has(i) ? '#332200' : '#1a1a1a'}
              stroke={revealed.has(i) ? '#ffaa00' : '#333333'}
              strokeWidth="2"
              style={{ cursor: revealed.has(i) ? 'default' : 'pointer' }}
              onClick={() => handleHexClick(i)}
            />
          );
        })}
      </svg>
      
      <div style={{ marginTop: '30px', minHeight: '120px' }}>
        {FRAGMENTS.slice(0, currentFragment).map((fragment, i) => (
          <div key={i} style={{ marginBottom: '8px', opacity: 0.8 }}>
            {fragment}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.4 ABOUT.TXT - Static Text

**Create `src/components/Portfolio/About.tsx`:**

```typescript
export function About() {
  return (
    <div style={{
      padding: '20px',
      color: '#00ff00',
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      lineHeight: 1.8,
      overflowY: 'auto',
      height: '100%',
    }}>
      <div style={{ borderTop: '1px solid #00ff00', borderBottom: '1px solid #00ff00', padding: '10px 0', marginBottom: '20px' }}>
        ABOUT
      </div>
      
      <div>
        G. Solo indie dev, Singapore.
        <br /><br />
        Three projects:
        <br /><br />
        TRUST — AcadCert + VeriCert
        <br />
        &nbsp;&nbsp;Cryptographic credential platform. RSA-4096, RFC 3161,
        <br />
        &nbsp;&nbsp;AES-256-GCM. Building credentials that outlive the
        <br />
        &nbsp;&nbsp;institutions that issue them.
        <br />
        &nbsp;&nbsp;acadcert.com / verify.acadcert.com
        <br /><br />
        CULTURE — DefMarks
        <br />
        &nbsp;&nbsp;Cultural publication. Finding connections between
        <br />
        &nbsp;&nbsp;things people assume are unrelated. Articles, analysis,
        <br />
        &nbsp;&nbsp;unexpected threads. Site's live, content coming.
        <br />
        &nbsp;&nbsp;defmarks.com
        <br /><br />
        CONSCIOUSNESS — ARES (战神)
        <br />
        &nbsp;&nbsp;Science fiction universe. Book series + grand strategy
        <br />
        &nbsp;&nbsp;game set in 2150 Southeast Asia. Post-collapse river
        <br />
        &nbsp;&nbsp;corridor politics. Web-playable alpha at
        <br />
        &nbsp;&nbsp;play.aresundertow.com
        <br /><br />
        I like invisible infrastructure plays. Willing-to-pay users,
        <br />
        not crowdsourced ideas. Strong filter for things that won't
        <br />
        work in practice.
        <br /><br />
        Chinese literature, browser extensions, the building process
        <br />
        itself. Writing 裂世纪·浊流 (Fractured Century: Turbid Current),
        <br />
        first book in the ARES series.
        <br /><br />
        Long-term: ARES as identity infrastructure. Define what you
        <br />
        did → who you are → that you are.
      </div>
    </div>
  );
}
```

### 2.5 CONTACT.TXT - Static Text

**Create `src/components/Portfolio/Contact.tsx`:**

```typescript
export function Contact() {
  return (
    <div style={{
      padding: '20px',
      color: '#00ff00',
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      lineHeight: 1.8,
    }}>
      <div style={{ borderTop: '1px solid #00ff00', borderBottom: '1px solid #00ff00', padding: '10px 0', marginBottom: '20px' }}>
        CONTACT
      </div>
      
      <div>
        Email: gerard.qiu803@gmail.com
        <br />
        GitHub: Private repos (no public profile link)
        <br /><br />
        Singapore.
        <br /><br />
        Down to talk about: Technical collabs, indie product ideas,
        <br />
        Chinese literature, SF worldbuilding, browser extensions.
        <br /><br />
        Not interested in: Generic pitches, crowdsourced anything,
        <br />
        consulting unrelated to my work.
      </div>
    </div>
  );
}
```

---

## STEP 3: Update Terminal Store Imports

**Edit `src/store/terminalStore.ts`:**

Replace placeholder functions with actual imports:

```typescript
import { Trust } from '@/components/Portfolio/Trust';
import { Culture } from '@/components/Portfolio/Culture';
import { Undertow } from '@/components/Portfolio/Undertow';
import { About } from '@/components/Portfolio/About';
import { Contact } from '@/components/Portfolio/Contact';

function getTrustContent() {
  return React.createElement(Trust);
}

function getCultureContent() {
  return React.createElement(Culture);
}

function getUndertowContent() {
  return React.createElement(Undertow);
}

function getAboutContent() {
  return React.createElement(About);
}

function getContactContent() {
  return React.createElement(Contact);
}
```

---

## STEP 4: Test and Verify

### 4.1 Test TRUST.EXE

In terminal:
```
> trust
```

Window opens showing 12 signature fragments  
Click fragments → they reveal hex strings  
After 10+ clicks → final reveal shows AcadCert/VeriCert info

### 4.2 Test CULTURE.EXE

In terminal:
```
> culture
```

Window opens showing 10 nodes  
Click Literature → click Film → line connects (valid pair)  
Click Code → click History → line fades (invalid pair)  
After 5 valid connections → final reveal shows DefMarks info

### 4.3 Test UNDERTOW.EXE

In terminal:
```
> undertow
```

Window opens showing hex grid  
Click hexes → they turn amber, fragments appear below  
After 7 clicks → final reveal shows ARES info

### 4.4 Test ABOUT/CONTACT

```
> about
Opening ABOUT.TXT...

> contact
Opening CONTACT.TXT...
```

Both open as scrollable text windows.

---

## STEP 5: Troubleshooting

### Portfolio window doesn't open

Check terminalStore:
```typescript
useDesktopStore.getState().openWindow('trust', 'TRUST.EXE', getTrustContent());
```

Verify `useDesktopStore` imported and `getTrustContent()` returns React element.

### Components not rendering

Check imports in terminalStore.ts:
```typescript
import { Trust } from '@/components/Portfolio/Trust';
```

Verify file paths match exactly.

### Hex grid not rendering

Check SVG polygon points calculation in Undertow.tsx:
```typescript
const points = [];
for (let j = 0; j < 6; j++) {
  const angle = (Math.PI / 3) * j;
  const px = x + size * Math.cos(angle) + 150;
  const py = y + size * Math.sin(angle) + 50;
  points.push(`${px},${py}`);
}
```

### Network graph lines not drawing

Check SVG in Culture.tsx:
```typescript
<svg style={{ position: 'absolute', ... }}>
  {connections.map((conn, i) => {
    const node1 = NODES.find(n => n.id === conn[0])!;
    const node2 = NODES.find(n => n.id === conn[1])!;
    return <line ... />;
  })}
</svg>
```

---

## PHASE 4 COMPLETE ✅

**Checkpoint:** All portfolio pages now fully interactive with win states.

**Next:** `docs/PHASE_5_OBJECTS.md` - Implement 15 3D objects with click interactions

**Before moving to Phase 5:**
1. Verify all 5 portfolio commands open windows
2. Verify TRUST signature game works (10+ clicks → reveal)
3. Verify CULTURE graph game works (5 valid pairs → reveal)
4. Verify UNDERTOW hex game works (7 clicks → reveal)
5. Verify ABOUT/CONTACT display correctly
6. Commit code to git

```bash
git add .
git commit -m "Phase 4 complete: Interactive portfolio pages"
```
