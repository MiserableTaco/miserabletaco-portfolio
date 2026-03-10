# PHASE 6: Audio System

> **Day 10 of 14**  
> Implement Web Audio API with generative and sampled sounds

**Prerequisites:** Phase 5 complete (3D objects with visual feedback)

---

## DELIVERABLES

By end of Phase 6, you will have:
- ✅ Web Audio API initialized and working
- ✅ Generative audio (ambient drone, fluorescent buzz, dial tone)
- ✅ 15+ sound files sourced from freesound.org
- ✅ All sounds loaded and playable
- ✅ Master mixing system with per-layer gain
- ✅ Mute toggle button (bottom-right)
- ✅ Audio ducking (ambient lowers during typing)
- ✅ All object interactions play sounds
- ✅ Terminal typing plays keyboard clicks

---

## STEP 1: Source Audio Files

### 1.1 Download from freesound.org

**Go to [freesound.org](https://freesound.org) and search for:**

1. **room-tone.mp3** - Search: "office ambience quiet" or "room tone"
   - Find: Quiet office background sound, 30s+ long
   - License: CC0 or CC-BY

2. **keyboard-1.mp3, keyboard-2.mp3, keyboard-3.mp3** - Search: "mechanical keyboard click"
   - Find: 3 different short click sounds (<100ms each)
   - License: CC0 or CC-BY

3. **mug-clink.mp3** - Search: "ceramic cup clink"

4. **paper-rustle.mp3** - Search: "paper shuffle"

5. **stapler.mp3** - Search: "stapler punch"

6. **pen-rattle.mp3** - Search: "pens in cup" or "plastic rattle"

7. **book-thud.mp3** - Search: "book close thud"

8. **drawer-slide.mp3** - Search: "wood drawer open"

9. **leaf-rustle.mp3** - Search: "plant leaves rustle"

10. **window-open.mp3** - Search: "woosh short"

11. **window-close.mp3** - Search: "soft click"

12. **icon-click.mp3** - Search: "ui beep short"

13. **error-beep.mp3** - Search: "error beep alert"

14. **success-chime.mp3** - Search: "success ding pleasant"

15. **snap.mp3** - Search: "snap click" (for CULTURE connections)

16. **ping.mp3** - Search: "tactical ping sonar" (for UNDERTOW hexes)

17. **verify-chime.mp3** - Search: "verification success chime" (for TRUST fragments)

### 1.2 Process in Audacity (optional but recommended)

For each sound:
1. Open in Audacity
2. **Normalize:** Effect → Normalize → OK
3. **Trim silence:** Select quiet parts → Delete
4. **Fade in/out:** Select first/last 50ms → Effect → Fade In/Out
5. **Export:** File → Export → Export as MP3 (128 kbps)

### 1.3 Add to project

Place all downloaded MP3 files in:
```
public/audio/
```

---

## STEP 2: Audio Hook

### 2.1 Create audio hook

**Create `src/hooks/useAudio.ts`:**

```typescript
import { useEffect, useRef } from 'react';
import { create } from 'zustand';

// Audio store for mute state
interface AudioState {
  muted: boolean;
  toggleMute: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  muted: sessionStorage.getItem('audio_muted') === 'true',
  toggleMute: () => set((state) => {
    const newMuted = !state.muted;
    sessionStorage.setItem('audio_muted', String(newMuted));
    return { muted: newMuted };
  }),
}));

export function useAudio() {
  const audioCtx = useRef<AudioContext | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  const ambientGain = useRef<GainNode | null>(null);
  const roomToneGain = useRef<GainNode | null>(null);
  const keyboardGain = useRef<GainNode | null>(null);
  const objectGain = useRef<GainNode | null>(null);
  const audioBuffers = useRef<Record<string, AudioBuffer>>({});
  
  const { muted } = useAudioStore();
  
  useEffect(() => {
    // Initialize Audio Context
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtx.current = ctx;
    
    // Create master gain
    const master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    masterGain.current = master;
    
    // Create layer gains
    const ambient = ctx.createGain();
    ambient.gain.value = 0.2;
    ambient.connect(master);
    ambientGain.current = ambient;
    
    const roomTone = ctx.createGain();
    roomTone.gain.value = 0.15;
    roomTone.connect(master);
    roomToneGain.current = roomTone;
    
    const keyboard = ctx.createGain();
    keyboard.gain.value = 0.4;
    keyboard.connect(master);
    keyboardGain.current = keyboard;
    
    const object = ctx.createGain();
    object.gain.value = 0.5;
    object.connect(master);
    objectGain.current = object;
    
    // Resume context on user interaction (browser requirement)
    const resumeContext = () => {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    };
    
    document.addEventListener('click', resumeContext, { once: true });
    
    // Start generative audio
    startAmbientDrone(ctx, ambient);
    startFluorescentBuzz(ctx, master);
    
    // Load all audio files
    loadAllAudio(ctx);
    
    return () => {
      ctx.close();
    };
  }, []);
  
  // Update master gain when muted
  useEffect(() => {
    if (masterGain.current) {
      masterGain.current.gain.value = muted ? 0 : 0.7;
    }
  }, [muted]);
  
  const loadAllAudio = async (ctx: AudioContext) => {
    const files = [
      'room-tone.mp3',
      'keyboard-1.mp3',
      'keyboard-2.mp3',
      'keyboard-3.mp3',
      'mug-clink.mp3',
      'paper-rustle.mp3',
      'stapler.mp3',
      'pen-rattle.mp3',
      'book-thud.mp3',
      'drawer-slide.mp3',
      'leaf-rustle.mp3',
      'window-open.mp3',
      'window-close.mp3',
      'icon-click.mp3',
      'error-beep.mp3',
      'success-chime.mp3',
      'snap.mp3',
      'ping.mp3',
      'verify-chime.mp3',
    ];
    
    for (const file of files) {
      try {
        const response = await fetch(`/audio/${file}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        audioBuffers.current[file] = audioBuffer;
      } catch (error) {
        console.error(`Failed to load ${file}:`, error);
      }
    }
    
    // Play room tone loop
    playRoomTone(ctx, roomToneGain.current!);
  };
  
  const playSound = (filename: string, gainNode?: GainNode, pitchVariation = 0) => {
    if (muted || !audioCtx.current || !audioBuffers.current[filename]) return;
    
    const ctx = audioCtx.current;
    const source = ctx.createBufferSource();
    source.buffer = audioBuffers.current[filename];
    
    const gain = ctx.createGain();
    gain.gain.value = 1.0;
    
    // Apply pitch variation if specified
    if (pitchVariation !== 0) {
      source.playbackRate.value = 1.0 + (Math.random() - 0.5) * pitchVariation;
    }
    
    source.connect(gain);
    gain.connect(gainNode || masterGain.current!);
    source.start();
  };
  
  const playRoomTone = (ctx: AudioContext, gainNode: GainNode) => {
    const buffer = audioBuffers.current['room-tone.mp3'];
    if (!buffer) return;
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    source.start();
  };
  
  const playKeyboardClick = () => {
    const variant = Math.floor(Math.random() * 3) + 1;
    playSound(`keyboard-${variant}.mp3`, keyboardGain.current!, 0.2);
    
    // Duck ambient
    if (ambientGain.current && audioCtx.current) {
      const ctx = audioCtx.current;
      ambientGain.current.gain.setValueAtTime(0.1, ctx.currentTime);
      ambientGain.current.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.5);
    }
  };
  
  const playObjectSound = (soundName: string) => {
    playSound(soundName, objectGain.current!);
  };
  
  const playDialTone = () => {
    if (muted || !audioCtx.current) return;
    
    const ctx = audioCtx.current;
    const tone1 = ctx.createOscillator();
    const tone2 = ctx.createOscillator();
    tone1.frequency.value = 350;
    tone2.frequency.value = 440;
    
    const toneGain = ctx.createGain();
    toneGain.gain.value = 0.3;
    
    tone1.connect(toneGain);
    tone2.connect(toneGain);
    toneGain.connect(masterGain.current!);
    
    tone1.start(ctx.currentTime);
    tone2.start(ctx.currentTime);
    tone1.stop(ctx.currentTime + 1.0);
    tone2.stop(ctx.currentTime + 1.0);
  };
  
  return {
    playSound,
    playKeyboardClick,
    playObjectSound,
    playDialTone,
  };
}

