import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CAMERA, COLORS, DESKTOP_WIDTH, DESKTOP_HEIGHT, FOG, LIGHTING, MAX_PIXEL_RATIO, MONITOR } from '@/utils/constants'
import { useSceneStore } from '@/store/sceneStore'
import { useObjectStore } from '@/store/objectStore'

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
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap

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
    ceilingLight.position.set(0.5, 3.5, 1.5)
    ceilingLight.target.position.set(0, 0.3, 0.15)
    ceilingLight.castShadow = true
    ceilingLight.shadow.mapSize.width = 2048
    ceilingLight.shadow.mapSize.height = 2048
    ceilingLight.shadow.camera.left = -1.8
    ceilingLight.shadow.camera.right = 1.8
    ceilingLight.shadow.camera.top = 2.0
    ceilingLight.shadow.camera.bottom = -0.5
    ceilingLight.shadow.camera.near = 0.5
    ceilingLight.shadow.camera.far = 6
    ceilingLight.shadow.bias = -0.001
    scene.add(ceilingLight)
    scene.add(ceilingLight.target)

    // --- Monitor ---
    const { group: monitor, ledMaterial, screenMesh } = createMonitor()
    enableShadows(monitor, true, false)
    scene.add(monitor)

    // --- Environment & Objects ---
    const room = createRoom()
    for (const obj of room) {
      enableShadows(obj, true, true) // room surfaces cast + receive shadows
      scene.add(obj)
    }

    const { group: shelf } = createShelf()
    enableShadows(shelf, true, true)
    scene.add(shelf)

    const { group: clockGroup, hourHand, minuteHand, secondHand } = createClock()
    scene.add(clockGroup)

    // Interactive objects
    const interactiveObjects = [
      createCoffeeMug(), createPapers(), createDeskLamp(),
      createPenCup(), createPlant(), createStapler(),
      createPhone(), createDrawer(), createKeyboard(),
      createWaterBottle(), createFramedPhoto(),
    ]
    for (const obj of interactiveObjects) {
      enableShadows(obj, true, true)
      scene.add(obj)
    }

    // Desk lamp light (needs to be in scene root for proper lighting)
    const lampObj = interactiveObjects.find(o => o.userData.id === 'desk_lamp')
    if (lampObj?.userData.light) scene.add(lampObj.userData.light)

    // Decorative objects
    const decorative = [
      createNamePlacard(), createComputerMouse(), createMousePad(),
      createStickyNote(), createCalendar(),
      createCorkBoard(), createTapeDispenser(),
    ]
    for (const obj of decorative) {
      enableShadows(obj, true, true)
      scene.add(obj)
    }

    // --- Desktop texture (offscreen canvas → CanvasTexture → monitor screen) ---
    const desktopCanvas = document.createElement('canvas')
    desktopCanvas.width = DESKTOP_WIDTH
    desktopCanvas.height = DESKTOP_HEIGHT

    const canvasTexture = new THREE.CanvasTexture(desktopCanvas)
    canvasTexture.minFilter = THREE.LinearFilter
    canvasTexture.magFilter = THREE.NearestFilter

    screenMesh.material = new THREE.MeshBasicMaterial({ map: canvasTexture })

    // --- Store refs for other components ---
    useSceneStore.getState().setSceneRefs({
      scene,
      camera,
      renderer,
      monitorScreen: screenMesh,
      canvas,
      desktopCanvas,
      canvasTexture,
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
        const driftY = Math.sin(elapsed * CAMERA.driftSpeed * 0.7) * (CAMERA.driftAmount * 0.4)
        camera.position.x = CAMERA.position.x + driftX
        camera.position.y = CAMERA.position.y + driftY
      }

      camera.lookAt(CAMERA.lookAt.x, CAMERA.lookAt.y, CAMERA.lookAt.z)

      // LED pulse (0.5 → 1.0 intensity cycle)
      ledMaterial.emissiveIntensity = 0.5 + Math.sin(elapsed * 2) * 0.5

      // Clock hands — real time
      const now = new Date()
      const h = now.getHours() % 12
      const m = now.getMinutes()
      const s = now.getSeconds() + now.getMilliseconds() / 1000
      hourHand.rotation.z = -(h * 30 + m * 0.5) * (Math.PI / 180)
      minuteHand.rotation.z = -(m * 6) * (Math.PI / 180)
      secondHand.rotation.z = -(s * 6) * (Math.PI / 180)

      // Coffee steam — particles rise and reset
      const mugObj = interactiveObjects.find(o => o.userData.id === 'coffee_mug')
      if (mugObj) {
        const steamArr = mugObj.userData.steam as THREE.Mesh[]
        const coffeeM = mugObj.userData.coffee as THREE.Mesh
        const hasCoffee = coffeeM && coffeeM.scale.y > 0.2
        for (const p of steamArr) {
          if (hasCoffee) {
            p.visible = true
            p.position.y += 0.0006
            p.position.x += Math.sin(elapsed * 4 + p.position.y * 80) * 0.0001
            const mat = p.material as THREE.MeshBasicMaterial
            mat.opacity = Math.max(0, 0.12 - (p.position.y - 0.055) * 0.6)
            if (p.position.y > 0.15) {
              p.position.set(
                (Math.random() - 0.5) * 0.02,
                0.050 + Math.random() * 0.01,
                (Math.random() - 0.5) * 0.02,
              )
            }
          } else {
            p.visible = false
          }
        }
      }

      // Keyboard key glow — light up random keys when recently typed
      const kbObj = interactiveObjects.find(o => o.userData.id === 'keyboard')
      if (kbObj) {
        const keyMeshes = kbObj.userData.keys as THREE.Mesh[]
        const keyTime = (useObjectStore.getState().objects.keyboard?.custom?.keyTime as number) ?? 0
        const dt = Date.now() - keyTime
        for (const km of keyMeshes) {
          const mat = km.material as THREE.MeshStandardMaterial
          if (dt < 150) {
            // Briefly brighten a few random keys
            if (Math.random() < 0.08) {
              mat.emissive.setHex(0x004400)
              mat.emissiveIntensity = 1.0
            }
          } else {
            // Fade back
            mat.emissive.lerp(new THREE.Color(0x000000), 0.15)
            mat.emissiveIntensity *= 0.85
          }
        }
      }

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
      canvasTexture.dispose()
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}

