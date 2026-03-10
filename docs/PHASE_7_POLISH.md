# PHASE 7: Polish & Effects

> **Days 11-12 of 14**  
> Add post-processing effects, loading sequence, visit counter, and optimize performance

**Prerequisites:** Phase 6 complete (Audio system working)

---

## DELIVERABLES

By end of Phase 7, you will have:
- ✅ Film grain overlay (5% opacity)
- ✅ Vignette overlay (30% opacity dark corners)
- ✅ CRT scanlines on monitor screen only
- ✅ Loading sequence (eyes open → blur → boot text → interactive)
- ✅ Visit counter system (localStorage, never resets)
- ✅ Sticky note content evolves with visit count
- ✅ backup_v[count].zip filename updates
- ✅ Performance optimization (60fps sustained)
- ✅ Mobile detection and fallback to 2D terminal

---

## STEP 1: Post-Processing Effects

### 1.1 Create effects CSS

**Create `src/styles/effects.css`:**

```css
/* Film grain overlay */
@keyframes grain {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  20% { transform: translate(-15%, 5%); }
  30% { transform: translate(7%, -25%); }
  40% { transform: translate(-5%, 25%); }
  50% { transform: translate(-15%, 10%); }
  60% { transform: translate(15%, 0%); }
  70% { transform: translate(0%, 15%); }
  80% { transform: translate(3%, 35%); }
  90% { transform: translate(-10%, 10%); }
}

#grain-overlay {
  position: fixed;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuNSIvPjwvc3ZnPg==');
  opacity: 0.05;
  pointer-events: none;
  z-index: 9998;
  animation: grain 8s steps(10) infinite;
}

/* Vignette overlay */
#vignette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.3) 100%);
  opacity: 0.3;
  pointer-events: none;
  z-index: 9999;
}

/* CRT scanlines - applied to monitor screen only via Three.js */
.crt-scanlines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
}
```

### 1.2 Add overlays to HTML

**Edit `index.html`:**

Add after `<div id="root"></div>`:

```html
<div id="grain-overlay"></div>
<div id="vignette-overlay"></div>
```

### 1.3 Import effects CSS

**Edit `src/App.tsx`:**

```typescript
import '@/styles/effects.css';
```

### 1.4 Add CRT scanlines to monitor screen

**Edit `src/components/Desktop.tsx`:**

In render loop, after drawing desktop content, add scanlines:

```typescript
// Draw CRT scanlines
ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
ctx.lineWidth = 1;
for (let y = 0; y < DESKTOP_HEIGHT; y += 2) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(DESKTOP_WIDTH, y);
  ctx.stroke();
}
```

---

## STEP 2: Loading Sequence

### 2.1 Create loading component

**Create `src/components/Loading.tsx`:**

```typescript
import { useState, useEffect } from 'react';

interface LoadingProps {
  onComplete: () => void;
}

export function Loading({ onComplete }: LoadingProps) {
  const [stage, setStage] = useState<'eyes' | 'blur' | 'boot' | 'done'>('eyes');
  const [bootLines, setBootLines] = useState<string[]>([]);
  
  useEffect(() => {
    const sequence = async () => {
      // Stage 1: Eyes opening (2 seconds)
      await sleep(2000);
      setStage('blur');
      
      // Stage 2: Blur to focus (2 seconds)
      await sleep(2000);
      setStage('boot');
      
      // Stage 3: Boot sequence (3 seconds)
      const lines = [
        'ARES VERIFICATION PROTOCOL v4.5',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'INIT SYSTEMS... [OK]',
        'LOAD DOMAINS... [OK]',
        'MOUNT DRIVES... [OK]',
        'START SERVICES... [OK]',
        '',
        'AUTH: GUEST',
        '',
        'READY.',
      ];
      
      for (const line of lines) {
        setBootLines(prev => [...prev, line]);
        await sleep(line ? 300 : 100);
      }
      
      await sleep(1000);
      setStage('done');
      
      // Fade out and complete
      await sleep(1000);
      onComplete();
    };
    
    sequence();
  }, [onComplete]);
  
  if (stage === 'done') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#000',
        opacity: 0,
        transition: 'opacity 1s',
        zIndex: 10000,
      }} />
    );
  }
  
  if (stage === 'eyes') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#000',
        zIndex: 10000,
        animation: 'eyes-open 2s ease-out forwards',
      }}>
        <style>{`
          @keyframes eyes-open {
            0% {
              background: #000;
              box-shadow: inset 0 50vh 0 0 #000, inset 0 -50vh 0 0 #000;
            }
            100% {
              background: #1a1a1a;
              box-shadow: inset 0 0 0 0 #000, inset 0 0 0 0 #000;
            }
          }
        `}</style>
      </div>
    );
  }
  
  if (stage === 'blur') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#1a1a1a',
        backdropFilter: 'blur(10px)',
        animation: 'blur-to-focus 2s ease-out forwards',
        zIndex: 10000,
      }}>
        <style>{`
          @keyframes blur-to-focus {
            0% { backdrop-filter: blur(10px); }
            100% { backdrop-filter: blur(0px); }
          }
        `}</style>
      </div>
    );
  }
  
  // Boot stage
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      color: '#00ff00',
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      padding: '40px',
      zIndex: 10000,
      overflow: 'hidden',
    }}>
      {bootLines.map((line, i) => (
        <div key={i} style={{ marginBottom: '4px' }}>
          {line}
        </div>
      ))}
    </div>
  );
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 2.2 Use loading in App

**Edit `src/App.tsx`:**

```typescript
import { useState } from 'react';
import { Loading } from '@/components/Loading';

