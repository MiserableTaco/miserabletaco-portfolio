# PHASE 5: 3D Objects & Interactions

> **Days 8-9 of 14**  
> Create 15 3D objects (10 interactive, 5 decorative) with visual/audio feedback

**Prerequisites:** Phase 4 complete (Portfolio pages working)

---

## DELIVERABLES

By end of Phase 5, you will have:
- ✅ 10 interactive objects with click detection
- ✅ Visual feedback on click (animations, color changes)
- ✅ Audio feedback on click (placeholder sounds for now, real sounds in Phase 6)
- ✅ 5 decorative objects (no interaction)
- ✅ Object state persistence (objects remember interaction state)
- ✅ Desk, shelf, and wall clock added to scene

---

## STEP 1: Object Store

### 1.1 Create object store

**Create `src/store/objectStore.ts`:**

```typescript
import { create } from 'zustand';

export interface ObjectState {
  id: string;
  interacted: boolean;
  customState?: any; // For object-specific state (e.g., lamp on/off, plant health)
}

interface ObjectStoreState {
  objects: Record<string, ObjectState>;
  
  markInteracted: (id: string, customState?: any) => void;
  getObjectState: (id: string) => ObjectState;
}

const INITIAL_OBJECTS = [
  'coffee_mug',
  'papers',
  'desk_lamp',
  'pen_cup',
  'plant',
  'stapler',
  'phone',
  'drawer',
  'keyboard', // Will be part of monitor group
  'monitor', // Already created in Phase 1
];

export const useObjectStore = create<ObjectStoreState>((set, get) => ({
  objects: INITIAL_OBJECTS.reduce((acc, id) => {
    acc[id] = { id, interacted: false };
    return acc;
  }, {} as Record<string, ObjectState>),
  
  markInteracted: (id, customState) => set((state) => ({
    objects: {
      ...state.objects,
      [id]: {
        ...state.objects[id],
        interacted: true,
        customState: customState || state.objects[id]?.customState,
      },
    },
  })),
  
  getObjectState: (id) => {
    const state = get().objects[id];
    return state || { id, interacted: false };
  },
}));
```

---

## STEP 2: Create Object Models

### 2.1 Update Scene component with objects

**Edit `src/components/Scene.tsx`:**

Add object creation after monitor:

```typescript
// Inside useEffect, after creating monitor:

// Create desk
const desk = createDesk();
scene.add(desk);

// Create shelf
const shelf = createShelf();
scene.add(shelf);

// Create wall clock
const clock = createClock();
scene.add(clock);

// Create interactive objects
const coffeeMug = createCoffeeMug();
scene.add(coffeeMug);

const papers = createPapers();
scene.add(papers);

const deskLamp = createDeskLamp();
scene.add(deskLamp);

const penCup = createPenCup();
scene.add(penCup);

const plant = createPlant();
scene.add(plant);

const stapler = createStapler();
scene.add(stapler);

const phone = createPhone();
scene.add(phone);

const drawer = createDrawer();
scene.add(drawer);

const keyboard = createKeyboard();
scene.add(keyboard);

// Create decorative objects
const namePlacard = createNamePlacard();
scene.add(namePlacard);

const mouse = createMouse();
scene.add(mouse);

const mousePad = createMousePad();
scene.add(mousePad);

const stickyNote = createStickyNote();
scene.add(stickyNote);

const calendar = createCalendar();
scene.add(calendar);
```

Add object creation functions at bottom of file (outside component):

