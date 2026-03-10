# PHASE 2: Desktop UI System

> **Days 3-4 of 14**  
> Implement desktop UI canvas rendering, window management system, icons, taskbar

**Prerequisites:** Phase 1 complete (Three.js scene with monitor model)

---

## DELIVERABLES

By end of Phase 2, you will have:
- ✅ Desktop canvas rendering to texture on monitor screen
- ✅ 9 desktop icons in grid layout
- ✅ Window management system (open, close, drag, minimize, maximize)
- ✅ Taskbar at bottom with system tray
- ✅ Raycasting converts 3D clicks to 2D desktop coordinates
- ✅ Double-click detection for icon launching
- ✅ Window z-index management (bring to front on click)

---

## STEP 1: Desktop Store (Zustand)

### 1.1 Create desktop store

**Create `src/store/desktopStore.ts`:**

```typescript
import { create } from 'zustand';

export interface DesktopIcon {
  id: string;
  name: string;
  app: 'terminal' | 'trust' | 'culture' | 'undertow' | 'about' | 'contact' | 'mycomputer' | 'notepad' | 'backup';
  x: number;
  y: number;
  iconColor: string;
}

export interface DesktopWindow {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  content: React.ReactNode | null;
  zIndex: number;
}

interface DesktopState {
  icons: DesktopIcon[];
  windows: DesktopWindow[];
  nextZIndex: number;
  selectedIconId: string | null;
  
  // Icon actions
  selectIcon: (id: string | null) => void;
  
  // Window actions
  openWindow: (app: string, title: string, content: React.ReactNode) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
}

const DESKTOP_WIDTH = 1024;
const DESKTOP_HEIGHT = 768;

// Icon grid: 3 columns, start at (20, 20), 80px horizontal gap, 100px vertical gap
const createIcons = (): DesktopIcon[] => [
  // Column 1 - Portfolio apps
  { id: 'trust', name: 'TRUST.EXE', app: 'trust', x: 20, y: 20, iconColor: '#00ffff' },
  { id: 'culture', name: 'CULTURE.EXE', app: 'culture', x: 20, y: 120, iconColor: '#ff00ff' },
  { id: 'undertow', name: 'UNDERTOW.EXE', app: 'undertow', x: 20, y: 220, iconColor: '#ffaa00' },
  
  // Column 2 - Info/System
  { id: 'about', name: 'ABOUT.TXT', app: 'about', x: 120, y: 20, iconColor: '#00ff00' },
  { id: 'contact', name: 'CONTACT.TXT', app: 'contact', x: 120, y: 120, iconColor: '#00ff00' },
  { id: 'terminal', name: 'Terminal.exe', app: 'terminal', x: 120, y: 220, iconColor: '#00ff00' },
  
  // Column 3 - Easter eggs
  { id: 'mycomputer', name: 'My Computer', app: 'mycomputer', x: 220, y: 20, iconColor: '#808080' },
  { id: 'notepad', name: 'Notepad.exe', app: 'notepad', x: 220, y: 120, iconColor: '#ffffff' },
  { id: 'backup', name: 'backup_v1.zip', app: 'backup', x: 220, y: 220, iconColor: '#808080' },
];

export const useDesktopStore = create<DesktopState>((set, get) => ({
  icons: createIcons(),
  windows: [],
  nextZIndex: 100,
  selectedIconId: null,
  
  selectIcon: (id) => set({ selectedIconId: id }),
  
  openWindow: (app, title, content) => {
    const { windows, nextZIndex } = get();
    
    // Don't open duplicate windows
    if (windows.some(w => w.title === title)) {
      const existingWindow = windows.find(w => w.title === title);
      if (existingWindow) {
        get().focusWindow(existingWindow.id);
      }
      return;
    }
    
    const newWindow: DesktopWindow = {
      id: `window-${Date.now()}`,
      title,
      x: Math.floor((DESKTOP_WIDTH - 819) / 2), // Center horizontally
      y: Math.floor((DESKTOP_HEIGHT - 652) / 2), // Center vertically
      width: 819, // 80% of 1024
      height: 652, // 85% of 768
      minimized: false,
      maximized: false,
      content,
      zIndex: nextZIndex,
    };
    
    set({
      windows: [...windows, newWindow],
      nextZIndex: nextZIndex + 1,
    });
  },
  
  closeWindow: (id) => set((state) => ({
    windows: state.windows.filter(w => w.id !== id),
  })),
  
  minimizeWindow: (id) => set((state) => ({
    windows: state.windows.map(w =>
      w.id === id ? { ...w, minimized: !w.minimized } : w
    ),
  })),
  
  maximizeWindow: (id) => set((state) => ({
    windows: state.windows.map(w =>
      w.id === id ? {
        ...w,
        maximized: !w.maximized,
        x: w.maximized ? Math.floor((DESKTOP_WIDTH - 819) / 2) : 0,
        y: w.maximized ? Math.floor((DESKTOP_HEIGHT - 652) / 2) : 0,
        width: w.maximized ? 819 : DESKTOP_WIDTH,
        height: w.maximized ? 652 : DESKTOP_HEIGHT - 30, // Leave space for taskbar
      } : w
    ),
  })),
  
  focusWindow: (id) => set((state) => {
    const { nextZIndex } = state;
    return {
      windows: state.windows.map(w =>
        w.id === id ? { ...w, zIndex: nextZIndex } : w
      ),
      nextZIndex: nextZIndex + 1,
    };
  }),
  
  moveWindow: (id, x, y) => set((state) => ({
    windows: state.windows.map(w =>
      w.id === id ? {
        ...w,
        x: Math.max(0, Math.min(x, DESKTOP_WIDTH - w.width)),
        y: Math.max(0, Math.min(y, DESKTOP_HEIGHT - w.height - 30)), // 30px for taskbar
      } : w
    ),
  })),
}));
```

