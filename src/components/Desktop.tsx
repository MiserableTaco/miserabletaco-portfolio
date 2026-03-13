import { useEffect } from 'react'
import { useSceneStore } from '@/store/sceneStore'
import { useDesktopStore } from '@/store/desktopStore'
import { useTerminalStore } from '@/store/terminalStore'
import { useObjectStore } from '@/store/objectStore'
import {
  usePortfolioStore,
  ABOUT_LINES, CONTACT_LINES,
  ABOUT_LINKS, CONTACT_LINKS,
} from '@/store/portfolioStore'
import type { DesktopIcon, DesktopWindow } from '@/store/desktopStore'
import { DESKTOP_WIDTH, DESKTOP_HEIGHT, DESKTOP } from '@/utils/constants'

// ── Dirty-flag rendering ─────────────────────────────────────────────
let desktopDirty = true
export function markDesktopDirty() { desktopDirty = true }

// Dark Win98 theme
const T = {
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
const BTN_H = DESKTOP.titleBarHeight - 8
const BTN_W = BTN_H + 4
const BTN_GAP = 2

export function Desktop() {
  const desktopCanvas = useSceneStore((s) => s.desktopCanvas)
  const canvasTexture = useSceneStore((s) => s.canvasTexture)

  useEffect(() => {
    if (!desktopCanvas || !canvasTexture) return

    const ctx = desktopCanvas.getContext('2d')
    if (!ctx) return

    desktopCanvas.width = DESKTOP_WIDTH
    desktopCanvas.height = DESKTOP_HEIGHT

    // Subscribe to store changes → mark dirty
    const unsub1 = useDesktopStore.subscribe(() => { desktopDirty = true })
    const unsub2 = useTerminalStore.subscribe(() => { desktopDirty = true })
    const unsub3 = usePortfolioStore.subscribe(() => { desktopDirty = true })
    let prevMonState = { on: useObjectStore.getState().monitorOn, tr: useObjectStore.getState().monitorTransition }
    const unsub4 = useObjectStore.subscribe((s) => {
      if (s.monitorOn !== prevMonState.on || s.monitorTransition !== prevMonState.tr) {
        prevMonState = { on: s.monitorOn, tr: s.monitorTransition }
        desktopDirty = true
      }
    })

    let rafId: number
    let lastBlinkPhase = -1
    let lastClockMinute = -1

    const render = () => {
      rafId = requestAnimationFrame(render)

      // Track cursor blink and clock minute to trigger redraws
      const blinkPhase = Math.floor(performance.now() / 500) % 2
      const clockMinute = new Date().getMinutes()
      if (blinkPhase !== lastBlinkPhase) { lastBlinkPhase = blinkPhase; desktopDirty = true }
      if (clockMinute !== lastClockMinute) { lastClockMinute = clockMinute; desktopDirty = true }

      if (!desktopDirty) return
      desktopDirty = false

      const { monitorOn, monitorTransition, transitionStart } = useObjectStore.getState()

      // Monitor OFF — black screen
      if (!monitorOn && !monitorTransition) {
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, DESKTOP_WIDTH, DESKTOP_HEIGHT)
        canvasTexture.needsUpdate = true
        return
      }

      // Boot animation — BIOS text
      if (monitorTransition === 'booting') {
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, DESKTOP_WIDTH, DESKTOP_HEIGHT)
        const bootLines = [
          'ARES BIOS v4.5',
          'Memory test... 640K OK',
          'Detecting drives... [OK]',
          'Loading ARES kernel...',
          'Initializing desktop...',
        ]
        const elapsed = (performance.now() - transitionStart) / 1000
        const visibleLines = Math.min(bootLines.length, Math.floor(elapsed / 0.3) + 1)
        ctx.fillStyle = '#00cc44'
        ctx.font = '26px "Courier New", monospace'
        ctx.textAlign = 'left'
        for (let i = 0; i < visibleLines; i++) {
          ctx.fillText(bootLines[i], 40, 80 + i * 40)
        }
        canvasTexture.needsUpdate = true
        desktopDirty = true // keep redrawing during boot
        return
      }

      // Shutdown animation — desktop renders white (Scene.tsx handles scale)
      if (monitorTransition === 'shutting-down') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, DESKTOP_WIDTH, DESKTOP_HEIGHT)
        canvasTexture.needsUpdate = true
        return
      }

      // Normal desktop rendering
      const { icons, windows, selectedIconId } = useDesktopStore.getState()

      ctx.fillStyle = T.desktopBg
      ctx.fillRect(0, 0, DESKTOP_WIDTH, DESKTOP_HEIGHT)

      for (const icon of icons) {
        drawIcon(ctx, icon, icon.id === selectedIconId)
      }

      const sorted = [...windows].sort((a, b) => a.zIndex - b.zIndex)
      for (const win of sorted) {
        if (!win.minimized) drawWindow(ctx, win)
      }

      drawTaskbar(ctx, windows)
      drawScanlines(ctx)

      canvasTexture.needsUpdate = true
    }

    render()
    return () => {
      cancelAnimationFrame(rafId)
      unsub1(); unsub2(); unsub3(); unsub4()
    }
  }, [desktopCanvas, canvasTexture])

  return null
}

// ── Text helper — truncate with ellipsis when exceeding maxW ────────

