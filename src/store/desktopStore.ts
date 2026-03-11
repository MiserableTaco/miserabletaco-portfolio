import { create } from 'zustand'
import { DESKTOP_WIDTH, DESKTOP_HEIGHT, DESKTOP } from '@/utils/constants'

export interface DesktopIcon {
  id: string
  name: string
  app: string
  x: number
  y: number
  iconColor: string
}

export interface DesktopWindow {
  id: string
  title: string
  app: string
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  maximized: boolean
  zIndex: number
}

interface DesktopState {
  icons: DesktopIcon[]
  windows: DesktopWindow[]
  nextZIndex: number
  selectedIconId: string | null
  startMenuOpen: boolean

  selectIcon: (id: string | null) => void
  setVisitCount: (count: number) => void
  openWindow: (app: string, title: string) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  focusWindow: (id: string) => void
  moveWindow: (id: string, x: number, y: number) => void
  toggleMinimizeFromTaskbar: (id: string) => void
  toggleStartMenu: () => void
  closeStartMenu: () => void
}

const createIcons = (): DesktopIcon[] => [
  // Column 1 — Portfolio apps
  { id: 'trust', name: 'TRUST', app: 'trust', x: 16, y: 14, iconColor: '#00ffff' },
  { id: 'culture', name: 'CULTURE', app: 'culture', x: 16, y: 134, iconColor: '#ff00ff' },
  { id: 'undertow', name: 'UNDERTOW', app: 'undertow', x: 16, y: 254, iconColor: '#ffaa00' },
  // Column 2 — Info/System
  { id: 'about', name: 'About', app: 'about', x: 164, y: 14, iconColor: '#00ff00' },
  { id: 'contact', name: 'Contact', app: 'contact', x: 164, y: 134, iconColor: '#00ff00' },
  { id: 'terminal', name: 'Terminal', app: 'terminal', x: 164, y: 254, iconColor: '#00ff00' },
  // Column 3 — Easter eggs
  { id: 'mycomputer', name: 'My PC', app: 'mycomputer', x: 312, y: 14, iconColor: '#808080' },
  { id: 'notepad', name: 'Notepad', app: 'notepad', x: 312, y: 134, iconColor: '#ffffff' },
  { id: 'backup', name: 'Backup', app: 'backup', x: 312, y: 254, iconColor: '#808080' },
]

export const useDesktopStore = create<DesktopState>((set, get) => ({
  icons: createIcons(),
  windows: [],
  nextZIndex: 100,
  selectedIconId: null,
  startMenuOpen: false,

  selectIcon: (id) => set({ selectedIconId: id }),

  setVisitCount: (count) =>
    set((state) => ({
      icons: state.icons.map((icon) =>
        icon.id === 'backup' ? { ...icon, name: `backup_v${count}.zip` } : icon,
      ),
    })),

  openWindow: (app, title) => {
    const { windows, nextZIndex } = get()

    // Don't open duplicate windows — focus existing instead
    const existing = windows.find((w) => w.app === app)
    if (existing) {
      get().focusWindow(existing.id)
      if (existing.minimized) {
        get().toggleMinimizeFromTaskbar(existing.id)
      }
      return
    }

    const newWindow: DesktopWindow = {
      id: `window-${Date.now()}`,
      title,
      app,
      x: Math.floor((DESKTOP_WIDTH - DESKTOP.windowWidth) / 2),
      y: Math.floor((DESKTOP_HEIGHT - DESKTOP.taskbarHeight - DESKTOP.windowHeight) / 2),
      width: DESKTOP.windowWidth,
      height: DESKTOP.windowHeight,
      minimized: false,
      maximized: false,
      zIndex: nextZIndex,
    }

    set({
      windows: [...windows, newWindow],
      nextZIndex: nextZIndex + 1,
    })
  },

  closeWindow: (id) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
    })),

  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    })),

  maximizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              maximized: !w.maximized,
              x: w.maximized ? Math.floor((DESKTOP_WIDTH - DESKTOP.windowWidth) / 2) : 0,
              y: w.maximized ? Math.floor((DESKTOP_HEIGHT - DESKTOP.taskbarHeight - DESKTOP.windowHeight) / 2) : 0,
              width: w.maximized ? DESKTOP.windowWidth : DESKTOP_WIDTH,
              height: w.maximized ? DESKTOP.windowHeight : DESKTOP_HEIGHT - DESKTOP.taskbarHeight,
            }
          : w,
      ),
    })),

  focusWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, zIndex: state.nextZIndex } : w)),
      nextZIndex: state.nextZIndex + 1,
    })),

  moveWindow: (id, x, y) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              x: Math.max(0, Math.min(x, DESKTOP_WIDTH - w.width)),
              y: Math.max(0, Math.min(y, DESKTOP_HEIGHT - w.height - DESKTOP.taskbarHeight)),
            }
          : w,
      ),
    })),

  toggleStartMenu: () => set((state) => ({ startMenuOpen: !state.startMenuOpen })),
  closeStartMenu: () => set({ startMenuOpen: false }),

  toggleMinimizeFromTaskbar: (id) =>
    set((state) => {
      const win = state.windows.find((w) => w.id === id)
      if (!win) return state
      if (win.minimized) {
        // Un-minimize and focus
        return {
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, minimized: false, zIndex: state.nextZIndex } : w,
          ),
          nextZIndex: state.nextZIndex + 1,
        }
      }
      // Already visible — minimize it
      return {
        windows: state.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
      }
    }),
}))