---

## STEP 2: Desktop Canvas Renderer

### 2.1 Create Desktop component

**Create `src/components/Desktop.tsx`:**

```typescript
import { useEffect, useRef } from 'react';
import { useDesktopStore } from '@/store/desktopStore';
import * as THREE from 'three';

interface DesktopProps {
  canvasTexture: THREE.CanvasTexture;
}

const DESKTOP_WIDTH = 1024;
const DESKTOP_HEIGHT = 768;
const TITLE_BAR_HEIGHT = 20;
const TASKBAR_HEIGHT = 30;

export function Desktop({ canvasTexture }: DesktopProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { icons, windows, selectedIconId } = useDesktopStore();
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = DESKTOP_WIDTH;
    canvas.height = DESKTOP_HEIGHT;
    
    const render = () => {
      // Clear desktop
      ctx.fillStyle = '#3a3a3a'; // Desktop background
      ctx.fillRect(0, 0, DESKTOP_WIDTH, DESKTOP_HEIGHT);
      
      // Draw icons
      icons.forEach(icon => {
        drawIcon(ctx, icon, icon.id === selectedIconId);
      });
      
      // Draw windows (sorted by z-index)
      const sortedWindows = [...windows].sort((a, b) => a.zIndex - b.zIndex);
      sortedWindows.forEach(window => {
        if (!window.minimized) {
          drawWindow(ctx, window);
        }
      });
      
      // Draw taskbar
      drawTaskbar(ctx, windows);
      
      // Update Three.js texture
      canvasTexture.needsUpdate = true;
      
      requestAnimationFrame(render);
    };
    
    render();
  }, [icons, windows, selectedIconId, canvasTexture]);
  
  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
}

function drawIcon(ctx: CanvasRenderingContext2D, icon: any, selected: boolean) {
  const iconSize = 32;
  const labelHeight = 20;
  
  // Selection highlight
  if (selected) {
    ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.fillRect(icon.x - 4, icon.y - 4, iconSize + 8, iconSize + labelHeight + 8);
  }
  
  // Icon square
  ctx.fillStyle = icon.iconColor;
  ctx.fillRect(icon.x, icon.y, iconSize, iconSize);
  
  // Icon border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(icon.x, icon.y, iconSize, iconSize);
  
  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillText(icon.name, icon.x + iconSize / 2, icon.y + iconSize + 14);
}

function drawWindow(ctx: CanvasRenderingContext2D, window: any) {
  // Window background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(window.x, window.y, window.width, window.height);
  
  // Window border
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1;
  ctx.strokeRect(window.x, window.y, window.width, window.height);
  
  // Title bar
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(window.x, window.y, window.width, TITLE_BAR_HEIGHT);
  
  // Title text
  ctx.fillStyle = '#ffffff';
  ctx.font = '11px "Courier New"';
  ctx.textAlign = 'left';
  ctx.fillText(window.title, window.x + 8, window.y + 14);
  
  // Window buttons (right-aligned)
  const buttonWidth = 16;
  const buttonSpacing = 2;
  const buttonsX = window.x + window.width - (buttonWidth * 3 + buttonSpacing * 2 + 8);
  
  // Minimize button [ _ ]
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(buttonsX, window.y + 2, buttonWidth, TITLE_BAR_HEIGHT - 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('_', buttonsX + 5, window.y + 14);
  
  // Maximize button [ □ ]
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(buttonsX + buttonWidth + buttonSpacing, window.y + 2, buttonWidth, TITLE_BAR_HEIGHT - 4);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(buttonsX + buttonWidth + buttonSpacing + 4, window.y + 6, 8, 8);
  
  // Close button [X]
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(buttonsX + (buttonWidth + buttonSpacing) * 2, window.y + 2, buttonWidth, TITLE_BAR_HEIGHT - 4);
  ctx.fillStyle = '#ff0000';
  ctx.font = 'bold 11px "Courier New"';
  ctx.fillText('X', buttonsX + (buttonWidth + buttonSpacing) * 2 + 4, window.y + 14);
  
  // Window content area (black for now, will render actual content in Phase 3+)
  ctx.fillStyle = '#000000';
  ctx.fillRect(window.x + 1, window.y + TITLE_BAR_HEIGHT, window.width - 2, window.height - TITLE_BAR_HEIGHT - 1);
}

function drawTaskbar(ctx: CanvasRenderingContext2D, windows: any[]) {
  const taskbarY = DESKTOP_HEIGHT - TASKBAR_HEIGHT;
  
  // Taskbar background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, taskbarY, DESKTOP_WIDTH, TASKBAR_HEIGHT);
  
  // Taskbar border
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, taskbarY);
  ctx.lineTo(DESKTOP_WIDTH, taskbarY);
  ctx.stroke();
  
  // "Start" button
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(4, taskbarY + 4, 60, TASKBAR_HEIGHT - 8);
  ctx.fillStyle = '#00ff00';
  ctx.font = 'bold 11px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillText('START', 34, taskbarY + 18);
  
  // Window buttons (100px each)
  windows.forEach((window, index) => {
    const x = 70 + index * 104;
    ctx.fillStyle = window.minimized ? '#2a2a2a' : '#3a3a3a';
    ctx.fillRect(x, taskbarY + 4, 100, TASKBAR_HEIGHT - 8);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText(window.title.substring(0, 12), x + 4, taskbarY + 18);
  });
  
  // System tray (right side)
  const timeX = DESKTOP_WIDTH - 60;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  ctx.fillStyle = '#00ff00';
  ctx.font = '10px "Courier New"';
  ctx.textAlign = 'right';
  ctx.fillText(timeStr, timeX, taskbarY + 18);
}
```