// Generative ambient drone
function startAmbientDrone(ctx: AudioContext, gainNode: GainNode) {
  // Three sine waves for deep rumble
  const osc1 = ctx.createOscillator();
  osc1.frequency.value = 60;
  osc1.type = 'sine';
  
  const osc2 = ctx.createOscillator();
  osc2.frequency.value = 90;
  osc2.type = 'sine';
  
  const osc3 = ctx.createOscillator();
  osc3.frequency.value = 120;
  osc3.type = 'sine';
  
  // LFO for slow modulation
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.1; // 10-second cycle
  lfo.type = 'sine';
  
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 5; // Modulation depth
  lfo.connect(lfoGain);
  lfoGain.connect(osc1.frequency);
  
  osc1.connect(gainNode);
  osc2.connect(gainNode);
  osc3.connect(gainNode);
  
  osc1.start();
  osc2.start();
  osc3.start();
  lfo.start();
}

// Generative fluorescent buzz
function startFluorescentBuzz(ctx: AudioContext, masterGain: GainNode) {
  const buzzOsc = ctx.createOscillator();
  buzzOsc.frequency.value = 120;
  buzzOsc.type = 'square';
  
  const buzzFilter = ctx.createBiquadFilter();
  buzzFilter.type = 'lowpass';
  buzzFilter.frequency.value = 300;
  
  const buzzGain = ctx.createGain();
  buzzGain.gain.value = 0.08;
  
  buzzOsc.connect(buzzFilter);
  buzzFilter.connect(buzzGain);
  buzzGain.connect(masterGain);
  buzzOsc.start();
}
```

---

## STEP 3: Integrate Audio

### 3.1 Use audio in App

**Edit `src/App.tsx`:**

```typescript
import { useAudio, useAudioStore } from '@/hooks/useAudio';