export function App() {
  const [loading, setLoading] = useState(true);
  const audio = useAudio();
  const { muted, toggleMute } = useAudioStore();
  const openWindow = useDesktopStore(state => state.openWindow);
  
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        openWindow('terminal', 'C:\\PORTFOLIO\\TERMINAL.EXE', <Terminal audio={audio} />);
      }, 100);
    }
  }, [loading, openWindow, audio]);
  
  if (loading) {
    return <Loading onComplete={() => setLoading(false)} />;
  }
  
  return (
    <>
      <Scene audio={audio} />
      <div id="cursor">█</div>
      <button onClick={toggleMute} style={{ /* ... */ }}>
        {muted ? '🔇 MUTED' : '🔊 AUDIO ON'}
      </button>
    </>
  );
}
```

---

## STEP 3: Visit Counter System

### 3.1 Create visit counter hook

**Create `src/hooks/useVisitCounter.ts`:**

```typescript
import { useEffect, useState } from 'react';

export function useVisitCounter() {
  const [visitCount, setVisitCount] = useState(1);
  
  useEffect(() => {
    const stored = localStorage.getItem('portfolio_visits');
    const count = stored ? parseInt(stored, 10) : 0;
    
    // Validate
    if (isNaN(count) || count < 0 || count > 1000000) {
      localStorage.setItem('portfolio_visits', '1');
      setVisitCount(1);
    } else {
      const newCount = count + 1;
      localStorage.setItem('portfolio_visits', String(newCount));
      setVisitCount(newCount);
    }
  }, []);
  
  return visitCount;
}

export function getStickyNoteText(visitCount: number): string {
  if (visitCount === 1) {
    return 'Welcome.';
  } else if (visitCount <= 3) {
    return 'Welcome back.';
  } else if (visitCount <= 5) {
    return 'You keep coming back.\nThat\'s nice.';
  } else if (visitCount <= 10) {
    return 'Still here?\nThe terminal knows more\nthan it shows.';
  } else if (visitCount <= 20) {
    return 'v' + visitCount + '\nYou\'re persistent.\nI respect that.';
  } else {
    // Corrupted after 20+ visits
    return 'v' + visitCount + '\n▓▓▓▓▓▓▓▓▓▓\nCa█ ▓ou s█ill\n██ad th█s?';
  }
}
```

### 3.2 Update desktop store with visit count

**Edit `src/store/desktopStore.ts`:**

Add visit count parameter to createIcons:

```typescript
const createIcons = (visitCount: number): DesktopIcon[] => [
  // ... existing icons ...
  { 
    id: 'backup', 
    name: visitCount > 20 ? `backup_v̷̗̈${visitCount}.z̸̰͝ip` : `backup_v${visitCount}.zip`, 
    app: 'backup', 
    x: 220, 
    y: 220, 
    iconColor: '#808080' 
  },
];
```

Update store to accept visit count:

```typescript
export const useDesktopStore = create<DesktopState>((set, get) => ({
  icons: [], // Will be initialized with visit count
  // ... rest of store ...
  
  initializeIcons: (visitCount: number) => set({ icons: createIcons(visitCount) }),
}));
```

### 3.3 Initialize with visit count

**Edit `src/App.tsx`:**

```typescript
import { useVisitCounter } from '@/hooks/useVisitCounter';

export function App() {
  const visitCount = useVisitCounter();
  const initializeIcons = useDesktopStore(state => state.initializeIcons);
  
  useEffect(() => {
    initializeIcons(visitCount);
  }, [visitCount, initializeIcons]);
  
  // ... rest of component ...
}
```

### 3.4 Update sticky note with visit text

**Edit `src/components/Scene.tsx`:**

Pass visit count to createStickyNote:

```typescript
const stickyNote = createStickyNote(visitCount);
```

Update function:

```typescript
import { getStickyNoteText } from '@/hooks/useVisitCounter';

function createStickyNote(visitCount: number): THREE.Group {
  const note = new THREE.Group();
  note.position.set(0.25, 1.4, -0.3);
  
  // Yellow square
  const square = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  note.add(square);
  
  // Text (using canvas texture)
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(0, 0, 256, 256);
  
  ctx.fillStyle = '#000000';
  ctx.font = '16px "Courier New"';
  ctx.textAlign = 'center';
  
  const lines = getStickyNoteText(visitCount).split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, 128, 60 + i * 20);
  });
  
  const texture = new THREE.CanvasTexture(canvas);
  square.material.map = texture;
  
  return note;
}
```

---

## STEP 4: Mobile Detection and Fallback

### 4.1 Create mobile detection

**Edit `src/App.tsx`:**

```typescript
const [isMobile] = useState(() => {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
});