/** Recursively set castShadow / receiveShadow on all meshes in an object. */
function enableShadows(obj: THREE.Object3D, cast: boolean, receive: boolean) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = cast
      child.receiveShadow = receive
    }
  })
}

/** Build a chunky low-poly CRT monitor with multi-material faces for 3D readability. */
function createMonitor() {
  const group = new THREE.Group()
  group.position.set(MONITOR.position.x, MONITOR.position.y, MONITOR.position.z)
  group.rotation.x = MONITOR.tilt

  const W = MONITOR.bezel.width
  const H = MONITOR.bezel.height
  const D = MONITOR.bezel.depth

  // Multi-material: [+x right, -x left, +y top, -y bottom, +z front, -z back]
  const bezelMats = [
    new THREE.MeshStandardMaterial({ color: 0x3e3e3e, roughness: 0.7, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: 0x505050, roughness: 0.6, metalness: 0.1 }), // top — bright
    new THREE.MeshStandardMaterial({ color: 0x282828, roughness: 0.8, metalness: 0.1 }), // bottom — shadow
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.8, metalness: 0.1 }),
  ]

  // Main bezel
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), bezelMats)
  group.add(bezel)

  // CRT body — bulky rear housing, visible from elevated camera
  const crtDepth = 0.30
  const crtMats = [
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x363636, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.65 }), // top — visible!
    new THREE.MeshStandardMaterial({ color: 0x252525, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.8 }),
  ]
  const crtBody = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.92, H * 0.85, crtDepth),
    crtMats,
  )
  crtBody.position.z = -(D / 2 + crtDepth / 2)
  group.add(crtBody)

  // Rear taper
  const rearDepth = 0.08
  const rearBody = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.55, H * 0.50, rearDepth),
    crtMats,
  )
  rearBody.position.z = -(D / 2 + crtDepth + rearDepth / 2)
  group.add(rearBody)

  // Vents on CRT body top (visible from above)
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
  const crtTopY = H * 0.85 / 2
  for (let i = 0; i < 9; i++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.005, 0.01), ventMat)
    slot.position.set(-0.22 + i * 0.055, crtTopY, -(D / 2 + crtDepth * 0.4))
    group.add(slot)
  }

  // Screen — flush with bezel front face
  const frontZ = D / 2 + 0.001
  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MONITOR.screen.width, MONITOR.screen.height),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  )
  screenMesh.position.z = frontZ
  group.add(screenMesh)

  // Brand plate — small lighter strip below screen on front face
  const brandPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.02, 0.004),
    new THREE.MeshStandardMaterial({ color: 0x484848, roughness: 0.5, metalness: 0.2 }),
  )
  brandPlate.position.set(0, -(H / 2 - 0.04), frontZ + 0.002)
  group.add(brandPlate)

  // Adjustment knobs — row of small cylinders on bottom-right front face
  const knobMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4, metalness: 0.3 })
  for (let i = 0; i < 4; i++) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 8), knobMat)
    knob.rotation.x = Math.PI / 2
    knob.position.set(0.35 + i * 0.05, -(H / 2 - 0.04), frontZ + 0.003)
    group.add(knob)
  }

  // Power LED
  const ledMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.monitor_glow,
    emissive: COLORS.monitor_glow,
    emissiveIntensity: 1.0,
  })
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), ledMaterial)
  led.position.set(0.58, -(H / 2 - 0.04), frontZ + 0.004)
  group.add(led)

  // Power button
  const btn = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.02, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 }),
  )
  btn.position.set(0.62, -(H / 2 - 0.04), frontZ + 0.003)
  group.add(btn)

  // Stand neck — chunky
  const standMats = [
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x363636, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x484848, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0x252525, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.8 }),
  ]
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.12, 0.20), standMats)
  neck.position.set(0, -0.70, -0.02)
  group.add(neck)

  // Base — wide, sits on desk
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.025, 0.34), standMats)
  base.position.set(0, -0.80, 0.02)
  group.add(base)

  return { group, ledMaterial, screenMesh }
}

