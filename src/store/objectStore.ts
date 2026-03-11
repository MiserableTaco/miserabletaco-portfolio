import { create } from 'zustand'
import { playDiscoMelody, stopDiscoMelody } from '@/hooks/useAudio'

interface ObjectStoreState {
  objects: Record<string, { interacted: boolean; custom: Record<string, unknown> }>
  interact: (id: string, custom?: Record<string, unknown>) => void
  getCustom: (id: string) => Record<string, unknown>
  zoomedNoteId: string | null
  setZoomedNote: (id: string | null) => void
  discoActive: boolean
  discoStartTime: number
  activateDisco: () => void
  deactivateDisco: () => void
  monitorOn: boolean
  monitorTransition: 'shutting-down' | 'booting' | null
  transitionStart: number
  setMonitorOn: (on: boolean) => void
  setMonitorTransition: (t: 'shutting-down' | 'booting' | null, start: number) => void
}

export const useObjectStore = create<ObjectStoreState>((set, get) => ({
  objects: {},

  interact: (id, custom) =>
    set((s) => ({
      objects: {
        ...s.objects,
        [id]: {
          interacted: true,
          custom: custom ?? s.objects[id]?.custom ?? {},
        },
      },
    })),

  getCustom: (id) => get().objects[id]?.custom ?? {},

  zoomedNoteId: null,
  setZoomedNote: (id) => set({ zoomedNoteId: id }),

  discoActive: false,
  discoStartTime: 0,
  activateDisco: () => set((s) => {
    if (s.discoActive) return s
    playDiscoMelody()
    return { discoActive: true, discoStartTime: performance.now() }
  }),
  deactivateDisco: () => {
    stopDiscoMelody()
    set({ discoActive: false, discoStartTime: 0 })
  },

  monitorOn: true,
  monitorTransition: null,
  transitionStart: 0,
  setMonitorOn: (on) => set({ monitorOn: on }),
  setMonitorTransition: (t, start) => set({ monitorTransition: t, transitionStart: start }),
}))
