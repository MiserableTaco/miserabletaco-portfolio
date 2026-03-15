import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CAMERA, COLORS, DESKTOP_WIDTH, DESKTOP_HEIGHT, FOG, LIGHTING, MAX_PIXEL_RATIO } from '@/utils/constants'
import { useSceneStore } from '@/store/sceneStore'
import { useObjectStore } from '@/store/objectStore'
import { DISCO_MELODY_DURATION } from '@/hooks/useAudio'
import { enableShadows } from '@/components/Objects/helpers'
import { createMonitor } from '@/components/Objects/monitor'
import { createRoom, createShelf, createClock } from '@/components/Objects/room'
import {
  createCoffeeMug, createPapers, createDeskLamp, createPenCup,
  createPlant, createStapler, createPhone, createKeyboard,
  createWaterBottle, createFramedPhoto, createDeskFan, createFidgetSpinner,
} from '@/components/Objects/interactive'
import {
  createNamePlacard, createComputerMouse, createMousePad,
  createStickyNote, createCalendar, createCorkBoard, createTapeDispenser,
} from '@/components/Objects/decorative'

// Check once at module level — won't change during session
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const COLOR_BLACK = new THREE.Color(0x000000)
const _tempVec3 = new THREE.Vector3()

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
      antialias: false,
      alpha: false,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
    renderer.setClearColor(COLORS.fog)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.BasicShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    // Suppress Three.js r183 WebGL warning about FLIP_Y on 3D textures
    // (cosmetic bug — pixelStorei called before texImage3D type check)
    const gl = renderer.getContext() as WebGL2RenderingContext
    if (gl.texImage3D) {
      const origTexImage3D = gl.texImage3D.bind(gl)
      gl.texImage3D = function (this: WebGL2RenderingContext, ...args: Parameters<WebGL2RenderingContext['texImage3D']>) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
        return origTexImage3D(...args)
      } as WebGL2RenderingContext['texImage3D']
    }

    // --- Environment map (procedural — enables metallic reflections) ---
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envScene = new THREE.Scene()
    envScene.add(new THREE.AmbientLight(0xffffff, 1.2))
    const envDir = new THREE.DirectionalLight(0xfff8f0, 2.0)
    envDir.position.set(1, 2, 1)
    envScene.add(envDir)
    scene.environment = pmrem.fromScene(envScene, 0.04).texture
    pmrem.dispose()

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(COLORS.ambient, LIGHTING.ambient)
    scene.add(ambientLight)

    const ceilingLight = new THREE.DirectionalLight(COLORS.ceiling, LIGHTING.ceiling)
    ceilingLight.position.set(0.5, 3.5, 1.5)
    ceilingLight.target.position.set(0, 0.3, 0.15)
    ceilingLight.castShadow = true
    ceilingLight.shadow.mapSize.width = 512
    ceilingLight.shadow.mapSize.height = 512
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
    const { fan: deskFanGroup, bladesGroup: fanBladesGroup } = createDeskFan()
    const { spinner: fidgetSpinnerGroup, armGroup: spinnerArmGroup } = createFidgetSpinner()
    const interactiveObjects: THREE.Object3D[] = [
      createCoffeeMug(), createPapers(), createDeskLamp(),
      createPenCup(), createPlant(), createStapler(),
      createPhone(), createKeyboard(),
      createWaterBottle(), createFramedPhoto(),
      deskFanGroup, fidgetSpinnerGroup,
    ]
    for (const obj of interactiveObjects) {
      enableShadows(obj, true, true)
      scene.add(obj)
    }

    // Water bottle spill particles — pool of 20 small spheres
    const spillParticles: THREE.Mesh[] = []
    for (let i = 0; i < 20; i++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.004, 4, 4),
        new THREE.MeshStandardMaterial({
          color: 0x66aadd,
          transparent: true,
          opacity: 0,
          roughness: 0.1,
          metalness: 0.2,
        }),
      )
      drop.visible = false
      drop.userData = { vx: 0, vy: 0, vz: 0, life: 0 }
      scene.add(drop)
      spillParticles.push(drop)
    }

    // Desk lamp light (needs to be in scene root for proper lighting)
    const lampObj = interactiveObjects.find(o => o.userData.id === 'desk_lamp')
    if (lampObj?.userData.light) scene.add(lampObj.userData.light)

    // Decorative objects
    const stickyNote = createStickyNote()
    const { board: corkBoard, notes: corkNotes } = createCorkBoard()
    const decorative: THREE.Object3D[] = [
      createNamePlacard(), createComputerMouse(), createMousePad(),
      stickyNote, createCalendar(),
      corkBoard, createTapeDispenser(),
    ]
    for (const obj of decorative) {
      enableShadows(obj, true, true)
      scene.add(obj)
    }

    // Add sticky note and cork board notes to interactive objects for raycasting
    const zoomableNotes: THREE.Object3D[] = [stickyNote, ...corkNotes]
    interactiveObjects.push(stickyNote)
    for (const n of corkNotes) {
      interactiveObjects.push(n)
    }

    // Store original Y for disco bounce — desk objects only (wall objects are higher)
    for (const obj of interactiveObjects) {
      if (obj.position.y < 1.0) {
        obj.userData.originalY = obj.position.y
        obj.userData.bounceOffset = Math.random() * 2
      }
    }
    for (const obj of decorative) {
      if (obj.position.y < 1.0) {
        obj.userData.originalY = obj.position.y
        obj.userData.bounceOffset = Math.random() * 2
      }
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
    let wasDiscoActive = false
    let localFanSpeed = 0
    let localFanSpinning = false
    let localSpinVelocity = 0

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const elapsed = (performance.now() - startTime) / 1000

      const objState = useObjectStore.getState()

      // Camera drift (subtle breathing motion) — disabled for reduced motion
      if (!prefersReducedMotion) {
        const driftX = Math.sin(elapsed * CAMERA.driftSpeed) * CAMERA.driftAmount
        const driftY = Math.sin(elapsed * CAMERA.driftSpeed * 0.7) * (CAMERA.driftAmount * 0.4)
        camera.position.x = CAMERA.position.x + driftX
        camera.position.y = CAMERA.position.y + driftY
      }

      camera.lookAt(CAMERA.lookAt.x, CAMERA.lookAt.y, CAMERA.lookAt.z)

      // LED color — green when on, dim red when off (skip during disco)
      const monitorOn = objState.monitorOn
      if (!objState.discoActive) {
        ledMaterial.color.setHex(monitorOn ? 0x00cc44 : 0x660000)
        ledMaterial.emissive.setHex(monitorOn ? 0x00cc44 : 0x660000)
        ledMaterial.emissiveIntensity = monitorOn ? 0.4 : 0.15
      }

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
        const keyTime = (objState.objects.keyboard?.custom?.keyTime as number) ?? 0
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
            mat.emissive.lerp(COLOR_BLACK, 0.15)
            mat.emissiveIntensity *= 0.85
          }
        }
      }

      // Fan blade spin — local state, no per-frame store writes
      if (fanBladesGroup) {
        const fanState = objState.getCustom('desk_fan')
        const storeSpinning = fanState.spinning as boolean ?? false

        if (storeSpinning !== localFanSpinning) {
          localFanSpinning = storeSpinning
          localFanSpeed = fanState.speed as number ?? 0
        }

        if (localFanSpinning && localFanSpeed < 15) {
          localFanSpeed = Math.min(localFanSpeed + 0.15, 15)
        } else if (!localFanSpinning && localFanSpeed > 0.01) {
          localFanSpeed = Math.max(localFanSpeed - 0.05, 0)
        } else if (!localFanSpinning && localFanSpeed <= 0.01) {
          localFanSpeed = 0
        }

        fanBladesGroup.rotation.z += localFanSpeed * 0.016
      }

      // Fidget spinner — local velocity, no per-frame store writes
      if (spinnerArmGroup) {
        const spinState = objState.getCustom('fidget_spinner')
        const storeVelocity = spinState.velocity as number ?? 0

        if (storeVelocity > localSpinVelocity) {
          localSpinVelocity = storeVelocity
        }

        if (localSpinVelocity > 0.01) {
          localSpinVelocity *= 0.997
          spinnerArmGroup.rotation.y += localSpinVelocity * 0.016
        } else if (localSpinVelocity > 0) {
          localSpinVelocity = 0
        }
      }

      // Note zoom-to-read — iterate collected notes instead of scene.traverse
      const zoomedId = objState.zoomedNoteId
      for (const note of zoomableNotes) {
        const isZoomed = note.userData.id === zoomedId
        const targetScale = isZoomed ? 6 : 1
        const targetZ = isZoomed ? camera.position.z - 0.8 : note.userData.originalZ
        const targetY = isZoomed ? camera.position.y : note.userData.originalY
        const targetX = isZoomed ? camera.position.x : note.userData.originalX

        note.scale.lerp(_tempVec3.set(targetScale, targetScale, 1), 0.12)

        if (!note.parent || note.parent === scene) {
          note.position.x += (targetX - note.position.x) * 0.12
          note.position.y += (targetY - note.position.y) * 0.12
          note.position.z += (targetZ - note.position.z) * 0.12
        }
      }

      // Water bottle spill particles
      const bottleState = objState.getCustom('water_bottle')
      const spillTime = bottleState.spillTime as number ?? 0

      if (spillTime > 0 && performance.now() - spillTime < 3000) {
        const spillElapsed = (performance.now() - spillTime) / 1000

        spillParticles.forEach((drop, i) => {
          const spawnDelay = 0.05 * i // stagger spawns
          if (spillElapsed < spawnDelay) return

          if (!drop.visible) {
            // Initialize particle at bottle mouth position
            drop.visible = true
            drop.position.set(
              -0.32 + (Math.random() - 0.5) * 0.03,
              0.40,
              0.35 + (Math.random() - 0.5) * 0.03,
            )
            drop.scale.set(1, 1, 1)
            drop.userData.vx = (Math.random() - 0.5) * 0.6
            drop.userData.vy = Math.random() * 1.0 + 0.3
            drop.userData.vz = (Math.random() - 0.5) * 0.6
            drop.userData.life = 1.0
            const mat = drop.material as THREE.MeshStandardMaterial
            mat.opacity = 0.7
          }

          // Physics update
          drop.userData.vy -= 3.5 * 0.016 // gravity
          drop.position.x += drop.userData.vx * 0.016
          drop.position.y += drop.userData.vy * 0.016
          drop.position.z += drop.userData.vz * 0.016

          // Desk surface collision (desk top is at y ~ 0.305)
          if (drop.position.y <= 0.31) {
            drop.position.y = 0.31
            drop.userData.vy = 0
            drop.userData.vx *= 0.7
            drop.userData.vz *= 0.7
            drop.scale.set(1.8, 0.2, 1.8) // flatten on impact
          }

          // Fade out
          drop.userData.life -= 0.012
          const mat = drop.material as THREE.MeshStandardMaterial
          mat.opacity = Math.max(0, drop.userData.life * 0.7)

          if (drop.userData.life <= 0) {
            drop.visible = false
          }
        })
      } else if (spillTime > 0 && performance.now() - spillTime >= 3000) {
        // Reset all particles
        spillParticles.forEach((d) => {
          d.visible = false
          d.scale.set(1, 1, 1)
          const mat = d.material as THREE.MeshStandardMaterial
          mat.opacity = 0
        })
        objState.interact('water_bottle', { spillTime: 0 })
      }

      // Disco mode — rainbow lights, object bounce, auto-spin
      if (objState.discoActive) {
        wasDiscoActive = true
        const dt = (performance.now() - objState.discoStartTime) / 1000
        const discoDur = DISCO_MELODY_DURATION + 1 // melody + 1s buffer

        if (dt > discoDur) {
          // Natural end — deactivateDisco handles audio stop + state reset
          objState.deactivateDisco()
        } else {
          const fadeStart = discoDur - 2
          const fadeOut = dt > fadeStart ? 1 - (dt - fadeStart) / 2 : 1

          // Rainbow ceiling light
          const hue = (dt * 0.5) % 1
          ceilingLight.color.setHSL(hue, 0.8 * fadeOut, 0.5)

          // LED matches rainbow
          ledMaterial.emissive.setHSL(hue, 0.8, 0.5 * fadeOut)
          ledMaterial.emissiveIntensity = 1.0

          // Bounce desk objects — only upward (abs), use cached arrays
          for (const obj of interactiveObjects) {
            if (obj.userData?.originalY != null && obj.userData?.bounceOffset != null) {
              const bounce = Math.abs(Math.sin((dt + obj.userData.bounceOffset) * 6)) * 0.006 * fadeOut
              obj.position.y = obj.userData.originalY + bounce
            }
          }
          for (const obj of decorative) {
            if (obj.userData?.originalY != null && obj.userData?.bounceOffset != null) {
              const bounce = Math.abs(Math.sin((dt + obj.userData.bounceOffset) * 6)) * 0.006 * fadeOut
              obj.position.y = obj.userData.originalY + bounce
            }
          }

          // Auto-spin fan
          const fanState = objState.getCustom('desk_fan')
          if (!(fanState.spinning as boolean)) {
            objState.interact('desk_fan', { spinning: true, speed: (fanState.speed as number) ?? 0 })
          }

          // Auto-spin fidget spinner
          const spinState = objState.getCustom('fidget_spinner')
          if (((spinState.velocity as number) ?? 0) < 10) {
            objState.interact('fidget_spinner', { velocity: 12 })
          }
        }
      } else if (wasDiscoActive) {
        // Disco just ended (stop command or natural end) — reset everything
        wasDiscoActive = false
        ceilingLight.color.setHex(0xfff5e6)
        const monOn = objState.monitorOn
        ledMaterial.color.setHex(monOn ? 0x00cc44 : 0x660000)
        ledMaterial.emissive.setHex(monOn ? 0x00cc44 : 0x660000)
        ledMaterial.emissiveIntensity = monOn ? 0.4 : 0.15
        for (const obj of interactiveObjects) {
          if (obj.userData?.originalY != null) obj.position.y = obj.userData.originalY
        }
        for (const obj of decorative) {
          if (obj.userData?.originalY != null) obj.position.y = obj.userData.originalY
        }
      }

      // CRT shutdown animation — scale collapse
      const monTransition = objState.monitorTransition
      const monTransStart = objState.transitionStart
      if (monTransition === 'shutting-down') {
        const dt = (performance.now() - monTransStart) / 1000
        if (dt < 0.4) {
          // Collapse height to thin line
          screenMesh.scale.y = Math.max(0.005, 1.0 - (dt / 0.4) * 0.995)
        } else if (dt < 0.6) {
          // Hold as bright horizontal line
          screenMesh.scale.y = 0.005
        } else if (dt < 0.8) {
          // Collapse width to dot
          screenMesh.scale.y = 0.005
          screenMesh.scale.x = Math.max(0.0, 1.0 - ((dt - 0.6) / 0.2))
        }
      } else if (!objState.monitorOn) {
        // Monitor off — ensure scale is reset and screen is black
        screenMesh.scale.set(1, 1, 1)
      } else {
        // Monitor on — normal scale
        screenMesh.scale.set(1, 1, 1)
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