function fillTextTruncated(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number) {
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

function drawRaised(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, face: string) {
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

function drawSunken(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, face: string) {
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

// ── Icon rendering ──────────────────────────────────────────────────

function drawIcon(ctx: CanvasRenderingContext2D, icon: DesktopIcon, selected: boolean) {
  const s = DESKTOP.iconSize

  if (selected) {
    ctx.fillStyle = 'rgba(0, 100, 0, 0.4)'
    ctx.fillRect(icon.x - 3, icon.y - 3, s + 6, s + DESKTOP.iconLabelHeight + 8)
    ctx.strokeStyle = T.textAccent
    ctx.lineWidth = 1
    ctx.strokeRect(icon.x - 3, icon.y - 3, s + 6, s + DESKTOP.iconLabelHeight + 8)
  }

  drawIconArt(ctx, icon.x, icon.y, s, icon.app, icon.iconColor)

  // Label
  ctx.textAlign = 'center'
  ctx.font = '20px "Courier New", monospace'
  const labelX = icon.x + s / 2
  const labelY = icon.y + s + 20

  if (selected) {
    const tw = ctx.measureText(icon.name).width + 6
    ctx.fillStyle = 'rgba(0, 80, 0, 0.8)'
    ctx.fillRect(labelX - tw / 2, labelY - 11, tw, 14)
    ctx.fillStyle = '#ffffff'
  } else {
    ctx.fillStyle = '#000000'
    ctx.fillText(icon.name, labelX + 1, labelY + 1)
    ctx.fillStyle = '#cccccc'
  }
  ctx.fillText(icon.name, labelX, labelY)
}

function drawIconArt(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, app: string, color: string) {
  switch (app) {
    case 'terminal': drawTerminalIcon(ctx, x, y, s, color); break
    case 'trust': drawShieldIcon(ctx, x, y, s, color); break
    case 'culture': drawNetworkIcon(ctx, x, y, s, color); break
    case 'undertow': drawWaveIcon(ctx, x, y, s, color); break
    case 'about': drawDocumentIcon(ctx, x, y, s, color, 'i'); break
    case 'contact': drawEnvelopeIcon(ctx, x, y, s, color); break
    case 'mycomputer': drawComputerIcon(ctx, x, y, s, color); break
    case 'notepad': drawNotepadIcon(ctx, x, y, s, color); break
    case 'backup': drawZipIcon(ctx, x, y, s, color); break
  }
}

function drawTerminalIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  const p = s * 0.06 // padding unit
  // Monitor body
  drawRaised(ctx, x + p, y + p, s - p * 2, s - p * 10, '#333333')
  // Screen (sunken)
  const sx = x + p * 3
  const sy = y + p * 2.5
  const sw = s - p * 6
  const sh = s - p * 14
  drawSunken(ctx, sx, sy, sw, sh, '#0a0a0a')
  // Prompt
  ctx.fillStyle = color
  ctx.font = `bold ${Math.round(s * 0.28)}px "Courier New", monospace`
  ctx.textAlign = 'left'
  ctx.fillText('>_', sx + p * 2, sy + sh - p * 2)
  // Stand
  ctx.fillStyle = '#444444'
  ctx.fillRect(x + s / 2 - s * 0.08, y + s - p * 8, s * 0.16, p * 4)
  ctx.fillRect(x + s / 2 - s * 0.14, y + s - p * 4, s * 0.28, p * 3)
}

function drawShieldIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  const cx = x + s / 2
  const top = y + s * 0.06
  const side = s * 0.08
  ctx.beginPath()
  ctx.moveTo(cx, top)
  ctx.lineTo(x + s - side, top + s * 0.14)
  ctx.lineTo(x + s - side, y + s * 0.48)
  ctx.quadraticCurveTo(cx, y + s - side, cx, y + s - side)
  ctx.quadraticCurveTo(cx, y + s - side, x + side, y + s * 0.48)
  ctx.lineTo(x + side, top + s * 0.14)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2
  ctx.stroke()
  // Checkmark
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.14, y + s * 0.48)
  ctx.lineTo(cx - s * 0.02, y + s * 0.60)
  ctx.lineTo(cx + s * 0.16, y + s * 0.34)
  ctx.stroke()
}

function drawNetworkIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  const cx = x + s / 2
  const cy = y + s / 2
  const r = s * 0.1
  const spread = s * 0.24
  const nodes = [
    { nx: cx, ny: cy - spread },
    { nx: cx - spread * 1.1, ny: cy + spread * 0.6 },
    { nx: cx + spread * 1.1, ny: cy + spread * 0.6 },
  ]
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      ctx.beginPath()
      ctx.moveTo(nodes[i].nx, nodes[i].ny)
      ctx.lineTo(nodes[j].nx, nodes[j].ny)
      ctx.stroke()
    }
  }
  for (const n of nodes) {
    ctx.beginPath()
    ctx.arc(n.nx, n.ny, r, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

function drawWaveIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = s * 0.06
  const rows = 3
  const rowH = s * 0.22
  const pad = s * 0.12
  const amp = s * 0.12
  for (let i = 0; i < rows; i++) {
    const wy = y + pad + s * 0.08 + i * rowH
    ctx.beginPath()
    ctx.moveTo(x + pad, wy)
    ctx.bezierCurveTo(x + s * 0.35, wy - amp, x + s * 0.55, wy + amp, x + s - pad, wy)
    ctx.stroke()
  }
}

function drawDocumentIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, label: string) {
  const pad = s * 0.1
  const dx = x + pad
  const dy = y + pad * 0.4
  const dw = s - pad * 2
  const dh = s - pad
  const fold = s * 0.18
  ctx.beginPath()
  ctx.moveTo(dx, dy)
  ctx.lineTo(dx + dw - fold, dy)
  ctx.lineTo(dx + dw, dy + fold)
  ctx.lineTo(dx + dw, dy + dh)
  ctx.lineTo(dx, dy + dh)
  ctx.closePath()
  ctx.fillStyle = '#e8e8d8'
  ctx.fill()
  ctx.strokeStyle = '#666666'
  ctx.lineWidth = 1.5
  ctx.stroke()
  // Dog-ear
  ctx.beginPath()
  ctx.moveTo(dx + dw - fold, dy)
  ctx.lineTo(dx + dw - fold, dy + fold)
  ctx.lineTo(dx + dw, dy + fold)
  ctx.closePath()
  ctx.fillStyle = '#c8c8b8'
  ctx.fill()
  ctx.stroke()
  // Text lines
  ctx.fillStyle = '#888888'
  const lineGap = s * 0.11
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(dx + pad * 0.6, dy + fold + pad * 0.8 + i * lineGap, dw - pad * 1.2 - (i === 2 ? s * 0.12 : 0), 2)
  }
  // Label letter
  ctx.fillStyle = color
  ctx.font = `bold ${Math.round(s * 0.3)}px serif`
  ctx.textAlign = 'center'
  ctx.fillText(label, x + s / 2, dy + fold + pad * 0.4)
}

function drawEnvelopeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  const pad = s * 0.06
  const ex = x + pad
  const ey = y + s * 0.16
  const ew = s - pad * 2
  const eh = s * 0.65
  ctx.fillStyle = '#e0e0d0'
  ctx.fillRect(ex, ey, ew, eh)
  ctx.strokeStyle = '#666666'
  ctx.lineWidth = 1.5
  ctx.strokeRect(ex, ey, ew, eh)
  // Flap
  ctx.beginPath()
  ctx.moveTo(ex, ey)
  ctx.lineTo(ex + ew / 2, ey + eh * 0.5)
  ctx.lineTo(ex + ew, ey)
  ctx.strokeStyle = '#888888'
  ctx.lineWidth = 2
  ctx.stroke()
  // @ symbol
  ctx.fillStyle = color
  ctx.font = `bold ${Math.round(s * 0.28)}px "Courier New", monospace`
  ctx.textAlign = 'center'
  ctx.fillText('@', x + s / 2, ey + eh - s * 0.06)
}

function drawComputerIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  const p = s * 0.06
  // Monitor body
  drawRaised(ctx, x + p * 2, y + p, s - p * 4, s - p * 10, color)
  // Screen (sunken)
  drawSunken(ctx, x + p * 4, y + p * 2.5, s - p * 8, s - p * 16, '#1a3a6a')
  // Stand
  ctx.fillStyle = color
  ctx.fillRect(x + s / 2 - s * 0.1, y + s - p * 8, s * 0.2, p * 4)
  ctx.fillRect(x + s / 2 - s * 0.16, y + s - p * 4, s * 0.32, p * 2.5)
  // Windows-style quadrants
  const qSize = s * 0.16
  const qGap = s * 0.04
  const qx = x + s / 2 - qSize - qGap / 2
  const qy = y + p * 4
  ctx.fillStyle = '#3a7abb'
  ctx.fillRect(qx, qy, qSize, qSize)
  ctx.fillRect(qx + qSize + qGap, qy, qSize, qSize)
  ctx.fillRect(qx, qy + qSize + qGap, qSize, qSize)
  ctx.fillRect(qx + qSize + qGap, qy + qSize + qGap, qSize, qSize)
}

function drawNotepadIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  const pad = s * 0.12
  const nx = x + pad
  const ny = y + pad * 0.3
  const nw = s - pad * 2
  const nh = s - pad
  ctx.fillStyle = color
  ctx.fillRect(nx, ny, nw, nh)
  ctx.strokeStyle = '#888888'
  ctx.lineWidth = 1.5
  ctx.strokeRect(nx, ny, nw, nh)
  // Blue header
  ctx.fillStyle = '#3a5a9a'
  ctx.fillRect(nx, ny, nw, s * 0.12)
  // Text lines
  ctx.fillStyle = '#999999'
  const lineGap = s * 0.12
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(nx + pad * 0.5, ny + s * 0.2 + i * lineGap, nw - pad - (i === 3 ? s * 0.1 : 0), 2)
  }
}

function drawZipIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  const p = s * 0.06
  // Folder body
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x + p * 2, y + s * 0.18)
  ctx.lineTo(x + p * 2, y + s - p * 2)
  ctx.lineTo(x + s - p * 2, y + s - p * 2)
  ctx.lineTo(x + s - p * 2, y + s * 0.18)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#555555'
  ctx.lineWidth = 1.5
  ctx.stroke()
  // Tab
  ctx.fillStyle = '#999999'
  const tabW = s * 0.32
  ctx.fillRect(x + p * 2, y + s * 0.08, tabW, s * 0.12)
  ctx.strokeStyle = '#555555'
  ctx.strokeRect(x + p * 2, y + s * 0.08, tabW, s * 0.12)
  // Zip stripe
  const zx = x + s / 2 - s * 0.06
  const zw = s * 0.12
  const blockH = s * 0.08
  const blocks = Math.floor((s * 0.65) / blockH)
  for (let i = 0; i < blocks; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#444444' : '#aaaaaa'
    ctx.fillRect(zx, y + s * 0.22 + i * blockH, zw, blockH)
  }
}

// ── Window rendering ────────────────────────────────────────────────