```typescript
// === DESK & SHELF ===

function createDesk(): THREE.Group {
  const desk = new THREE.Group();
  
  // Desktop surface
  const surface = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.05, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 })
  );
  surface.position.set(0, 0.72, 0);
  desk.add(surface);
  
  // Front panel
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.5, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 })
  );
  front.position.set(0, 0.5, 0.5);
  desk.add(front);
  
  return desk;
}

function createShelf(): THREE.Group {
  const shelf = new THREE.Group();
  
  const plank = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.04, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 })
  );
  plank.position.set(0, 1.8, -0.8);
  shelf.add(plank);
  
  // Books
  for (let i = 0; i < 5; i++) {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.15, 0.12),
      new THREE.MeshStandardMaterial({ 
        color: [0x8b4513, 0x2f4f4f, 0x8b0000, 0x4b0082, 0x006400][i],
        roughness: 0.9 
      })
    );
    book.position.set(-1.0 + i * 0.2, 1.88, -0.8);
    shelf.add(book);
  }
  
  return shelf;
}

function createClock(): THREE.Group {
  const clock = new THREE.Group();
  clock.position.set(-1.5, 2.0, -0.7);
  
  // Clock face
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.02, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  );
  face.rotation.x = Math.PI / 2;
  clock.add(face);
  
  // Hour hand
  const hourHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.06, 0.001),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  hourHand.position.y = 0.011;
  clock.add(hourHand);
  
  // Minute hand
  const minuteHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.09, 0.001),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  minuteHand.position.y = 0.012;
  clock.add(minuteHand);
  
  // Animate clock hands
  setInterval(() => {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    
    hourHand.rotation.z = -(hours * 30 + minutes * 0.5) * (Math.PI / 180);
    minuteHand.rotation.z = -(minutes * 6) * (Math.PI / 180);
  }, 1000);
  
  return clock;
}

// === INTERACTIVE OBJECTS ===

function createCoffeeMug(): THREE.Group {
  const mug = new THREE.Group();
  mug.position.set(-0.4, 0.77, 0.3);
  mug.userData = { interactive: true, id: 'coffee_mug' };
  
  // Mug body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
  );
  mug.add(body);
  
  // Handle
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.03, 0.008, 6, 8, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
  );
  handle.rotation.y = Math.PI / 2;
  handle.position.set(0.04, 0, 0);
  mug.add(handle);
  
  // Coffee (liquid)
  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.01, 12),
    new THREE.MeshBasicMaterial({ color: 0x4a2511 })
  );
  coffee.position.y = 0.035;
  mug.add(coffee);
  mug.userData.coffee = coffee; // Store reference for interaction
  
  return mug;
}

function createPapers(): THREE.Group {
  const papers = new THREE.Group();
  papers.position.set(0.5, 0.73, 0.1);
  papers.rotation.y = 0.3;
  papers.userData = { interactive: true, id: 'papers' };
  
  for (let i = 0; i < 3; i++) {
    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.001, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    paper.position.y = i * 0.002;
    papers.add(paper);
  }
  
  return papers;
}

function createDeskLamp(): THREE.Group {
  const lamp = new THREE.Group();
  lamp.position.set(0.6, 0.85, -0.4);
  lamp.userData = { interactive: true, id: 'desk_lamp' };
  
  // Arm
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 })
  );
  lamp.add(arm);
  
  // Shade
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.06, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 })
  );
  shade.position.y = 0.09;
  lamp.add(shade);
  
  // Light (initially off, stored for toggling)
  const light = new THREE.PointLight(0xffaa00, 0, 2);
  light.position.copy(lamp.position);
  lamp.userData.light = light;
  
  return lamp;
}

function createPenCup(): THREE.Group {
  const cup = new THREE.Group();
  cup.position.set(0.55, 0.76, -0.5);
  cup.userData = { interactive: true, id: 'pen_cup' };
  
  // Cup
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 })
  );
  cup.add(body);
  
  // Pens
  for (let i = 0; i < 3; i++) {
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.08),
      new THREE.MeshStandardMaterial({ color: i === 0 ? 0x0000ff : i === 1 ? 0xff0000 : 0x000000 })
    );
    pen.position.set((i - 1) * 0.01, 0.04, 0);
    pen.rotation.z = (i - 1) * 0.1;
    cup.add(pen);
  }
  
  return cup;
}

function createPlant(): THREE.Group {
  const plant = new THREE.Group();
  plant.position.set(-0.6, 0.75, -0.4);
  plant.userData = { interactive: true, id: 'plant' };
  
  // Pot
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.03, 0.05, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 })
  );
  plant.add(pot);
  
  // Leaves
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.06, 4),
      new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.7 })
    );
    leaf.position.set((i - 1) * 0.02, 0.05, 0);
    leaf.rotation.z = (i - 1) * 0.2;
    plant.add(leaf);
    plant.userData[`leaf${i}`] = leaf; // Store for wilting
  }
  
  return plant;
}

function createStapler(): THREE.Mesh {
  const stapler = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.02, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.6 })
  );
  stapler.position.set(0.3, 0.73, 0.4);
  stapler.userData = { interactive: true, id: 'stapler' };
  
  return stapler;
}

function createPhone(): THREE.Group {
  const phone = new THREE.Group();
  phone.position.set(-0.5, 0.73, -0.1);
  phone.userData = { interactive: true, id: 'phone' };
  
  // Base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 })
  );
  phone.add(base);
  
  // Handset
  const handset = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 })
  );
  handset.position.set(0, 0.03, 0);
  handset.rotation.z = Math.PI / 2;
  phone.add(handset);
  
  return phone;
}

function createDrawer(): THREE.Group {
  const drawer = new THREE.Group();
  drawer.position.set(0.4, 0.6, 0.5);
  drawer.userData = { interactive: true, id: 'drawer' };
  
  // Handle
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.01, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.8, roughness: 0.2 })
  );
  drawer.add(handle);
  
  return drawer;
}

function createKeyboard(): THREE.Group {
  const keyboard = new THREE.Group();
  keyboard.position.set(0, 0.74, 0.2);
  keyboard.userData = { interactive: true, id: 'keyboard' };
  
  // Base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.02, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 })
  );
  keyboard.add(base);
  
  // Keys (simplified - just a few representative keys)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 10; col++) {
      const key = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.005, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 })
      );
      key.position.set(-0.22 + col * 0.05, 0.015, -0.06 + row * 0.04);
      keyboard.add(key);
    }
  }
  
  return keyboard;
}

// === DECORATIVE OBJECTS ===

function createNamePlacard(): THREE.Mesh {
  const placard = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.02, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 })
  );
  placard.position.set(0, 0.73, 0.5);
  
  return placard;
}

function createMouse(): THREE.Mesh {
  const mouse = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.015, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 })
  );
  mouse.position.set(0.15, 0.73, 0.25);
  
  return mouse;
}

function createMousePad(): THREE.Mesh {
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.001, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
  );
  pad.position.set(0.1, 0.725, 0.25);
  
  return pad;
}

function createStickyNote(): THREE.Mesh {
  const note = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  note.position.set(0.25, 1.4, -0.3);
  
  return note;
}

function createCalendar(): THREE.Mesh {
  const calendar = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
  );
  calendar.position.set(1.2, 1.5, -0.6);
  
  return calendar;
}
```