// ── Room ────────────────────────────────────────────────────────────

function createRoom(): THREE.Object3D[] {
  const mat = (color: number, rough = 0.9) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough })

  // Back wall — muted warm grey
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.5), mat(0x4a4a52))
  wall.position.set(0, 1.4, -0.38)

  // Floor — warm dark
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), mat(0x38383f, 0.95))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0

  // Desk surface — medium grey, visible
  const deskMat = mat(0x555560, 0.8)
  const surface = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.85), deskMat)
  surface.position.set(0, 0.285, 0.15)

  // Desk side panels
  const sideMat = mat(0x4a4a50, 0.85)
  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.81), sideMat)
  leftSide.position.set(-1.08, 0.14, 0.15)
  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.81), sideMat)
  rightSide.position.set(1.08, 0.14, 0.15)

  // Desk back panel
  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.28, 0.04), sideMat)
  backPanel.position.set(0, 0.14, -0.24)

  return [wall, floor, surface, leftSide, rightSide, backPanel]
}

// ── Shelf ───────────────────────────────────────────────────────────

function createShelf() {
  const group = new THREE.Group()
  group.position.set(0.4, 1.88, -0.36)

  const plankMat = new THREE.MeshStandardMaterial({ color: 0x5a5550, roughness: 0.8 })
  const plank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.18), plankMat)
  group.add(plank)

  // Brackets
  for (const x of [-0.5, 0.5]) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.08, 0.16),
      plankMat,
    )
    bracket.position.set(x, -0.04, 0)
    group.add(bracket)
  }

  // Books
  const bookColors = [0x8b4513, 0x2f4f4f, 0x6b1010, 0x3b2080, 0x1a5030]
  for (let i = 0; i < 5; i++) {
    const h = 0.12 + Math.random() * 0.06
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, h, 0.10),
      new THREE.MeshStandardMaterial({ color: bookColors[i], roughness: 0.9 }),
    )
    book.position.set(-0.35 + i * 0.07, h / 2 + 0.015, 0)
    group.add(book)
  }

  return { group }
}

// ── Clock ───────────────────────────────────────────────────────────

function createClock() {
  const group = new THREE.Group()
  group.position.set(-1.05, 1.88, -0.36)

  // Face
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.10, 24),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 }),
  )
  face.position.z = 0.001
  group.add(face)

  // Rim
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(0.095, 0.105, 24),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 }),
  )
  rim.position.z = 0.002
  group.add(rim)

  // Hour hand — geometry shifted so bottom is at origin, mesh at clock center
  const hourHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.055, 0.002),
    new THREE.MeshBasicMaterial({ color: 0x111111 }),
  )
  hourHand.position.set(0, 0, 0.003)
  hourHand.geometry.translate(0, 0.0275, 0)
  group.add(hourHand)

  // Minute hand
  const minuteHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.075, 0.002),
    new THREE.MeshBasicMaterial({ color: 0x111111 }),
  )
  minuteHand.position.set(0, 0, 0.004)
  minuteHand.geometry.translate(0, 0.0375, 0)
  group.add(minuteHand)

  // Second hand — thin, red
  const secondHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.004, 0.080, 0.002),
    new THREE.MeshBasicMaterial({ color: 0xcc2222 }),
  )
  secondHand.position.set(0, 0, 0.005)
  secondHand.geometry.translate(0, 0.040, 0)
  group.add(secondHand)

  // Center dot
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(0.006, 8),
    new THREE.MeshBasicMaterial({ color: 0x111111 }),
  )
  dot.position.z = 0.006
  group.add(dot)

  return { group, hourHand, minuteHand, secondHand }
}