function drawWindow(ctx: CanvasRenderingContext2D, win: DesktopWindow) {
  const tbH = DESKTOP.titleBarHeight

  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.fillRect(win.x + 4, win.y + 4, win.width, win.height)

  // Window frame
  drawRaised(ctx, win.x, win.y, win.width, win.height, T.windowBg)

  // Title bar gradient
  const grad = ctx.createLinearGradient(win.x, win.y + 2, win.x + win.width, win.y + 2)
  grad.addColorStop(0, T.titleGradientStart)
  grad.addColorStop(1, T.titleGradientEnd)
  ctx.fillStyle = grad
  ctx.fillRect(win.x + 2, win.y + 2, win.width - 4, tbH)

  // Title text (vertically centered)
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.round(tbH * 0.62)}px "Courier New", monospace`
  ctx.textAlign = 'left'
  const titleMaxW = win.width - (BTN_W * 3 + BTN_GAP * 2 + 24)
  fillTextTruncated(ctx, win.title, win.x + 10, win.y + tbH * 0.72, titleMaxW)

  // Buttons
  const btnY = win.y + Math.round((tbH - BTN_H) / 2) + 1

  // Close (rightmost)
  const closeX = win.x + win.width - BTN_W - 6
  drawRaised(ctx, closeX, btnY, BTN_W, BTN_H, T.surface)
  ctx.fillStyle = T.closeRed
  ctx.font = `bold ${Math.round(BTN_H * 0.72)}px "Courier New", monospace`
  ctx.textAlign = 'center'
  ctx.fillText('X', closeX + BTN_W / 2, btnY + BTN_H * 0.72)

  // Maximize
  const maxX = closeX - BTN_W - BTN_GAP
  drawRaised(ctx, maxX, btnY, BTN_W, BTN_H, T.surface)
  const boxP = Math.round(BTN_W * 0.2)
  ctx.strokeStyle = T.text
  ctx.lineWidth = 1.5
  ctx.strokeRect(maxX + boxP, btnY + boxP, BTN_W - boxP * 2, BTN_H - boxP * 2)
  ctx.fillStyle = T.text
  ctx.fillRect(maxX + boxP, btnY + boxP, BTN_W - boxP * 2, 2)

  // Minimize
  const minX = maxX - BTN_W - BTN_GAP
  drawRaised(ctx, minX, btnY, BTN_W, BTN_H, T.surface)
  ctx.fillStyle = T.text
  ctx.fillRect(minX + boxP, btnY + BTN_H - boxP - 2, BTN_W - boxP * 2, 2)

  // Content area (sunken)
  const contentY = win.y + tbH + 2
  const contentH = win.height - tbH - 4
  drawSunken(ctx, win.x + 2, contentY, win.width - 4, contentH, T.windowContent)

  // Render app-specific content
  const cx = win.x + 4
  const cy = contentY + 4
  const cw = win.width - 8
  const ch = contentH - 8

  ctx.save()
  ctx.beginPath()
  ctx.rect(cx, cy, cw, ch)
  ctx.clip()

  switch (win.app) {
    case 'terminal': drawTerminalContent(ctx, cx, cy, cw, ch); break
    case 'trust': drawTrustContent(ctx, cx, cy, cw, ch); break
    case 'culture': drawCultureContent(ctx, cx, cy, cw, ch); break
    case 'undertow': drawUndertowContent(ctx, cx, cy, cw, ch); break
    case 'about': drawTextContent(ctx, cx, cy, cw, ch, 'about', ABOUT_LINES, '#00ff00', ABOUT_LINKS); break
    case 'contact': drawTextContent(ctx, cx, cy, cw, ch, 'contact', CONTACT_LINES, '#00ff00', CONTACT_LINKS); break
    case 'mycomputer': drawMyComputerContent(ctx, cx, cy, cw, ch); break
    case 'notepad': drawNotepadContent(ctx, cx, cy, cw, ch); break
    case 'backup': drawBackupContent(ctx, cx, cy, cw, ch); break
  }

  ctx.restore()
}

// ── Taskbar rendering ───────────────────────────────────────────────

function drawTaskbar(ctx: CanvasRenderingContext2D, windows: DesktopWindow[]) {
  const tbH = DESKTOP.taskbarHeight
  const taskbarY = DESKTOP_HEIGHT - tbH
  const pad = 4
  const innerH = tbH - pad * 2
  const textY = taskbarY + tbH / 2 + 5

  // Body
  drawRaised(ctx, 0, taskbarY, DESKTOP_WIDTH, tbH, T.taskbar)

  // START button
  const startBtnW = 84
  const startMenuOpen = useDesktopStore.getState().startMenuOpen
  if (startMenuOpen) {
    drawSunken(ctx, pad, taskbarY + pad, startBtnW, innerH, T.surfaceDown)
  } else {
    drawRaised(ctx, pad, taskbarY + pad, startBtnW, innerH, T.surface)
  }
  ctx.fillStyle = T.textAccent
  ctx.font = 'bold 24px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('START', pad + startBtnW / 2, textY)

  // Separator
  const sepX = pad + startBtnW + 4
  ctx.fillStyle = T.shadowInner
  ctx.fillRect(sepX, taskbarY + pad, 1, innerH)
  ctx.fillStyle = T.bevelInner
  ctx.fillRect(sepX + 1, taskbarY + pad, 1, innerH)

  // Window buttons — dynamically sized to fill available space
  const trayX = DESKTOP_WIDTH - 84
  const btnAreaStart = sepX + 6
  const btnAreaW = trayX - btnAreaStart - 4
  const btnCount = windows.length
  const btnW = btnCount > 0 ? Math.min(140, Math.floor(btnAreaW / btnCount) - 4) : 0

  for (let i = 0; i < btnCount; i++) {
    const win = windows[i]
    const bx = btnAreaStart + i * (btnW + 4)
    if (win.minimized) {
      drawRaised(ctx, bx, taskbarY + pad, btnW, innerH, T.surface)
    } else {
      drawSunken(ctx, bx, taskbarY + pad, btnW, innerH, T.surfaceDown)
    }
    // Truncate title to fit button
    ctx.fillStyle = T.text
    ctx.font = '20px "Courier New", monospace'
    ctx.textAlign = 'left'
    let label = win.title
    while (ctx.measureText(label).width > btnW - 14 && label.length > 1) {
      label = label.slice(0, -1)
    }
    if (label.length < win.title.length) label = label.slice(0, -1) + '\u2026'
    ctx.fillText(label, bx + 7, textY)
  }

  // System tray separator
  ctx.fillStyle = T.shadowInner
  ctx.fillRect(trayX, taskbarY + pad, 1, innerH)
  ctx.fillStyle = T.bevelInner
  ctx.fillRect(trayX + 1, taskbarY + pad, 1, innerH)

  // Clock
  drawSunken(ctx, trayX + 4, taskbarY + pad, 72, innerH, T.surfaceDown)
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  ctx.fillStyle = T.textAccent
  ctx.font = '22px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.fillText(timeStr, trayX + 40, textY)

  // START menu popup
  if (startMenuOpen) {
    drawStartMenu(ctx, taskbarY)
  }
}

// ── Start menu ──────────────────────────────────────────────────────

const START_MENU_ITEMS = [
  { app: 'trust', label: 'TRUST', icon: '\u25C6', color: '#00ffff' },
  { app: 'culture', label: 'CULTURE', icon: '\u25C6', color: '#ff00ff' },
  { app: 'undertow', label: 'UNDERTOW', icon: '\u25C6', color: '#ffaa00' },
  { app: 'about', label: 'About', icon: '\u25A0', color: '#00ff00' },
  { app: 'contact', label: 'Contact', icon: '\u2709', color: '#00ff00' },
  { app: 'terminal', label: 'Terminal', icon: '>_', color: '#00ff00' },
  { app: 'mycomputer', label: 'My PC', icon: '\u25A3', color: '#808080' },
  { app: 'notepad', label: 'Notepad', icon: '\u2630', color: '#ffffff' },
  { app: 'backup', label: 'Backup', icon: '\u2587', color: '#808080' },
]

export const START_MENU_ITEM_H = 36
export const START_MENU_W = 240
export const START_MENU_PAD = 4

function drawStartMenu(ctx: CanvasRenderingContext2D, taskbarY: number) {
  const itemH = START_MENU_ITEM_H
  const menuH = START_MENU_ITEMS.length * itemH + START_MENU_PAD * 2 + 24
  const menuY = taskbarY - menuH
  const menuX = 4

  // Menu body
  drawRaised(ctx, menuX, menuY, START_MENU_W, menuH, T.surface)

  // Header
  ctx.fillStyle = T.titleGradientStart
  ctx.fillRect(menuX + 2, menuY + 2, START_MENU_W - 4, 20)
  ctx.fillStyle = T.textAccent
  ctx.font = 'bold 18px "Courier New", monospace'
  ctx.textAlign = 'left'
  ctx.fillText('miserabletaco.dev', menuX + 10, menuY + 18)

  // Separator
  ctx.fillStyle = T.shadowInner
  ctx.fillRect(menuX + 4, menuY + 26, START_MENU_W - 8, 1)

  // Items
  for (let i = 0; i < START_MENU_ITEMS.length; i++) {
    const item = START_MENU_ITEMS[i]
    const iy = menuY + 28 + i * itemH

    ctx.fillStyle = item.color
    ctx.font = '20px "Courier New", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(item.icon, menuX + 12, iy + 24)

    ctx.fillStyle = T.text
    ctx.font = '22px "Courier New", monospace'
    ctx.fillText(item.label, menuX + 40, iy + 24)
  }
}

// ── Terminal content ─────────────────────────────────────────────────

function drawTerminalContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const { lines, currentInput } = useTerminalStore.getState()
  const lineH = 32
  const fontSize = 26
  const inputLineH = lineH + 8
  const maxVisible = Math.floor((h - inputLineH) / lineH)
  const startLine = Math.max(0, lines.length - maxVisible)
  const textMaxW = w - 8

  ctx.font = `${fontSize}px "Courier New", monospace`
  ctx.textAlign = 'left'

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i]
    const ly = y + (i - startLine) * lineH + fontSize
    if (ly > y + h - inputLineH) break
    ctx.fillStyle = line.type === 'error' ? '#ff4444' : '#00ff00'
    fillTextTruncated(ctx, line.text, x + 4, ly, textMaxW)
  }

  const inputY = y + h - 8
  ctx.fillStyle = '#00ff00'
  const prompt = `> ${currentInput}`
  fillTextTruncated(ctx, prompt, x + 4, inputY, textMaxW)

  if (Math.floor(performance.now() / 500) % 2 === 0) {
    const promptW = ctx.measureText(prompt).width
    const cursorX = x + 4 + Math.min(promptW, textMaxW) + 1
    if (cursorX < x + w) ctx.fillText('\u2588', cursorX, inputY)
  }
}

// ── Project header helper ────────────────────────────────────────────

function drawProjectHeader(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  color: string, name: string, tagline: string,
) {
  // Project name — large bold
  ctx.fillStyle = color
  ctx.font = 'bold 38px "Courier New", monospace'
  ctx.textAlign = 'left'
  fillTextTruncated(ctx, name, x + 16, y + 38, w - 140)

  // Tagline — smaller, dimmer
  ctx.fillStyle = color + '99'
  ctx.font = '22px "Courier New", monospace'
  fillTextTruncated(ctx, tagline, x + 16, y + 66, w - 32)

  // VISIT link — top right
  ctx.fillStyle = '#66ccff'
  ctx.font = '24px "Courier New", monospace'
  ctx.textAlign = 'right'
  ctx.fillText('VISIT >', x + w - 16, y + 38)
  const linkW = ctx.measureText('VISIT >').width
  ctx.fillRect(x + w - 16 - linkW, y + 42, linkW, 2)

  // Separator line
  ctx.fillStyle = color + '44'
  ctx.fillRect(x + 16, y + 78, w - 32, 1)

  ctx.textAlign = 'left'
  return 88 // header height consumed
}

// ── TRUST content ───────────────────────────────────────────────────

function drawTrustContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, _h: number) {
  const textMaxW = w - 40
  const color = '#00ffff'
  const headerH = drawProjectHeader(
    ctx, x, y, w, color,
    'TRUST', 'AcadCert \u2014 Cryptographic Credentials',
  )

  const cy = y + headerH + 8
  const pad = 20

  // Certificate visual
  const certX = x + pad
  const certY = cy + 4
  const certW = 180
  const certH = 160
  ctx.strokeStyle = color + '66'
  ctx.lineWidth = 2
  ctx.strokeRect(certX, certY, certW, certH)
  ctx.fillStyle = color + '0a'
  ctx.fillRect(certX, certY, certW, certH)

  // Certificate inner lines
  ctx.fillStyle = color + '44'
  ctx.fillRect(certX + 16, certY + 20, certW - 32, 2)
  ctx.fillRect(certX + 16, certY + 36, certW - 60, 2)
  ctx.fillRect(certX + 16, certY + 52, certW - 40, 2)

  // Shield icon in cert
  ctx.fillStyle = color
  ctx.font = 'bold 40px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('\u2713', certX + certW / 2, certY + 110)
  ctx.font = '18px "Courier New", monospace'
  ctx.fillText('VERIFIED', certX + certW / 2, certY + 140)

  // Tech specs — right side
  const specX = certX + certW + 30
  const specY = cy + 8
  const specs = [
    { label: 'SIGNING', value: 'RSA-4096' },
    { label: 'TIMESTAMP', value: 'RFC 3161' },
    { label: 'ENCRYPT', value: 'AES-256-GCM' },
    { label: 'FORMAT', value: 'X.509 / CMS' },
  ]

  const specMaxW = x + w - pad - specX
  for (let i = 0; i < specs.length; i++) {
    const sy = specY + i * 40
    ctx.fillStyle = color + '88'
    ctx.font = '16px "Courier New", monospace'
    ctx.textAlign = 'left'
    fillTextTruncated(ctx, specs[i].label, specX, sy, specMaxW)
    ctx.fillStyle = color
    ctx.font = 'bold 24px "Courier New", monospace'
    fillTextTruncated(ctx, specs[i].value, specX, sy + 24, specMaxW)
  }

  // Description — below
  const descY = cy + certH + 24
  ctx.fillStyle = color + 'cc'
  ctx.font = '22px "Courier New", monospace'
  ctx.textAlign = 'left'
  const descLines = [
    'Building credentials that outlive',
    'the institutions that issue them.',
  ]
  for (let i = 0; i < descLines.length; i++) {
    fillTextTruncated(ctx, descLines[i], x + pad, descY + i * 30, textMaxW)
  }

  // Stack
  const stackY = descY + descLines.length * 30 + 20
  ctx.fillStyle = color + '55'
  ctx.font = '18px "Courier New", monospace'
  fillTextTruncated(ctx, 'React \u00b7 Node \u00b7 PostgreSQL \u00b7 Redis', x + pad, stackY, textMaxW)
}

// ── CULTURE content ─────────────────────────────────────────────────

function drawCultureContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, _h: number) {
  const color = '#ff00ff'
  const textMaxW = w - 40
  const headerH = drawProjectHeader(
    ctx, x, y, w, color,
    'CULTURE', 'DefMarks \u2014 Cultural Publication',
  )

  const cy = y + headerH + 8
  const pad = 20

  // Quote
  ctx.fillStyle = color + 'cc'
  ctx.font = 'italic 24px Georgia, serif'
  ctx.textAlign = 'left'
  fillTextTruncated(ctx, '"Finding connections between', x + pad, cy + 8, textMaxW)
  fillTextTruncated(ctx, ' things people assume are', x + pad, cy + 38, textMaxW)
  fillTextTruncated(ctx, ' unrelated."', x + pad, cy + 68, textMaxW)

  // Domain tags — styled badges
  const tags = [
    'Literature', 'Film', 'Code', 'Design',
    'Philosophy', 'Art', 'Music', 'Tech',
  ]
  const tagY = cy + 100
  ctx.font = '20px "Courier New", monospace'
  let tx = x + pad
  let row = 0
  for (const tag of tags) {
    const tw = ctx.measureText(tag).width + 20
    if (tx + tw > x + w - pad) {
      tx = x + pad
      row++
    }
    const ty = tagY + row * 40

    // Tag background
    ctx.fillStyle = color + '18'
    ctx.fillRect(tx, ty, tw, 30)
    ctx.strokeStyle = color + '55'
    ctx.lineWidth = 1
    ctx.strokeRect(tx, ty, tw, 30)

    // Tag text
    ctx.fillStyle = color
    ctx.textAlign = 'left'
    ctx.fillText(tag, tx + 10, ty + 22)

    tx += tw + 10
  }

  // Description below tags
  const descY = tagY + (row + 1) * 40 + 20
  ctx.fillStyle = color + 'aa'
  ctx.font = '22px "Courier New", monospace'
  ctx.textAlign = 'left'
  fillTextTruncated(ctx, 'Articles \u00b7 Analysis \u00b7 Threads', x + pad, descY, textMaxW)

  // Subtle connection lines between random tag positions
  ctx.strokeStyle = color + '15'
  ctx.lineWidth = 1
  const tagCenters = [
    { cx: x + pad + 60, cy: tagY + 15 },
    { cx: x + pad + 200, cy: tagY + 15 },
    { cx: x + pad + 120, cy: tagY + 55 },
    { cx: x + pad + 300, cy: tagY + 55 },
  ]
  for (let i = 0; i < tagCenters.length - 1; i++) {
    ctx.beginPath()
    ctx.moveTo(tagCenters[i].cx, tagCenters[i].cy)
    ctx.lineTo(tagCenters[i + 1].cx, tagCenters[i + 1].cy)
    ctx.stroke()
  }

  // Stack
  const stackY = descY + 36
  ctx.fillStyle = color + '55'
  ctx.font = '18px "Courier New", monospace'
  fillTextTruncated(ctx, 'Next.js \u00b7 Sanity \u00b7 Vercel', x + pad, stackY, textMaxW)
}

// ── UNDERTOW content ────────────────────────────────────────────────

function drawUndertowContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, _h: number) {
  const color = '#ffaa00'
  const textMaxW = w - 40
  const headerH = drawProjectHeader(
    ctx, x, y, w, color,
    'UNDERTOW', 'ARES \u2014 Grand Strategy',
  )

  const cy = y + headerH + 4
  const pad = 20

  // Classified briefing banner
  ctx.fillStyle = color + '15'
  ctx.fillRect(x + pad, cy, w - pad * 2, 34)
  ctx.strokeStyle = color + '44'
  ctx.lineWidth = 1
  ctx.strokeRect(x + pad, cy, w - pad * 2, 34)
  ctx.fillStyle = color
  ctx.font = 'bold 22px "Courier New", monospace'
  ctx.textAlign = 'center'
  fillTextTruncated(ctx, '\u2593\u2593 OPERATIONAL BRIEFING \u2593\u2593', x + w / 2, cy + 24, w - pad * 2)

  // Intel fields — two column layout
  const fieldY = cy + 52
  const fields = [
    { label: 'SETTING', value: '2150 \u00b7 SE Asia' },
    { label: 'STATUS', value: 'Post-collapse' },
    { label: 'GENRE', value: 'Political grand strategy' },
    { label: 'PLATFORM', value: 'Web (Chrome)' },
  ]

  ctx.textAlign = 'left'
  for (let i = 0; i < fields.length; i++) {
    const fy = fieldY + i * 42
    ctx.fillStyle = color + '66'
    ctx.font = '16px "Courier New", monospace'
    fillTextTruncated(ctx, fields[i].label, x + pad, fy, textMaxW)
    ctx.fillStyle = color
    ctx.font = 'bold 24px "Courier New", monospace'
    fillTextTruncated(ctx, fields[i].value, x + pad, fy + 26, textMaxW)
  }

  // Separator
  const sepY = fieldY + fields.length * 42 + 8
  ctx.fillStyle = color + '33'
  ctx.fillRect(x + pad, sepY, w - pad * 2, 1)

  // Description
  const descY = sepY + 16
  ctx.fillStyle = color + 'cc'
  ctx.font = '22px "Courier New", monospace'
  ctx.textAlign = 'left'
  const descLines = [
    'Command fleets. Navigate',
    'council politics. Survive',
    '40 turns. Every decision costs.',
  ]
  for (let i = 0; i < descLines.length; i++) {
    fillTextTruncated(ctx, descLines[i], x + pad, descY + i * 30, textMaxW)
  }

  // URL bar at bottom
  const urlY = descY + descLines.length * 30 + 20
  ctx.fillStyle = color + '55'
  ctx.font = '18px "Courier New", monospace'
  fillTextTruncated(ctx, 'Godot \u00b7 GDScript \u00b7 Web Export', x + pad, urlY, textMaxW)
}

// ── Scrollable text content (ABOUT / CONTACT) ──────────────────────

function drawTextContent(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  app: string, lines: string[], color: string,
  links?: Record<number, string>,
) {
  const offset = usePortfolioStore.getState().scrollOffsets[app] ?? 0
  const lineH = 34
  const fontSize = 26
  const headerH = 52

  // Header
  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px "Courier New", monospace`
  ctx.textAlign = 'left'
  ctx.fillText(app.toUpperCase(), x + 12, y + 32)
  // Separator
  ctx.fillRect(x + 12, y + 38, w - 24, 1)

  // Text
  ctx.font = `${fontSize}px "Courier New", monospace`
  const visibleStart = Math.floor(offset / lineH)
  const maxVisible = Math.floor((h - headerH) / lineH)

  const textMaxW = w - 24

  for (let i = visibleStart; i < lines.length && i < visibleStart + maxVisible + 1; i++) {
    const ly = y + headerH + (i - visibleStart) * lineH - (offset % lineH) + fontSize
    if (ly < y + headerH || ly > y + h) continue

    const isLink = links != null && i in links
    ctx.fillStyle = isLink ? '#66ccff' : color
    fillTextTruncated(ctx, lines[i], x + 12, ly, textMaxW)

    if (isLink) {
      const tw = Math.min(ctx.measureText(lines[i]).width, textMaxW)
      ctx.fillRect(x + 12, ly + 3, tw, 2)
    }
  }

  // Scroll indicator if content overflows
  const totalH = lines.length * lineH
  if (totalH > h - headerH) {
    const barH = Math.max(20, ((h - headerH) / totalH) * (h - headerH))
    const barY = y + headerH + (offset / totalH) * (h - headerH - barH)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.fillRect(x + w - 8, barY, 6, barH)
  }
}

