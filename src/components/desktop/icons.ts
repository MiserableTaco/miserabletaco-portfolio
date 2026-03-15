import type { DesktopIcon } from '@/store/desktopStore'
import { DESKTOP } from '@/utils/constants'
import { T, drawRaised, drawSunken } from '@/components/desktop/theme'

// ── Icon rendering ──────────────────────────────────────────────────

export function drawIcon(ctx: CanvasRenderingContext2D, icon: DesktopIcon, selected: boolean) {
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