// ── Interactive objects ─────────────────────────────────────────────

function createCoffeeMug(): THREE.Group {
  const mug = new THREE.Group()
  mug.position.set(-0.48, 0.35, 0.50)
  mug.userData = { interactive: true, id: 'coffee_mug' }

  const mugMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.6 })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.040, 0.09, 10), mugMat)
  mug.add(body)

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.030, 0.008, 6, 8, Math.PI),
    mugMat,
  )
  handle.rotation.y = Math.PI / 2
  handle.position.set(0.045, 0, 0)
  mug.add(handle)

  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.040, 0.040, 0.008, 10),
    new THREE.MeshBasicMaterial({ color: 0x3a1a08 }),
  )
  coffee.position.y = 0.040
  mug.add(coffee)
  mug.userData.coffee = coffee

  // Steam particles (float upward, loop)
  const steam: THREE.Mesh[] = []
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }),
    )
    p.position.set(
      (Math.random() - 0.5) * 0.02,
      0.055 + i * 0.022,
      (Math.random() - 0.5) * 0.02,
    )
    mug.add(p)
    steam.push(p)
  }
  mug.userData.steam = steam

  return mug
}

function createPapers(): THREE.Group {
  const papers = new THREE.Group()
  papers.position.set(0.55, 0.31, 0.38)
  papers.rotation.y = 0.25
  papers.userData = { interactive: true, id: 'papers' }

  for (let i = 0; i < 3; i++) {
    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.001, 0.17),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9 }),
    )
    paper.position.y = i * 0.002
    paper.rotation.y = (i - 1) * 0.04
    papers.add(paper)
  }

  return papers
}

function createDeskLamp(): THREE.Group {
  const lamp = new THREE.Group()
  lamp.position.set(0.75, 0.305, 0.18)
  lamp.userData = { interactive: true, id: 'desk_lamp' }

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.3 })

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.015, 10), metalMat)
  lamp.add(base)

  // Arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), metalMat)
  arm.position.y = 0.10
  lamp.add(arm)

  // Shade
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.05, 8, 1, true), metalMat)
  shade.position.y = 0.20
  shade.rotation.x = Math.PI
  lamp.add(shade)

  // Light (starts off)
  const light = new THREE.PointLight(0xffcc66, 0, 1.5)
  light.position.set(0.75, 0.305 + 0.18, 0.18)
  lamp.userData.light = light

  return lamp
}

function createPenCup(): THREE.Group {
  const cup = new THREE.Group()
  cup.position.set(0.65, 0.34, 0.32)
  cup.userData = { interactive: true, id: 'pen_cup' }

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.028, 0.070, 8),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 }),
  )
  cup.add(body)

  const penColors = [0x0040cc, 0xcc2020, 0x111111]
  for (let i = 0; i < 3; i++) {
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.085, 4),
      new THREE.MeshStandardMaterial({ color: penColors[i] }),
    )
    pen.position.set((i - 1) * 0.010, 0.042, 0)
    pen.rotation.z = (i - 1) * 0.08
    cup.add(pen)
  }

  return cup
}

function createPlant(): THREE.Group {
  const plant = new THREE.Group()
  plant.position.set(-0.75, 0.34, 0.18)
  plant.userData = { interactive: true, id: 'plant' }

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.035, 0.055, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.8 }),
  )
  plant.add(pot)

  // Soil
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.006, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.95 }),
  )
  soil.position.y = 0.028
  plant.add(soil)

  // Leaves
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.020, 0.070, 4),
      new THREE.MeshStandardMaterial({ color: 0x2d5a16, roughness: 0.7 }),
    )
    const angle = (i / 4) * Math.PI * 2
    leaf.position.set(Math.cos(angle) * 0.016, 0.06, Math.sin(angle) * 0.016)
    leaf.rotation.z = (Math.random() - 0.5) * 0.3
    plant.add(leaf)
    plant.userData[`leaf${i}`] = leaf
  }

  return plant
}