---

## STEP 3: Update Scene with Desktop

### 3.1 Modify Scene component

**Edit `src/components/Scene.tsx`:**

Add imports:
```typescript
import { Desktop } from '@/components/Desktop';
```

Add state for canvas texture:
```typescript
const [canvasTexture, setCanvasTexture] = useState<THREE.CanvasTexture | null>(null);
```

In the useEffect, after creating the monitor, add desktop texture:

```typescript
// Create canvas texture for desktop
const desktopCanvas = document.createElement('canvas');
const texture = new THREE.CanvasTexture(desktopCanvas);
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.NearestFilter;
setCanvasTexture(texture);

// Apply texture to monitor screen
const screen = monitor.children.find(child => child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry);
if (screen && screen instanceof THREE.Mesh) {
  screen.material = new THREE.MeshBasicMaterial({ map: texture });
}
```

Add Desktop component to JSX return:

```typescript
return (
  <>
    <canvas ref={canvasRef} />
    {canvasTexture && <Desktop canvasTexture={canvasTexture} />}
  </>
);
```

---

## STEP 4: Raycasting for Clicks

### 4.1 Create interaction hook

**Create `src/hooks/useRaycaster.ts`:**

```typescript
import { useEffect } from 'react';
import * as THREE from 'three';
import { useDesktopStore } from '@/store/desktopStore';

const DESKTOP_WIDTH = 1024;
const DESKTOP_HEIGHT = 768;
const TITLE_BAR_HEIGHT = 20;

export function useRaycaster(
  canvas: HTMLCanvasElement | null,
  camera: THREE.PerspectiveCamera | null,
  scene: THREE.Scene | null,
  monitorScreen: THREE.Mesh | null
) {
  const { icons, windows, selectIcon, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, moveWindow } = useDesktopStore();
  
  useEffect(() => {
    if (!canvas || !camera || !scene || !monitorScreen) return;
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    let clickTimers: Record<string, number> = {};
    let draggingWindow: string | null = null;
    let dragOffset = { x: 0, y: 0 };
    
    const handleClick = (event: MouseEvent) => {
      // Convert mouse coordinates to normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(monitorScreen);
      
      if (intersects.length === 0) return;
      
      // Get UV coordinates (0-1 range on monitor screen)
      const uv = intersects[0].uv;
      if (!uv) return;
      
      // Convert UV to desktop canvas coordinates
      const canvasX = Math.floor(uv.x * DESKTOP_WIDTH);
      const canvasY = Math.floor((1 - uv.y) * DESKTOP_HEIGHT); // Flip Y
      
      // Check window clicks (check from top z-index first)
      const sortedWindows = [...windows].sort((a, b) => b.zIndex - a.zIndex);
      for (const window of sortedWindows) {
        if (window.minimized) continue;
        
        if (isPointInRect(canvasX, canvasY, {
          x: window.x,
          y: window.y,
          width: window.width,
          height: window.height,
        })) {
          handleWindowClick(window, canvasX, canvasY);
          return;
        }
      }
      
      // Check icon clicks
      for (const icon of icons) {
        if (isPointInRect(canvasX, canvasY, {
          x: icon.x,
          y: icon.y,
          width: 32,
          height: 52, // Icon + label
        })) {
          handleIconClick(icon);
          return;
        }
      }
      
      // Click on empty desktop - deselect icon
      selectIcon(null);
    };
    
    const handleIconClick = (icon: any) => {
      const now = Date.now();
      const lastClick = clickTimers[icon.id] || 0;
      
      if (now - lastClick < 300) {
        // Double-click detected - open app
        delete clickTimers[icon.id];
        selectIcon(null);
        
        // Open window with placeholder content
        openWindow(icon.app, icon.name, null);
      } else {
        // Single click - select icon
        selectIcon(icon.id);
        clickTimers[icon.id] = now;
      }
    };
    
    const handleWindowClick = (window: any, x: number, y: number) => {
      const inTitleBar = y >= window.y && y <= window.y + TITLE_BAR_HEIGHT;
      
      if (inTitleBar) {
        // Check window buttons (right side of title bar)
        const buttonWidth = 16;
        const buttonSpacing = 2;
        const buttonsX = window.x + window.width - (buttonWidth * 3 + buttonSpacing * 2 + 8);
        
        if (x >= buttonsX + (buttonWidth + buttonSpacing) * 2 && x <= buttonsX + (buttonWidth + buttonSpacing) * 2 + buttonWidth) {
          // Close button
          closeWindow(window.id);
        } else if (x >= buttonsX + buttonWidth + buttonSpacing && x <= buttonsX + (buttonWidth + buttonSpacing) * 2) {
          // Maximize button
          maximizeWindow(window.id);
        } else if (x >= buttonsX && x <= buttonsX + buttonWidth) {
          // Minimize button
          minimizeWindow(window.id);
        } else {
          // Start dragging
          draggingWindow = window.id;
          dragOffset.x = x - window.x;
          dragOffset.y = y - window.y;
          focusWindow(window.id);
        }
      } else {
        // Focus window
        focusWindow(window.id);
      }
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!draggingWindow) return;
      
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(monitorScreen);
      
      if (intersects.length === 0) return;
      
      const uv = intersects[0].uv;
      if (!uv) return;
      
      const canvasX = Math.floor(uv.x * DESKTOP_WIDTH);
      const canvasY = Math.floor((1 - uv.y) * DESKTOP_HEIGHT);
      
      moveWindow(draggingWindow, canvasX - dragOffset.x, canvasY - dragOffset.y);
    };
    
    const handleMouseUp = () => {
      draggingWindow = null;
    };
    
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvas, camera, scene, monitorScreen, icons, windows]);
}

function isPointInRect(x: number, y: number, rect: { x: number; y: number; width: number; height: number }): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
```