// ── My Computer content ─────────────────────────────────────────────

function drawMyComputerContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, _h: number) {
  const textMaxW = w - 32
  ctx.fillStyle = '#aaaaaa'
  ctx.font = 'bold 28px "Courier New", monospace'
  ctx.textAlign = 'left'
  fillTextTruncated(ctx, 'System Properties', x + 16, y + 32, textMaxW)

  ctx.fillStyle = '#555'
  ctx.fillRect(x + 16, y + 40, w - 32, 1)

  const mem = (performance as unknown as Record<string, unknown>).memory as { usedJSHeapSize?: number } | undefined
  const ramUsed = mem?.usedJSHeapSize ? Math.round(mem.usedJSHeapSize / 1048576) : 0

  const lines = [
    ['OS', 'miserabletaco.dev v1.0'],
    ['CPU', 'Three.js r183'],
    ['RAM', `${ramUsed} MB used`],
    ['GPU', 'WebGL 2.0'],
    ['Display', '1024 x 768'],
    ['Uptime', formatUptime()],
    ['User', 'GUEST'],
  ]

  const valMaxW = w - 180
  ctx.font = '22px "Courier New", monospace'
  for (let i = 0; i < lines.length; i++) {
    const ly = y + 72 + i * 36
    ctx.fillStyle = '#888'
    ctx.fillText(lines[i][0], x + 20, ly)
    ctx.fillStyle = '#00ff00'
    fillTextTruncated(ctx, lines[i][1], x + 160, ly, valMaxW)
  }

  // Drive bars
  const driveY = y + 72 + lines.length * 36 + 20
  ctx.fillStyle = '#aaaaaa'
  ctx.font = 'bold 22px "Courier New", monospace'
  ctx.fillText('Drives', x + 16, driveY)

  const drives = [
    { label: 'C:', used: 0.72, total: '2.4 MB' },
    { label: 'D:', used: 0.15, total: '512 KB' },
  ]
  for (let i = 0; i < drives.length; i++) {
    const dy = driveY + 30 + i * 38
    ctx.fillStyle = '#888'
    ctx.font = '20px "Courier New", monospace'
    ctx.fillText(drives[i].label, x + 20, dy)
    ctx.fillStyle = '#1a1a1a'
    const barW = Math.min(220, w - 260)
    ctx.fillRect(x + 70, dy - 14, barW, 18)
    ctx.fillStyle = drives[i].used > 0.8 ? '#cc4444' : '#3388cc'
    ctx.fillRect(x + 70, dy - 14, barW * drives[i].used, 18)
    ctx.fillStyle = '#888'
    fillTextTruncated(ctx, drives[i].total, x + 70 + barW + 12, dy, w - 70 - barW - 24)
  }
}