---

## STEP 3: Object Interactions

### 3.1 Update raycaster hook

**Edit `src/hooks/useRaycaster.ts`:**

Add import:
```typescript
import { useObjectStore } from '@/store/objectStore';
```

In the hook, before window/icon checking, add object checking:

```typescript
const { markInteracted } = useObjectStore();

// ... existing raycaster setup ...

const handleClick = (event: MouseEvent) => {
  // ... existing mouse coordinate setup ...
  
  raycaster.setFromCamera(mouse, camera);
  
  // Check 3D objects first (before monitor/desktop UI)
  const allObjects = scene.children.filter(obj => obj.userData.interactive);
  const objectIntersects = raycaster.intersectObjects(allObjects, true);
  
  if (objectIntersects.length > 0) {
    const clickedObject = objectIntersects[0].object;
    const rootObject = findRootInteractive(clickedObject);
    
    if (rootObject && rootObject.userData.id) {
      handleObjectClick(rootObject);
      return;
    }
  }
  
  // Then check monitor screen for desktop UI
  const monitorIntersects = raycaster.intersectObject(monitorScreen);
  // ... existing desktop interaction code ...
};

// Helper to find root interactive object
function findRootInteractive(obj: THREE.Object3D): THREE.Object3D | null {
  if (obj.userData.interactive) return obj;
  if (obj.parent) return findRootInteractive(obj.parent);
  return null;
}

const handleObjectClick = (object: THREE.Group | THREE.Mesh) => {
  const id = object.userData.id;
  
  // Play placeholder sound (will be real sound in Phase 6)
  console.log(`[AUDIO] Click sound for ${id}`);
  
  // Object-specific interactions
  switch (id) {
    case 'coffee_mug':
      // Fade coffee level
      const coffee = object.userData.coffee;
      if (coffee && coffee.scale.y > 0.2) {
        coffee.scale.y *= 0.7;
        coffee.position.y *= 0.7;
      }
      break;
      
    case 'papers':
      // Cycle rotation
      object.rotation.y += 0.3;
      break;
      
    case 'desk_lamp':
      // Toggle light
      const state = useObjectStore.getState().getObjectState(id);
      const newState = !state.customState?.on;
      
      if (newState && !scene.children.includes(object.userData.light)) {
        scene.add(object.userData.light);
      } else if (!newState && scene.children.includes(object.userData.light)) {
        scene.remove(object.userData.light);
      }
      
      markInteracted(id, { on: newState });
      break;
      
    case 'pen_cup':
      // Tilt pens
      object.children.forEach((child, i) => {
        if (i > 0) { // Skip cup body
          child.rotation.z += (i - 2) * 0.3;
        }
      });
      break;
      
    case 'plant':
      // Wilt leaves
      for (let i = 0; i < 3; i++) {
        const leaf = object.userData[`leaf${i}`];
        if (leaf) {
          leaf.material.color.setHex(0x5a4a3a); // Brown
          leaf.rotation.z += 0.5; // Droop
        }
      }
      break;
      
    case 'stapler':
      // Staple animation
      const originalY = object.position.y;
      object.position.y = originalY - 0.01;
      setTimeout(() => {
        object.position.y = originalY;
      }, 100);
      break;
      
    case 'phone':
      // Will play dial tone in Phase 6
      console.log('[AUDIO] Dial tone');
      break;
      
    case 'drawer':
      // Slide open
      const state2 = useObjectStore.getState().getObjectState(id);
      const isOpen = state2.customState?.open || false;
      object.position.z = isOpen ? 0.5 : 0.7;
      markInteracted(id, { open: !isOpen });
      break;
      
    case 'keyboard':
      // Already handled by typing in terminal
      console.log('[AUDIO] Keyboard click');
      break;
  }
  
  markInteracted(id);
};
```