### 4.2 Use raycaster in Scene

**Edit `src/components/Scene.tsx`:**

Import hook:
```typescript
import { useRaycaster } from '@/hooks/useRaycaster';
```

Add refs for raycasting:
```typescript
const monitorScreenRef = useRef<THREE.Mesh | null>(null);
```

Store monitor screen reference after creating it:
```typescript
// In createMonitor function, after creating screen:
monitorScreenRef.current = screen;
```

Use raycaster hook:
```typescript
useRaycaster(canvasRef.current, cameraRef.current, sceneRef.current, monitorScreenRef.current);
```

---

## STEP 5: Test and Verify

### 5.1 Start dev server

```bash
pnpm dev
```

### 5.2 Expected result

You should see:
- Monitor displaying retro desktop UI with grey background
- 9 icons in 3×3 grid on left side
- Taskbar at bottom with "START" button and system time
- Clicking icons selects them (cyan highlight)
- Double-clicking icons opens windows
- Windows have title bar with minimize/maximize/close buttons
- Windows can be dragged by title bar
- Clicking window buttons works (minimize, maximize, close)
- Multiple windows stack with z-index (clicking brings to front)

### 5.3 Test double-click

Single-click an icon → it highlights cyan  
Double-click the same icon → window opens with title

### 5.4 Test window dragging

