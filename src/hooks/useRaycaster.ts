import { useEffect } from 'react'
import * as THREE from 'three'
import { useSceneStore } from '@/store/sceneStore'
import { useDesktopStore } from '@/store/desktopStore'
import { useObjectStore } from '@/store/objectStore'
import {
  usePortfolioStore,
  ABOUT_LINKS, CONTACT_LINKS,
} from '@/store/portfolioStore'
import { playSound, initAudio } from '@/hooks/useAudio'
import { DESKTOP_WIDTH, DESKTOP_HEIGHT, DESKTOP } from '@/utils/constants'
import { START_MENU_ITEM_H, START_MENU_W, START_MENU_PAD } from '@/components/Desktop'

// Sound map for object clicks
const OBJECT_SOUNDS: Record<string, string> = {
  coffee_mug: 'mug',
  papers: 'paper',
  desk_lamp: 'lamp',
  pen_cup: 'pen',
  plant: 'leaf',
  stapler: 'stapler',
  phone: 'phone',
  drawer: 'drawer',
  keyboard: 'keyboard',
  water_bottle: 'mug',
  framed_photo: 'snap',
}

export function useRaycaster() {
  const canvas = useSceneStore((s) => s.canvas)
  const camera = useSceneStore((s) => s.camera)
  const monitorScreen = useSceneStore((s) => s.monitorScreen)
  const scene = useSceneStore((s) => s.scene)

  useEffect(() => {
    if (!canvas || !camera || !monitorScreen || !scene) return

    const cam = camera
    const screen = monitorScreen
    const sceneRef = scene

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const clickTimers: Record<string, number> = {}
    let draggingWindow: string | null = null
    const dragOffset = { x: 0, y: 0 }

    function setMouseFromEvent(event: MouseEvent) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      raycaster.setFromCamera(mouse, cam)
    }

    function toDesktopCoords(event: MouseEvent): { x: number; y: number } | null {
      setMouseFromEvent(event)
      const hits = raycaster.intersectObject(screen)
      if (hits.length === 0 || !hits[0].uv) return null
      return {
        x: Math.floor(hits[0].uv.x * DESKTOP_WIDTH),
        y: Math.floor((1 - hits[0].uv.y) * DESKTOP_HEIGHT),
      }
    }

    function isInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number) {
      return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
    }

    // ── Main mousedown handler (replaces click for proper dragging) ──

    function handleMouseDown(event: MouseEvent) {
      // Init audio on first interaction (browser requirement)
      initAudio()

      setMouseFromEvent(event)

      // Gather interactive 3D objects
      const interactiveObjs: THREE.Object3D[] = []
      for (const child of sceneRef.children) {
        if (child.userData.interactive) interactiveObjs.push(child)
      }

      // Raycast against monitor screen + all interactive objects
      const hits = raycaster.intersectObjects([screen, ...interactiveObjs], true)
      if (hits.length === 0) return

      const closest = hits[0]

      // Hit the monitor screen → desktop UI
      if (closest.object === screen) {
        const uv = closest.uv
        if (!uv) return
        const x = Math.floor(uv.x * DESKTOP_WIDTH)
        const y = Math.floor((1 - uv.y) * DESKTOP_HEIGHT)
        handleDesktopClick(x, y)
        return
      }

      // Hit a 3D object → find root interactive parent
      let obj: THREE.Object3D | null = closest.object
      while (obj && !obj.userData.interactive) obj = obj.parent
      if (obj?.userData.id) {
        handleObjectClick(obj)
      }
    }

    // ── Desktop click routing ──────────────────────────────────────

    // Start menu app list (must match Desktop.tsx START_MENU_ITEMS order)
    const startMenuApps = [
      { app: 'trust', label: 'TRUST' },
      { app: 'culture', label: 'CULTURE' },
      { app: 'undertow', label: 'UNDERTOW' },
      { app: 'about', label: 'About' },
      { app: 'contact', label: 'Contact' },
      { app: 'terminal', label: 'Terminal' },
      { app: 'mycomputer', label: 'My PC' },
      { app: 'notepad', label: 'Notepad' },
      { app: 'backup', label: 'Backup' },
    ]

    function handleDesktopClick(x: number, y: number) {
      const store = useDesktopStore.getState()
      const taskbarY = DESKTOP_HEIGHT - DESKTOP.taskbarHeight

      // Check start menu first (if open)
      if (store.startMenuOpen) {
        const menuH = startMenuApps.length * START_MENU_ITEM_H + START_MENU_PAD * 2 + 24
        const menuY = taskbarY - menuH
        const menuX = 4

        if (isInRect(x, y, menuX, menuY, START_MENU_W, menuH)) {
          // Click inside start menu — find which item
          const itemY = y - menuY - 26
          if (itemY >= 0) {
            const idx = Math.floor(itemY / START_MENU_ITEM_H)
            if (idx >= 0 && idx < startMenuApps.length) {
              const item = startMenuApps[idx]
              store.openWindow(item.app, item.label)
              playSound('window-open')
            }
          }
          store.closeStartMenu()
          return
        }
        // Click outside start menu — close it
        store.closeStartMenu()
      }

      // Taskbar
      if (y >= taskbarY) {
        // START button
        const startBtnW = 84
        if (isInRect(x, y, 4, taskbarY + 4, startBtnW, DESKTOP.taskbarHeight - 8)) {
          store.toggleStartMenu()
          return
        }

        // Window buttons (dynamically positioned, match Desktop.tsx)
        const trayX = DESKTOP_WIDTH - 84
        const btnAreaStart = 4 + startBtnW + 10
        const btnAreaW = trayX - btnAreaStart - 4
        const btnCount = store.windows.length
        const btnW = btnCount > 0 ? Math.min(140, Math.floor(btnAreaW / btnCount) - 4) : 0

        for (let i = 0; i < btnCount; i++) {
          const bx = btnAreaStart + i * (btnW + 4)
          if (isInRect(x, y, bx, taskbarY + 4, btnW, DESKTOP.taskbarHeight - 8)) {
            store.toggleMinimizeFromTaskbar(store.windows[i].id)
            return
          }
        }
        return
      }

      // Windows (top z-index first)
      const sorted = [...store.windows].sort((a, b) => b.zIndex - a.zIndex)
      for (const win of sorted) {
        if (win.minimized) continue
        if (!isInRect(x, y, win.x, win.y, win.width, win.height)) continue

        const inTitleBar = y >= win.y && y <= win.y + DESKTOP.titleBarHeight
        if (inTitleBar) {
          handleTitleBarClick(store, win.id, win, x, y)
        } else {
          store.focusWindow(win.id)
          const lx = x - win.x - 4
          const ly = y - win.y - DESKTOP.titleBarHeight - 4
          const cw = win.width - 8
          const ch = win.height - DESKTOP.titleBarHeight - 8
          handleContentClick(win.app, lx, ly, cw, ch)
        }
        return
      }

      // Icons
      for (const icon of store.icons) {
        if (isInRect(x, y, icon.x, icon.y, DESKTOP.iconSize, DESKTOP.iconSize + DESKTOP.iconLabelHeight)) {
          handleIconClick(store, icon)
          return
        }
      }

      store.selectIcon(null)
    }

    function handleIconClick(
      store: ReturnType<typeof useDesktopStore.getState>,
      icon: { id: string; app: string; name: string },
    ) {
      const now = Date.now()
      const last = clickTimers[icon.id] ?? 0

      if (now - last < DESKTOP.doubleClickMs) {
        delete clickTimers[icon.id]
        store.selectIcon(null)
        store.openWindow(icon.app, icon.name)
        playSound('window-open')
      } else {
        store.selectIcon(icon.id)
        playSound('icon')
        clickTimers[icon.id] = now
      }
    }

    function handleTitleBarClick(
      store: ReturnType<typeof useDesktopStore.getState>,
      winId: string,
      win: { x: number; y: number; width: number },
      x: number,
      y: number,
    ) {
      const btnH = DESKTOP.titleBarHeight - 8
      const btnW = btnH + 4
      const btnGap = 2
      const closeX = win.x + win.width - btnW - 6
      const maxX = closeX - btnW - btnGap
      const minX = maxX - btnW - btnGap

      if (x >= closeX && x <= closeX + btnW) {
        store.closeWindow(winId)
        playSound('window-close')
      } else if (x >= maxX && x <= maxX + btnW) {
        store.maximizeWindow(winId)
      } else if (x >= minX && x <= minX + btnW) {
        store.minimizeWindow(winId)
      } else {
        draggingWindow = winId
        dragOffset.x = x - win.x
        dragOffset.y = y - win.y
        store.focusWindow(winId)
      }
    }

    // ── Content click routing ──────────────────────────────────────

    function handleContentClick(app: string, lx: number, ly: number, cw: number, _ch: number) {
      // VISIT link in project windows (header: ~ly 36-48, reveal: ~ly 66-78)
      if (app === 'trust' || app === 'culture' || app === 'undertow') {
        const inHeaderVisit = lx >= cw - 160 && ly >= 14 && ly <= 54
        const inRevealVisit = lx >= cw - 160 && ly >= 60 && ly <= 84
        if (inHeaderVisit || inRevealVisit) {
          const urls: Record<string, string> = {
            trust: 'https://acadcert.com',
            culture: 'https://defmarks.com',
            undertow: 'https://play.aresundertow.com',
          }
          window.open(urls[app]!, '_blank', 'noopener,noreferrer')
          return
        }
      }

      const pStore = usePortfolioStore.getState()

      // Clickable links in about/contact
      if (app === 'about' || app === 'contact') {
        const links = app === 'about' ? ABOUT_LINKS : CONTACT_LINKS
        const lineH = 34
        const headerH = 54 // 52 draw space + 2px content offset
        const offset = pStore.scrollOffsets[app] ?? 0
        const clickedLine = Math.floor((ly - headerH + offset) / lineH)
        const url = links[clickedLine]
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer')
        }
      }
    }

    // ── 3D Object click handler ────────────────────────────────────

    function handleObjectClick(obj: THREE.Object3D) {
      const id = obj.userData.id as string
      const oStore = useObjectStore.getState()

      // Play sound
      const sound = OBJECT_SOUNDS[id]
      if (sound) playSound(sound)

      // Visual feedback per object
      switch (id) {
        case 'coffee_mug': {
          const coffee = obj.userData.coffee as THREE.Mesh | undefined
          if (coffee && coffee.scale.y > 0.2) {
            coffee.scale.y *= 0.7
            coffee.position.y *= 0.85
          }
          break
        }
        case 'papers':
          // Scatter individual sheets randomly
          obj.children.forEach((child) => {
            child.position.x += (Math.random() - 0.5) * 0.03
            child.position.z += (Math.random() - 0.5) * 0.03
            child.rotation.y += (Math.random() - 0.5) * 0.2
          })
          break
        case 'desk_lamp': {
          const light = obj.userData.light as THREE.PointLight
          const isOn = light.intensity > 0
          light.intensity = isOn ? 0 : 0.6
          oStore.interact(id, { on: !isOn })
          return // skip default interact call
        }
        case 'pen_cup':
          // Fan pens outward, toggle back when spread too far
          obj.children.forEach((child, i) => {
            if (i > 0) {
              if (Math.abs(child.rotation.z) > 0.6) {
                // Reset back to upright
                child.rotation.z = (i - 1) * 0.08
              } else {
                child.rotation.z += (i % 2 === 0 ? 1 : -1) * 0.15
              }
            }
          })
          break
        case 'plant':
          for (let i = 0; i < 4; i++) {
            const leaf = obj.userData[`leaf${i}`] as THREE.Mesh | undefined
            if (leaf) {
              ;(leaf.material as THREE.MeshStandardMaterial).color.setHex(0x5a4a3a)
              leaf.rotation.z += 0.4
            }
          }
          break
        case 'stapler': {
          const top = obj.userData.top as THREE.Mesh | undefined
          if (top) {
            top.position.y = 0.004
            setTimeout(() => { top.position.y = 0.012 }, 100)
          }
          break
        }
        case 'phone': {
          // Lift handset, auto-lower after dial tone
          const handset = obj.userData.handset as THREE.Mesh | undefined
          if (handset && handset.position.y < 0.03) {
            handset.position.y = 0.050
            handset.rotation.z = 0.15
            setTimeout(() => {
              handset.position.y = 0.020
              handset.rotation.z = 0
            }, 900)
          }
          break
        }
        case 'drawer': {
          const custom = oStore.getCustom(id)
          const isOpen = custom.open === true
          obj.position.z = isOpen ? 0.55 : 0.72
          oStore.interact(id, { open: !isOpen })
          return
        }
        case 'keyboard':
          // Trigger key glow via objectStore timestamp
          oStore.interact(id, { keyTime: Date.now() })
          return
        case 'water_bottle': {
          // Tip and spill — bottle tilts, water level drops
          const water = obj.userData.water as THREE.Mesh | undefined
          if (water && water.scale.y > 0.15) {
            water.scale.y *= 0.55
            water.position.y -= 0.008
          }
          // Tip the bottle over and back
          obj.rotation.z = 0.5
          setTimeout(() => { obj.rotation.z = 0.25 }, 200)
          setTimeout(() => { obj.rotation.z = 0 }, 500)
          break
        }
        case 'framed_photo':
          // Flip to show back (toggle between 0 and PI)
          obj.rotation.y = obj.rotation.y < Math.PI / 2 ? Math.PI : 0
          break
      }

      oStore.interact(id)
    }

    // ── Mouse move / up (dragging) ─────────────────────────────────

    function handleMouseMove(event: MouseEvent) {
      if (!draggingWindow) return
      const coords = toDesktopCoords(event)
      if (!coords) return
      useDesktopStore.getState().moveWindow(draggingWindow, coords.x - dragOffset.x, coords.y - dragOffset.y)
    }

    function handleMouseUp() {
      draggingWindow = null
    }

    // ── Scroll (wheel) ─────────────────────────────────────────────

    function handleWheel(event: WheelEvent) {
      // Check if scrolling inside a desktop window first
      const coords = toDesktopCoords(event)
      if (coords) {
        const store = useDesktopStore.getState()
        const sorted = [...store.windows].sort((a, b) => b.zIndex - a.zIndex)

        for (const win of sorted) {
          if (win.minimized) continue
          if (!isInRect(coords.x, coords.y, win.x, win.y, win.width, win.height)) continue

          if (win.app === 'about' || win.app === 'contact') {
            event.preventDefault()
            const lineH = 34
            const lines = win.app === 'about' ? 30 : 13
            const contentH = win.height - DESKTOP.titleBarHeight - 8 - 52
            const maxScroll = Math.max(0, lines * lineH - contentH)
            usePortfolioStore.getState().scroll(win.app, event.deltaY * 0.5, maxScroll)
          }
          return // hit a window — don't zoom
        }
      }

      // Not inside a window — do nothing (no zoom)
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [canvas, camera, monitorScreen, scene])
}