export function App() {
  const audio = useAudio();
  const { muted, toggleMute } = useAudioStore();
  
  // ... existing code ...
  
  return (
    <>
      <Scene audio={audio} />
      <div id="cursor">█</div>
      
      {/* Mute toggle button */}
      <button
        onClick={toggleMute}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#2a2a2a',
          border: '2px solid #00ff00',
          color: '#00ff00',
          padding: '10px 20px',
          fontFamily: '"Courier New", monospace',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 10000,
        }}
      >
        {muted ? '🔇 MUTED' : '🔊 AUDIO ON'}
      </button>
    </>
  );
}
```

### 3.2 Pass audio to components

**Edit `src/components/Scene.tsx`:**

Add prop:
```typescript
interface SceneProps {
  audio?: {
    playKeyboardClick: () => void;
    playObjectSound: (soundName: string) => void;
    playDialTone: () => void;
  };
}

export function Scene({ audio }: SceneProps) {
  // ... existing code ...
}
```

### 3.3 Play sounds on interactions

**Edit `src/hooks/useRaycaster.ts`:**

Add audio prop and use it:

```typescript
export function useRaycaster(
  canvas: HTMLCanvasElement | null,
  camera: THREE.PerspectiveCamera | null,
  scene: THREE.Scene | null,
  monitorScreen: THREE.Mesh | null,
  audio?: any
) {
  // ... existing code ...
  
  const handleObjectClick = (object: THREE.Group | THREE.Mesh) => {
    const id = object.userData.id;
    
    // Play appropriate sound
    const soundMap: Record<string, string> = {
      'coffee_mug': 'mug-clink.mp3',
      'papers': 'paper-rustle.mp3',
      'desk_lamp': 'icon-click.mp3',
      'pen_cup': 'pen-rattle.mp3',
      'plant': 'leaf-rustle.mp3',
      'stapler': 'stapler.mp3',
      'phone': 'dial-tone', // Special case
      'drawer': 'drawer-slide.mp3',
      'keyboard': 'keyboard-1.mp3',
    };
    
    if (id === 'phone' && audio) {
      audio.playDialTone();
    } else if (soundMap[id] && audio) {
      audio.playObjectSound(soundMap[id]);
    }
    
    // ... existing object interaction code ...
  };
  
  const handleIconClick = (icon: any) => {
    audio?.playObjectSound('icon-click.mp3');
    // ... existing code ...
  };
  
  const handleWindowClick = (window: any, x: number, y: number) => {
    // Play window sounds
    const inTitleBar = y >= window.y && y <= window.y + TITLE_BAR_HEIGHT;
    
    if (inTitleBar) {
      const buttonWidth = 16;
      const buttonSpacing = 2;
      const buttonsX = window.x + window.width - (buttonWidth * 3 + buttonSpacing * 2 + 8);
      
      if (x >= buttonsX + (buttonWidth + buttonSpacing) * 2) {
        audio?.playObjectSound('window-close.mp3');
        closeWindow(window.id);
      } else if (x >= buttonsX + buttonWidth + buttonSpacing) {
        audio?.playObjectSound('window-open.mp3');
        maximizeWindow(window.id);
      } else if (x >= buttonsX) {
        audio?.playObjectSound('window-close.mp3');
        minimizeWindow(window.id);
      } else {
        // Just focus, no sound
        draggingWindow = window.id;
        dragOffset.x = x - window.x;
        dragOffset.y = y - window.y;
        focusWindow(window.id);
      }
    } else {
      focusWindow(window.id);
    }
  };
}
```

### 3.4 Play keyboard clicks in terminal

**Edit `src/components/Terminal.tsx`:**

Add audio prop:
```typescript
interface TerminalProps {
  audio?: {
    playKeyboardClick: () => void;
  };
}

