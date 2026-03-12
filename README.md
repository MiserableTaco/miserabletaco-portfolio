# miserabletaco.dev

Personal portfolio built as a 3D low-poly office. A CRT monitor takes up most of the viewport and runs an interactive retro desktop — Windows 98 style, dark theme, fully canvas-rendered. Visitors navigate portfolio content through desktop windows and a working terminal, click 3D objects in the scene, and encounter 50+ hidden commands and easter eggs.

**Live:** [miserabletaco.dev](https://miserabletaco.dev)

## Stack

| | |
|---|---|
| **Rendering** | Three.js r183 — procedural geometry, no external models |
| **UI** | React 19 + TypeScript 5.9 |
| **State** | Zustand 5 |
| **Build** | Vite 7 + pnpm |
| **Hosting** | Cloudflare Pages |

## Features

- **3D office scene** — low-poly room with monitor, desk, shelf, and interactive objects. PBR materials, shadow mapping, fog, ACES tone mapping, procedural environment map for metallic reflections.
- **Canvas desktop** — 1024x768 retro desktop rendered to a 2D canvas mapped onto the monitor. Window management, taskbar, icons with double-click, clock, scanlines. Dirty-flag rendering (redraws only on state change).
- **Terminal** — command history, input buffer, 50+ commands including `neofetch`, `cowsay`, `matrix`, `hack`, `fortune`, and portfolio navigation. Easter eggs lazy-loaded for bundle performance.
- **Portfolio pages** — TRUST, CULTURE, UNDERTOW, ABOUT, CONTACT — displayed inside desktop windows.
- **Audio** — Web Audio API generative synthesis + sampled sounds. Keyboard clicks, object interactions, ambient hum.
- **Monitor power button** — CRT shutdown animation (screen collapses to a horizontal line, then a dot) and boot animation (BIOS POST text).
- **Interactions** — raycaster click detection on 3D objects, keyboard light-up on typing, Konami code disco mode.
- **Mobile fallback** — 2D terminal interface on small screens.

## Development

```bash
pnpm install
pnpm dev        # dev server on :3000
pnpm build      # type-check + production build
pnpm preview    # preview production build
```

## Project Structure

```
src/
├── components/
│   ├── Scene.tsx           # Three.js scene, monitor, room, lighting, objects
│   ├── Desktop.tsx         # Canvas-rendered desktop UI
│   ├── Loading.tsx         # Boot sequence
│   └── MobileFallback.tsx  # Mobile 2D terminal
├── store/
│   ├── desktopStore.ts     # Windows, icons, taskbar
│   ├── terminalStore.ts    # Terminal I/O, command processing
│   ├── objectStore.ts      # 3D object + monitor power state
│   └── portfolioStore.ts   # Portfolio page content
├── hooks/
│   ├── useAudio.ts         # Web Audio API
│   └── useRaycaster.ts     # 3D click detection
├── utils/
│   ├── constants.ts        # Scene dimensions, colors, lighting
│   └── sanitize.ts         # Input sanitization
└── styles/
    ├── index.css           # Global reset
    └── effects.css         # Film grain, vignette
```

## License

All rights reserved.