Open a window → click and hold title bar → drag around desktop  
Window should follow mouse and stay within desktop bounds

### 5.5 Test window buttons

Click minimize `[ _ ]` → window disappears, appears in taskbar  
Click taskbar button → window reappears

Click maximize `[ □ ]` → window fills entire desktop  
Click maximize again → window returns to original size

Click close `[X]` → window disappears completely

### 5.6 Test z-index

Open 2-3 windows → click different windows  
Most recently clicked window should be on top

---

## STEP 6: Troubleshooting

### Desktop not rendering on monitor

Check:
- Canvas texture is created: `const texture = new THREE.CanvasTexture(desktopCanvas);`
- Texture applied to screen material: `screen.material = new THREE.MeshBasicMaterial({ map: texture });`
- Desktop component is rendering: `{canvasTexture && <Desktop canvasTexture={canvasTexture} />}`

### Icons/windows not clickable

Check:
- Raycaster hook is called: `useRaycaster(...)`
- Monitor screen mesh reference is passed: `monitorScreenRef.current`
- Console for errors in raycasting logic

### Windows open behind desktop

Check z-index in desktopStore: `nextZIndex` should start at 100 and increment

### Double-click not working

Adjust timeout in handleIconClick:
```typescript
if (now - lastClick < 300) { // Try 400 or 500ms if needed
```

### Window dragging jumpy

Check dragOffset calculation:
```typescript
dragOffset.x = x - window.x;
dragOffset.y = y - window.y;
```

Then in move:
```typescript
moveWindow(draggingWindow, canvasX - dragOffset.x, canvasY - dragOffset.y);
```

---

## PHASE 2 COMPLETE ✅

**Checkpoint:** You now have a fully functional desktop UI system with windows and icons.

**Next:** `docs/PHASE_3_TERMINAL.md` - Implement terminal window with command processing

**Before moving to Phase 3:**
1. Verify all 9 icons are visible and clickable
2. Verify double-click opens windows
3. Verify window dragging works smoothly
4. Verify window buttons (minimize, maximize, close) work
5. Commit code to git

```bash
git add .
git commit -m "Phase 2 complete: Desktop UI system"
```
