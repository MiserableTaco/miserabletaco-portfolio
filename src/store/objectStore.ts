import { create } from 'zustand'

interface ObjectStoreState {
  objects: Record<string, { interacted: boolean; custom: Record<string, unknown> }>
  interact: (id: string, custom?: Record<string, unknown>) => void
  getCustom: (id: string) => Record<string, unknown>
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
}))
