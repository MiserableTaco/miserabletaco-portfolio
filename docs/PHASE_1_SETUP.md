# PHASE 1: Setup & Scene Foundation

> **Days 1-2 of 14**  
> Initialize project, set up Three.js scene, create basic monitor model

**Prerequisites:** pnpm 10.31.0 installed globally

---

## DELIVERABLES

By end of Phase 1, you will have:
- ✅ Vite + React + TypeScript project initialized
- ✅ All dependencies installed (confirmed versions)
- ✅ Three.js scene rendering to canvas
- ✅ Camera with subtle auto-drift
- ✅ CRT monitor 3D model (low-poly)
- ✅ Basic lighting setup
- ✅ 60fps render loop
- ✅ Responsive canvas (resizes with window)

---

## STEP 1: Initialize Project

### 1.1 Create Vite project

```bash
cd ~/Desktop  # or wherever you keep projects
pnpm create vite portfolio --template react-ts
cd portfolio
```

**Verify files created:**
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `src/` directory

### 1.2 Install dependencies

**Install exact versions (DO NOT use @latest):**

```bash
# Core dependencies
pnpm install react@19.2.4 react-dom@19.2.4
pnpm install three@0.183.2
pnpm install zustand@5.0.11

# Dev dependencies
pnpm install -D typescript@5.9.3
pnpm install -D @vitejs/plugin-react@latest
pnpm install -D @types/react@latest
pnpm install -D @types/react-dom@latest
pnpm install -D @types/three@0.183.1
```

**Verify package.json contains:**

```json
{
  "dependencies": {
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "three": "0.183.2",
    "zustand": "5.0.11"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "@vitejs/plugin-react": "^4.3.4",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@types/three": "0.183.1"
  }
}
```

### 1.3 Configure TypeScript

**Edit `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### 1.4 Configure Vite

**Edit `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
        },
      },
    },
  },
});
```

---

## STEP 2: Project Structure

### 2.1 Create directory structure

```bash
mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/store
mkdir -p src/utils
mkdir -p src/styles
mkdir -p public/audio
```

### 2.2 Create base files

**Create `src/styles/index.css`:**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0a0a;
  font-family: 'Courier New', monospace;
  color: #00ff00;
}

#root {
  width: 100%;
  height: 100%;
}

/* Custom cursor */
body {
  cursor: none;
}

#cursor {
  position: fixed;
  width: 12px;
  height: 16px;
  background: #00ff00;
  pointer-events: none;
  z-index: 10000;
  font-size: 16px;
  line-height: 1;
  color: #00ff00;
}
```

**Create `src/utils/constants.ts`:**

```typescript
export const MONITOR_SIZE_PERCENT = 0.72; // 72% of viewport
export const TARGET_FPS = 60;
export const CAMERA_DRIFT_AMOUNT = 0.05; // ±0.05 units
export const CAMERA_DRIFT_SPEED = 0.1; // Slow breathing motion

export const COLORS = {
  ambient: 0x404040,
  monitor_glow: 0x00ff00,
  ceiling: 0x606060,
  desk: 0x4a4a4a,
  monitor_bezel: 0x2a2a2a,
  fog: 0x0a0a0a,
};

export const LIGHTING = {
  ambient_intensity: 0.5,
  monitor_glow_intensity: 0.8,
  ceiling_intensity: 0.3,
};

export const FOG = {
  near: 5,
  far: 15,
};
```

---

## STEP 3: Three.js Scene Setup

### 3.1 Create Scene component

**Create `src/components/Scene.tsx`:**

```typescript
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { COLORS, LIGHTING, FOG, MONITOR_SIZE_PERCENT, CAMERA_DRIFT_AMOUNT, CAMERA_DRIFT_SPEED } from '@/utils/constants';

export function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const monitorRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(COLORS.fog, FOG.near, FOG.far);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      45, // FOV
      window.innerWidth / window.innerHeight, // Aspect
      0.1, // Near
      100 // Far
    );
    camera.position.set(0, 1.5, 3.5); // Seated POV, slightly elevated
    camera.lookAt(0, 1.2, 0); // Look at monitor center
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Max 2x for performance
    renderer.setClearColor(COLORS.fog);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(COLORS.ambient, LIGHTING.ambient_intensity);
    scene.add(ambientLight);

    const monitorGlow = new THREE.PointLight(COLORS.monitor_glow, LIGHTING.monitor_glow_intensity, 10);
    monitorGlow.position.set(0, 1.2, 0.3);
    scene.add(monitorGlow);

    const ceilingLight = new THREE.DirectionalLight(COLORS.ceiling, LIGHTING.ceiling_intensity);
    ceilingLight.position.set(0, 5, 2);
    scene.add(ceilingLight);

    // Create monitor model
    const monitor = createMonitor();
    scene.add(monitor);
    monitorRef.current = monitor;

    // Animation loop
    let animationId: number;
    let startTime = Date.now();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Camera drift (breathing motion)
      const elapsed = (Date.now() - startTime) / 1000;
      const driftX = Math.sin(elapsed * CAMERA_DRIFT_SPEED) * CAMERA_DRIFT_AMOUNT;
      const driftY = Math.sin(elapsed * CAMERA_DRIFT_SPEED * 0.7) * (CAMERA_DRIFT_AMOUNT * 0.4);
      
      camera.position.x = driftX;
      camera.position.y = 1.5 + driftY;
      camera.lookAt(0, 1.2, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

// Create monitor 3D model (low-poly CRT)
function createMonitor(): THREE.Group {
  const monitor = new THREE.Group();
  monitor.position.set(0, 1.25, -0.35);
  monitor.rotation.x = -0.1; // Tilt back slightly

  // Monitor bezel (main body)
  const bezelGeometry = new THREE.BoxGeometry(0.7, 0.55, 0.08);
  const bezelMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.monitor_bezel,
    roughness: 0.7,
    metalness: 0.1,
  });
  const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
  monitor.add(bezel);

  // Monitor screen (black for now, will add desktop texture in Phase 2)
  const screenGeometry = new THREE.PlaneGeometry(0.6, 0.45);
  const screenMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
  });
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.z = 0.041; // Slightly in front of bezel
  monitor.add(screen);

  // Power LED (pulsing green light)
  const ledGeometry = new THREE.SphereGeometry(0.01, 8, 8);
  const ledMaterial = new THREE.MeshBasicMaterial({
    color: COLORS.monitor_glow,
    emissive: COLORS.monitor_glow,
    emissiveIntensity: 1.0,
  });
  const led = new THREE.Mesh(ledGeometry, ledMaterial);
  led.position.set(0.3, -0.25, 0.041);
  monitor.add(led);

  // Animate LED pulsing
  let pulseTime = 0;
  const pulseLED = () => {
    pulseTime += 0.02;
    ledMaterial.emissiveIntensity = 0.5 + Math.sin(pulseTime) * 0.5; // 0.5 to 1.0
    requestAnimationFrame(pulseLED);
  };
  pulseLED();

  return monitor;
}
```

