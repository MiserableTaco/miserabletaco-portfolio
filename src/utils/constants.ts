// Monitor dimensions (world units)
// Sized for ~72% viewport height coverage at camera distance ~1.9
export const MONITOR = {
  bezel: { width: 1.5, height: 1.15, depth: 0.12 },
  screen: { width: 1.28, height: 0.96 }, // 4:3 ratio
  position: { x: 0, y: 1.1, z: 0 },
  tilt: -0.08, // radians backward
} as const

// Desktop canvas resolution (pixels)
export const DESKTOP_WIDTH = 1024
export const DESKTOP_HEIGHT = 768

// Camera
export const CAMERA = {
  fov: 45,
  position: { x: 0, y: 1.4, z: 1.9 },
  lookAt: { x: 0, y: 1.1, z: 0 },
  near: 0.1,
  far: 100,
  driftAmount: 0.03, // smaller drift for closer camera
  driftSpeed: 0.1,
} as const

// Colors (hex)
export const COLORS = {
  ambient: 0x404040,
  monitor_glow: 0x00ff00,
  ceiling: 0x606060,
  desk: 0x4a4a4a,
  monitor_bezel: 0x2a2a2a,
  fog: 0x0a0a0a,
} as const

// Lighting intensities
export const LIGHTING = {
  ambient: 0.5,
  monitor_glow: 0.8,
  monitor_glow_range: 10,
  ceiling: 0.3,
} as const

// Fog
export const FOG = {
  near: 5,
  far: 15,
} as const

// Performance
export const TARGET_FPS = 60
export const MAX_PIXEL_RATIO = 2