function formatUptime(): string {
  const ms = performance.now()
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m ${s % 60}s`
}

// ── Notepad content ─────────────────────────────────────────────────

function drawNotepadContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, _h: number) {
  const textMaxW = w - 60 // leave room for line numbers
  // Menu bar
  ctx.fillStyle = '#111'
  ctx.fillRect(x, y, w, 30)
  ctx.fillStyle = '#888'
  ctx.font = '20px "Courier New", monospace'
  ctx.textAlign = 'left'
  fillTextTruncated(ctx, 'File  Edit  Format  Help', x + 12, y + 22, w - 24)

  ctx.fillStyle = '#555'
  ctx.fillRect(x, y + 30, w, 1)

  // Editor area
  ctx.fillStyle = '#0d0d0d'
  ctx.fillRect(x + 2, y + 32, w - 4, _h - 34)

  const noteLines = [
    '// TODO:',
    '//',
    '// - fix the thing that breaks',
    '//   when you look at it wrong',
    '// - stop moving stuff around',
    '// - ship it already',
    '//',
    '// --- old notes ---',
    '//',
    '// "the zoom is garbage"',
    '// "the text is too small"',
    '//',
    '// (it\'s always something)',
    '',
    'console.log("hello world")',
  ]

  const codeFontSize = 22
  const codeLineH = 30
  ctx.font = `${codeFontSize}px "Courier New", monospace`
  for (let i = 0; i < noteLines.length; i++) {
    const ly = y + 58 + i * codeLineH
    if (ly > y + _h) break
    if (noteLines[i].startsWith('//')) {
      ctx.fillStyle = '#448844'
    } else if (noteLines[i].startsWith('console')) {
      ctx.fillStyle = '#cccc88'
    } else {
      ctx.fillStyle = '#888'
    }
    fillTextTruncated(ctx, noteLines[i], x + 12, ly, textMaxW)
  }

  // Line numbers
  ctx.fillStyle = '#333'
  ctx.font = '18px "Courier New", monospace'
  for (let i = 0; i < noteLines.length; i++) {
    const ly = y + 58 + i * codeLineH
    if (ly > y + _h) break
    ctx.fillText(`${i + 1}`, x + w - 36, ly)
  }
}

// ── Backup content ──────────────────────────────────────────────────

function drawBackupContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, _h: number) {
  const textMaxW = w - 32
  ctx.fillStyle = '#aaaaaa'
  ctx.font = 'bold 28px "Courier New", monospace'
  ctx.textAlign = 'left'
  fillTextTruncated(ctx, 'Archive Contents', x + 16, y + 32, textMaxW)

  ctx.fillStyle = '#555'
  ctx.fillRect(x + 16, y + 40, w - 32, 1)

  const files = [
    { name: 'resume_FINAL.pdf', size: '284K', date: '2025-08' },
    { name: 'portfolio_ideas.txt', size: '12K', date: '2025-06' },
    { name: 'screenshot.png', size: '1.2M', date: '2025-09' },
    { name: 'old_project/', size: '---', date: '2024-11' },
    { name: 'notes.md', size: '4K', date: '2025-03' },
    { name: '.env.backup', size: '1K', date: '2025-01' },
    { name: 'TODO.txt', size: '8K', date: '2026-01' },
    { name: 'game_jam/', size: '---', date: '2024-05' },
  ]

  // Column headers
  ctx.fillStyle = '#666'
  ctx.font = '20px "Courier New", monospace'
  ctx.fillText('Name', x + 20, y + 66)
  ctx.fillText('Size', x + w - 220, y + 66)
  ctx.fillText('Date', x + w - 120, y + 66)

  ctx.fillStyle = '#333'
  ctx.fillRect(x + 16, y + 74, w - 32, 1)

  const fileFont = 20
  const fileLineH = 32
  ctx.font = `${fileFont}px "Courier New", monospace`
  const nameMaxW = w - 270

  for (let i = 0; i < files.length; i++) {
    const fy = y + 100 + i * fileLineH
    if (fy > y + _h - 36) break
    const f = files[i]
    const isDir = f.name.endsWith('/')

    ctx.fillStyle = isDir ? '#8888cc' : '#aaaaaa'
    let name = isDir ? `[${f.name}]` : f.name
    while (ctx.measureText(name).width > nameMaxW && name.length > 1) {
      name = name.slice(0, -1)
    }
    if (name.length < (isDir ? f.name.length + 2 : f.name.length)) name = name.slice(0, -1) + '\u2026'
    ctx.fillText(name, x + 20, fy)

    ctx.fillStyle = '#666'
    ctx.fillText(f.size, x + w - 220, fy)
    ctx.fillText(f.date, x + w - 120, fy)
  }

  // Footer
  const footerY = y + 100 + Math.min(files.length, Math.floor((_h - 136) / fileLineH)) * fileLineH + 12
  ctx.fillStyle = '#555'
  ctx.fillRect(x + 16, footerY, w - 32, 1)
  ctx.fillStyle = '#666'
  ctx.font = '18px "Courier New", monospace'
  fillTextTruncated(ctx, `${files.length} items | 1.5 MB`, x + 20, footerY + 24, textMaxW)
}

// ── CRT scanlines ───────────────────────────────────────────────────

function drawScanlines(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
  for (let y = 0; y < DESKTOP_HEIGHT; y += 3) {
    ctx.fillRect(0, y, DESKTOP_WIDTH, 1)
  }
}