### 3.2 Update App component

**Edit `src/App.tsx`:**

```typescript
import { Scene } from '@/components/Scene';
import '@/styles/index.css';

export function App() {
  return (
    <>
      <Scene />
      <div id="cursor">█</div>
    </>
  );
}

export default App;
```

### 3.3 Update main entry

**Edit `src/main.tsx`:**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Custom cursor tracking
document.addEventListener('DOMContentLoaded', () => {
  const cursor = document.getElementById('cursor');
  if (cursor) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### 3.4 Update index.html

**Edit `index.html`:**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>miserabletaco.dev</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## STEP 4: Test and Verify

### 4.1 Start dev server

```bash
pnpm dev
```

Browser should open at `http://localhost:3000`

### 4.2 Expected result

You should see:
- Black background
- Green-tinted CRT monitor in center (70-75% of screen)
- Monitor has grey bezel and black screen
- Small green LED pulsing on bottom-right of monitor
- Camera slowly drifting left-right and up-down (breathing motion)
- Custom green block cursor `█` following mouse
- 60fps (check with browser dev tools)

### 4.3 Verify camera drift

Watch for 10-15 seconds. The monitor should appear to shift very slightly as the camera drifts. This creates a subtle "you're sitting at a desk" feeling.

### 4.4 Verify responsive

Resize browser window - canvas should resize and maintain aspect ratio.

### 4.5 Check performance

Open Chrome DevTools → Performance tab → Record for 5 seconds → Stop

**Target:** Steady 60fps, no dropped frames

If < 60fps, check:
- `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` - limits to 2x
- Monitor has <100 polygons total
- No unnecessary scene.add() calls in animation loop

---

## STEP 5: Troubleshooting

### "Module not found: three"

```bash
# Reinstall three.js
pnpm remove three
pnpm install three@0.183.2
```

### "Cannot find module '@/utils/constants'"

Check `tsconfig.json` has:
```json
"paths": {
  "@/*": ["./src/*"]
}
```

And `vite.config.ts` has:
```typescript
alias: {
  '@': path.resolve(__dirname, './src'),
}
```

### Black screen, no monitor

Check browser console for errors. Common issues:
- Canvas not rendering: Check `canvasRef.current` is not null
- Monitor not visible: Check `monitor.position` is correct
- Camera wrong position: Check `camera.position.set(0, 1.5, 3.5)`

### Monitor too small/large

Adjust monitor geometry in `createMonitor()`:
```typescript
const bezelGeometry = new THREE.BoxGeometry(0.7, 0.55, 0.08); // Width, height, depth
const screenGeometry = new THREE.PlaneGeometry(0.6, 0.45); // Width, height
```

Target: Monitor should be 70-75% of viewport. If too small, increase values proportionally.

### No camera drift

Check `CAMERA_DRIFT_SPEED` in constants.ts - should be 0.1 (slow).  
If still not visible, increase `CAMERA_DRIFT_AMOUNT` to 0.1 temporarily to see drift clearly, then reduce back to 0.05.

---

## PHASE 1 COMPLETE ✅

**Checkpoint:** You now have a working Three.js scene with a low-poly monitor model and camera drift.

**Next:** `docs/PHASE_2_DESKTOP.md` - Implement desktop UI canvas rendering system

**Before moving to Phase 2:**
1. Verify 60fps sustained
2. Verify camera drift is visible but subtle
3. Verify monitor is 70-75% of viewport
4. Commit code to git
5. Take screenshot for reference

```bash
git add .
git commit -m "Phase 1 complete: Three.js scene foundation"
```