function createStapler(): THREE.Group {
  const stapler = new THREE.Group()
  stapler.position.set(-0.15, 0.31, 0.52)
  stapler.userData = { interactive: true, id: 'stapler' }

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.018, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 }),
  )
  stapler.add(body)

  // Top (hinged part)
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.008, 0.028),
    new THREE.MeshStandardMaterial({ color: 0xbb1a1a, roughness: 0.5 }),
  )
  top.position.y = 0.012
  stapler.add(top)
  stapler.userData.top = top

  return stapler
}

function createPhone(): THREE.Group {
  const phone = new THREE.Group()
  phone.position.set(-0.62, 0.33, 0.35)
  phone.userData = { interactive: true, id: 'phone' }

  const phoneMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 })

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.028, 0.12), phoneMat)
  phone.add(base)

  // Handset cradle
  const handset = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.014, 0.030), phoneMat)
  handset.position.set(0, 0.020, 0)
  phone.add(handset)
  phone.userData.handset = handset

  // Number pad dots
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const dot = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.003, 0.008),
        new THREE.MeshStandardMaterial({ color: 0x555555 }),
      )
      dot.position.set((c - 1) * 0.018, 0.016, 0.030 + r * 0.018)
      phone.add(dot)
    }
  }

  return phone
}

function createDrawer(): THREE.Group {
  const drawer = new THREE.Group()
  drawer.position.set(0.55, 0.16, 0.52)
  drawer.userData = { interactive: true, id: 'drawer' }

  // Front face
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.12, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x383838, roughness: 0.8 }),
  )
  drawer.add(front)

  // Handle
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.008, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.7, roughness: 0.3 }),
  )
  handle.position.z = 0.015
  drawer.add(handle)

  return drawer
}

function createKeyboard(): THREE.Group {
  const kb = new THREE.Group()
  kb.position.set(0, 0.31, 0.40)
  kb.userData = { interactive: true, id: 'keyboard' }

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.012, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
  )
  kb.add(base)

  // Keys (simplified grid) — each with its own material for per-key lighting
  const keys: THREE.Mesh[] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 12; c++) {
      const km = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, emissive: 0x000000 })
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.012), km)
      key.position.set(-0.155 + c * 0.028, 0.009, -0.04 + r * 0.028)
      kb.add(key)
      keys.push(key)
    }
  }
  kb.userData.keys = keys

  return kb
}

// ── Decorative objects ──────────────────────────────────────────────

function createNamePlacard(): THREE.Mesh {
  const placard = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.025, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x7a6a50, roughness: 0.7 }),
  )
  placard.position.set(-0.05, 0.31, 0.54)
  return placard
}

function createComputerMouse(): THREE.Group {
  const group = new THREE.Group()
  group.position.set(0.25, 0.31, 0.44)

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.012, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4 }),
  )
  group.add(body)

  // Scroll wheel
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.003, 0.008, 6),
    new THREE.MeshStandardMaterial({ color: 0x555555 }),
  )
  wheel.rotation.z = Math.PI / 2
  wheel.position.set(0, 0.008, -0.008)
  group.add(wheel)

  return group
}

function createMousePad(): THREE.Mesh {
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.002, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 }),
  )
  pad.position.set(0.25, 0.305, 0.44)
  return pad
}

function createStickyNote(): THREE.Mesh {
  // Render visit-based text onto the sticky note
  const cvs = document.createElement('canvas')
  cvs.width = 128
  cvs.height = 128
  const c = cvs.getContext('2d')!
  c.fillStyle = '#c8c830'
  c.fillRect(0, 0, 128, 128)

  // Get visit text
  let text = 'Welcome.'
  try {
    const stored = localStorage.getItem('portfolio_visits')
    const count = stored ? parseInt(stored, 10) : 1
    if (!isNaN(count) && count > 0) {
      if (count === 1) text = 'Welcome.'
      else if (count <= 3) text = 'Welcome back.'
      else if (count <= 5) text = 'You keep\ncoming back.'
      else if (count <= 10) text = 'Still here?\nTry: help'
      else if (count <= 20) text = 'v' + count + '\nPersistent.'
      else text = 'v' + count + '\n▓▓▓▓▓▓▓'
    }
  } catch { /* ignore */ }

  c.fillStyle = '#222222'
  c.font = '13px Courier New'
  c.textAlign = 'center'
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    c.fillText(line, 64, 40 + i * 18)
  })

  const tex = new THREE.CanvasTexture(cvs)
  const note = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.06),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
  )
  note.position.set(1.08, 1.45, -0.36)
  return note
}

