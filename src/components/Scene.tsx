import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CAMERA, COLORS, FOG, LIGHTING, MAX_PIXEL_RATIO, MONITOR } from '@/utils/constants'
import { useSceneStore } from '@/store/sceneStore'

// Check once at module level — won't change during session
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // --- Scene ---
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(COLORS.fog, FOG.near, FOG.far)

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(
      CAMERA.fov,
      window.innerWidth / window.innerHeight,
      CAMERA.near,
      CAMERA.far,
    )
    camera.position.set(CAMERA.position.x, CAMERA.position.y, CAMERA.position.z)
    camera.lookAt(CAMERA.lookAt.x, CAMERA.lookAt.y, CAMERA.lookAt.z)

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
    renderer.setClearColor(COLORS.fog)

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(COLORS.ambient, LIGHTING.ambient)
    scene.add(ambientLight)

    const monitorGlow = new THREE.PointLight(
      COLORS.monitor_glow,
      LIGHTING.monitor_glow,
      LIGHTING.monitor_glow_range,
    )
    monitorGlow.position.set(0, 1.0, 0.5)
    scene.add(monitorGlow)

    const ceilingLight = new THREE.DirectionalLight(COLORS.ceiling, LIGHTING.ceiling)
    ceilingLight.position.set(0, 5, 2)
    scene.add(ceilingLight)

    // --- Monitor ---
    const { group: monitor, ledMaterial, screenMesh } = createMonitor()
    scene.add(monitor)

    // --- Store refs for Phase 2 access ---
    useSceneStore.getState().setSceneRefs({
      scene,
      camera,
      renderer,
      monitorScreen: screenMesh,
      canvas,
    })

    // --- Animation loop ---
    const startTime = performance.now()
    let animationId: number

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const elapsed = (performance.now() - startTime) / 1000

      // Camera drift (subtle breathing motion) — disabled for reduced motion
      if (!prefersReducedMotion) {
        const driftX = Math.sin(elapsed * CAMERA.driftSpeed) * CAMERA.driftAmount
        const driftY =
          Math.sin(elapsed * CAMERA.driftSpeed * 0.7) * (CAMERA.driftAmount * 0.4)
        camera.position.x = CAMERA.position.x + driftX
        camera.position.y = CAMERA.position.y + driftY
        camera.lookAt(CAMERA.lookAt.x, CAMERA.lookAt.y, CAMERA.lookAt.z)
      }

      // LED pulse (0.5 → 1.0 intensity cycle)
      ledMaterial.emissiveIntensity = 0.5 + Math.sin(elapsed * 2) * 0.5

      renderer.render(scene, camera)
    }

    animate()

    // --- Resize handler ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
    }

    window.addEventListener('resize', handleResize)

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      useSceneStore.getState().clearSceneRefs()

      // Dispose all Three.js resources to prevent memory leaks
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}

/** Build the low-poly CRT monitor model. Returns the group, LED material (for pulsing), and screen mesh (for Phase 2 texture). */
function createMonitor() {
  const group = new THREE.Group()
  group.position.set(MONITOR.position.x, MONITOR.position.y, MONITOR.position.z)
  group.rotation.x = MONITOR.tilt

  // Bezel (main body)
  const bezelGeometry = new THREE.BoxGeometry(
    MONITOR.bezel.width,
    MONITOR.bezel.height,
    MONITOR.bezel.depth,
  )
  const bezelMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.monitor_bezel,
    roughness: 0.7,
    metalness: 0.1,
  })
  const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial)
  group.add(bezel)

  // Screen (black for now — Phase 2 replaces with CanvasTexture)
  const screenGeometry = new THREE.PlaneGeometry(
    MONITOR.screen.width,
    MONITOR.screen.height,
  )
  const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
  const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial)
  screenMesh.position.z = MONITOR.bezel.depth / 2 + 0.001 // slightly in front of bezel
  group.add(screenMesh)

  // Power LED — using MeshStandardMaterial (supports emissive)
  const ledGeometry = new THREE.SphereGeometry(0.01, 8, 8)
  const ledMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.monitor_glow,
    emissive: COLORS.monitor_glow,
    emissiveIntensity: 1.0,
  })
  const led = new THREE.Mesh(ledGeometry, ledMaterial)
  const screenZ = MONITOR.bezel.depth / 2 + 0.001
  led.position.set(0.65, -0.52, screenZ)
  group.add(led)

  // Stand (simple box)
  const standGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.15)
  const standMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.monitor_bezel,
    roughness: 0.8,
    metalness: 0.05,
  })
  const stand = new THREE.Mesh(standGeometry, standMaterial)
  stand.position.set(0, -0.675, 0)
  group.add(stand)

  // Stand base
  const baseGeometry = new THREE.BoxGeometry(0.45, 0.03, 0.25)
  const base = new THREE.Mesh(baseGeometry, standMaterial)
  base.position.set(0, -0.79, 0.02)
  group.add(base)

  return { group, ledMaterial, screenMesh }
}
