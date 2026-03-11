import { create } from 'zustand'
import type * as THREE from 'three'

interface SceneStoreState {
  scene: THREE.Scene | null
  camera: THREE.PerspectiveCamera | null
  renderer: THREE.WebGLRenderer | null
  monitorScreen: THREE.Mesh | null
  canvas: HTMLCanvasElement | null
  desktopCanvas: HTMLCanvasElement | null
  canvasTexture: THREE.CanvasTexture | null
  setSceneRefs: (refs: {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    monitorScreen: THREE.Mesh
    canvas: HTMLCanvasElement
    desktopCanvas: HTMLCanvasElement
    canvasTexture: THREE.CanvasTexture
  }) => void
  clearSceneRefs: () => void
}

export const useSceneStore = create<SceneStoreState>((set) => ({
  scene: null,
  camera: null,
  renderer: null,
  monitorScreen: null,
  canvas: null,
  desktopCanvas: null,
  canvasTexture: null,
  setSceneRefs: (refs) => set(refs),
  clearSceneRefs: () =>
    set({
      scene: null,
      camera: null,
      renderer: null,
      monitorScreen: null,
      canvas: null,
      desktopCanvas: null,
      canvasTexture: null,
    }),
}))