if (loading) {
  return <Loading onComplete={() => setLoading(false)} />;
}

if (isMobile) {
  return <MobileFallback />;
}

// Desktop experience
return (
  <>
    <Scene audio={audio} />
    {/* ... rest ... */}
  </>
);
```

### 4.2 Create mobile fallback

**Create `src/components/MobileFallback.tsx`:**

```typescript
import { Terminal } from './Terminal';

export function MobileFallback() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '20px',
        color: '#00ff00',
        fontFamily: '"Courier New", monospace',
        fontSize: '12px',
        borderBottom: '1px solid #00ff00',
      }}>
        miserabletaco.dev
        <br />
        <span style={{ opacity: 0.5 }}>
          (Desktop experience available on larger screens)
        </span>
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Terminal />
      </div>
    </div>
  );
}
```

---

## STEP 5: Performance Optimization

### 5.1 Optimize Three.js scene

**Edit `src/components/Scene.tsx`:**

Add render optimizations:

```typescript
// In useEffect after creating renderer:

// Enable shadows only if needed (currently not using shadows)
renderer.shadowMap.enabled = false;

// Optimize pixel ratio
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Max 2x

// Use WebGL 2 if available
const gl = renderer.getContext();
console.log('WebGL version:', gl.getParameter(gl.VERSION));

// Frustum culling (Three.js does this by default, but verify)
camera.updateProjectionMatrix();
```

### 5.2 Optimize desktop rendering

**Edit `src/components/Desktop.tsx`:**

Throttle render loop:

```typescript
let lastRenderTime = 0;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

const render = (timestamp: number) => {
  if (timestamp - lastRenderTime < FRAME_TIME) {
    requestAnimationFrame(render);
    return;
  }
  
  lastRenderTime = timestamp;
  
  // ... existing render code ...
  
  requestAnimationFrame(render);
};

render(0);
```

### 5.3 Lazy load audio

Audio files already lazy-loaded in Phase 6 via async loading.

### 5.4 Check performance

**Test in Chrome DevTools:**
1. Open DevTools → Performance tab
2. Record for 10 seconds
3. Check FPS (should be steady 60fps)
4. Check Memory (should stay <200MB)

If < 60fps:
- Reduce desktop canvas size (1024×768 → 800×600)
- Reduce 3D object polygon count
- Disable film grain animation

---

## STEP 6: Test and Verify

### 6.1 Test loading sequence

Refresh page:
1. Black screen with vignette shrinking (eyes opening) - 2s
2. Blurry grey screen focusing - 2s
3. Boot text typing out line by line - 3s
4. Fade to interactive scene - 1s

Total: 8 seconds

### 6.2 Test post-processing

**Film grain:** Subtle animated noise over entire viewport  
**Vignette:** Dark corners, 30% opacity  
**CRT scanlines:** Horizontal lines visible on monitor screen only

### 6.3 Test visit counter

First visit: Sticky note says "Welcome.", backup filename is `backup_v1.zip`  
Refresh: Sticky note says "Welcome back.", backup filename is `backup_v2.zip`  
Refresh 20 times: Sticky note corrupts, backup filename glitches

### 6.4 Test mobile fallback

Open on phone or resize browser <768px width → 2D terminal interface loads

### 6.5 Test performance

Open DevTools → Performance tab → record 10 seconds  
FPS should be steady 60fps with no major drops

---

## STEP 7: Troubleshooting

### Loading sequence not showing

Check Loading component renders:
```typescript
if (loading) {
  return <Loading onComplete={() => setLoading(false)} />;
}
```

### Effects not visible

Check CSS imports:
```typescript
import '@/styles/effects.css';
```

Check overlays added to HTML:
```html
<div id="grain-overlay"></div>
<div id="vignette-overlay"></div>
```

### Visit counter not incrementing

Check localStorage:
```javascript
const stored = localStorage.getItem('portfolio_visits');
```

Open DevTools → Application → Local Storage → verify 'portfolio_visits' increments.

### Mobile fallback not triggering

Check detection logic:
```typescript
const [isMobile] = useState(() => {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
});
```

Test by resizing browser window to <768px.

### Performance issues

**If < 60fps:**
1. Reduce canvas size: `canvas.width = 800; canvas.height = 600;`
2. Increase render throttle: `const FRAME_TIME = 1000 / 30;` (30fps target)
3. Disable film grain animation: Remove `animation: grain 8s steps(10) infinite;`

---

## PHASE 7 COMPLETE ✅

**Checkpoint:** Site fully polished with effects, loading, and optimization.

**Next:** `docs/PHASE_8_DEPLOY.md` - Security headers, service worker, Cloudflare Pages deployment

**Before moving to Phase 8:**
1. Verify loading sequence works (8 seconds total)
2. Verify film grain, vignette, scanlines visible
3. Verify visit counter increments and sticky note evolves
4. Verify mobile fallback triggers on small screens
5. Verify 60fps sustained performance
6. Commit code to git

```bash
git add .
git commit -m "Phase 7 complete: Polish and effects"
```
