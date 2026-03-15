import { DESKTOP } from '@/utils/constants'

// Dark Win98 theme
export const T = {
  bevelOuter: '#606060',
  bevelInner: '#4a4a4a',
  shadowInner: '#1a1a1a',
  shadowOuter: '#0a0a0a',
  surface: '#2e2e2e',
  surfaceDown: '#222222',
  titleGradientStart: '#002200',
  titleGradientEnd: '#005500',
  text: '#e0e0e0',
  textAccent: '#00ff00',
  windowBg: '#2e2e2e',
  windowContent: '#0a0a0a',
  desktopBg: '#1a2820',
  taskbar: '#2e2e2e',
  closeRed: '#cc2200',
} as const

// Window title bar button dimensions (derived from title bar height)
export const BTN_H = DESKTOP.titleBarHeight - 8
export const BTN_W = BTN_H + 4
export const BTN_GAP = 2

// ── Text helper — truncate with ellipsis when exceeding maxW ────────

export function fillTextTruncated(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number) {
  if (ctx.measureText(text).width <= maxW) {
    ctx.fillText(text, x, y)
    return
  }
  let t = text
  while (t.length > 1 && ctx.measureText(t + '\u2026').width > maxW) {
    t = t.slice(0, -1)
  }
  ctx.fillText(t + '\u2026', x, y)
}

// ── Bevel helpers ───────────────────────────────────────────────────

export function drawRaised(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, face: string) {
  ctx.fillStyle = face
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = T.bevelOuter
  ctx.fillRect(x, y, w - 1, 1)
  ctx.fillRect(x, y, 1, h - 1)
  ctx.fillStyle = T.bevelInner
  ctx.fillRect(x + 1, y + 1, w - 3, 1)
  ctx.fillRect(x + 1, y + 1, 1, h - 3)
  ctx.fillStyle = T.shadowInner
  ctx.fillRect(x + 1, y + h - 2, w - 2, 1)
  ctx.fillRect(x + w - 2, y + 1, 1, h - 2)
  ctx.fillStyle = T.shadowOuter
  ctx.fillRect(x, y + h - 1, w, 1)
  ctx.fillRect(x + w - 1, y, 1, h)
}

export function drawSunken(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, face: string) {
  ctx.fillStyle = face
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = T.shadowOuter
  ctx.fillRect(x, y, w - 1, 1)
  ctx.fillRect(x, y, 1, h - 1)
  ctx.fillStyle = T.shadowInner
  ctx.fillRect(x + 1, y + 1, w - 3, 1)
  ctx.fillRect(x + 1, y + 1, 1, h - 3)
  ctx.fillStyle = T.bevelInner
  ctx.fillRect(x + 1, y + h - 2, w - 2, 1)
  ctx.fillRect(x + w - 2, y + 1, 1, h - 2)
  ctx.fillStyle = T.bevelOuter
  ctx.fillRect(x, y + h - 1, w, 1)
  ctx.fillRect(x + w - 1, y, 1, h)
}

// ── CRT scanlines ───────────────────────────────────────────────────

export function drawScanlines(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1)
  }
}