function createCalendar(): THREE.Group {
  const group = new THREE.Group()
  group.position.set(-1.08, 1.42, -0.36)

  const page = new THREE.Mesh(
    new THREE.PlaneGeometry(0.10, 0.13),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9, side: THREE.DoubleSide }),
  )
  group.add(page)

  // Red header strip
  const header = new THREE.Mesh(
    new THREE.PlaneGeometry(0.10, 0.025),
    new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.8, side: THREE.DoubleSide }),
  )
  header.position.set(0, 0.052, 0.001)
  group.add(header)

  return group
}

// ── Additional interactive objects ──────────────────────────────────

function createWaterBottle(): THREE.Group {
  const bottle = new THREE.Group()
  bottle.position.set(-0.32, 0.35, 0.35)
  bottle.userData = { interactive: true, id: 'water_bottle' }

  // Body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.10, 8),
    new THREE.MeshStandardMaterial({ color: 0x4488cc, roughness: 0.3, metalness: 0.2 }),
  )
  bottle.add(body)

  // Cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.015, 8),
    new THREE.MeshStandardMaterial({ color: 0x3366aa, roughness: 0.4 }),
  )
  cap.position.y = 0.055
  bottle.add(cap)

  // Water level (visible through translucent body)
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.019, 0.019, 0.06, 8),
    new THREE.MeshStandardMaterial({ color: 0x66aadd, roughness: 0.2, transparent: true, opacity: 0.5 }),
  )
  water.position.y = -0.01
  bottle.add(water)
  bottle.userData.water = water

  return bottle
}

function createFramedPhoto(): THREE.Group {
  const frame = new THREE.Group()
  frame.position.set(1.05, 1.30, -0.36)
  frame.userData = { interactive: true, id: 'framed_photo' }

  // Frame border
  const border = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.10, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.7 }),
  )
  frame.add(border)

  // Photo (lighter rectangle inside)
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.09, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.9 }),
  )
  photo.position.z = 0.006
  frame.add(photo)

  return frame
}

// ── Additional decorative objects ───────────────────────────────────

function createCorkBoard(): THREE.Group {
  const board = new THREE.Group()
  board.position.set(-1.05, 1.65, -0.36)

  // Board
  const cork = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.16, 0.01),
    new THREE.MeshStandardMaterial({ color: 0xb8956a, roughness: 0.95 }),
  )
  board.add(cork)

  // Frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 })
  for (const [px, py, w, h] of [
    [0, 0.085, 0.24, 0.01],   // top
    [0, -0.085, 0.24, 0.01],  // bottom
    [-0.115, 0, 0.01, 0.18],  // left
    [0.115, 0, 0.01, 0.18],   // right
  ] as [number, number, number, number][]) {
    const piece = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), frameMat)
    piece.position.set(px, py, 0)
    board.add(piece)
  }

  // Colored pins
  const pinColors = [0xee3333, 0x33aa33, 0x3355ee, 0xeecc22]
  const pinPositions = [[-0.05, 0.03], [0.04, 0.04], [-0.03, -0.03], [0.06, -0.02]]
  for (let i = 0; i < 4; i++) {
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 6, 6),
      new THREE.MeshStandardMaterial({ color: pinColors[i] }),
    )
    pin.position.set(pinPositions[i][0], pinPositions[i][1], 0.008)
    board.add(pin)
  }

  return board
}

function createTapeDispenser(): THREE.Group {
  const tape = new THREE.Group()
  tape.position.set(0.15, 0.31, 0.52)

  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.025, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 }),
  )
  tape.add(body)

  // Tape roll
  const roll = new THREE.Mesh(
    new THREE.TorusGeometry(0.012, 0.005, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xccbb88, roughness: 0.4, transparent: true, opacity: 0.7 }),
  )
  roll.position.set(-0.015, 0.015, 0)
  roll.rotation.y = Math.PI / 2
  tape.add(roll)

  // Cutting edge
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.002, 0.015, 0.028),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 }),
  )
  edge.position.set(0.032, 0.008, 0)
  tape.add(edge)

  return tape
}