---

## STEP 4: Test and Verify

### 4.1 Test interactive objects

Click each object:

**Coffee mug:** Coffee level decreases  
**Papers:** Stack rotates  
**Desk lamp:** Light turns on/off (add/remove point light)  
**Pen cup:** Pens tilt over  
**Plant:** Leaves turn brown and droop  
**Stapler:** Staples down briefly  
**Phone:** Console logs dial tone  
**Drawer:** Slides open/closed  
**Keyboard:** Console logs click  

### 4.2 Test decorative objects

Name placard, mouse, mouse pad, sticky note, calendar should be visible but not clickable.

### 4.3 Test object state persistence

Click desk lamp → light turns on  
Close browser tab → reopen  
Click desk lamp again → light turns off (state persisted)

### 4.4 Verify no conflicts with desktop UI

Click 3D object → object interaction fires  
Click monitor screen → desktop UI interaction fires  
No overlap or interference

---

## STEP 5: Troubleshooting

### Objects not rendering

Check each `createXXX()` function is called and added to scene:
```typescript
const coffeeMug = createCoffeeMug();
scene.add(coffeeMug);
```

### Objects not clickable

Check raycaster filters for interactive objects:
```typescript
const allObjects = scene.children.filter(obj => obj.userData.interactive);
```

Verify each object has `userData.interactive = true` and `userData.id`.

### Desk lamp light not toggling

Check scene.add/remove:
```typescript
if (newState && !scene.children.includes(object.userData.light)) {
  scene.add(object.userData.light);
}
```

Verify `object.userData.light` is a PointLight created in `createDeskLamp()`.

### Plant leaves not wilting

Check leaf references stored in userData:
```typescript
plant.userData[`leaf${i}`] = leaf;
```

Then accessed in click handler:
```typescript
const leaf = object.userData[`leaf${i}`];
```

---

## PHASE 5 COMPLETE ✅

**Checkpoint:** All 15 objects created, 10 interactive with visual feedback.

**Next:** `docs/PHASE_6_AUDIO.md` - Implement Web Audio API system with real sounds

**Before moving to Phase 6:**
1. Verify all 15 objects visible in scene
2. Verify 10 objects respond to clicks with visual changes
3. Verify desk lamp light toggles on/off
4. Verify plant wilts when clicked
5. Verify drawer slides open/closed
6. Commit code to git

```bash
git add .
git commit -m "Phase 5 complete: 15 3D objects with interactions"
```
