// Monitor dimensions (world units)
// Sized for ~72% viewport height coverage at camera distance ~1.9
export const MONITOR = {
  bezel: { width: 1.60, height: 1.22, depth: 0.14 },
  screen: { width: 1.36, height: 1.02 }, // 4:3 ratio
  position: { x: 0, y: 1.1, z: 0 },
  tilt: -0.08, // radians backward
} as const

// Desktop canvas resolution (pixels)
export const DESKTOP_WIDTH = 1024
export const DESKTOP_HEIGHT = 768

// Camera — fixed position showing full desk, monitor, shelf, wall items
export const CAMERA = {
  fov: 45,
  position: { x: 0, y: 1.3, z: 2.4 },
  lookAt: { x: 0, y: 1.0, z: 0 },
  near: 0.1,
  far: 100,
  driftAmount: 0.02,
  driftSpeed: 0.12,
} as const

// Colors (hex) — warm office, not horror
export const COLORS = {
  ambient: 0x808080,
  monitor_glow: 0x88bbff,  // soft blue-white, not green
  ceiling: 0xfff5e6,       // warm white
  desk: 0x5a5a5a,
  monitor_bezel: 0x333333,
  fog: 0x2a2a35,
} as const

// Lighting intensities — bright enough to see objects
export const LIGHTING = {
  ambient: 1.0,
  monitor_glow: 0.5,
  monitor_glow_range: 6,
  ceiling: 0.8,
} as const

// Fog — pushed back so objects are clearly visible
export const FOG = {
  near: 4,
  far: 20,
} as const

// Desktop UI
export const DESKTOP = {
  titleBarHeight: 36,
  taskbarHeight: 46,
  iconSize: 76,
  iconLabelHeight: 28,
  doubleClickMs: 300,
  windowWidth: 840, // ~82% of 1024
  windowHeight: 640, // ~83% of 768 (accounts for larger taskbar)
  background: '#2c3040',
} as const

// Performance
export const TARGET_FPS = 60
export const MAX_PIXEL_RATIO = 1.5
