import { useTerminalStore } from '@/store/terminalStore'
import {
  usePortfolioStore,
  ABOUT_LINES, CONTACT_LINES,
  ABOUT_LINKS, CONTACT_LINKS,
} from '@/store/portfolioStore'
import { fillTextTruncated } from '@/components/desktop/theme'

// ── Dispatcher ───────────────────────────────────────────────────────

export function drawContentForApp(
  ctx: CanvasRenderingContext2D,
  app: string,
  cx: number,
  cy: number,
  cw: number,
  ch: number,
) {
  switch (app) {
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

function getHeapMB(): number {
  const perf = performance as { memory?: { usedJSHeapSize?: number } }
  const heap = perf.memory?.usedJSHeapSize
  return typeof heap === 'number' ? Math.round(heap / 1048576) : 0
}

function drawMyComputerContent(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, _h: number) {
  const textMaxW = w - 32
  ctx.fillStyle = '#aaaaaa'
  ctx.font = 'bold 28px "Courier New", monospace'
  ctx.textAlign = 'left'
  fillTextTruncated(ctx, 'System Properties', x + 16, y + 32, textMaxW)

  ctx.fillStyle = '#555'
  ctx.fillRect(x + 16, y + 40, w - 32, 1)

  const ramUsed = getHeapMB()

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