export function Terminal({ audio }: TerminalProps) {
  // ... existing code ...
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      audio?.playKeyboardClick();
      executeCommand(currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
    } else if (e.key === 'Backspace') {
      audio?.playKeyboardClick();
      setInput(currentInput.slice(0, -1));
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      audio?.playKeyboardClick();
      setInput(currentInput + e.key);
    }
  };
  
  // ... rest of component ...
}
```

Update terminal opening in App.tsx:
```typescript
openWindow('terminal', 'C:\\PORTFOLIO\\TERMINAL.EXE', <Terminal audio={audio} />);
```

### 3.5 Play sounds in portfolio pages

**Edit portfolio components to accept and use audio:**

In `src/components/Portfolio/Trust.tsx`:
```typescript
interface TrustProps {
  audio?: { playObjectSound: (sound: string) => void };
}

export function Trust({ audio }: TrustProps) {
  // ... existing code ...
  
  const handleFragmentClick = (index: number) => {
    if (verified.has(index) || revealing !== null) return;
    
    audio?.playObjectSound('verify-chime.mp3');
    // ... rest of click handler ...
  };
}
```

Similarly for Culture (use 'snap.mp3') and Undertow (use 'ping.mp3').

---

## STEP 4: Test and Verify

### 4.1 Test mute toggle

Click mute button bottom-right → all audio stops  
Click again → audio resumes  
Refresh page → mute state persists

### 4.2 Test generative audio

Load page → hear low ambient drone (60Hz, 90Hz, 120Hz oscillators)  
Hear subtle fluorescent buzz (120Hz square wave)

### 4.3 Test sampled audio

**Terminal typing:** Hear keyboard clicks (3 variants, randomized)

**3D objects:** Click each object, hear appropriate sound:
- Coffee mug → ceramic clink
- Papers → paper rustle
- Desk lamp → click
- Pen cup → pen rattle
- Plant → leaf rustle
- Stapler → staple punch
- Phone → dial tone (350Hz + 440Hz, 1 second)
- Drawer → wood slide
- Keyboard → keyboard click

**Desktop UI:**
- Icon click → ui beep
- Window open → woosh
- Window close → soft click

**Portfolio pages:**
- TRUST fragment click → verify chime
- CULTURE connection → snap
- UNDERTOW hex click → ping

### 4.4 Test audio ducking

Type in terminal rapidly → ambient drone volume lowers briefly, then returns

---

## STEP 5: Troubleshooting

### No audio at all

Check browser console for errors.  
Verify Audio Context resumed:
```typescript
document.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}, { once: true });
```

### Audio files not loading

Check `/public/audio/` directory has all MP3 files.  
Check browser Network tab for 404 errors.  
Verify fetch paths: `/audio/filename.mp3`

### Generative audio not playing

Check oscillators started:
```typescript
osc1.start();
osc2.start();
osc3.start();
```

Verify connected to gainNode:
```typescript
osc1.connect(gainNode);
```

### Keyboard clicks not playing

Check Terminal component receives audio prop:
```typescript
<Terminal audio={audio} />
```

Verify click handler calls:
```typescript
audio?.playKeyboardClick();
```

### Dial tone not working

Check `playDialTone()` creates oscillators correctly:
```typescript
const tone1 = ctx.createOscillator();
tone1.frequency.value = 350;
```

Verify both tones connect to gain and start/stop.

---

## PHASE 6 COMPLETE ✅

**Checkpoint:** Full audio system with generative and sampled sounds.

**Next:** `docs/PHASE_7_POLISH.md` - Post-processing effects, loading sequence, optimization

**Before moving to Phase 7:**
1. Verify all 15+ sounds play correctly
2. Verify mute toggle works and persists
3. Verify ambient drone and fluorescent buzz audible
4. Verify dial tone plays when clicking phone
5. Verify audio ducking works during typing
6. Commit code to git

```bash
git add .
git commit -m "Phase 6 complete: Full audio system"
```
