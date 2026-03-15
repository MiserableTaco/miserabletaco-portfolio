import { useEffect } from 'react'
import { useSceneStore } from '@/store/sceneStore'
import { useDesktopStore } from '@/store/desktopStore'
import { useTerminalStore } from '@/store/terminalStore'
import { useObjectStore } from '@/store/objectStore'
import { usePortfolioStore } from '@/store/portfolioStore'
import { DESKTOP_WIDTH, DESKTOP_HEIGHT } from '@/utils/constants'
import { T, drawScanlines } from '@/components/desktop/theme'
import { drawIcon } from '@/components/desktop/icons'
import { drawWindow, drawTaskbar } from '@/components/desktop/window'
import { drawContentForApp } from '@/components/desktop/content'

// ── Dirty-flag rendering ─────────────────────────────────────────────
let desktopDirty = true
export function markDesktopDirty() { desktopDirty = true }

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
        if (!win.minimized) drawWindow(ctx, win, drawContentForApp)
      }

      drawTaskbar(ctx, windows)
      drawScanlines(ctx, DESKTOP_WIDTH, DESKTOP_HEIGHT)

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
