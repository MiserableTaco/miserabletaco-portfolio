import type { DesktopWindow } from '@/store/desktopStore'
import { useDesktopStore } from '@/store/desktopStore'
import { DESKTOP_WIDTH, DESKTOP_HEIGHT, DESKTOP } from '@/utils/constants'
import { T, BTN_H, BTN_W, BTN_GAP, fillTextTruncated, drawRaised, drawSunken } from '@/components/desktop/theme'

// ── Start menu data ──────────────────────────────────────────────────

export const START_MENU_ITEMS = [
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

// ── Window rendering ────────────────────────────────────────────────

export function drawWindow(
  ctx: CanvasRenderingContext2D,
  win: DesktopWindow,
  drawContent: (ctx: CanvasRenderingContext2D, app: string, cx: number, cy: number, cw: number, ch: number) => void,
) {
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

  drawContent(ctx, win.app, cx, cy, cw, ch)

  ctx.restore()
}

// ── Start menu (file-internal) ───────────────────────────────────────

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

// ── Taskbar rendering ───────────────────────────────────────────────

export function drawTaskbar(ctx: CanvasRenderingContext2D, windows: DesktopWindow[]) {
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
